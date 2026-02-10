-- Migration: RLS Fixes
-- Corrige policies faltantes e habilita RLS em tabelas sem protecao

-- =============================================================================
-- 1. FIX: group_members - Adicionar policy de DELETE
-- =============================================================================

-- Verificar se policy ja existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'group_members'
    AND policyname = 'Org members can delete group_members'
  ) THEN
    CREATE POLICY "Org members can delete group_members"
      ON group_members FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM whatsapp_groups g
          JOIN users u ON u.organization_id = g.organization_id
          WHERE g.id = group_members.group_id
          AND u.id = auth.uid()
        )
      );
  END IF;
END $$;

COMMENT ON POLICY "Org members can delete group_members" ON group_members IS
'Membros da organizacao podem deletar participantes de grupos da sua org';

-- =============================================================================
-- 2. FIX: health_checks - Habilitar RLS e criar policies
-- =============================================================================

-- Habilitar RLS
ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;

-- Policy de SELECT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'health_checks'
    AND policyname = 'Org members can view health_checks'
  ) THEN
    CREATE POLICY "Org members can view health_checks"
      ON health_checks FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM whatsapp_instances i
          JOIN users u ON u.organization_id = i.organization_id
          WHERE i.id = health_checks.instance_id
          AND u.id = auth.uid()
        )
      );
  END IF;
END $$;

COMMENT ON POLICY "Org members can view health_checks" ON health_checks IS
'Membros da organizacao podem visualizar health checks das suas instancias';

-- Nota: INSERT em health_checks e feito via service role (cron), nao precisa de policy

-- =============================================================================
-- 3. FIX: audit_logs - Habilitar RLS e criar policies
-- =============================================================================

-- Habilitar RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy de SELECT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'audit_logs'
    AND policyname = 'Org members can view audit_logs'
  ) THEN
    CREATE POLICY "Org members can view audit_logs"
      ON audit_logs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM users u
          WHERE u.organization_id = audit_logs.organization_id
          AND u.id = auth.uid()
        )
      );
  END IF;
END $$;

COMMENT ON POLICY "Org members can view audit_logs" ON audit_logs IS
'Membros da organizacao podem visualizar logs de auditoria da sua org';

-- Policy de INSERT (para funcoes que criam logs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'audit_logs'
    AND policyname = 'Org members can insert audit_logs'
  ) THEN
    CREATE POLICY "Org members can insert audit_logs"
      ON audit_logs FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users u
          WHERE u.organization_id = audit_logs.organization_id
          AND u.id = auth.uid()
        )
      );
  END IF;
END $$;

COMMENT ON POLICY "Org members can insert audit_logs" ON audit_logs IS
'Membros da organizacao podem criar logs de auditoria para sua org';

-- =============================================================================
-- 4. VERIFICACAO: Garantir que todas as tabelas multi-tenant tem RLS
-- =============================================================================

-- Lista de tabelas que DEVEM ter RLS habilitado:
DO $$
DECLARE
  table_name TEXT;
  tables_to_check TEXT[] := ARRAY[
    'organizations',
    'users',
    'subscriptions',
    'whatsapp_instances',
    'whatsapp_groups',
    'group_members',
    'scheduled_messages',
    'message_logs',
    'webhook_events',
    'health_checks',
    'audit_logs'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables_to_check
  LOOP
    -- Verificar se RLS esta habilitado
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables t
      JOIN pg_class c ON c.relname = t.tablename
      WHERE t.schemaname = 'public'
      AND t.tablename = table_name
      AND c.relrowsecurity = true
    ) THEN
      RAISE WARNING 'Tabela % nao tem RLS habilitado!', table_name;
    END IF;
  END LOOP;
END $$;

-- =============================================================================
-- 5. SEGURANCA ADICIONAL: Revogar permissoes publicas desnecessarias
-- =============================================================================

-- Revogar acesso direto de anon/authenticated em tabelas sensiveis
-- (devem usar apenas via RLS policies)

REVOKE ALL ON health_checks FROM anon, authenticated;
GRANT SELECT ON health_checks TO authenticated;

REVOKE ALL ON audit_logs FROM anon, authenticated;
GRANT SELECT, INSERT ON audit_logs TO authenticated;

-- webhook_events e message_logs sao apenas leitura para users
REVOKE ALL ON webhook_events FROM anon, authenticated;
GRANT SELECT ON webhook_events TO authenticated;

REVOKE ALL ON message_logs FROM anon, authenticated;
GRANT SELECT ON message_logs TO authenticated;

-- =============================================================================
-- NOTAS FINAIS
-- =============================================================================

-- Esta migration:
-- 1. Adiciona policy DELETE faltante em group_members
-- 2. Habilita RLS em health_checks e audit_logs (tabelas novas sem protecao)
-- 3. Cria policies de SELECT/INSERT para essas tabelas
-- 4. Verifica que todas as tabelas multi-tenant tem RLS
-- 5. Ajusta permissoes para seguir principio do menor privilegio

-- Para verificar policies de uma tabela:
-- SELECT * FROM pg_policies WHERE tablename = 'nome_da_tabela';

-- Para verificar se RLS esta habilitado:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
