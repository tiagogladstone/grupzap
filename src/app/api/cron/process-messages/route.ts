/**
 * API Route: Process Scheduled Messages (Multi-Instance + Locking)
 *
 * Esta rota e chamada pelo cron (Google Cloud Scheduler / Vercel Cron)
 * para processar mensagens agendadas de TODAS as instancias WhatsApp.
 *
 * Melhorias sobre a versao anterior:
 * - FOR UPDATE SKIP LOCKED via RPC (evita race condition entre crons)
 * - UazapiClient criado por instancia (multi-tenant)
 * - timingSafeEqual para CRON_SECRET
 * - Suporte a sticker, location, contact
 * - media_filename do banco (nao hardcoded)
 * - Retry de mensagens falhadas via RPC
 *
 * @endpoint GET /api/cron/process-messages
 * @endpoint POST /api/cron/process-messages
 * @auth Header Authorization: Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'crypto'
import { UazapiClient } from '@/lib/uazapi'

// ============================================================================
// TIPOS
// ============================================================================

/** Mensagem retornada pela RPC fetch_and_lock_pending_messages */
interface LockedMessage {
  id: string
  target_jid: string
  target_type: string
  message_type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contact'
  content: string | null
  caption: string | null
  media_url: string | null
  media_filename: string | null
  media_mime_type: string | null
  buttons: unknown | null
  attempts: number
  max_attempts: number
  instance_api_token: string
  instance_id_external: string
  scheduled_message_id: string
}

interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

interface ProcessResult {
  processed: number
  sent: number
  failed: number
  errors: Array<{ id: string; error: string }>
}

// ============================================================================
// CONSTANTES
// ============================================================================

const BATCH_SIZE = 10

// ============================================================================
// AUTENTICACAO
// ============================================================================

/**
 * Verifica CRON_SECRET com timingSafeEqual (previne timing attacks)
 */
function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[CRON] CRON_SECRET nao configurado')
    return false
  }

  const token = authHeader?.replace('Bearer ', '') || ''

  // timingSafeEqual exige buffers de mesmo tamanho
  if (token.length !== cronSecret.length) {
    return false
  }

  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(cronSecret))
  } catch {
    return false
  }
}

// ============================================================================
// SUPABASE ADMIN
// ============================================================================

/**
 * Cria cliente Supabase com service role (bypass RLS)
 */
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase credentials not configured')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// ============================================================================
// BUSCAR MENSAGENS (RPC COM LOCKING)
// ============================================================================

/**
 * Busca mensagens pendentes usando RPC com FOR UPDATE SKIP LOCKED.
 * A RPC ja faz o UPDATE para status='processing' e incrementa attempts.
 */
async function fetchAndLockMessages(
  supabase: ReturnType<typeof createSupabaseAdmin>
): Promise<LockedMessage[]> {
  const { data, error } = await supabase.rpc('fetch_and_lock_pending_messages', {
    p_batch_size: BATCH_SIZE,
  })

  if (error) {
    console.error('[CRON] Erro ao buscar/travar mensagens:', error)
    throw error
  }

  return (data || []) as LockedMessage[]
}

// ============================================================================
// ENVIO DE MENSAGENS (MULTI-INSTANCIA)
// ============================================================================

/**
 * Envia uma mensagem via UAZAPI usando credenciais da instancia especifica.
 */
