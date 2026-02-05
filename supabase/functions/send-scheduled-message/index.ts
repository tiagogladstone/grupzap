// Edge Function: send-scheduled-message
// Responsável por enviar mensagens agendadas via UAZAPI e atualizar o status no banco

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScheduledMessagePayload {
  message_id: string
  target_jid: string
  message_type: 'text' | 'image' | 'video' | 'audio' | 'document'
  content: string
  media_url?: string
  instance_token: string
  instance_url: string
}

interface UAZAPIResponse {
  success: boolean
  error?: string
  messageId?: string
}

// Envia mensagem via UAZAPI
async function sendViaUAZAPI(payload: ScheduledMessagePayload): Promise<UAZAPIResponse> {
  const { instance_url, instance_token, target_jid, message_type, content, media_url } = payload
  
  // Construir o endpoint baseado no tipo de mensagem
  let endpoint: string
  let body: Record<string, unknown>
  
  switch (message_type) {
    case 'text':
      endpoint = `${instance_url}/message/sendText/${instance_token}`
      body = {
        number: target_jid,
        text: content,
      }
      break
      
    case 'image':
      endpoint = `${instance_url}/message/sendImage/${instance_token}`
      body = {
        number: target_jid,
        image: media_url,
        caption: content || '',
      }
      break
      
    case 'video':
      endpoint = `${instance_url}/message/sendVideo/${instance_token}`
      body = {
        number: target_jid,
        video: media_url,
        caption: content || '',
      }
      break
      
    case 'audio':
      endpoint = `${instance_url}/message/sendAudio/${instance_token}`
      body = {
        number: target_jid,
        audio: media_url,
      }
      break
      
    case 'document':
      endpoint = `${instance_url}/message/sendDocument/${instance_token}`
      body = {
        number: target_jid,
        document: media_url,
        fileName: content || 'document',
      }
      break
      
    default:
      return {
        success: false,
        error: `Tipo de mensagem não suportado: ${message_type}`,
      }
  }
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `HTTP ${response.status}`,
      }
    }
    
    return {
      success: true,
      messageId: data.key?.id || data.messageId,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao enviar mensagem',
    }
  }
}

// Atualiza o status da mensagem no banco
async function updateMessageStatus(
  supabase: ReturnType<typeof createClient>,
  messageId: string,
  status: 'sent' | 'failed',
  errorMessage?: string,
  externalMessageId?: string
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  
  if (errorMessage) {
    updateData.error_message = errorMessage
  }
  
  if (externalMessageId) {
    updateData.external_message_id = externalMessageId
  }
  
  if (status === 'sent') {
    updateData.sent_at = new Date().toISOString()
  }
  
  const { error } = await supabase
    .from('scheduled_messages')
    .update(updateData)
    .eq('id', messageId)
  
  if (error) {
    console.error('Erro ao atualizar status da mensagem:', error)
    throw error
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Verificar autorização
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Criar cliente Supabase com service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse do payload
    const payload: ScheduledMessagePayload = await req.json()
    
    // Validar payload
    if (!payload.message_id || !payload.target_jid || !payload.message_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: message_id, target_jid, message_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Validar se é mensagem de mídia e tem URL
    if (['image', 'video', 'audio', 'document'].includes(payload.message_type) && !payload.media_url) {
      await updateMessageStatus(supabase, payload.message_id, 'failed', 'URL de mídia obrigatória para este tipo de mensagem')
      return new Response(
        JSON.stringify({ error: 'media_url required for media messages' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`Processando mensagem ${payload.message_id} para ${payload.target_jid}`)
    
    // Enviar via UAZAPI
    const result = await sendViaUAZAPI(payload)
    
    // Atualizar status no banco
    if (result.success) {
      await updateMessageStatus(supabase, payload.message_id, 'sent', undefined, result.messageId)
      console.log(`Mensagem ${payload.message_id} enviada com sucesso`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message_id: payload.message_id,
          external_message_id: result.messageId 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      await updateMessageStatus(supabase, payload.message_id, 'failed', result.error)
      console.error(`Falha ao enviar mensagem ${payload.message_id}:`, result.error)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message_id: payload.message_id,
          error: result.error 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
  } catch (error) {
    console.error('Erro na Edge Function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
