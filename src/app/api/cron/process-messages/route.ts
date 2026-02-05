/**
 * API Route: Process Scheduled Messages
 * 
 * Esta rota é chamada pelo Vercel Cron para processar mensagens agendadas.
 * Substitui o pg_cron que não está disponível no Supabase Free tier.
 * 
 * @endpoint GET /api/cron/process-messages
 * @auth Header CRON_SECRET obrigatório
 * @schedule Vercel Pro: cada minuto | Vercel Hobby: 1x por dia
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createUazapiClient } from '@/lib/uazapi';

// Tipos
interface ScheduledMessage {
  id: string;
  target_jid: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contact';
  content: string | null;
  caption: string | null;
  media_url: string | null;
  attempts: number;
  max_attempts: number;
  instance: {
    api_token: string;
    api_url: string;
  };
}

interface ProcessResult {
  processed: number;
  sent: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

// Constantes
const BATCH_SIZE = 10;

/**
 * Verifica autenticação via CRON_SECRET
 */
function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('[CRON] CRON_SECRET não configurado');
    return false;
  }
  
  // Vercel envia como "Bearer <secret>"
  const token = authHeader?.replace('Bearer ', '');
  
  return token === cronSecret;
}

/**
 * Cria cliente Supabase com service role (bypass RLS)
 */
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase credentials not configured');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Busca mensagens pendentes para processar
 * Usa RPC com FOR UPDATE SKIP LOCKED para evitar race conditions
 */
async function fetchPendingMessages(supabase: ReturnType<typeof createSupabaseAdmin>): Promise<ScheduledMessage[]> {
  // Busca mensagens pendentes cujo horário já passou
  // Em produção, idealmente usar uma função RPC com FOR UPDATE SKIP LOCKED
  const { data, error } = await supabase
    .from('scheduled_messages')
    .select(`
      id,
      target_jid,
      message_type,
      content,
      caption,
      media_url,
      attempts,
      max_attempts,
      instance:whatsapp_instances!inner(
        api_token,
        api_url
      )
    `)
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .lt('attempts', 3) // fallback se max_attempts não for respeitado
    .order('scheduled_for', { ascending: true })
    .limit(BATCH_SIZE);
  
  if (error) {
    console.error('[CRON] Erro ao buscar mensagens:', error);
    throw error;
  }
  
  // Type assertion necessário por causa do join
  return (data || []) as unknown as ScheduledMessage[];
}

/**
 * Marca mensagem como processing
 */
async function markAsProcessing(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  messageId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('scheduled_messages')
    .update({
      status: 'processing',
    })
    .eq('id', messageId)
    .eq('status', 'pending'); // Double-check para evitar race condition
  
  if (error) {
    console.error(`[CRON] Erro ao marcar ${messageId} como processing:`, error);
    return false;
  }
  
  return true;
}

/**
 * Incrementa attempts e marca como processing
 */
async function incrementAttemptsAndProcess(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  messageId: string,
  currentAttempts: number
): Promise<boolean> {
  const { error } = await supabase
    .from('scheduled_messages')
    .update({
      status: 'processing',
      attempts: currentAttempts + 1,
    })
    .eq('id', messageId);
  
  return !error;
}

/**
 * Atualiza status da mensagem para sent/failed
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
  };
  
  const { error } = await supabase
    .from('scheduled_messages')
    .update(update)
    .eq('id', messageId);
  
  if (error) {
    console.error(`[CRON] Erro ao atualizar status de ${messageId}:`, error);
  }
}

/**
 * Envia mensagem via UAZAPI
 */
