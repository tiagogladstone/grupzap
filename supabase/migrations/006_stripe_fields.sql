-- =============================================================================
-- Migration 006: Stripe Integration Fields
-- =============================================================================
-- Adiciona campos necessários para integração com Stripe
-- - stripe_customer_id e stripe_subscription_id na tabela organizations
-- - Campos Stripe adicionais na tabela subscriptions (já existentes mas garantindo)
-- =============================================================================

-- Adicionar campos Stripe na tabela organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Adicionar campos Stripe na tabela subscriptions (caso não existam)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Criar índice para busca por customer_id
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer
ON organizations(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

-- Criar índice para busca por subscription_id na tabela subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription
ON subscriptions(stripe_subscription_id)
WHERE stripe_subscription_id IS NOT NULL;

-- Comentários
COMMENT ON COLUMN organizations.stripe_customer_id IS 'ID do customer no Stripe (cus_xxx)';
COMMENT ON COLUMN organizations.stripe_subscription_id IS 'ID da subscription ativa no Stripe (sub_xxx)';
COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'ID da subscription no Stripe (sub_xxx)';
COMMENT ON COLUMN subscriptions.stripe_price_id IS 'ID do price/plano no Stripe (price_xxx)';
COMMENT ON COLUMN subscriptions.current_period_start IS 'Início do período de cobrança atual';
COMMENT ON COLUMN subscriptions.current_period_end IS 'Fim do período de cobrança atual';
