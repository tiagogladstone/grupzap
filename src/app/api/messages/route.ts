import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// =============================================================================
// GET /api/messages — Lista mensagens agendadas da organizacao
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
        { status: 403 }
      )
    }

    const orgId = userData.organization_id

    // Query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const instanceId = searchParams.get('instance_id')
    const groupId = searchParams.get('group_id')

    // Montar query com JOINs
    let query = supabase
      .from('scheduled_messages')
      .select(
        '*, whatsapp_instances(instance_name), whatsapp_groups(name)',
        { count: 'exact' }
      )
      .eq('organization_id', orgId)

    // Filtro por status
    if (status && ['pending', 'processing', 'sent', 'failed', 'cancelled'].includes(status)) {
      query = query.eq('status', status as 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled')
    }

    // Filtro por instancia
    if (instanceId) {
      query = query.eq('instance_id', instanceId)
    }

    // Filtro por grupo
    if (groupId) {
      query = query.eq('group_id', groupId)
    }

    // Ordenacao: pending/processing primeiro por scheduled_for ASC, sent/failed/cancelled por DESC
    if (status === 'sent' || status === 'failed' || status === 'cancelled') {
      query = query.order('scheduled_for', { ascending: false })
    } else {
      query = query.order('scheduled_for', { ascending: true })
    }

    const { data: messages, error: queryError, count } = await query

    if (queryError) {
      console.error('Erro ao buscar mensagens:', queryError)
      return NextResponse.json(
        { error: { message: 'Erro ao buscar mensagens', code: 'QUERY_ERROR' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: messages, count })
  } catch (error) {
    console.error('Erro inesperado em GET /api/messages:', error)
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST /api/messages — Agendar nova mensagem
// =============================================================================
export async function POST(request: NextRequest) {
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
        { status: 403 }
      )
    }

    const orgId = userData.organization_id

    // Verificar limite de mensagens do mês
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    firstDayOfMonth.setHours(0, 0, 0, 0)

    const { count: messagesThisMonth, error: countError } = await supabase
      .from('scheduled_messages')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', firstDayOfMonth.toISOString())

    if (countError) {
      return NextResponse.json(
        { error: { message: 'Erro ao contar mensagens', code: 'COUNT_ERROR' } },
        { status: 500 }
      )
    }

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

    const { getPlanLimits } = await import('@/lib/plans')
    const plan = subscription?.plan || 'free'
    const limits = getPlanLimits(plan as 'free' | 'starter' | 'pro' | 'enterprise')

    if (limits.max_messages_per_month !== -1 && (messagesThisMonth ?? 0) >= limits.max_messages_per_month) {
      return NextResponse.json(
        { error: { message: 'Limite de mensagens mensais atingido. Faça upgrade do seu plano.', code: 'PLAN_LIMIT_EXCEEDED' } },
        { status: 403 }
      )
    }

    // Validar body
    const body = await request.json()
    const {
      instanceId,
      groupId,
      targetJid,
      targetType,
      messageType,
      content,
      caption,
      mediaUrl,
      scheduledFor,
      timezone,
      recurrence,
      recurrenceEndAt,
    } = body as {
      instanceId?: string
      groupId?: string
      targetJid?: string
      targetType?: 'group' | 'individual'
      messageType?: 'text' | 'image' | 'video' | 'audio' | 'document'
      content?: string
      caption?: string
      mediaUrl?: string
      scheduledFor?: string
      timezone?: string
      recurrence?: 'none' | 'daily' | 'weekly' | 'monthly'
      recurrenceEndAt?: string
    }

    // Validacoes obrigatorias
    if (!instanceId) {
      return NextResponse.json(
        { error: { message: 'Campo obrigatorio: instanceId', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    if (!targetJid) {
      return NextResponse.json(
        { error: { message: 'Campo obrigatorio: targetJid', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    if (!scheduledFor) {
      return NextResponse.json(
        { error: { message: 'Campo obrigatorio: scheduledFor', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    // Validar tipo de mensagem e conteudo
    const msgType = messageType || 'text'
    if (msgType === 'text' && !content) {
      return NextResponse.json(
        { error: { message: 'Campo obrigatorio para mensagem de texto: content', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    if (['image', 'video', 'audio', 'document'].includes(msgType) && !mediaUrl) {
      return NextResponse.json(
        { error: { message: 'Campo obrigatorio para midia: mediaUrl', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    // Validar que scheduledFor e futuro
    const scheduledDate = new Date(scheduledFor)
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: { message: 'scheduledFor deve ser uma data ISO valida', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    if (scheduledDate.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: { message: 'scheduledFor deve ser uma data futura', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    // Validar que instanceId pertence a org
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('id', instanceId)
      .eq('organization_id', orgId)
      .single()

    if (instanceError || !instance) {
      return NextResponse.json(
        { error: { message: 'Instancia nao encontrada ou nao pertence a esta organizacao', code: 'INSTANCE_NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Inserir mensagem agendada
    const { data: message, error: insertError } = await supabase
      .from('scheduled_messages')
      .insert({
        organization_id: orgId,
        instance_id: instanceId,
        group_id: groupId || null,
        target_jid: targetJid,
        target_type: targetType || 'group',
        message_type: msgType,
        content: content || null,
        caption: caption || null,
        media_url: mediaUrl || null,
        scheduled_for: scheduledFor,
        timezone: timezone || 'America/Sao_Paulo',
        recurrence: recurrence || 'none',
        recurrence_end_at: recurrenceEndAt || null,
        status: 'pending',
        created_by: user.id,
      })
      .select('*, whatsapp_instances(instance_name), whatsapp_groups(name)')
      .single()

    if (insertError) {
      console.error('Erro ao agendar mensagem:', insertError)
      return NextResponse.json(
        { error: { message: 'Erro ao agendar mensagem', code: 'INSERT_ERROR' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: message }, { status: 201 })
  } catch (error) {
    console.error('Erro inesperado em POST /api/messages:', error)
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}