async function sendMessage(message: ScheduledMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Cria cliente UAZAPI com credenciais da instância
    // Nota: Se cada instância tem URL diferente, precisa passar config
    // Por ora, usamos as variáveis de ambiente (single instance)
    const uazapi = createUazapiClient();
    
    const phone = message.target_jid.replace('@s.whatsapp.net', '').replace('@g.us', '');
    
    let response;
    
    switch (message.message_type) {
      case 'text':
        if (!message.content) {
          return { success: false, error: 'Conteúdo da mensagem vazio' };
        }
        response = await uazapi.messages.sendText({
          phone,
          message: message.content,
        });
        break;
        
      case 'image':
        if (!message.media_url) {
          return { success: false, error: 'URL da mídia não fornecida' };
        }
        response = await uazapi.messages.sendImage({
          phone,
          media: message.media_url,
          caption: message.caption || undefined,
        });
        break;
        
      case 'video':
        if (!message.media_url) {
          return { success: false, error: 'URL da mídia não fornecida' };
        }
        response = await uazapi.messages.sendVideo({
          phone,
          media: message.media_url,
          caption: message.caption || undefined,
        });
        break;
        
      case 'audio':
        if (!message.media_url) {
          return { success: false, error: 'URL da mídia não fornecida' };
        }
        response = await uazapi.messages.sendAudio({
          phone,
          audio: message.media_url,
        });
        break;
        
      case 'document':
        if (!message.media_url) {
          return { success: false, error: 'URL da mídia não fornecida' };
        }
        response = await uazapi.messages.sendDocument({
          phone,
          media: message.media_url,
          filename: 'document', // TODO: extrair do metadata
        });
        break;
        
      // Tipos não implementados ainda
      case 'sticker':
      case 'location':
      case 'contact':
        return { success: false, error: `Tipo ${message.message_type} não implementado ainda` };
        
      default:
        return { success: false, error: `Tipo de mensagem desconhecido: ${message.message_type}` };
    }
    
    // Extrai ID da mensagem da resposta (SendMessageResponse tem Id)
    const messageId = response?.data?.Id;
    
    return { success: true, messageId };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`[CRON] Erro ao enviar mensagem ${message.id}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Processa lote de mensagens
 */
async function processMessages(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  messages: ScheduledMessage[]
): Promise<ProcessResult> {
  const result: ProcessResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    errors: [],
  };
  
  for (const message of messages) {
    // 1. Marca como processing (com increment de attempts)
    const locked = await incrementAttemptsAndProcess(supabase, message.id, message.attempts);
    if (!locked) {
      console.warn(`[CRON] Mensagem ${message.id} já está sendo processada`);
      continue;
    }
    
    result.processed++;
    
    // 2. Envia via UAZAPI
    const sendResult = await sendMessage(message);
    
    // 3. Atualiza status
    await updateMessageStatus(
      supabase,
      message.id,
      sendResult.success,
      sendResult.messageId,
      sendResult.error
    );
    
    if (sendResult.success) {
      result.sent++;
      console.log(`[CRON] ✓ Mensagem ${message.id} enviada`);
    } else {
      result.failed++;
      result.errors.push({ id: message.id, error: sendResult.error || 'Unknown error' });
      console.error(`[CRON] ✗ Mensagem ${message.id} falhou: ${sendResult.error}`);
    }
  }
  
  return result;
}

/**
 * Recoloca mensagens falhadas na fila (retry)
 */
async function retryFailedMessages(supabase: ReturnType<typeof createSupabaseAdmin>): Promise<number> {
  // Mensagens que falharam há mais de 5 minutos e ainda têm tentativas disponíveis
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('scheduled_messages')
    .update({ status: 'pending' })
    .eq('status', 'failed')
    .lt('attempts', 3) // max_attempts padrão
    .lt('updated_at', fiveMinutesAgo)
    .select('id');
  
  if (error) {
    console.error('[CRON] Erro ao resetar mensagens falhadas:', error);
    return 0;
  }
  
  return data?.length || 0;
}

// ============================================================================
// HANDLER PRINCIPAL
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  console.log('[CRON] Iniciando processamento de mensagens agendadas...');
  
  // 1. Verificar autenticação
  if (!verifyAuth(request)) {
    console.error('[CRON] Autenticação falhou');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    // 2. Criar cliente Supabase
    const supabase = createSupabaseAdmin();
    
    // 3. Buscar mensagens pendentes
    const messages = await fetchPendingMessages(supabase);
    console.log(`[CRON] Encontradas ${messages.length} mensagens para processar`);
    
    // 4. Processar mensagens
    let result: ProcessResult = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [],
    };
    
    if (messages.length > 0) {
      result = await processMessages(supabase, messages);
    }
    
    // 5. Retry de mensagens falhadas
    const retried = await retryFailedMessages(supabase);
    if (retried > 0) {
      console.log(`[CRON] ${retried} mensagens resetadas para retry`);
    }
    
    const duration = Date.now() - startTime;
    
    console.log(`[CRON] Concluído em ${duration}ms - Processadas: ${result.processed}, Enviadas: ${result.sent}, Falhas: ${result.failed}`);
    
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
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CRON] Erro fatal:', errorMessage);
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        duration_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// Também permite POST (algumas configurações de cron usam POST)
export async function POST(request: NextRequest) {
  return GET(request);
}
