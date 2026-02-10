import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import {
  verifyWebhookSignature,
  isMessageUpsert,
  isGroupParticipant,
  jidToPhone,
} from '@/lib/uazapi'
import type { WebhookPayload, WebhookMessageUpsert, WebhookGroupParticipant } from '@/lib/uazapi'
import { checkRateLimit } from '@/lib/rate-limit-middleware'

// =============================================================================
// ADMIN CLIENT (bypass RLS — webhooks não têm sessão de usuário)
// =============================================================================

function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// =============================================================================
// HELPERS
// =============================================================================

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status })
}

/**
 * Determina o tipo da mensagem a partir do payload do webhook.
 */
function getMessageType(msg: WebhookMessageUpsert): string {
  const message = msg.data.messages.message
  if (message.imageMessage) return 'image'
  if (message.videoMessage) return 'video'
  if (message.audioMessage) return 'audio'
  if (message.documentMessage) return 'document'
  if (message.stickerMessage) return 'sticker'
  if (message.locationMessage) return 'location'
  if (message.contactMessage) return 'contact'
  if (message.extendedTextMessage) return 'text'
  if (message.conversation) return 'text'
  return 'unknown'
}

/**
 * Verifica se a mensagem contém mídia.
 */
function hasMedia(msg: WebhookMessageUpsert): boolean {
  const message = msg.data.messages.message
  return !!(
    message.imageMessage ||
    message.videoMessage ||
    message.audioMessage ||
    message.documentMessage ||
    message.stickerMessage
  )
}

/**
 * Extrai o event type de um payload genérico.
 */
function extractEventType(payload: Record<string, unknown>): string {
  if (typeof payload.event === 'string') return payload.event
  return 'unknown'
}

// =============================================================================
// AUTENTICAÇÃO
// =============================================================================

interface AuthResult {
  authenticated: boolean
  instanceId?: string
}

/**
 * Tenta autenticar o webhook por HMAC signature ou secret fallback.
 * Retorna o instance_id identificado (se disponível no payload/query).
 */
async function authenticateWebhook(
  req: NextRequest,
  rawBody: string,
  payload: Record<string, unknown>
): Promise<AuthResult> {
  const supabase = createAdminClient()

  // Tentar extrair instance_id do payload ou query
  const instanceIdFromPayload = payload.instance_id as string | undefined
  const instanceIdFromQuery = req.nextUrl.searchParams.get('instance_id')
  const instanceId = instanceIdFromPayload || instanceIdFromQuery || undefined

  // 1. Verificação via HMAC SHA256 (preferencial)
  const signatureHeader = req.headers.get('x-webhook-signature')
  if (signatureHeader && instanceId) {
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('id, webhook_secret')
      .eq('instance_id', instanceId)
      .single()

    if (instance?.webhook_secret) {
      const valid = verifyWebhookSignature(rawBody, signatureHeader, instance.webhook_secret)
      if (valid) {
        return { authenticated: true, instanceId: instance.id }
      }
    }
  }

  // 2. Fallback: x-webhook-secret header
  const secretHeader = req.headers.get('x-webhook-secret')
  if (secretHeader) {
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('webhook_secret', secretHeader)
      .single()

    if (instance) {
      return { authenticated: true, instanceId: instance.id }
    }
  }

  // 3. Fallback: ?secret= query param
  const secretQuery = req.nextUrl.searchParams.get('secret')
  if (secretQuery) {
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('webhook_secret', secretQuery)
      .single()

    if (instance) {
      return { authenticated: true, instanceId: instance.id }
    }
  }

  // 4. Fallback: se temos instance_id, buscar pelo instance_id no banco
  //    (para instâncias sem webhook_secret configurado)
  if (instanceId) {
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('id, webhook_secret')
      .eq('instance_id', instanceId)
      .single()

    // Se a instância existe mas NÃO tem webhook_secret configurado, aceitar
    // (significa que o admin ainda não configurou a segurança)
    if (instance && !instance.webhook_secret) {
      console.log('[WEBHOOK] AVISO: instância sem webhook_secret, aceitando sem auth:', instanceId)
      return { authenticated: true, instanceId: instance.id }
    }
  }

  return { authenticated: false }
}

