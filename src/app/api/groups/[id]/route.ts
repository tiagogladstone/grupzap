import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Validar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: { message: 'Não autenticado', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    // Buscar organization_id do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.organization_id) {
      return NextResponse.json(
        { error: { message: 'Organização não encontrada', code: 'ORG_NOT_FOUND' } },
        { status: 403 }
      )
    }

    const orgId = userData.organization_id

    // Buscar grupo com validação de ownership
    const { data: group, error: groupError } = await supabase
      .from('whatsapp_groups')
      .select('*, whatsapp_instances(instance_name, phone_number)')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single()

    if (groupError || !group) {
      return NextResponse.json(
        { error: { message: 'Grupo não encontrado', code: 'GROUP_NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Tentar buscar stats via RPC
    let stats = null
    try {
      const { data: statsData } = await supabase
        .rpc('get_group_stats', { p_group_id: id })

      if (statsData && statsData.length > 0) {
        stats = statsData[0]
      }
    } catch {
      // RPC pode não existir ainda, ignora
    }

    return NextResponse.json({
      data: {
        ...group,
        stats,
      }
    })
  } catch (error) {
    console.error('Erro inesperado em GET /api/groups/[id]:', error)
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Validar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: { message: 'Não autenticado', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    // Buscar organization_id do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.organization_id) {
      return NextResponse.json(
        { error: { message: 'Organização não encontrada', code: 'ORG_NOT_FOUND' } },
        { status: 403 }
      )
    }

    const orgId = userData.organization_id
    const body = await request.json()

    // Campos permitidos para atualização
    const allowedFields = ['is_monitored', 'is_archived', 'settings'] as const
    const updateData: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: { message: 'Nenhum campo válido para atualizar', code: 'NO_FIELDS' } },
        { status: 400 }
      )
    }

    // Atualizar com validação de ownership
    const { data: updated, error: updateError } = await supabase
      .from('whatsapp_groups')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single()

    if (updateError || !updated) {
      return NextResponse.json(
        { error: { message: 'Grupo não encontrado ou erro ao atualizar', code: 'UPDATE_ERROR' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Erro inesperado em PATCH /api/groups/[id]:', error)
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}
