import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
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

    // Validar que o grupo pertence à organização
    const { data: group, error: groupError } = await supabase
      .from('whatsapp_groups')
      .select('id')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single()

    if (groupError || !group) {
      return NextResponse.json(
        { error: { message: 'Grupo não encontrado', code: 'GROUP_NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Query params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    // Buscar membros
    let query = supabase
      .from('group_members')
      .select('*', { count: 'exact' })
      .eq('group_id', id)
      .order('is_admin', { ascending: false })
      .order('name', { ascending: true })

    // Busca por nome
    if (search) {
      query = query.or(`name.ilike.%${search}%,push_name.ilike.%${search}%,phone_number.ilike.%${search}%`)
    }

    const { data: members, error: membersError, count } = await query

    if (membersError) {
      console.error('Erro ao buscar membros:', membersError)
      return NextResponse.json(
        { error: { message: 'Erro ao buscar membros', code: 'QUERY_ERROR' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: members, count })
  } catch (error) {
    console.error('Erro inesperado em GET /api/groups/[id]/members:', error)
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}