// =============================================================================
// PROCESSADORES DE EVENTOS
// =============================================================================

/**
 * Processa evento de mensagem recebida (messages.upsert).
 * Salva metadados em message_logs e atualiza contadores.
 */
async function processMessageUpsert(
  supabase: ReturnType<typeof createAdminClient>,
  payload: WebhookMessageUpsert,
  instanceDbId: string,
  organizationId: string
): Promise<void> {
  const msg = payload.data.messages
  const remoteJid = msg.key.remoteJid
  const isFromMe = msg.key.fromMe
  const senderJid = remoteJid
  const senderName = msg.pushName || null
  const messageType = getMessageType(payload)
  const messageHasMedia = hasMedia(payload)
  const messageTimestamp = new Date(payload.timestamp * 1000).toISOString()
  const externalMessageId = msg.key.id

  // Determinar se é mensagem de grupo
  const isGroup = remoteJid.endsWith('@g.us')
  let groupDbId: string | null = null

  if (isGroup) {
    const { data: group } = await supabase
      .from('whatsapp_groups')
      .select('id')
      .eq('group_jid', remoteJid)
      .eq('organization_id', organizationId)
      .single()

    groupDbId = group?.id ?? null
  }

  // INSERT em message_logs
  const { error: insertError } = await supabase.from('message_logs').insert({
    organization_id: organizationId,
    instance_id: instanceDbId,
    group_id: groupDbId,
    sender_jid: senderJid,
    sender_name: senderName,
    message_type: messageType,
    is_from_me: isFromMe,
    has_media: messageHasMedia,
    message_timestamp: messageTimestamp,
    external_message_id: externalMessageId,
  })

  if (insertError) {
    console.log('[WEBHOOK] Erro ao inserir message_log:', insertError.message)
  }

  // Atualizar last_message_at do grupo
  if (isGroup && groupDbId) {
    const { error: groupUpdateError } = await supabase
      .from('whatsapp_groups')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', groupDbId)

    if (groupUpdateError) {
      console.log('[WEBHOOK] Erro ao atualizar grupo last_message_at:', groupUpdateError.message)
    }

    // Atualizar membro: last_message_at e message_count
    // Buscar membro atual para incrementar message_count
    if (!isFromMe) {
      const { data: member } = await supabase
        .from('group_members')
        .select('id, message_count')
        .eq('group_id', groupDbId)
        .eq('phone_jid', senderJid)
        .single()

      if (member) {
        const { error: memberUpdateError } = await supabase
          .from('group_members')
          .update({
            last_message_at: new Date().toISOString(),
            message_count: member.message_count + 1,
            push_name: senderName,
          })
          .eq('id', member.id)

        if (memberUpdateError) {
          console.log('[WEBHOOK] Erro ao atualizar membro:', memberUpdateError.message)
        }
      }
    }
  }

  console.log('[WEBHOOK] Mensagem processada:', {
    type: messageType,
    isGroup,
    groupDbId,
    isFromMe,
    externalMessageId,
  })
}

/**
 * Processa evento de participante de grupo (add/remove/promote/demote).
 */