async function sendMessage(message: LockedMessage): Promise<SendResult> {
  try {
    const baseUrl = process.env.UAZAPI_BASE_URL
    if (!baseUrl) {
      return { success: false, error: 'UAZAPI_BASE_URL nao configurado' }
    }

    if (!message.instance_api_token) {
      return { success: false, error: 'Token da instancia nao encontrado' }
    }

    // Cria client com token ESPECIFICO da instancia
    const uazapi = new UazapiClient({
      baseUrl,
      token: message.instance_api_token,
    })

    // Extrai phone do JID (remove sufixo @s.whatsapp.net ou @g.us)
    const phone = message.target_jid.replace('@s.whatsapp.net', '').replace('@g.us', '')

    let response

    switch (message.message_type) {
      // ----------------------------------------------------------------
      // TEXTO
      // ----------------------------------------------------------------
      case 'text':
        if (!message.content) {
          return { success: false, error: 'Conteudo da mensagem vazio' }
        }
        response = await uazapi.messages.sendText({
          phone,
          message: message.content,
        })
        break

      // ----------------------------------------------------------------
      // IMAGEM
      // ----------------------------------------------------------------
      case 'image':
        if (!message.media_url) {
          return { success: false, error: 'URL da midia nao fornecida' }
        }
        response = await uazapi.messages.sendImage({
          phone,
          media: message.media_url,
          caption: message.caption || undefined,
        })
        break

      // ----------------------------------------------------------------
      // VIDEO
      // ----------------------------------------------------------------
      case 'video':
        if (!message.media_url) {
          return { success: false, error: 'URL da midia nao fornecida' }
        }
        response = await uazapi.messages.sendVideo({
          phone,
          media: message.media_url,
          caption: message.caption || undefined,
        })
        break

      // ----------------------------------------------------------------
      // AUDIO
      // ----------------------------------------------------------------
      case 'audio':
        if (!message.media_url) {
          return { success: false, error: 'URL da midia nao fornecida' }
        }
        response = await uazapi.messages.sendAudio({
          phone,
          audio: message.media_url,
        })
        break

      // ----------------------------------------------------------------
      // DOCUMENTO (usa media_filename do banco)
      // ----------------------------------------------------------------
      case 'document':
        if (!message.media_url) {
          return { success: false, error: 'URL da midia nao fornecida' }
        }
        response = await uazapi.messages.sendDocument({
          phone,
          media: message.media_url,
          filename: message.media_filename || 'document',
        })
        break

      // ----------------------------------------------------------------
      // STICKER
      // ----------------------------------------------------------------
      case 'sticker':
        if (!message.media_url) {
          return { success: false, error: 'URL da midia nao fornecida para sticker' }
        }
        response = await uazapi.messages.sendSticker({
          phone,
          sticker: message.media_url,
        })
        break

      // ----------------------------------------------------------------
      // LOCATION (content = JSON { latitude, longitude, name })
      // ----------------------------------------------------------------
      case 'location': {
        if (!message.content) {
          return { success: false, error: 'Conteudo da localizacao vazio' }
        }
        let loc: { latitude: number; longitude: number; name?: string }
        try {
          loc = JSON.parse(message.content)
        } catch {
          return { success: false, error: 'Conteudo da localizacao nao e JSON valido' }
        }
        if (loc.latitude == null || loc.longitude == null) {
          return { success: false, error: 'latitude e longitude sao obrigatorios' }
        }
        response = await uazapi.messages.sendLocation({
          phone,
          latitude: loc.latitude,
          longitude: loc.longitude,
          name: loc.name,
        })
        break
      }

      // ----------------------------------------------------------------
      // CONTACT (content = vCard string, caption = nome do contato)
      // ----------------------------------------------------------------
      case 'contact': {
        if (!message.content) {
          return { success: false, error: 'vCard do contato vazio' }
        }
        response = await uazapi.messages.sendContact({
          phone,
          contactName: message.caption || 'Contato',
          vcard: message.content,
        })
        break
      }

      // ----------------------------------------------------------------
      // TIPO DESCONHECIDO
      // ----------------------------------------------------------------
      default:
        return { success: false, error: `Tipo de mensagem desconhecido: ${message.message_type}` }
    }

    // Extrai ID da mensagem da resposta (SendMessageResponse tem Id)
    const messageId = response?.data?.Id

    return { success: true, messageId }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error(`[CRON] Erro ao enviar mensagem ${message.id}:`, errorMessage)
    return { success: false, error: errorMessage }
  }
}

// ============================================================================
// ATUALIZAR STATUS
// ============================================================================

/**
 * Atualiza status de uma mensagem apos envio (sent ou failed).
 */
