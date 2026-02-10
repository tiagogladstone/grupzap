-- ============================================================================
-- MIGRATION 005: RPC para buscar mensagens pendentes com locking
-- ============================================================================

-- Função que busca mensagens pendentes COM locking (FOR UPDATE SKIP LOCKED)
-- Evita que 2 crons processem a mesma mensagem
CREATE OR REPLACE FUNCTION public.fetch_and_lock_pending_messages(
    p_batch_size INT DEFAULT 10
)
RETURNS TABLE(
    id UUID,
    target_jid TEXT,
    target_type TEXT,
    message_type TEXT,
    content TEXT,
    caption TEXT,
    media_url TEXT,
    media_filename TEXT,
    media_mime_type TEXT,
    buttons JSONB,
    attempts INT,
    max_attempts INT,
    instance_api_token TEXT,
    instance_id_external TEXT,
    scheduled_message_id UUID
) AS $$
BEGIN
    RETURN QUERY
    WITH locked AS (
        SELECT sm.id
        FROM public.scheduled_messages sm
        JOIN public.whatsapp_instances wi ON wi.id = sm.instance_id
        WHERE sm.status = 'pending'
          AND sm.scheduled_for <= NOW()
          AND sm.attempts < sm.max_attempts
          AND wi.status = 'connected'
          AND wi.is_active = true
        ORDER BY sm.scheduled_for ASC
        LIMIT p_batch_size
        FOR UPDATE OF sm SKIP LOCKED
    )
    UPDATE public.scheduled_messages sm
    SET status = 'processing', attempts = sm.attempts + 1, updated_at = NOW()
    FROM locked
    JOIN public.whatsapp_instances wi ON wi.id = sm.instance_id
    WHERE sm.id = locked.id
    RETURNING
        sm.id,
        sm.target_jid,
        sm.target_type,
        sm.message_type,
        sm.content,
        sm.caption,
        sm.media_url,
        sm.media_filename,
        sm.media_mime_type,
        sm.buttons,
        sm.attempts,
        sm.max_attempts,
        wi.api_token AS instance_api_token,
        wi.instance_id AS instance_id_external,
        sm.id AS scheduled_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para resetar mensagens falhadas (retry)
CREATE OR REPLACE FUNCTION public.reset_failed_messages(
    p_cooldown_minutes INT DEFAULT 5
)
RETURNS INT AS $$
DECLARE
    reset_count INT;
BEGIN
    WITH reset AS (
        UPDATE public.scheduled_messages
        SET status = 'pending', updated_at = NOW()
        WHERE status = 'failed'
          AND attempts < max_attempts
          AND updated_at < NOW() - (p_cooldown_minutes || ' minutes')::INTERVAL
        RETURNING id
    )
    SELECT COUNT(*) INTO reset_count FROM reset;

    RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
