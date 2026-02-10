import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Period = '7d' | '30d' | '90d'

const PERIOD_DAYS: Record<Period, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

// =============================================================================
// GET /api/analytics — Buscar dados de analytics
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

    // Obter periodo da query
    const searchParams = request.nextUrl.searchParams
    const periodParam = searchParams.get('period') as Period | null
    const period: Period = periodParam && ['7d', '30d', '90d'].includes(periodParam) ? periodParam : '7d'
    const days = PERIOD_DAYS[period]

    // Calcular data inicial
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateISO = startDate.toISOString()

    // 1. SUMMARY - Total de mensagens enviadas e recebidas
    const { count: sentMessages, error: sentError } = await supabase
      .from('message_logs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('is_from_me', true)
      .gte('created_at', startDateISO)

    const { count: receivedMessages, error: receivedError } = await supabase
      .from('message_logs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('is_from_me', false)
      .gte('created_at', startDateISO)

    if (sentError || receivedError) {
      throw new Error('Erro ao buscar mensagens')
    }

    // 2. Grupos ativos (com mensagens no periodo)
    const { data: activeGroupsData, error: activeGroupsError } = await supabase
      .from('message_logs')
      .select('group_id')
      .eq('organization_id', orgId)
      .gte('created_at', startDateISO)

    if (activeGroupsError) {
      throw new Error('Erro ao buscar grupos ativos')
    }

    const uniqueGroups = new Set(activeGroupsData?.map(m => m.group_id).filter(Boolean) || [])

    // 3. Membros ativos (aproximacao - contagem de membros dos grupos ativos)
    const uniqueGroupIds = Array.from(uniqueGroups).filter((id): id is string => id !== null)
    const { data: groupsData, error: groupsError } = await supabase
      .from('whatsapp_groups')
      .select('id, participant_count')
      .eq('organization_id', orgId)
      .in('id', uniqueGroupIds)

    if (groupsError) {
      throw new Error('Erro ao buscar dados dos grupos')
    }

    const activeMembersCount = groupsData?.reduce((sum, g) => sum + (g.participant_count || 0), 0) || 0

    // 4. Health score medio
    const { data: healthData, error: healthError } = await supabase
      .from('whatsapp_groups')
      .select('health_score')
      .eq('organization_id', orgId)
      .not('health_score', 'is', null)

    if (healthError) {
      throw new Error('Erro ao buscar health scores')
    }

    const avgHealthScore = healthData && healthData.length > 0
      ? Math.round(healthData.reduce((sum, g) => sum + (g.health_score || 0), 0) / healthData.length)
      : 0

    // 5. MESSAGES PER DAY - Agrupar mensagens por dia
    const { data: messagesPerDayData, error: messagesPerDayError } = await supabase
      .from('message_logs')
      .select('created_at, is_from_me')
      .eq('organization_id', orgId)
      .gte('created_at', startDateISO)
      .order('created_at', { ascending: true })

    if (messagesPerDayError) {
      throw new Error('Erro ao buscar mensagens por dia')
    }

    // Agrupar por data
    const messagesMap: Record<string, { sent: number; received: number }> = {}
    messagesPerDayData?.forEach(msg => {
      const date = new Date(msg.created_at).toISOString().split('T')[0]
      if (!messagesMap[date]) {
        messagesMap[date] = { sent: 0, received: 0 }
      }
      if (msg.is_from_me) {
        messagesMap[date].sent++
      } else {
        messagesMap[date].received++
      }
    })

    const messagesPerDay = Object.entries(messagesMap).map(([date, counts]) => ({
      date,
      sent: counts.sent,
      received: counts.received,
    }))

    // 6. TOP GROUPS - Top 10 grupos por contagem de mensagens
    // Buscar mensagens agrupadas por group_id
    const { data: groupMessagesData } = await supabase
      .from('message_logs')
      .select('group_id')
      .eq('organization_id', orgId)
      .gte('created_at', startDateISO)
      .not('group_id', 'is', null)

    // Contar mensagens por grupo
    const groupCounts: Record<string, number> = {}
    groupMessagesData?.forEach(msg => {
      if (msg.group_id) {
        groupCounts[msg.group_id] = (groupCounts[msg.group_id] || 0) + 1
      }
    })

    // Buscar dados dos grupos
    const topGroupIds = Object.entries(groupCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id]) => id)

    const { data: groupsDetailsData } = await supabase
      .from('whatsapp_groups')
      .select('id, name, health_score, participant_count')
      .eq('organization_id', orgId)
      .in('id', topGroupIds)

    const topGroups = topGroupIds
      .map(id => {
        const group = groupsDetailsData?.find(g => g.id === id)
        return group ? {
          id: group.id,
          name: group.name,
          message_count: groupCounts[id],
          health_score: group.health_score || 0,
          member_count: group.participant_count || 0,
        } : null
      })
      .filter(Boolean)

    // 7. ACTIVITY BY HOUR - Agrupar mensagens por hora do dia
    const activityByHour = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }))
    messagesPerDayData?.forEach(msg => {
      const hour = new Date(msg.created_at).getHours()
      activityByHour[hour].count++
    })

    // 8. MESSAGE TYPES - Agrupar por tipo de mensagem
    const { data: messageTypesData, error: messageTypesError } = await supabase
      .from('message_logs')
      .select('message_type')
      .eq('organization_id', orgId)
      .gte('created_at', startDateISO)

    if (messageTypesError) {
      throw new Error('Erro ao buscar tipos de mensagem')
    }

    const messageTypeCounts: Record<string, number> = {}
    messageTypesData?.forEach(msg => {
      const type = msg.message_type || 'text'
      messageTypeCounts[type] = (messageTypeCounts[type] || 0) + 1
    })

    const messageTypes = Object.entries(messageTypeCounts).map(([type, count]) => ({
      type,
      count,
    }))

    // Retornar dados
    return NextResponse.json({
      data: {
        summary: {
          total_messages_sent: sentMessages || 0,
          total_messages_received: receivedMessages || 0,
          active_groups: uniqueGroups.size,
          active_members: activeMembersCount,
          avg_health_score: avgHealthScore,
        },
        messages_per_day: messagesPerDay,
        top_groups: topGroups,
        activity_by_hour: activityByHour,
        message_types: messageTypes,
      },
    })
  } catch (error) {
    console.error('Erro em GET /api/analytics:', error)
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}
