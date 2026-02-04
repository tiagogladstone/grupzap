-- ============================================================================
-- GRUPZAP - Schema do Banco de Dados Supabase
-- ============================================================================
-- SaaS de gestão de grupos WhatsApp
-- Supabase URL: https://plyrhsdkeuvbqgnuiglw.supabase.co
-- 
-- Executar este arquivo completo no Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PARTE 1: EXTENSÕES E FUNÇÕES AUXILIARES
-- ============================================================================

-- Extensão para UUIDs (geralmente já habilitada no Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função auxiliar para verificar se usuário pertence a uma organização
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND organization_id = org_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para obter organization_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id FROM public.users
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é admin da organização
CREATE OR REPLACE FUNCTION public.user_is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND organization_id = org_id
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 2: TABELAS PRINCIPAIS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ORGANIZATIONS (Multi-tenant)
-- ----------------------------------------------------------------------------
-- Cada organização representa um cliente/empresa usando o Grupzap
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
    settings JSONB DEFAULT '{}',
    max_instances INT DEFAULT 1,
    max_groups INT DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para organizations
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_plan ON public.organizations(plan);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON public.organizations(is_active) WHERE is_active = true;

-- ----------------------------------------------------------------------------
-- USERS (com tenant_id = organization_id)
-- ----------------------------------------------------------------------------
-- Usuários do sistema, vinculados a uma organização
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    phone TEXT,
    settings JSONB DEFAULT '{}',
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT users_email_unique UNIQUE(email)
);

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_organization ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(organization_id, role);

-- ----------------------------------------------------------------------------
-- WHATSAPP_INSTANCES (Conexões UAZAPI)
-- ----------------------------------------------------------------------------
-- Instâncias do WhatsApp conectadas via UAZAPI
CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    instance_name TEXT NOT NULL,
    instance_id TEXT UNIQUE NOT NULL, -- ID retornado pela UAZAPI
    api_token TEXT, -- Token de API da instância (criptografado em produção)
    phone_number TEXT,
    status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'connecting', 'qr_code', 'banned', 'error')),
    qr_code TEXT,
    qr_code_expires_at TIMESTAMPTZ,
    webhook_url TEXT,
    webhook_secret TEXT,
    last_health_check TIMESTAMPTZ,
    health_status TEXT DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para whatsapp_instances
CREATE INDEX IF NOT EXISTS idx_instances_organization ON public.whatsapp_instances(organization_id);
CREATE INDEX IF NOT EXISTS idx_instances_status ON public.whatsapp_instances(status);
CREATE INDEX IF NOT EXISTS idx_instances_instance_id ON public.whatsapp_instances(instance_id);
CREATE INDEX IF NOT EXISTS idx_instances_active ON public.whatsapp_instances(organization_id, is_active) WHERE is_active = true;

-- ----------------------------------------------------------------------------
-- WHATSAPP_GROUPS
-- ----------------------------------------------------------------------------
-- Grupos do WhatsApp monitorados pelo sistema
CREATE TABLE IF NOT EXISTS public.whatsapp_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    group_jid TEXT NOT NULL, -- ID do grupo no WhatsApp (ex: 120363xxx@g.us)
    name TEXT NOT NULL,
    description TEXT,
    picture_url TEXT,
    invite_link TEXT,
    participant_count INT DEFAULT 0,
    admin_count INT DEFAULT 0,
    is_monitored BOOLEAN DEFAULT true,
    is_archived BOOLEAN DEFAULT false,
    health_score INT DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
    activity_level TEXT DEFAULT 'normal' CHECK (activity_level IN ('high', 'normal', 'low', 'inactive')),
    settings JSONB DEFAULT '{}',
    last_message_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT unique_group_per_instance UNIQUE(instance_id, group_jid)
);

-- Índices para whatsapp_groups
CREATE INDEX IF NOT EXISTS idx_groups_instance ON public.whatsapp_groups(instance_id);
CREATE INDEX IF NOT EXISTS idx_groups_organization ON public.whatsapp_groups(organization_id);
CREATE INDEX IF NOT EXISTS idx_groups_jid ON public.whatsapp_groups(group_jid);
CREATE INDEX IF NOT EXISTS idx_groups_health ON public.whatsapp_groups(health_score);
CREATE INDEX IF NOT EXISTS idx_groups_monitored ON public.whatsapp_groups(organization_id, is_monitored) WHERE is_monitored = true;
CREATE INDEX IF NOT EXISTS idx_groups_activity ON public.whatsapp_groups(last_message_at DESC);

