import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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
    const instanceId = searchParams.get('instance_id')
    const search = searchParams.get('search')

    // Montar query
    let query = supabase
      .from('whatsapp_groups')
      .select('*, whatsapp_instances(instance_name)', { count: 'exact' })
      .eq('organization_id', orgId)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    // Filtro por instância
    if (instanceId) {
      query = query.eq('instance_id', instanceId)
    }

    // Busca por nome
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data: groups, error: queryError, count } = await query

    if (queryError) {
      console.error('Erro ao buscar grupos:', queryError)
      return NextResponse.json(
        { error: { message: 'Erro ao buscar grupos', code: 'QUERY_ERROR' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: groups, count })
  } catch (error) {
    console.error('Erro inesperado em GET /api/groups:', error)
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}
