import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCustomerPortalSession } from '@/lib/stripe'
import { checkRateLimit } from '@/lib/rate-limit-middleware'

// =============================================================================
// POST /api/billing/portal — Cria sessão do Customer Portal
// =============================================================================

export async function POST(request: NextRequest) {
  // Rate limit: 10 req/min (restrito)
  const rateLimitResponse = checkRateLimit(request, 'restricted')
  if (rateLimitResponse) return rateLimitResponse
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

    const organizationId = userData.organization_id

    // Buscar organização para pegar stripe_customer_id
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', organizationId)
      .single()

    if (orgError) {
      return NextResponse.json(
        { error: { message: 'Erro ao buscar organização', code: 'ORG_ERROR' } },
        { status: 500 }
      )
    }

    if (!org.stripe_customer_id) {
      return NextResponse.json(
        { error: { message: 'Nenhuma assinatura ativa encontrada', code: 'NO_SUBSCRIPTION' } },
        { status: 400 }
      )
    }

    // Criar sessão do portal
    const session = await createCustomerPortalSession(org.stripe_customer_id)

    return NextResponse.json({
      data: {
        url: session.url,
      },
    })
  } catch (error) {
    console.error('Portal error:', error)
    return NextResponse.json(
      { error: { message: 'Erro ao criar portal', code: 'PORTAL_ERROR' } },
      { status: 500 }
    )
  }
}