-- ----------------------------------------------------------------------------
-- GROUP_MEMBERS
-- ----------------------------------------------------------------------------
-- Membros dos grupos WhatsApp
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.whatsapp_groups(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    phone_jid TEXT NOT NULL, -- ID do usuário no WhatsApp (ex: 5511999999999@s.whatsapp.net)
    phone_number TEXT, -- Número formatado
    name TEXT,
    push_name TEXT, -- Nome definido pelo próprio usuário
    is_admin BOOLEAN DEFAULT false,
    is_super_admin BOOLEAN DEFAULT false,
    joined_at TIMESTAMPTZ,
    added_by TEXT,
    last_seen TIMESTAMPTZ,
    last_message_at TIMESTAMPTZ,
    message_count INT DEFAULT 0,
    engagement_score INT DEFAULT 50 CHECK (engagement_score >= 0 AND engagement_score <= 100),
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT unique_member_per_group UNIQUE(group_id, phone_jid)
);

-- Índices para group_members
CREATE INDEX IF NOT EXISTS idx_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_members_organization ON public.group_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_members_phone ON public.group_members(phone_jid);
CREATE INDEX IF NOT EXISTS idx_members_admin ON public.group_members(group_id, is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_members_engagement ON public.group_members(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_members_activity ON public.group_members(last_message_at DESC);

-- ----------------------------------------------------------------------------
-- SCHEDULED_MESSAGES
-- ----------------------------------------------------------------------------
-- Mensagens agendadas para envio
CREATE TABLE IF NOT EXISTS public.scheduled_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    instance_id UUID NOT NULL REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.whatsapp_groups(id) ON DELETE SET NULL,
    target_jid TEXT NOT NULL, -- Pode ser grupo ou contato individual
    target_type TEXT NOT NULL DEFAULT 'group' CHECK (target_type IN ('group', 'individual', 'broadcast')),
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'sticker', 'location', 'contact')),
    content TEXT,
    caption TEXT,
    media_url TEXT,
    media_mime_type TEXT,
    media_filename TEXT,
    buttons JSONB, -- Botões interativos
    scheduled_for TIMESTAMPTZ NOT NULL,
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    recurrence TEXT CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly')),
    recurrence_end_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
    sent_at TIMESTAMPTZ,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    error_message TEXT,
    external_message_id TEXT, -- ID da mensagem retornado pela UAZAPI
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para scheduled_messages
CREATE INDEX IF NOT EXISTS idx_scheduled_organization ON public.scheduled_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_instance ON public.scheduled_messages(instance_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_group ON public.scheduled_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_status ON public.scheduled_messages(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_pending ON public.scheduled_messages(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_scheduled_processing ON public.scheduled_messages(status, scheduled_for) WHERE status IN ('pending', 'processing');

-- ----------------------------------------------------------------------------
-- MESSAGE_LOGS
-- ----------------------------------------------------------------------------
-- Log de mensagens para analytics (SEM conteúdo sensível por privacidade)
CREATE TABLE IF NOT EXISTS public.message_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    instance_id UUID NOT NULL REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.whatsapp_groups(id) ON DELETE SET NULL,
    sender_jid TEXT,
    sender_name TEXT,
    message_type TEXT NOT NULL, -- text, image, video, audio, document, sticker, location, contact, poll, reaction
    is_from_me BOOLEAN DEFAULT false,
    is_forwarded BOOLEAN DEFAULT false,
    has_media BOOLEAN DEFAULT false,
    reply_to_id TEXT, -- ID da mensagem original se for reply
    message_timestamp TIMESTAMPTZ NOT NULL,
    external_message_id TEXT, -- ID da mensagem no WhatsApp
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para message_logs
CREATE INDEX IF NOT EXISTS idx_messages_organization ON public.message_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_instance ON public.message_logs(instance_id);
CREATE INDEX IF NOT EXISTS idx_messages_group ON public.message_logs(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON public.message_logs(message_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_group_time ON public.message_logs(group_id, message_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.message_logs(sender_jid);
CREATE INDEX IF NOT EXISTS idx_messages_type ON public.message_logs(message_type);

-- Particionar por mês para melhor performance (opcional - rodar separadamente se quiser)
-- CREATE TABLE public.message_logs_y2025m01 PARTITION OF public.message_logs
--     FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- ----------------------------------------------------------------------------
-- SUBSCRIPTIONS (Billing/Assinaturas)
-- ----------------------------------------------------------------------------
-- Assinaturas e informações de cobrança
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid', 'trialing', 'incomplete')),
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    quantity INT DEFAULT 1, -- Número de "seats" ou instâncias
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT one_active_subscription_per_org UNIQUE(organization_id)
);

-- Índices para subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization ON public.subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON public.subscriptions(current_period_end);

-- ============================================================================
-- PARTE 3: TABELAS AUXILIARES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- HEALTH_CHECKS (Histórico de verificações)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'timeout', 'error')),
    response_time_ms INT,
    error_message TEXT,
    details JSONB DEFAULT '{}',
    checked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índice para health_checks
CREATE INDEX IF NOT EXISTS idx_health_instance ON public.health_checks(instance_id);
CREATE INDEX IF NOT EXISTS idx_health_time ON public.health_checks(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_instance_time ON public.health_checks(instance_id, checked_at DESC);

-- ----------------------------------------------------------------------------
-- WEBHOOK_EVENTS (Fila de webhooks recebidos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
    attempts INT DEFAULT 0,
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para webhook_events
CREATE INDEX IF NOT EXISTS idx_webhook_status ON public.webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_pending ON public.webhook_events(created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_webhook_instance ON public.webhook_events(instance_id);

-- ----------------------------------------------------------------------------
-- AUDIT_LOGS (Auditoria de ações)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_organization ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_time ON public.audit_logs(created_at DESC);

-- ============================================================================
-- PARTE 4: TRIGGERS PARA UPDATED_AT
-- ============================================================================

-- Organizations
CREATE TRIGGER trigger_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Users
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- WhatsApp Instances
CREATE TRIGGER trigger_instances_updated_at
    BEFORE UPDATE ON public.whatsapp_instances
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- WhatsApp Groups
CREATE TRIGGER trigger_groups_updated_at
    BEFORE UPDATE ON public.whatsapp_groups
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Group Members
CREATE TRIGGER trigger_members_updated_at
    BEFORE UPDATE ON public.group_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Scheduled Messages
CREATE TRIGGER trigger_scheduled_updated_at
    BEFORE UPDATE ON public.scheduled_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Subscriptions
CREATE TRIGGER trigger_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PARTE 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- POLICIES: ORGANIZATIONS
-- ----------------------------------------------------------------------------

-- SELECT: Usuários podem ver sua própria organização
CREATE POLICY "organizations_select_own"
    ON public.organizations FOR SELECT
    USING (
        id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
    );

-- UPDATE: Apenas owner/admin pode atualizar
CREATE POLICY "organizations_update_admin"
    ON public.organizations FOR UPDATE
    USING (
        public.user_is_org_admin(id)
    );

-- INSERT: Service role apenas (criado no signup)
CREATE POLICY "organizations_insert_service"
    ON public.organizations FOR INSERT
    WITH CHECK (false); -- Apenas via service role

-- DELETE: Nunca via RLS (apenas service role)
CREATE POLICY "organizations_delete_never"
    ON public.organizations FOR DELETE
    USING (false);

-- ----------------------------------------------------------------------------
-- POLICIES: USERS
-- ----------------------------------------------------------------------------

-- SELECT: Usuários podem ver membros da mesma organização
CREATE POLICY "users_select_same_org"
    ON public.users FOR SELECT
    USING (
        organization_id = public.get_user_org_id()
        OR id = auth.uid()
    );

-- UPDATE: Usuários podem atualizar próprio perfil, admins podem atualizar outros
CREATE POLICY "users_update_self_or_admin"
    ON public.users FOR UPDATE
    USING (
        id = auth.uid()
        OR public.user_is_org_admin(organization_id)
    );

-- INSERT: Service role apenas
CREATE POLICY "users_insert_service"
    ON public.users FOR INSERT
    WITH CHECK (false);

-- DELETE: Apenas service role
CREATE POLICY "users_delete_never"
    ON public.users FOR DELETE
    USING (false);

-- ----------------------------------------------------------------------------
-- POLICIES: WHATSAPP_INSTANCES
-- ----------------------------------------------------------------------------

-- SELECT: Usuários podem ver instâncias da sua organização
CREATE POLICY "instances_select_org"
    ON public.whatsapp_instances FOR SELECT
    USING (
        organization_id = public.get_user_org_id()
    );

-- INSERT: Admins podem criar instâncias
CREATE POLICY "instances_insert_admin"
    ON public.whatsapp_instances FOR INSERT
    WITH CHECK (
        public.user_is_org_admin(organization_id)
    );

-- UPDATE: Admins podem atualizar
CREATE POLICY "instances_update_admin"
    ON public.whatsapp_instances FOR UPDATE
    USING (
        public.user_is_org_admin(organization_id)
    );

-- DELETE: Admins podem deletar
CREATE POLICY "instances_delete_admin"
    ON public.whatsapp_instances FOR DELETE
    USING (
        public.user_is_org_admin(organization_id)
    );

-- ----------------------------------------------------------------------------
-- POLICIES: WHATSAPP_GROUPS
-- ----------------------------------------------------------------------------

-- SELECT: Usuários podem ver grupos da sua organização
CREATE POLICY "groups_select_org"
    ON public.whatsapp_groups FOR SELECT
    USING (
        organization_id = public.get_user_org_id()
    );

-- INSERT: Membros podem adicionar grupos
CREATE POLICY "groups_insert_member"
    ON public.whatsapp_groups FOR INSERT
    WITH CHECK (
        public.user_belongs_to_org(organization_id)
    );

-- UPDATE: Membros podem atualizar
CREATE POLICY "groups_update_member"
    ON public.whatsapp_groups FOR UPDATE
    USING (
        public.user_belongs_to_org(organization_id)
    );

-- DELETE: Apenas admins
CREATE POLICY "groups_delete_admin"
    ON public.whatsapp_groups FOR DELETE
    USING (
        public.user_is_org_admin(organization_id)
    );

-- ----------------------------------------------------------------------------
-- POLICIES: GROUP_MEMBERS
-- ----------------------------------------------------------------------------

-- SELECT: Usuários podem ver membros dos grupos da sua organização
CREATE POLICY "members_select_org"
    ON public.group_members FOR SELECT
    USING (
        organization_id = public.get_user_org_id()
    );

-- INSERT: Membros podem adicionar
CREATE POLICY "members_insert_member"
    ON public.group_members FOR INSERT
    WITH CHECK (
        public.user_belongs_to_org(organization_id)
    );

-- UPDATE: Membros podem atualizar
CREATE POLICY "members_update_member"
    ON public.group_members FOR UPDATE
    USING (
        public.user_belongs_to_org(organization_id)
    );

-- DELETE: Membros podem remover
CREATE POLICY "members_delete_member"
    ON public.group_members FOR DELETE
    USING (
        public.user_belongs_to_org(organization_id)
    );

-- ----------------------------------------------------------------------------
-- POLICIES: SCHEDULED_MESSAGES
-- ----------------------------------------------------------------------------

-- SELECT: Usuários podem ver mensagens agendadas da sua organização
CREATE POLICY "scheduled_select_org"
    ON public.scheduled_messages FOR SELECT
    USING (
        organization_id = public.get_user_org_id()
    );

-- INSERT: Membros podem agendar mensagens
CREATE POLICY "scheduled_insert_member"
    ON public.scheduled_messages FOR INSERT
    WITH CHECK (
        public.user_belongs_to_org(organization_id)
    );

-- UPDATE: Membros podem atualizar (próprias ou admins todas)
CREATE POLICY "scheduled_update_member"
    ON public.scheduled_messages FOR UPDATE
    USING (
        created_by = auth.uid()
        OR public.user_is_org_admin(organization_id)
    );

-- DELETE: Criador ou admin pode deletar
CREATE POLICY "scheduled_delete_owner"
    ON public.scheduled_messages FOR DELETE
    USING (
        created_by = auth.uid()
        OR public.user_is_org_admin(organization_id)
    );

-- ----------------------------------------------------------------------------
-- POLICIES: MESSAGE_LOGS
-- ----------------------------------------------------------------------------

-- SELECT: Usuários podem ver logs da sua organização
CREATE POLICY "messages_select_org"
    ON public.message_logs FOR SELECT
    USING (
        organization_id = public.get_user_org_id()
    );

-- INSERT: Sistema apenas (via service role ou function)
CREATE POLICY "messages_insert_service"
    ON public.message_logs FOR INSERT
    WITH CHECK (false);

-- UPDATE/DELETE: Nunca (logs são imutáveis)
CREATE POLICY "messages_update_never"
    ON public.message_logs FOR UPDATE
    USING (false);

CREATE POLICY "messages_delete_never"
    ON public.message_logs FOR DELETE
    USING (false);

-- ----------------------------------------------------------------------------
-- POLICIES: SUBSCRIPTIONS
-- ----------------------------------------------------------------------------

-- SELECT: Usuários podem ver subscription da sua organização
CREATE POLICY "subscriptions_select_org"
    ON public.subscriptions FOR SELECT
    USING (
        organization_id = public.get_user_org_id()
    );

-- INSERT/UPDATE/DELETE: Service role apenas (via Stripe webhooks)
CREATE POLICY "subscriptions_insert_service"
    ON public.subscriptions FOR INSERT
    WITH CHECK (false);

CREATE POLICY "subscriptions_update_service"
    ON public.subscriptions FOR UPDATE
    USING (false);

CREATE POLICY "subscriptions_delete_service"
    ON public.subscriptions FOR DELETE
    USING (false);

-- ----------------------------------------------------------------------------
-- POLICIES: HEALTH_CHECKS
-- ----------------------------------------------------------------------------

-- SELECT: Usuários podem ver health checks da sua organização
CREATE POLICY "health_select_org"
    ON public.health_checks FOR SELECT
    USING (
        organization_id = public.get_user_org_id()
    );

-- INSERT: Service role apenas
CREATE POLICY "health_insert_service"
    ON public.health_checks FOR INSERT
    WITH CHECK (false);

-- UPDATE/DELETE: Nunca
CREATE POLICY "health_update_never"
    ON public.health_checks FOR UPDATE
    USING (false);

CREATE POLICY "health_delete_never"
    ON public.health_checks FOR DELETE
    USING (false);

-- ----------------------------------------------------------------------------
-- POLICIES: WEBHOOK_EVENTS
-- ----------------------------------------------------------------------------

-- SELECT: Admins podem ver eventos da sua organização
CREATE POLICY "webhook_select_admin"
    ON public.webhook_events FOR SELECT
    USING (
        public.user_is_org_admin(organization_id)
    );

-- INSERT/UPDATE/DELETE: Service role apenas
CREATE POLICY "webhook_insert_service"
    ON public.webhook_events FOR INSERT
    WITH CHECK (false);

CREATE POLICY "webhook_update_service"
    ON public.webhook_events FOR UPDATE
    USING (false);

CREATE POLICY "webhook_delete_service"
    ON public.webhook_events FOR DELETE
    USING (false);

-- ----------------------------------------------------------------------------
-- POLICIES: AUDIT_LOGS
-- ----------------------------------------------------------------------------

-- SELECT: Admins podem ver audit logs da sua organização
CREATE POLICY "audit_select_admin"
    ON public.audit_logs FOR SELECT
    USING (
        public.user_is_org_admin(organization_id)
    );

-- INSERT: Service role apenas
CREATE POLICY "audit_insert_service"
    ON public.audit_logs FOR INSERT
    WITH CHECK (false);

-- UPDATE/DELETE: Nunca (audit logs são imutáveis)
CREATE POLICY "audit_update_never"
    ON public.audit_logs FOR UPDATE
    USING (false);

CREATE POLICY "audit_delete_never"
    ON public.audit_logs FOR DELETE
    USING (false);

-- ============================================================================
-- PARTE 6: FUNÇÕES DE NEGÓCIO
-- ============================================================================

-- Função para criar uma nova organização com usuário owner
CREATE OR REPLACE FUNCTION public.create_organization_with_owner(
    org_name TEXT,
    org_slug TEXT,
    owner_email TEXT,
    owner_name TEXT DEFAULT NULL
)
RETURNS TABLE(organization_id UUID, user_id UUID) AS $$
DECLARE
    new_org_id UUID;
    new_user_id UUID;
BEGIN
    -- Criar organização
    INSERT INTO public.organizations (name, slug)
    VALUES (org_name, org_slug)
    RETURNING id INTO new_org_id;
    
    -- Criar/atualizar usuário como owner
    INSERT INTO public.users (id, organization_id, email, name, role)
    VALUES (auth.uid(), new_org_id, owner_email, owner_name, 'owner')
    ON CONFLICT (id) DO UPDATE SET
        organization_id = new_org_id,
        role = 'owner',
        updated_at = NOW()
    RETURNING id INTO new_user_id;
    
    -- Criar subscription free
    INSERT INTO public.subscriptions (organization_id, plan, status)
    VALUES (new_org_id, 'free', 'active');
    
    RETURN QUERY SELECT new_org_id, new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de um grupo
CREATE OR REPLACE FUNCTION public.get_group_stats(p_group_id UUID)
RETURNS TABLE(
    total_members BIGINT,
    total_admins BIGINT,
    messages_today BIGINT,
    messages_week BIGINT,
    active_members BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.group_members WHERE group_id = p_group_id),
        (SELECT COUNT(*) FROM public.group_members WHERE group_id = p_group_id AND is_admin = true),
        (SELECT COUNT(*) FROM public.message_logs WHERE group_id = p_group_id AND message_timestamp >= CURRENT_DATE),
        (SELECT COUNT(*) FROM public.message_logs WHERE group_id = p_group_id AND message_timestamp >= CURRENT_DATE - INTERVAL '7 days'),
        (SELECT COUNT(DISTINCT sender_jid) FROM public.message_logs WHERE group_id = p_group_id AND message_timestamp >= CURRENT_DATE - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar health score de um grupo
CREATE OR REPLACE FUNCTION public.update_group_health_score(p_group_id UUID)
RETURNS INT AS $$
DECLARE
    score INT := 100;
    last_msg TIMESTAMPTZ;
    msg_count_week INT;
    member_count INT;
BEGIN
    -- Obter dados do grupo
    SELECT last_message_at, participant_count INTO last_msg, member_count
    FROM public.whatsapp_groups WHERE id = p_group_id;
    
    -- Contar mensagens da última semana
    SELECT COUNT(*) INTO msg_count_week
    FROM public.message_logs
    WHERE group_id = p_group_id
    AND message_timestamp >= NOW() - INTERVAL '7 days';
    
    -- Calcular score
    -- Penalidade por inatividade
    IF last_msg IS NULL OR last_msg < NOW() - INTERVAL '7 days' THEN
        score := score - 40;
    ELSIF last_msg < NOW() - INTERVAL '3 days' THEN
        score := score - 20;
    ELSIF last_msg < NOW() - INTERVAL '1 day' THEN
        score := score - 10;
    END IF;
    
    -- Penalidade por poucas mensagens (relativo ao tamanho)
    IF member_count > 0 AND msg_count_week < member_count * 0.1 THEN
        score := score - 20;
    END IF;
    
    -- Garantir range 0-100
    score := GREATEST(0, LEAST(100, score));
    
    -- Atualizar grupo
    UPDATE public.whatsapp_groups
    SET health_score = score,
        activity_level = CASE
            WHEN score >= 80 THEN 'high'
            WHEN score >= 50 THEN 'normal'
            WHEN score >= 20 THEN 'low'
            ELSE 'inactive'
        END
    WHERE id = p_group_id;
    
    RETURN score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 7: REALTIME (Habilitar para tabelas específicas)
-- ============================================================================

-- Nota: Execute estes comandos separadamente se a publication já existir
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_instances;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_groups;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_messages;

-- ============================================================================
-- PARTE 8: COMENTÁRIOS NAS TABELAS (Documentação)
-- ============================================================================

COMMENT ON TABLE public.organizations IS 'Organizações/tenants do sistema multi-tenant';
COMMENT ON TABLE public.users IS 'Usuários do sistema, vinculados a uma organização';
COMMENT ON TABLE public.whatsapp_instances IS 'Instâncias WhatsApp conectadas via UAZAPI';
COMMENT ON TABLE public.whatsapp_groups IS 'Grupos WhatsApp monitorados pelo sistema';
COMMENT ON TABLE public.group_members IS 'Membros dos grupos WhatsApp';
COMMENT ON TABLE public.scheduled_messages IS 'Mensagens agendadas para envio';
COMMENT ON TABLE public.message_logs IS 'Log de mensagens para analytics (sem conteúdo sensível)';
COMMENT ON TABLE public.subscriptions IS 'Assinaturas e informações de billing';
COMMENT ON TABLE public.health_checks IS 'Histórico de verificações de saúde das instâncias';
COMMENT ON TABLE public.webhook_events IS 'Fila de webhooks recebidos para processamento';
COMMENT ON TABLE public.audit_logs IS 'Logs de auditoria de ações no sistema';

-- ============================================================================
-- FIM DO SCHEMA
-- ============================================================================

-- Para verificar se tudo foi criado corretamente:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT * FROM pg_policies WHERE schemaname = 'public';