async function updateMessageStatus(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  messageId: string,
  success: boolean,
  externalMessageId?: string,
  errorMessage?: string
): Promise<void> {
  const update: Record<string, string | undefined> = {
    status: success ? 'sent' : 'failed',
    ...(success && { sent_at: new Date().toISOString() }),
    ...(externalMessageId && { external_message_id: externalMessageId }),
    ...(errorMessage && { error_message: errorMessage }),
  }

  const { error } = await supabase
    .from('scheduled_messages')
    .update(update)
    .eq('id', messageId)

  if (error) {
    console.error(`[CRON] Erro ao atualizar status de ${messageId}:`, error)
  }
}

// ============================================================================
// PROCESSAR LOTE
// ============================================================================

/**
 * Processa o lote de mensagens travadas.
 * A RPC ja marcou como 'processing' e incrementou attempts.
 */
async function processMessages(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  messages: LockedMessage[]
): Promise<ProcessResult> {
  const result: ProcessResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    errors: [],
  }

  for (const message of messages) {
    result.processed++

    // Envia via UAZAPI (com client da instancia correta)
    const sendResult = await sendMessage(message)

    // Atualiza status no banco
    await updateMessageStatus(
      supabase,
      message.id,
      sendResult.success,
      sendResult.messageId,
      sendResult.error
    )

    if (sendResult.success) {
      result.sent++
      console.log(`[CRON] Mensagem ${message.id} enviada com sucesso`)
    } else {
      result.failed++
      result.errors.push({ id: message.id, error: sendResult.error || 'Unknown error' })
      console.error(`[CRON] Mensagem ${message.id} falhou: ${sendResult.error}`)
    }
  }

  return result
}

// ============================================================================
// RETRY DE MENSAGENS FALHADAS
// ============================================================================

/**
 * Reseta mensagens falhadas para retry via RPC.
 * A RPC verifica cooldown e max_attempts.
 */
async function retryFailedMessages(
  supabase: ReturnType<typeof createSupabaseAdmin>
): Promise<number> {
  const { data, error } = await supabase.rpc('reset_failed_messages', {
    p_cooldown_minutes: 5,
  })

  if (error) {
    console.error('[CRON] Erro ao resetar mensagens falhadas:', error)
    return 0
  }

  return data ?? 0
}

// ============================================================================
// HANDLER PRINCIPAL
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  console.log('[CRON] Iniciando processamento de mensagens agendadas...')

  // 1. Verificar autenticacao (timingSafeEqual)
  if (!verifyAuth(request)) {
    console.error('[CRON] Autenticacao falhou')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 2. Criar cliente Supabase (service role)
    const supabase = createSupabaseAdmin()

    // 3. Buscar e travar mensagens pendentes (FOR UPDATE SKIP LOCKED)
    const messages = await fetchAndLockMessages(supabase)
    console.log(`[CRON] Encontradas ${messages.length} mensagens para processar`)

    // 4. Processar mensagens
    let result: ProcessResult = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [],
    }

    if (messages.length > 0) {
      result = await processMessages(supabase, messages)
    }

    // 5. Retry de mensagens falhadas (via RPC)
    const retried = await retryFailedMessages(supabase)
    if (retried > 0) {
      console.log(`[CRON] ${retried} mensagens resetadas para retry`)
    }

    const duration = Date.now() - startTime

    console.log(
      `[CRON] Concluido em ${duration}ms - Processadas: ${result.processed}, Enviadas: ${result.sent}, Falhas: ${result.failed}`
    )

    return NextResponse.json({
      success: true,
      duration_ms: duration,
      result: {
        processed: result.processed,
        sent: result.sent,
        failed: result.failed,
        retried,
      },
      ...(result.errors.length > 0 && { errors: result.errors }),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[CRON] Erro fatal:', errorMessage)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        duration_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

// Tambem permite POST (Google Cloud Scheduler envia POST por padrao)
export async function POST(request: NextRequest) {
  return GET(request)
}
