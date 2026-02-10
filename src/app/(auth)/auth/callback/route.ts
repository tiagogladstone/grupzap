import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

function getRedirectUrl(request: NextRequest, path: string): string {
  const { origin } = new URL(request.url)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'

  if (isLocalEnv) {
    return `${origin}${path}`
  } else if (forwardedHost) {
    return `https://${forwardedHost}${path}`
  }
  return `${origin}${path}`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Handle password recovery
      if (type === 'recovery') {
        return NextResponse.redirect(getRedirectUrl(request, '/reset-password'))
      }

      // Obter dados do user autenticado
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Verificar se é um signup novo (tem organization_name nos metadata)
        const organizationName = user.user_metadata?.organization_name as string | undefined

        if (organizationName) {
          try {
            await provisionOrganization(user, organizationName)
            // Redirecionar novo usuário para onboarding
            return NextResponse.redirect(getRedirectUrl(request, '/onboarding/connect'))
          } catch (err) {
            console.error('Erro ao provisionar organização no callback:', err)
            // Não bloquear o redirect - o user pode tentar novamente
          }
        }

        // Para usuários existentes, verificar se devem ir para onboarding
        const shouldOnboard = await shouldRedirectToOnboarding(supabase, user.id)
        if (shouldOnboard) {
          return NextResponse.redirect(getRedirectUrl(request, '/onboarding/connect'))
        }
      }

      return NextResponse.redirect(getRedirectUrl(request, next))
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(getRedirectUrl(request, '/login?error=auth_callback_error'))
}

/**
 * Cria organização, user e subscription para um signup novo.
 * Usa service role para bypass de RLS.
 */
async function provisionOrganization(
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> },
  organizationName: string
) {
  const adminClient = createAdminClient()

  // Verificar se o user já tem organização (evitar duplicatas em re-clicks)
  const { data: existingUser } = await adminClient
    .from('users')
    .select('id, organization_id')
    .eq('id', user.id)
    .single()

  if (existingUser?.organization_id) {
    console.log('User já tem organização, pulando provisionamento.')
    return
  }

  // Gerar slug
  let slug = generateSlug(organizationName)
  if (!slug) {
    slug = `org-${Date.now().toString(36)}`
  }

  // 1. Criar organização
  const { data: org, error: orgError } = await adminClient
    .from('organizations')
    .insert({ name: organizationName, slug })
    .select('id')
    .single()

  let orgId: string

  if (orgError) {
    // Se slug duplicado, tentar com sufixo único
    if (orgError.code === '23505') {
      const uniqueSlug = `${slug}-${Date.now().toString(36)}`
      const { data: orgRetry, error: orgRetryError } = await adminClient
        .from('organizations')
        .insert({ name: organizationName, slug: uniqueSlug })
        .select('id')
        .single()

      if (orgRetryError || !orgRetry) {
        throw new Error(`Falha ao criar organização (retry): ${orgRetryError?.message}`)
      }
      orgId = orgRetry.id
    } else {
      throw new Error(`Falha ao criar organização: ${orgError.message}`)
    }
  } else {
    orgId = org.id
  }

  // 2. Criar user na tabela public.users
  const { error: userError } = await adminClient
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

  if (userError) {
    // Limpar org criada se user falhou
    await adminClient.from('organizations').delete().eq('id', orgId)
    throw new Error(`Falha ao criar usuário: ${userError.message}`)
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
    console.error('Erro ao criar subscription (não-fatal):', subError.message)
  }

  console.log(`Organização "${organizationName}" criada com sucesso para user ${user.id}`)
}

/**
 * Verifica se o usuário deve ser redirecionado para onboarding.
 * Critérios:
 * - Usuário criado há menos de 5 minutos (novo signup)
 * - OU organização sem nenhuma instância
 */
async function shouldRedirectToOnboarding(
  _supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<boolean> {
  try {
    const adminClient = createAdminClient()

    // Buscar dados do usuário
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('created_at, organization_id')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return false
    }

    // Verificar se é usuário recente (< 5 minutos)
    const userCreatedAt = new Date(userData.created_at)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    if (userCreatedAt > fiveMinutesAgo) {
      return true
    }

    // Verificar se organização tem instâncias
    const { count, error: countError } = await adminClient
      .from('whatsapp_instances')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', userData.organization_id!)

    if (countError) {
      return false
    }

    // Se não tem instâncias, ir para onboarding
    return (count ?? 0) === 0
  } catch {
    return false
  }
}
