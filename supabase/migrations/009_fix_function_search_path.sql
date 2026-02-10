-- ============================================================================
-- MIGRATION 009: Fix function search_path + duplicate policies + initplan
-- ============================================================================
-- Aplicada via MCP em 2026-02-10
-- 1. SET search_path = '' em todas as funções (security advisory)
-- 2. Remove policies duplicadas (003 + 008 conflitavam)
-- 3. Otimiza RLS policies com (select auth.uid()) para initplan
-- 4. Adiciona indexes faltantes em FKs
-- ============================================================================

-- Fix 1: Remove duplicate policies from migration 008
DROP POLICY IF EXISTS "Org members can view audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Org members can insert audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Org members can delete group_members" ON public.group_members;
DROP POLICY IF EXISTS "Org members can view health_checks" ON public.health_checks;

-- Fix 2: Recreate policies with (select auth.uid()) for initplan optimization
DROP POLICY IF EXISTS "organizations_select_own" ON public.organizations;
CREATE POLICY "organizations_select_own" ON public.organizations FOR SELECT
    USING (id IN (SELECT organization_id FROM public.users WHERE id = (select auth.uid())));

DROP POLICY IF EXISTS "users_select_same_org" ON public.users;
CREATE POLICY "users_select_same_org" ON public.users FOR SELECT
    USING (organization_id = public.get_user_org_id() OR id = (select auth.uid()));

DROP POLICY IF EXISTS "users_update_self_or_admin" ON public.users;
CREATE POLICY "users_update_self_or_admin" ON public.users FOR UPDATE
    USING (id = (select auth.uid()) OR public.user_is_org_admin(organization_id));

DROP POLICY IF EXISTS "scheduled_update_member" ON public.scheduled_messages;
CREATE POLICY "scheduled_update_member" ON public.scheduled_messages FOR UPDATE
    USING (created_by = (select auth.uid()) OR public.user_is_org_admin(organization_id));

DROP POLICY IF EXISTS "scheduled_delete_owner" ON public.scheduled_messages;
CREATE POLICY "scheduled_delete_owner" ON public.scheduled_messages FOR DELETE
    USING (created_by = (select auth.uid()) OR public.user_is_org_admin(organization_id));

DROP POLICY IF EXISTS "templates_update_owner" ON public.message_templates;
CREATE POLICY "templates_update_owner" ON public.message_templates FOR UPDATE
    USING (created_by = (select auth.uid()) OR public.user_is_org_admin(organization_id));

DROP POLICY IF EXISTS "templates_delete_owner" ON public.message_templates;
CREATE POLICY "templates_delete_owner" ON public.message_templates FOR DELETE
    USING (created_by = (select auth.uid()) OR public.user_is_org_admin(organization_id));

-- Fix 3: Missing FK indexes
CREATE INDEX IF NOT EXISTS idx_health_checks_organization ON public.health_checks(organization_id);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON public.message_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_scheduled_created_by ON public.scheduled_messages(created_by);
CREATE INDEX IF NOT EXISTS idx_webhook_organization ON public.webhook_events(organization_id);

-- Fix 4: Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_instances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_messages;
