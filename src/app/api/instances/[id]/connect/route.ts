import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UazapiClient } from '@/lib/uazapi'

const UAZAPI_BASE_URL = process.env.UAZAPI_BASE_URL!

// =============================================================================
// POST /api/instances/[id]/connect — Conectar instância e obter QR code
// =============================================================================
export async function POST(
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
      return NextResponse.json(
        { error: { message: 'Token da API não configurado', code: 'NO_TOKEN' } },
        { status: 400 }
      )
    }

    // Criar UazapiClient com credenciais da instância
    const uazapi = new UazapiClient({
      baseUrl: UAZAPI_BASE_URL,
      token: instance.api_token,
    })

    // Verificar se já está conectado
    try {
      const statusResponse = await uazapi.instance.getStatus()
      if (statusResponse.data.Connected && statusResponse.data.LoggedIn) {
        // Atualizar status no banco
        await supabase
          .from('whatsapp_instances')
          .update({
            status: 'connected',
            qr_code: null,
            qr_code_expires_at: null,
            error_message: null,
          })
          .eq('id', id)

        return NextResponse.json({
          data: { connected: true }
        })
      }
    } catch {
      // Se falhar ao verificar status, continua com a conexão
    }

    // Tentar conectar
    try {
      await uazapi.instance.connect({
        subscribe: ['Message', 'group_participant'],
      })
    } catch {
      // Se falhar ao conectar, tenta obter QR code mesmo assim
    }

    // Verificar se conectou após o connect
    try {
      const statusAfterConnect = await uazapi.instance.getStatus()
      if (statusAfterConnect.data.Connected && statusAfterConnect.data.LoggedIn) {
        await supabase
          .from('whatsapp_instances')
          .update({
            status: 'connected',
            qr_code: null,
            qr_code_expires_at: null,
            error_message: null,
          })
          .eq('id', id)

        return NextResponse.json({
          data: { connected: true }
        })
      }
    } catch {
      // Continua para QR code
    }

    // Obter QR Code
    try {
      const qrResponse = await uazapi.instance.getQRCode()
      const qrCode = qrResponse.data.QRCode
      const expiresAt = new Date(Date.now() + 60 * 1000).toISOString() // 60 segundos

      // Salvar QR code no banco
      await supabase
        .from('whatsapp_instances')
        .update({
          status: 'qr_code',
          qr_code: qrCode,
          qr_code_expires_at: expiresAt,
          error_message: null,
        })
        .eq('id', id)

      return NextResponse.json({
        data: {
          connected: false,
          qrCode,
          expiresAt,
        }
      })
    } catch {
      // Atualizar status para connecting (sem QR ainda)
      await supabase
        .from('whatsapp_instances')
        .update({
          status: 'connecting',
          error_message: 'Aguardando QR code...',
        })
        .eq('id', id)

      return NextResponse.json({
        data: {
          connected: false,
          qrCode: null,
          expiresAt: null,
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
