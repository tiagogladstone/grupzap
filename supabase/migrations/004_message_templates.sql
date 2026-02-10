-- ============================================================================
-- MIGRATION 004: Templates de Mensagem
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document')),
    content TEXT,                    -- Texto com variáveis: {{nome}}, {{grupo}}, etc.
    caption TEXT,                    -- Legenda para mídia
    media_url TEXT,                  -- URL da mídia
    media_filename TEXT,
    variables TEXT[] DEFAULT '{}',   -- Lista de variáveis usadas: ['nome', 'grupo']
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'welcome', 'reminder', 'announcement', 'promotion')),
    is_active BOOLEAN DEFAULT true,
    usage_count INT DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_templates_organization ON public.message_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.message_templates(organization_id, category);
CREATE INDEX IF NOT EXISTS idx_templates_active ON public.message_templates(organization_id, is_active) WHERE is_active = true;

-- Trigger updated_at
DROP TRIGGER IF EXISTS trigger_templates_updated_at ON public.message_templates;
CREATE TRIGGER trigger_templates_updated_at
    BEFORE UPDATE ON public.message_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- SELECT: membros da org podem ver
DROP POLICY IF EXISTS "templates_select_org" ON public.message_templates;
CREATE POLICY "templates_select_org"
    ON public.message_templates FOR SELECT
    USING (organization_id = public.get_user_org_id());

-- INSERT: membros podem criar
DROP POLICY IF EXISTS "templates_insert_member" ON public.message_templates;
CREATE POLICY "templates_insert_member"
    ON public.message_templates FOR INSERT
    WITH CHECK (public.user_belongs_to_org(organization_id));

-- UPDATE: criador ou admin
DROP POLICY IF EXISTS "templates_update_owner" ON public.message_templates;
CREATE POLICY "templates_update_owner"
    ON public.message_templates FOR UPDATE
    USING (created_by = auth.uid() OR public.user_is_org_admin(organization_id));

-- DELETE: criador ou admin
DROP POLICY IF EXISTS "templates_delete_owner" ON public.message_templates;
CREATE POLICY "templates_delete_owner"
    ON public.message_templates FOR DELETE
    USING (created_by = auth.uid() OR public.user_is_org_admin(organization_id));

COMMENT ON TABLE public.message_templates IS 'Templates de mensagem reutilizáveis com variáveis';
