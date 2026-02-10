# api — API Routes

Rotas de API do Next.js (server-side).

## Rotas

- `cron/process-messages/route.ts` — Processa mensagens agendadas pendentes
  - Chamado via GitHub Actions (cron a cada minuto)
  - Autenticado via header `Authorization: Bearer CRON_SECRET`
  - Busca mensagens com `status=pending` e `scheduled_for <= now`
  - Envia via UAZAPI e atualiza status no banco

## Segurança

- API routes de cron DEVEM validar `CRON_SECRET`
- Use `createClient` server-side com `SUPABASE_SERVICE_ROLE_KEY` para bypass de RLS
- Nunca exponha dados sensíveis nas responses
