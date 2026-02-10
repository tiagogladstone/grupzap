import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// =============================================================================
// GET /api/instances — Lista instâncias da organização
// =============================================================================
export async function GET() {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: { message: 'Não autenticado', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    // Buscar organization_id do user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.organization_id) {
      return NextResponse.json(
        { error: { message: 'Organização não encontrada', code: 'ORG_NOT_FOUND' } },
        { status: 404 }
      )
    }

    const orgId = userData.organization_id

    // Listar instâncias da organização
    const { data: instances, error: queryError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (queryError) {
      return NextResponse.json(
        { error: { message: 'Erro ao buscar instâncias', code: 'QUERY_ERROR' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: instances })
  } catch {
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST /api/instances — Criar nova instância
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: { message: 'Não autenticado', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    // Buscar organization_id do user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.organization_id) {
      return NextResponse.json(
        { error: { message: 'Organização não encontrada', code: 'ORG_NOT_FOUND' } },
        { status: 404 }
      )
    }

    const orgId = userData.organization_id

    // Validar body
    const body = await request.json()
    const { instanceName, instanceId, apiToken } = body as {
      instanceName?: string
      instanceId?: string
      apiToken?: string
    }

    if (!instanceName || !instanceId || !apiToken) {
      return NextResponse.json(
        { error: { message: 'Campos obrigatórios: instanceName, instanceId, apiToken', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    // Verificar limite do plano via subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('organization_id', orgId)
      .single()

    if (subError) {
      return NextResponse.json(
        { error: { message: 'Erro ao verificar assinatura', code: 'SUBSCRIPTION_ERROR' } },
        { status: 500 }
      )
    }

    // Importar dinamicamente para evitar problema de circular dependency
    const { getPlanLimits } = await import('@/lib/plans')
    const plan = subscription?.plan || 'free'
    const limits = getPlanLimits(plan as 'free' | 'starter' | 'pro' | 'enterprise')

    const { count: currentCount, error: countError } = await supabase
      .from('whatsapp_instances')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)

    if (countError) {
      return NextResponse.json(
        { error: { message: 'Erro ao contar instâncias', code: 'COUNT_ERROR' } },
        { status: 500 }
      )
    }

    if ((currentCount ?? 0) >= limits.max_instances) {
      return NextResponse.json(
        { error: { message: 'Limite de instâncias atingido. Faça upgrade do seu plano.', code: 'PLAN_LIMIT_EXCEEDED' } },
        { status: 403 }
      )
    }

    // Criar instância
    const { data: instance, error: insertError } = await supabase
      .from('whatsapp_instances')
      .insert({
        organization_id: orgId,
        instance_name: instanceName,
        instance_id: instanceId,
        api_token: apiToken,
        status: 'disconnected',
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: { message: 'Erro ao criar instância', code: 'INSERT_ERROR' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: instance }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}
