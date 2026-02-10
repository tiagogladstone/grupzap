# webhooks -- Recepção de Eventos Externos

## Rotas

- `POST /api/webhooks/uazapi` -- Recebe eventos da UAZAPI (WhatsApp)

## Eventos Processados

### Mensagem Recebida
- Salva em `message_logs` (sem conteúdo sensível, apenas metadados)
- Atualiza `last_message_at` do grupo e membro
- Incrementa `message_count` do membro

### Membro Entrou/Saiu
- Add: UPSERT em `group_members`, incrementa `participant_count`
- Remove: DELETE de `group_members`, decrementa `participant_count`
- Promote/Demote: atualiza `is_admin`, ajusta `admin_count`

## Autenticação
- HMAC SHA256 via header `x-webhook-signature`
- Fallback: `x-webhook-secret` header ou `?secret=` query param

## Segurança
- Usa `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS -- webhooks não têm sessão de user)
- Sempre retorna 200 (evitar retries da UAZAPI)
- Erros são salvos em `webhook_events.error_message`
