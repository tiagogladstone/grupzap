# Supabase -- Database Setup

## Para banco NOVO
Execute no SQL Editor do Supabase:
1. `migrations/003_consolidated_schema.sql` (schema completo)
2. `migrations/002_pg_cron_scheduled_messages.sql` (se usar pg_cron)

## Para banco EXISTENTE (ja rodou 001 e 002)
Execute:
1. `migrations/003_consolidated_schema.sql` (consolida e atualiza)

## Source of Truth
O arquivo `schema.sql` e a referencia canonica do schema.
Sempre que alterar o schema, atualize TANTO o schema.sql quanto crie uma nova migration.

## Migrations
- `001_auth_schema.sql` -- DEPRECATED (usava profiles/organization_members)
- `002_pg_cron_scheduled_messages.sql` -- Setup pg_cron (ainda valida)
- `003_consolidated_schema.sql` -- Schema completo consolidado
