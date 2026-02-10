import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit-middleware'

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s-]/g, '')   // remove caracteres especiais
    .replace(/\s+/g, '-')            // spaces -> hyphens
    .replace(/-+/g, '-')             // multiple hyphens -> single
    .replace(/^-|-$/g, '')           // trim hyphens
}

export async function POST(request: NextRequest) {
  // Rate limit: 5 req/min (muito restrito, evita abuse)
  const rateLimitResponse = checkRateLimit(request, 'veryRestricted')
  if (rateLimitResponse) return rateLimitResponse
  try {
    // Obter user autenticado via session cookies
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { organizationName } = body

    if (!organizationName || typeof organizationName !== 'string') {
      return NextResponse.json(
        { error: 'Nome da organização é obrigatório' },
        { status: 400 }
      )
    }

    const slug = generateSlug(organizationName)

    if (!slug) {
      return NextResponse.json(
        { error: 'Nome da organização inválido (não gera um slug válido)' },
        { status: 400 }
      )
    }

    // Usar service role para bypass de RLS e inserir nos 3 registros
    const adminClient = createAdminClient()

    // Verificar se o user já tem organização (evitar duplicatas)
    const { data: existingUser } = await adminClient
      .from('users')
      .select('id, organization_id')
      .eq('id', user.id)
      .single()

    if (existingUser?.organization_id) {
      return NextResponse.json(
        { error: 'Usuário já possui uma organização' },
        { status: 409 }
      )
    }

    // 1. Criar organização
    const { data: org, error: orgError } = await adminClient
      .from('organizations')
      .insert({ name: organizationName, slug })
      .select('id')
      .single()

    if (orgError) {
      // Se slug duplicado, tentar com sufixo
      if (orgError.code === '23505') {
        const uniqueSlug = `${slug}-${Date.now().toString(36)}`
        const { data: orgRetry, error: orgRetryError } = await adminClient
          .from('organizations')
          .insert({ name: organizationName, slug: uniqueSlug })
          .select('id')
          .single()

        if (orgRetryError) {
          console.error('Erro ao criar organização (retry):', orgRetryError)
          return NextResponse.json(
            { error: 'Erro ao criar organização' },
            { status: 500 }
          )
        }

        return await createUserAndSubscription(adminClient, orgRetry.id, user)
      }

      console.error('Erro ao criar organização:', orgError)
      return NextResponse.json(
        { error: 'Erro ao criar organização' },
        { status: 500 }
      )
    }

    return await createUserAndSubscription(adminClient, org.id, user)
  } catch (error) {
    console.error('Erro inesperado no signup-complete:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

async function createUserAndSubscription(
  adminClient: ReturnType<typeof createAdminClient>,
  orgId: string,
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> }
) {
  // 2. Criar/atualizar user na tabela public.users
  const { data: newUser, error: userError } = await adminClient
    .from('users')
    .upsert(
      {
        id: user.id,
        organization_id: orgId,
        email: user.email!,
        name: (user.user_metadata?.full_name as string) || null,
        role: 'owner',
      },
      { onConflict: 'id' }
    )
    .select('id')
    .single()

  if (userError) {
    console.error('Erro ao criar usuário:', userError)
    // Tentar limpar a org criada
    await adminClient.from('organizations').delete().eq('id', orgId)
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    )
  }

  // 3. Criar subscription free
  const { error: subError } = await adminClient
    .from('subscriptions')
    .insert({
      organization_id: orgId,
      plan: 'free',
      status: 'active',
    })

  if (subError) {
    console.error('Erro ao criar subscription:', subError)
    // Não falhar por causa da subscription, org e user já foram criados
  }

  return NextResponse.json({
    organizationId: orgId,
    userId: newUser.id,
  })
}
