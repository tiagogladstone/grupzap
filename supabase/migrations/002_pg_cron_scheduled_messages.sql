-- =====================================================
-- Migration: pg_cron para Mensagens Agendadas
-- =====================================================
-- IMPORTANTE: Antes de rodar esta migration, você DEVE:
-- 1. Habilitar pg_cron no Supabase Dashboard (Database > Extensions)
-- 2. Habilitar pg_net no Supabase Dashboard (Database > Extensions)
-- Veja: supabase/SETUP-CRON.md para instruções detalhadas
-- =====================================================

-- Verificar se pg_net está disponível (vai falhar se não estiver habilitado)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        RAISE EXCEPTION 'Extension pg_net não está habilitada. Habilite no Supabase Dashboard primeiro.';
    END IF;
END $$;

-- =====================================================
-- Função que processa mensagens agendadas
-- =====================================================
CREATE OR REPLACE FUNCTION process_scheduled_messages()
RETURNS INTEGER AS $$
DECLARE
    processed_count INTEGER := 0;
    msg RECORD;
    http_response_id BIGINT;
BEGIN
    -- Buscar mensagens pendentes que já passaram do horário agendado
    FOR msg IN 
        SELECT 
            sm.id,
            sm.target_jid,
            sm.message_type,
            sm.content,
            sm.media_url,
            sm.attempts,
            wi.api_token,
            wi.api_url
        FROM scheduled_messages sm
        JOIN whatsapp_instances wi ON sm.instance_id = wi.id
        WHERE sm.status = 'pending'
          AND sm.scheduled_for <= NOW()
          AND sm.attempts < sm.max_attempts
        ORDER BY sm.scheduled_for ASC
        LIMIT 10  -- Processar em lotes para não sobrecarregar
        FOR UPDATE OF sm SKIP LOCKED  -- Evita race conditions
    LOOP
        -- Marcar como processing
        UPDATE scheduled_messages 
        SET 
            status = 'processing', 
            attempts = attempts + 1, 
            updated_at = NOW()
        WHERE id = msg.id;
        
        -- Chamar Edge Function para enviar a mensagem
        -- A Edge Function é responsável por:
        -- 1. Enviar via UAZAPI
        -- 2. Atualizar o status no banco (sent/failed)
        SELECT net.http_post(
            url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-scheduled-message',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
            ),
            body := jsonb_build_object(
                'message_id', msg.id,
                'target_jid', msg.target_jid,
                'message_type', msg.message_type,
                'content', msg.content,
                'media_url', msg.media_url,
                'instance_token', msg.api_token,
                'instance_url', msg.api_url
            )
        ) INTO http_response_id;
        
        processed_count := processed_count + 1;
    END LOOP;
    
    RETURN processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Função para retry de mensagens com falha
-- =====================================================
CREATE OR REPLACE FUNCTION retry_failed_messages()
RETURNS INTEGER AS $$
DECLARE
    retried_count INTEGER := 0;
BEGIN
    -- Resetar mensagens que falharam mas ainda têm tentativas disponíveis
    -- Aguarda 5 minutos entre retries
    UPDATE scheduled_messages
    SET 
        status = 'pending',
        updated_at = NOW()
    WHERE status = 'failed'
      AND attempts < max_attempts
      AND updated_at < NOW() - INTERVAL '5 minutes';
    
    GET DIAGNOSTICS retried_count = ROW_COUNT;
    
    RETURN retried_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Função para limpar mensagens antigas
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_scheduled_messages()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Deletar mensagens enviadas ou canceladas há mais de 30 dias
    DELETE FROM scheduled_messages
    WHERE status IN ('sent', 'cancelled')
      AND updated_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Agendar jobs do pg_cron
-- =====================================================

-- Job principal: processar mensagens a cada minuto
SELECT cron.schedule(
    'process-scheduled-messages',
    '* * * * *',  -- A cada minuto
    'SELECT process_scheduled_messages();'
);

-- Job de retry: verificar mensagens falhadas a cada 5 minutos
SELECT cron.schedule(
    'retry-failed-messages',
    '*/5 * * * *',  -- A cada 5 minutos
    'SELECT retry_failed_messages();'
);

-- Job de limpeza: limpar mensagens antigas uma vez por dia (às 3h da manhã)
SELECT cron.schedule(
    'cleanup-old-scheduled-messages',
    '0 3 * * *',  -- Todo dia às 3:00 AM
    'SELECT cleanup_old_scheduled_messages();'
);

-- =====================================================
-- Comentários para documentação
-- =====================================================
COMMENT ON FUNCTION process_scheduled_messages() IS 
'Processa mensagens agendadas pendentes. Roda a cada minuto via pg_cron.
Busca até 10 mensagens por execução para evitar sobrecarga.
Usa FOR UPDATE SKIP LOCKED para evitar race conditions em ambientes com múltiplas instâncias.';

COMMENT ON FUNCTION retry_failed_messages() IS 
'Recoloca mensagens falhadas na fila para nova tentativa.
Aguarda 5 minutos entre tentativas. Roda a cada 5 minutos.';

COMMENT ON FUNCTION cleanup_old_scheduled_messages() IS 
'Remove mensagens enviadas ou canceladas há mais de 30 dias.
Roda diariamente às 3:00 AM para manter o banco limpo.';
