import { createClient } from '@/lib/supabase/server'
import { UazapiClient } from '@/lib/uazapi'
import { NextRequest, NextResponse } from 'next/server'

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

    // Ler body
    const body = await request.json()
    const { instanceId } = body

    if (!instanceId || typeof instanceId !== 'string') {
      return NextResponse.json(
        { error: { message: 'instanceId é obrigatório', code: 'INVALID_INPUT' } },
        { status: 400 }
      )
    }

    // Buscar instância no banco e validar ownership
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('id, instance_id, api_token, instance_name')
      .eq('id', instanceId)
      .eq('organization_id', orgId)
      .single()

    if (instanceError || !instance) {
      return NextResponse.json(
        { error: { message: 'Instância não encontrada ou não pertence à organização', code: 'INSTANCE_NOT_FOUND' } },
        { status: 404 }
      )
    }

    if (!instance.api_token) {
      return NextResponse.json(
        { error: { message: 'Instância sem token de API configurado', code: 'NO_API_TOKEN' } },
        { status: 400 }
      )
    }

    // Criar client UAZAPI com credenciais da instância
    const baseUrl = process.env.UAZAPI_BASE_URL
    if (!baseUrl) {
      return NextResponse.json(
        { error: { message: 'UAZAPI_BASE_URL não configurada', code: 'CONFIG_ERROR' } },
        { status: 500 }
      )
    }

    const uazapi = new UazapiClient({
      baseUrl,
      token: instance.api_token,
    })

    // Buscar grupos do WhatsApp via UAZAPI
    const groupsResponse = await uazapi.groups.list()
    const remoteGroups = groupsResponse.data?.Groups || []

    let created = 0
    let updated = 0

    // Para cada grupo retornado, fazer upsert no banco
    for (const group of remoteGroups) {
      const participantCount = group.Participants?.length || 0
      const adminCount = group.Participants?.filter(p => p.IsAdmin || p.IsSuperAdmin).length || 0

      const { data: existing } = await supabase
        .from('whatsapp_groups')
        .select('id')
        .eq('instance_id', instance.id)
        .eq('group_jid', group.JID)
        .single()

      const groupData = {
        instance_id: instance.id,
        organization_id: orgId,
        group_jid: group.JID,
        name: group.Name || 'Sem nome',
        description: group.Topic || null,
        participant_count: participantCount,
        admin_count: adminCount,
        last_sync_at: new Date().toISOString(),
      }

      if (existing) {
        // UPDATE
        const { error: updateError } = await supabase
          .from('whatsapp_groups')
          .update({
            name: groupData.name,
            description: groupData.description,
            participant_count: groupData.participant_count,
            admin_count: groupData.admin_count,
            last_sync_at: groupData.last_sync_at,
          })
          .eq('id', existing.id)

        if (!updateError) updated++
      } else {
        // INSERT
        const { error: insertError } = await supabase
          .from('whatsapp_groups')
          .insert(groupData)

        if (!insertError) created++
      }
    }

    const synced = created + updated

    // Verificar limite de grupos monitorados
    const { count: monitoredCount } = await supabase
      .from('whatsapp_groups')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('is_monitored', true)

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('organization_id', orgId)
      .single()

    const { getPlanLimits } = await import('@/lib/plans')
    const plan = subscription?.plan || 'free'
    const limits = getPlanLimits(plan as 'free' | 'starter' | 'pro' | 'enterprise')

    const response: { data: { synced: number; created: number; updated: number }; warning?: string } = {
      data: { synced, created, updated }
    }

    if (limits.max_groups !== -1 && (monitoredCount ?? 0) >= limits.max_groups) {
      response.warning = 'Limite de grupos monitorados atingido'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erro inesperado em POST /api/groups/sync:', error)
    return NextResponse.json(
      { error: { message: 'Erro ao sincronizar grupos', code: 'SYNC_ERROR' } },
      { status: 500 }
    )
  }
}