async function processGroupParticipant(
  supabase: ReturnType<typeof createAdminClient>,
  payload: WebhookGroupParticipant,
  instanceDbId: string,
  organizationId: string
): Promise<void> {
  const { groupJid, participantJid, action } = payload.data

  // Buscar grupo no banco
  const { data: group } = await supabase
    .from('whatsapp_groups')
    .select('id, participant_count, admin_count')
    .eq('group_jid', groupJid)
    .eq('organization_id', organizationId)
    .single()

  if (!group) {
    console.log('[WEBHOOK] Grupo não encontrado para evento de participante:', groupJid)
    return
  }

  const phoneNumber = jidToPhone(participantJid)

  switch (action) {
    case 'add': {
      // UPSERT membro
      const { error: upsertError } = await supabase
        .from('group_members')
        .upsert(
          {
            group_id: group.id,
            organization_id: organizationId,
            phone_jid: participantJid,
            phone_number: phoneNumber,
            joined_at: new Date().toISOString(),
          },
          { onConflict: 'group_id,phone_jid' }
        )

      if (upsertError) {
        console.log('[WEBHOOK] Erro ao upsert membro (add):', upsertError.message)
      }

      // Incrementar participant_count
      const { error: groupUpdateError } = await supabase
        .from('whatsapp_groups')
        .update({ participant_count: group.participant_count + 1 })
        .eq('id', group.id)

      if (groupUpdateError) {
        console.log('[WEBHOOK] Erro ao incrementar participant_count:', groupUpdateError.message)
      }

      console.log('[WEBHOOK] Membro adicionado:', { groupJid, participantJid })
      break
    }

    case 'remove': {
      // DELETE membro
      const { error: deleteError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', group.id)
        .eq('phone_jid', participantJid)

      if (deleteError) {
        console.log('[WEBHOOK] Erro ao deletar membro (remove):', deleteError.message)
      }

      // Decrementar participant_count (mínimo 0)
      const newCount = Math.max(0, group.participant_count - 1)
      const { error: groupUpdateError } = await supabase
        .from('whatsapp_groups')
        .update({ participant_count: newCount })
        .eq('id', group.id)

      if (groupUpdateError) {
        console.log('[WEBHOOK] Erro ao decrementar participant_count:', groupUpdateError.message)
      }

      console.log('[WEBHOOK] Membro removido:', { groupJid, participantJid })
      break
    }

    case 'promote': {
      // UPDATE is_admin = true
      const { error: promoteError } = await supabase
        .from('group_members')
        .update({ is_admin: true })
        .eq('group_id', group.id)
        .eq('phone_jid', participantJid)

      if (promoteError) {
        console.log('[WEBHOOK] Erro ao promover membro:', promoteError.message)
      }

      // Incrementar admin_count
      const { error: groupUpdateError } = await supabase
        .from('whatsapp_groups')
        .update({ admin_count: group.admin_count + 1 })
        .eq('id', group.id)

      if (groupUpdateError) {
        console.log('[WEBHOOK] Erro ao incrementar admin_count:', groupUpdateError.message)
      }

      console.log('[WEBHOOK] Membro promovido a admin:', { groupJid, participantJid })
      break
    }

    case 'demote': {
      // UPDATE is_admin = false
      const { error: demoteError } = await supabase
        .from('group_members')
        .update({ is_admin: false })
        .eq('group_id', group.id)
        .eq('phone_jid', participantJid)

      if (demoteError) {
        console.log('[WEBHOOK] Erro ao rebaixar membro:', demoteError.message)
      }

      // Decrementar admin_count (mínimo 0)
      const newAdminCount = Math.max(0, group.admin_count - 1)
      const { error: groupUpdateError } = await supabase
        .from('whatsapp_groups')
        .update({ admin_count: newAdminCount })
        .eq('id', group.id)

      if (groupUpdateError) {
        console.log('[WEBHOOK] Erro ao decrementar admin_count:', groupUpdateError.message)
      }

      console.log('[WEBHOOK] Membro rebaixado de admin:', { groupJid, participantJid })
      break
    }

    default:
      console.log('[WEBHOOK] Ação de participante desconhecida:', action)
  }
}

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function POST(req: NextRequest) {
  // Rate limit: 200 req/min (permissivo para webhooks)
  const rateLimitResponse = checkRateLimit(req, 'permissive')
  if (rateLimitResponse) return rateLimitResponse

  const supabase = createAdminClient()

  let rawBody: string
  let payload: Record<string, unknown>

  // -----------------------------------------------------------------------
  // 1. Parse do body
  // -----------------------------------------------------------------------
  try {
    rawBody = await req.text()
    payload = JSON.parse(rawBody) as Record<string, unknown>
  } catch (err) {
    console.log('[WEBHOOK] Erro ao parsear body:', err)
    // Retornar 200 mesmo com erro de parse para evitar retries
    return jsonResponse({ received: true, error: 'invalid_json' })
  }

  // -----------------------------------------------------------------------
  // 2. Autenticação
  // -----------------------------------------------------------------------
  let auth: AuthResult
  try {
    auth = await authenticateWebhook(req, rawBody, payload)
  } catch (err) {
    console.log('[WEBHOOK] Erro na autenticação:', err)
    return jsonResponse({ error: 'authentication_error' }, 401)
  }

  if (!auth.authenticated) {
    console.log('[WEBHOOK] Autenticação falhou')
    return jsonResponse({ error: 'unauthorized' }, 401)
  }

  const instanceDbId = auth.instanceId!

  // -----------------------------------------------------------------------
  // 3. Buscar instância para obter organization_id
  // -----------------------------------------------------------------------
  let organizationId: string
  try {
    const { data: instance, error } = await supabase
      .from('whatsapp_instances')
      .select('organization_id')
      .eq('id', instanceDbId)
      .single()

    if (error || !instance) {
      console.log('[WEBHOOK] Instância não encontrada:', instanceDbId, error?.message)
      return jsonResponse({ received: true, error: 'instance_not_found' })
    }

    organizationId = instance.organization_id
  } catch (err) {
    console.log('[WEBHOOK] Erro ao buscar instância:', err)
    return jsonResponse({ received: true, error: 'internal_error' })
  }

  // -----------------------------------------------------------------------
  // 4. Salvar evento bruto em webhook_events (status: processing)
  // -----------------------------------------------------------------------
  const eventType = extractEventType(payload)
  let webhookEventId: string | null = null

  try {
    const { data: webhookEvent, error: insertError } = await supabase
      .from('webhook_events')
      .insert({
        instance_id: instanceDbId,
        organization_id: organizationId,
        event_type: eventType,
        payload: payload as Database['public']['Tables']['webhook_events']['Insert']['payload'],
        status: 'processing' as const,
      })
      .select('id')
      .single()

    if (insertError) {
      console.log('[WEBHOOK] Erro ao salvar webhook_event:', insertError.message)
    } else {
      webhookEventId = webhookEvent?.id ?? null
    }
  } catch (err) {
    console.log('[WEBHOOK] Erro ao inserir webhook_event:', err)
  }

  // -----------------------------------------------------------------------
  // 5. Processar evento por tipo
  // -----------------------------------------------------------------------
  try {
    const typedPayload = payload as unknown as WebhookPayload

    if (isMessageUpsert(typedPayload)) {
      // Mensagem recebida
      await processMessageUpsert(supabase, typedPayload, instanceDbId, organizationId)
    } else if (isGroupParticipant(typedPayload)) {
      // Membro entrou/saiu/promovido/rebaixado
      await processGroupParticipant(supabase, typedPayload, instanceDbId, organizationId)
    } else {
      // Outros eventos (ReadReceipt, ChatPresence, HistorySync, etc.)
      console.log('[WEBHOOK] Evento não processado (apenas armazenado):', eventType)
    }

    // Marcar webhook_event como processed
    if (webhookEventId) {
      await supabase
        .from('webhook_events')
        .update({
          status: 'processed' as const,
          processed_at: new Date().toISOString(),
        })
        .eq('id', webhookEventId)
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown processing error'
    console.log('[WEBHOOK] Erro no processamento:', errorMessage)

    // Marcar webhook_event como failed
    if (webhookEventId) {
      try {
        await supabase
          .from('webhook_events')
          .update({
            status: 'failed' as const,
            error_message: errorMessage,
          })
          .eq('id', webhookEventId)
      } catch (updateErr) {
        console.log('[WEBHOOK] Erro ao atualizar status de falha:', updateErr)
      }
    }
  }

  // -----------------------------------------------------------------------
  // 6. Sempre retornar 200 para evitar retries da UAZAPI
  // -----------------------------------------------------------------------
  return jsonResponse({ received: true })
}
