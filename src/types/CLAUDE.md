# src/types — Tipos TypeScript

## Arquivos

- `supabase.ts` — Tipos manuais do schema Supabase (Database interface)
  - Espelha fielmente o `supabase/schema.sql` (11 tabelas)
  - Tabelas: organizations, users, whatsapp_instances, whatsapp_groups, group_members, scheduled_messages, message_logs, subscriptions, health_checks, webhook_events, audit_logs
  - Funções: create_organization_with_owner, get_group_stats, update_group_health_score, user_belongs_to_org, get_user_org_id, user_is_org_admin
  - Type helpers exportados: Tables, TableName, Row, InsertRow, UpdateRow

## Convenções

- Tipos do Supabase devem espelhar o schema.sql
- Use `Database['public']['Tables']['nome']['Row']` para tipos de linha
- Atualize este arquivo sempre que alterar o schema do banco
