import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/** Extrai variáveis do conteúdo: {{nome}} -> ['nome'] */
function extractVariables(text: string | null | undefined): string[] {
  if (!text) return []
  const matches = text.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  // Remover duplicatas
  const vars = [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))]
  return vars
}

export async function GET(request: NextRequest) {
  try {
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

    // Query params
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    // Montar query
    let query = supabase
      .from('message_templates')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId)
      .order('usage_count', { ascending: false })
      .order('name', { ascending: true })

    // Filtro por categoria
    if (category && category !== 'all') {
      query = query.eq('category', category as 'general' | 'welcome' | 'reminder' | 'announcement' | 'promotion')
    }

    // Busca por nome
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data: templates, error: queryError, count } = await query

    if (queryError) {
      console.error('Erro ao buscar templates:', queryError)
      return NextResponse.json(
        { error: { message: 'Erro ao buscar templates', code: 'QUERY_ERROR' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: templates, count })
  } catch (error) {
    console.error('Erro inesperado em GET /api/templates:', error)
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Parse body
    const body = await request.json()
    const {
      name,
      description,
      messageType = 'text',
      content,
      caption,
      mediaUrl,
      mediaFilename,
      category = 'general',
    } = body

    // Validação
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: { message: 'Nome do template é obrigatório', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    // Auto-detectar variáveis do content e caption
    const variables = [
      ...new Set([
        ...extractVariables(content),
        ...extractVariables(caption),
      ])
    ]

    // Inserir template
    const { data: template, error: insertError } = await supabase
      .from('message_templates')
      .insert({
        organization_id: orgId,
        name: name.trim(),
        description: description?.trim() || null,
        message_type: messageType,
        content: content || null,
        caption: caption || null,
        media_url: mediaUrl || null,
        media_filename: mediaFilename || null,
        variables,
        category,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao criar template:', insertError)
      return NextResponse.json(
        { error: { message: 'Erro ao criar template', code: 'INSERT_ERROR' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: template }, { status: 201 })
  } catch (error) {
    console.error('Erro inesperado em POST /api/templates:', error)
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}
