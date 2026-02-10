import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/** Extrai variáveis do conteúdo: {{nome}} -> ['nome'] */
function extractVariables(text: string | null | undefined): string[] {
  if (!text) return []
  const matches = text.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  const vars = [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))]
  return vars
}

/** Validar auth e retornar user + orgId */
async function getAuthContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) return null

  return { user, orgId: userData.organization_id }
}

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const auth = await getAuthContext(supabase)
    if (!auth) {
      return NextResponse.json(
        { error: { message: 'Não autenticado', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const { data: template, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', id)
      .eq('organization_id', auth.orgId)
      .single()

    if (error || !template) {
      return NextResponse.json(
        { error: { message: 'Template não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: template })
  } catch (error) {
    console.error('Erro inesperado em GET /api/templates/[id]:', error)
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const auth = await getAuthContext(supabase)
    if (!auth) {
      return NextResponse.json(
        { error: { message: 'Não autenticado', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      messageType,
      content,
      caption,
      mediaUrl,
      mediaFilename,
      category,
      isActive,
    } = body

    // Montar objeto de update (somente campos presentes)
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (messageType !== undefined) updateData.message_type = messageType
    if (content !== undefined) updateData.content = content || null
    if (caption !== undefined) updateData.caption = caption || null
    if (mediaUrl !== undefined) updateData.media_url = mediaUrl || null
    if (mediaFilename !== undefined) updateData.media_filename = mediaFilename || null
    if (category !== undefined) updateData.category = category
    if (isActive !== undefined) updateData.is_active = isActive

    // Re-extrair variables se content ou caption mudou
    if (content !== undefined || caption !== undefined) {
      // Buscar template atual para mesclar content/caption
      const { data: current } = await supabase
        .from('message_templates')
        .select('content, caption')
        .eq('id', id)
        .eq('organization_id', auth.orgId)
        .single()

      const finalContent = content !== undefined ? content : current?.content
      const finalCaption = caption !== undefined ? caption : current?.caption

      updateData.variables = [
        ...new Set([
          ...extractVariables(finalContent),
          ...extractVariables(finalCaption),
        ])
      ]
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: { message: 'Nenhum campo para atualizar', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    const { data: template, error: updateError } = await supabase
      .from('message_templates')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', auth.orgId)
      .select()
      .single()

    if (updateError || !template) {
      console.error('Erro ao atualizar template:', updateError)
      return NextResponse.json(
        { error: { message: 'Erro ao atualizar template', code: 'UPDATE_ERROR' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: template })
  } catch (error) {
    console.error('Erro inesperado em PATCH /api/templates/[id]:', error)
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const auth = await getAuthContext(supabase)
    if (!auth) {
      return NextResponse.json(
        { error: { message: 'Não autenticado', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const { error: deleteError } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', id)
      .eq('organization_id', auth.orgId)

    if (deleteError) {
      console.error('Erro ao deletar template:', deleteError)
      return NextResponse.json(
        { error: { message: 'Erro ao deletar template', code: 'DELETE_ERROR' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error('Erro inesperado em DELETE /api/templates/[id]:', error)
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}
