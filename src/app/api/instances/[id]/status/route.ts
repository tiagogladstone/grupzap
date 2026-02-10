import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UazapiClient } from '@/lib/uazapi'

const UAZAPI_BASE_URL = process.env.UAZAPI_BASE_URL!

// =============================================================================
// GET /api/instances/[id]/status — Verificar status atual da instância
// =============================================================================
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: { message: 'Não autenticado', code: 'UNAUTHORIZED' } },
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
        { error: { message: 'Organização não encontrada', code: 'ORG_NOT_FOUND' } },
        { status: 404 }
      )
    }

    const orgId = userData.organization_id

    // Buscar instância do banco
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single()

    if (instanceError || !instance) {
      return NextResponse.json(
        { error: { message: 'Instância não encontrada', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    if (!instance.api_token) {
      return NextResponse.json({
        data: {
          status: instance.status,
          phoneNumber: instance.phone_number,
          healthStatus: instance.health_status,
        }
      })
    }

    // Criar UazapiClient com credenciais da instância
    const uazapi = new UazapiClient({
      baseUrl: UAZAPI_BASE_URL,
      token: instance.api_token,
    })

    try {
      const statusResponse = await uazapi.instance.getStatus()
      const isConnected = statusResponse.data.Connected && statusResponse.data.LoggedIn

      // Determinar novo status
      let newStatus: 'connected' | 'disconnected' | 'connecting' | 'qr_code' | 'banned' | 'error' = instance.status

      if (isConnected && instance.status !== 'connected') {
        newStatus = 'connected'
      } else if (!isConnected && instance.status === 'connected') {
        newStatus = 'disconnected'
      } else if (!isConnected && instance.status === 'qr_code') {
        // Manter qr_code se ainda estiver aguardando scan
        newStatus = 'qr_code'
      }

      // Atualizar status no banco se mudou
      if (newStatus !== instance.status) {
        const updateData: Record<string, unknown> = {
          status: newStatus,
          last_health_check: new Date().toISOString(),
        }

        if (newStatus === 'connected') {
          updateData.qr_code = null
          updateData.qr_code_expires_at = null
          updateData.error_message = null
          updateData.health_status = 'healthy'
        }

        await supabase
          .from('whatsapp_instances')
          .update(updateData)
          .eq('id', id)
      }

      return NextResponse.json({
        data: {
          status: newStatus,
          phoneNumber: instance.phone_number,
          healthStatus: newStatus === 'connected' ? 'healthy' : instance.health_status,
          connected: isConnected,
          loggedIn: statusResponse.data.LoggedIn,
        }
      })
    } catch {
      // Se falhar ao consultar UAZAPI, retorna dados do banco
      await supabase
        .from('whatsapp_instances')
        .update({
          health_status: 'unhealthy',
          last_health_check: new Date().toISOString(),
          error_message: 'Falha ao consultar status na UAZAPI',
        })
        .eq('id', id)

      return NextResponse.json({
        data: {
          status: instance.status,
          phoneNumber: instance.phone_number,
          healthStatus: 'unhealthy',
          connected: false,
          loggedIn: false,
        }
      })
    }
  } catch {
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}
