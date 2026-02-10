-- Migration: Criptografia de API Tokens
-- Adiciona suporte a criptografia de tokens usando pgcrypto

-- =============================================================================
-- 1. Habilitar extensao pgcrypto
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- 2. Funcoes de criptografia/descriptografia
-- =============================================================================

-- Funcao para criptografar tokens
-- Usa pgp_sym_encrypt com chave secreta (deve ser definida em variavel de ambiente)
CREATE OR REPLACE FUNCTION encrypt_api_token(token TEXT, secret TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(pgp_sym_encrypt(token, secret), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION encrypt_api_token IS 'Criptografa um token de API usando AES-256 via pgcrypto';

-- Funcao para descriptografar tokens
CREATE OR REPLACE FUNCTION decrypt_api_token(encrypted TEXT, secret TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(decode(encrypted, 'base64'), secret);
EXCEPTION
  WHEN OTHERS THEN
    -- Se falhar ao descriptografar, retornar NULL (token invalido ou chave incorreta)
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION decrypt_api_token IS 'Descriptografa um token de API criptografado';

-- =============================================================================
-- 3. Adicionar coluna encrypted_api_token
-- =============================================================================

ALTER TABLE whatsapp_instances
ADD COLUMN IF NOT EXISTS encrypted_api_token TEXT;

COMMENT ON COLUMN whatsapp_instances.encrypted_api_token IS
'Token de API criptografado usando pgp_sym_encrypt. Em producao, migrar api_token para esta coluna e remover api_token.';

-- =============================================================================
-- 4. Criar indice para busca por token criptografado (se necessario)
-- =============================================================================

-- Nota: Buscar por token criptografado requer descriptografar todos os registros,
-- o que pode ser lento. Para uso em producao, considerar manter hash do token
-- em coluna separada para busca rapida.

-- =============================================================================
-- NOTAS PARA PRODUCAO
-- =============================================================================

-- Para migrar tokens existentes:
-- 1. Definir ENCRYPTION_SECRET como variavel de ambiente segura
-- 2. Executar update para criptografar todos api_token existentes:
--    UPDATE whatsapp_instances
--    SET encrypted_api_token = encrypt_api_token(api_token, 'seu_secret_aqui')
--    WHERE api_token IS NOT NULL AND encrypted_api_token IS NULL;
-- 3. Atualizar codigo da aplicacao para usar encrypted_api_token
-- 4. Apos validacao, remover coluna api_token:
--    ALTER TABLE whatsapp_instances DROP COLUMN api_token;

-- Para descriptografar no codigo TypeScript (exemplo):
-- const { data } = await supabase.rpc('decrypt_api_token', {
--   encrypted: instance.encrypted_api_token,
--   secret: process.env.ENCRYPTION_SECRET
-- })
