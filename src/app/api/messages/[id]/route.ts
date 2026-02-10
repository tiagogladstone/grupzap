import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// =============================================================================
// Helper: autenticar e buscar org_id
// =============================================================================
async function getAuthContext() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'UNAUTHORIZED' as const, supabase, user: null, orgId: null }
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (userError || !userData?.organization_id) {
    return { error: 'ORG_NOT_FOUND' as const, supabase, user, orgId: null }
  }

  return { error: null, supabase, user, orgId: userData.organization_id }
}

// =============================================================================
// GET /api/messages/[id] — Detalhe de uma mensagem
// =============================================================================
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error: authErr, supabase, orgId } = await getAuthContext()

    if (authErr === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: { message: 'Nao autenticado', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    if (authErr === 'ORG_NOT_FOUND' || !orgId) {
      return NextResponse.json(
        { error: { message: 'Organizacao nao encontrada', code: 'ORG_NOT_FOUND' } },
        { status: 403 }
      )
    }

    const { data: message, error: queryError } = await supabase
      .from('scheduled_messages')
      .select('*, whatsapp_instances(instance_name, phone_number), whatsapp_groups(name, group_jid)')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single()

    if (queryError || !message) {
      return NextResponse.json(
        { error: { message: 'Mensagem nao encontrada', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: message })
  } catch (error) {
    console.error('Erro inesperado em GET /api/messages/[id]:', error)
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}

// =============================================================================
// PATCH /api/messages/[id] — Atualizar mensagem (apenas se status = 'pending')
// =============================================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error: authErr, supabase, orgId } = await getAuthContext()

    if (authErr === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: { message: 'Nao autenticado', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    if (authErr === 'ORG_NOT_FOUND' || !orgId) {
      return NextResponse.json(
        { error: { message: 'Organizacao nao encontrada', code: 'ORG_NOT_FOUND' } },
        { status: 403 }
      )
    }

    // Verificar se mensagem existe e pertence a org
    const { data: existing, error: findError } = await supabase
      .from('scheduled_messages')
      .select('id, status')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single()

    if (findError || !existing) {
      return NextResponse.json(
        { error: { message: 'Mensagem nao encontrada', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Validar que status e 'pending'
    if (existing.status !== 'pending') {
      return NextResponse.json(
        { error: { message: 'Apenas mensagens pendentes podem ser editadas', code: 'INVALID_STATUS' } },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      content,
      caption,
      mediaUrl,
      scheduledFor,
      recurrence,
      recurrenceEndAt,
      status: newStatus,
    } = body as {
      content?: string
      caption?: string
      mediaUrl?: string
      scheduledFor?: string
      recurrence?: 'none' | 'daily' | 'weekly' | 'monthly'
      recurrenceEndAt?: string | null
      status?: 'pending'
    }

    // Montar objeto de update (apenas campos permitidos)
    const updateData: Record<string, unknown> = {}

    if (content !== undefined) updateData.content = content
    if (caption !== undefined) updateData.caption = caption
    if (mediaUrl !== undefined) updateData.media_url = mediaUrl
    if (recurrence !== undefined) updateData.recurrence = recurrence
    if (recurrenceEndAt !== undefined) updateData.recurrence_end_at = recurrenceEndAt
    if (newStatus !== undefined) updateData.status = newStatus

    if (scheduledFor !== undefined) {
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
      updateData.scheduled_for = scheduledFor
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: { message: 'Nenhum campo para atualizar', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    const { data: updated, error: updateError } = await supabase
      .from('scheduled_messages')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', orgId)
      .select('*, whatsapp_instances(instance_name), whatsapp_groups(name)')
      .single()

    if (updateError) {
      console.error('Erro ao atualizar mensagem:', updateError)
      return NextResponse.json(
        { error: { message: 'Erro ao atualizar mensagem', code: 'UPDATE_ERROR' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Erro inesperado em PATCH /api/messages/[id]:', error)
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}

// =============================================================================
// DELETE /api/messages/[id] — Cancelar mensagem
// =============================================================================
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error: authErr, supabase, orgId } = await getAuthContext()

    if (authErr === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: { message: 'Nao autenticado', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    if (authErr === 'ORG_NOT_FOUND' || !orgId) {
      return NextResponse.json(
        { error: { message: 'Organizacao nao encontrada', code: 'ORG_NOT_FOUND' } },
        { status: 403 }
      )
    }

    // Verificar se mensagem existe e pertence a org
    const { data: existing, error: findError } = await supabase
      .from('scheduled_messages')
      .select('id, status')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single()

    if (findError || !existing) {
      return NextResponse.json(
        { error: { message: 'Mensagem nao encontrada', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Validar status
    if (existing.status === 'sent' || existing.status === 'processing') {
      return NextResponse.json(
        { error: { message: 'Mensagem ja foi enviada/esta sendo processada', code: 'INVALID_STATUS' } },
        { status: 400 }
      )
    }

    if (existing.status === 'cancelled') {
      return NextResponse.json(
        { error: { message: 'Mensagem ja foi cancelada', code: 'ALREADY_CANCELLED' } },
        { status: 400 }
      )
    }

    // Cancelar mensagem (update status para cancelled)
    const { error: updateError } = await supabase
      .from('scheduled_messages')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('organization_id', orgId)

    if (updateError) {
      console.error('Erro ao cancelar mensagem:', updateError)
      return NextResponse.json(
        { error: { message: 'Erro ao cancelar mensagem', code: 'UPDATE_ERROR' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error('Erro inesperado em DELETE /api/messages/[id]:', error)
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}
