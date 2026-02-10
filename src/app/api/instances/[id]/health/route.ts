/**
 * API Route: Instance Health Checks
 *
 * Retorna historico de health checks de uma instancia.
 *
 * @endpoint GET /api/instances/[id]/health
 * @auth Requerida (via cookies)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// TIPOS
// ============================================================================

interface HealthCheck {
  id: string
  instance_id: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'timeout' | 'error'
  response_time_ms: number | null
  error_message: string | null
  checked_at: string
}

interface HealthStats {
  checks: HealthCheck[]
  uptime_percentage: number
  avg_response_time: number
}

// ============================================================================
// CALCULAR ESTATISTICAS
// ============================================================================

/**
 * Calcula uptime percentage e tempo medio de resposta das ultimas 24h
 */
function calculateStats(checks: HealthCheck[]): { uptime: number; avgResponse: number } {
  if (checks.length === 0) {
    return { uptime: 0, avgResponse: 0 }
  }

  // Filtrar checks das ultimas 24h
  const now = Date.now()
  const oneDayAgo = now - 24 * 60 * 60 * 1000
  const recentChecks = checks.filter((check) => {
    const checkTime = new Date(check.checked_at).getTime()
    return checkTime >= oneDayAgo
  })

  if (recentChecks.length === 0) {
    return { uptime: 0, avgResponse: 0 }
  }

  // Calcular uptime (% de checks healthy)
  const healthyCount = recentChecks.filter((check) => check.status === 'healthy').length
  const uptime = (healthyCount / recentChecks.length) * 100

  // Calcular tempo medio de resposta
  const totalResponseTime = recentChecks.reduce(
    (sum, check) => sum + (check.response_time_ms || 0),
    0
  )
  const avgResponse = Math.round(totalResponseTime / recentChecks.length)

  return { uptime: Math.round(uptime * 100) / 100, avgResponse }
}

// ============================================================================
// HANDLER
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verificar autenticacao
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: { message: 'Nao autenticado', code: 'UNAUTHORIZED' } },
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
        { error: { message: 'Organizacao nao encontrada', code: 'ORG_NOT_FOUND' } },
        { status: 404 }
      )
    }

    const organizationId = userData.organization_id

    // Verificar se a instancia pertence a organizacao do user
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('id, organization_id')
      .eq('id', id)
      .single()

    if (instanceError || !instance) {
      return NextResponse.json(
        { error: { message: 'Instancia nao encontrada', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    if (instance.organization_id !== organizationId) {
      return NextResponse.json(
        { error: { message: 'Acesso negado', code: 'FORBIDDEN' } },
        { status: 403 }
      )
    }

    // Buscar ultimos 20 health checks (mais recentes primeiro)
    const { data: checks, error: checksError } = await supabase
      .from('health_checks')
      .select('id, instance_id, status, response_time_ms, error_message, checked_at')
      .eq('instance_id', id)
      .order('checked_at', { ascending: false })
      .limit(20)

    if (checksError) {
      console.error('Erro ao buscar health checks:', checksError)
      return NextResponse.json(
        { error: { message: 'Erro ao buscar health checks', code: 'DB_ERROR' } },
        { status: 500 }
      )
    }

    // Calcular estatisticas
    const stats = calculateStats(checks || [])

    const response: HealthStats = {
      checks: checks || [],
      uptime_percentage: stats.uptime,
      avg_response_time: stats.avgResponse,
    }

    return NextResponse.json({ data: response })
  } catch (error) {
    console.error('Erro ao buscar health checks:', error)
    return NextResponse.json(
      { error: { message: 'Erro interno', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}
