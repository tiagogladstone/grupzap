# supabase — Schema e Migrations

## Arquivos

- `schema.sql` — Schema completo do banco (SOURCE OF TRUTH)
- `migrations/001_auth_schema.sql` — DEPRECATED (usava profiles/organization_members)
- `migrations/002_pg_cron_scheduled_messages.sql` — Migration de pg_cron (ainda valida)
- `migrations/003_consolidated_schema.sql` — Schema completo consolidado (usar esta)
- `SETUP-CRON.md` — Documentacao de setup do cron
- `README.md` — Instrucoes de setup do banco

## Tabelas Principais

- `organizations` — Tenants (planos: free, starter, pro, enterprise)
- `users` — Vinculados a uma org (roles: owner, admin, member, viewer)
- `whatsapp_instances` — Conexões UAZAPI (status: connected, disconnected, etc.)
- `whatsapp_groups` — Grupos monitorados (health_score, activity_level)
- `group_members` — Membros dos grupos (engagement_score, tags)
- `scheduled_messages` — Mensagens agendadas (recorrência, status de envio)
- `message_logs` — Analytics sem conteúdo sensível
- `subscriptions` — Billing preparado para Stripe
- `health_checks` — Verificações de saúde
- `webhook_events` — Fila de webhooks
- `audit_logs` — Auditoria de ações

## Segurança

- RLS habilitado em TODAS as tabelas
- Isolamento por `organization_id`
- Funções auxiliares: `user_belongs_to_org()`, `get_user_org_id()`, `user_is_org_admin()`
- INSERT em tabelas sensíveis é bloqueado via RLS (apenas service_role)

## Padrões

- Todas as tabelas têm `created_at` e `updated_at` (com trigger automático)
- IDs são UUID (gen_random_uuid)
- JSONB para campos flexíveis (settings, metadata)
- Índices otimizados para queries frequentes
