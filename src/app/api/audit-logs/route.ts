import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// =============================================================================
// GET /api/audit-logs — Buscar logs de auditoria
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticacao
    const { data: { user }, error: authError } = await supabase.auth.getUser()
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

    const orgId = userData.organization_id

    // Obter parametros de filtro
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id')
    const action = searchParams.get('action')
    const entityType = searchParams.get('entity_type')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const perPage = parseInt(searchParams.get('per_page') || '50', 10)

    // Validar paginacao
    const validPage = Math.max(1, page)
    const validPerPage = Math.max(1, Math.min(100, perPage))
    const offset = (validPage - 1) * validPerPage

    // Construir query base
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId)

    // Aplicar filtros
    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (action) {
      query = query.eq('action', action)
    }
    if (entityType) {
      query = query.eq('entity_type', entityType)
    }
    if (from) {
      query = query.gte('created_at', from)
    }
    if (to) {
      query = query.lte('created_at', to)
    }

    // Ordenar e paginar
    const { data: logs, error: logsError, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + validPerPage - 1)

    if (logsError) {
      throw new Error('Erro ao buscar logs de auditoria')
    }

    // Buscar dados dos usuarios (segunda query)
    const userIds = [...new Set(logs?.map(log => log.user_id).filter((id): id is string => id !== null) || [])]
    const { data: usersData } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', userIds)

    // Criar mapa de usuarios
    const usersMap = new Map(usersData?.map(u => [u.id, u]) || [])

    // Formatar dados
    const formattedLogs = logs?.map(log => {
      const user = log.user_id ? usersMap.get(log.user_id) : null
      return {
        id: log.id,
        user_id: log.user_id,
        user_name: user?.name || 'Usuario desconhecido',
        user_email: user?.email || '',
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        metadata: log.metadata,
        created_at: log.created_at,
      }
    }) || []

    const totalPages = count ? Math.ceil(count / validPerPage) : 0

    return NextResponse.json({
      data: formattedLogs,
      pagination: {
        page: validPage,
        per_page: validPerPage,
        total: count || 0,
        total_pages: totalPages,
      },
    })
  } catch (error) {
    console.error('Erro em GET /api/audit-logs:', error)
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}
