# Setup: pg_cron + Edge Function para Mensagens Agendadas

Este guia explica como configurar o sistema de mensagens agendadas no Grupzap.

## Visão Geral

O sistema funciona assim:
1. **pg_cron** roda a cada minuto verificando mensagens pendentes
2. Quando encontra uma mensagem, chama a **Edge Function** via **pg_net**
3. A Edge Function envia a mensagem via **UAZAPI** e atualiza o status

## Pré-requisitos

- Acesso ao Supabase Dashboard com permissões de admin
- Projeto Grupzap já configurado no Supabase
- Supabase CLI instalado (`npm install -g supabase`)

---

## Passo 1: Habilitar Extensions no Supabase

### 1.1 Acessar o Dashboard
1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione o projeto Grupzap
3. No menu lateral, vá em **Database** → **Extensions**

### 1.2 Habilitar pg_cron
1. Na lista de extensions, procure por `pg_cron`
2. Clique no toggle para habilitar
3. Aguarde a confirmação

> ⚠️ **Importante:** pg_cron só funciona em projetos Pro ou superiores. Em projetos Free, a extension não está disponível.

### 1.3 Habilitar pg_net
1. Na mesma página, procure por `pg_net`
2. Clique no toggle para habilitar
3. Aguarde a confirmação

---

## Passo 2: Configurar Variáveis de Ambiente

### 2.1 No SQL Editor
Precisamos configurar as variáveis que a função `process_scheduled_messages()` usa.

Vá em **SQL Editor** e rode:

```sql
-- Configurar URL do Supabase
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://plyrhsdkeuvbqgnuiglw.supabase.co';

-- Configurar Service Role Key (pegue no Dashboard > Settings > API)
ALTER DATABASE postgres SET app.settings.service_role_key = 'SUA_SERVICE_ROLE_KEY_AQUI';
```

> ⚠️ **Segurança:** A service role key tem acesso total ao banco. Nunca exponha em código client-side.

Para pegar a Service Role Key:
1. Vá em **Settings** → **API**
2. Na seção "Project API keys", copie a `service_role` (NÃO a anon/public)

---

## Passo 3: Rodar a Migration

### 3.1 Via Supabase CLI
```bash
cd ~/clawd/projects/grupzap
supabase db push
```

### 3.2 Via SQL Editor (alternativa)
Copie o conteúdo de `supabase/migrations/002_pg_cron_scheduled_messages.sql` e cole no SQL Editor.

---

## Passo 4: Deploy da Edge Function

### 4.1 Login no Supabase
```bash
supabase login
```

### 4.2 Link ao projeto
```bash
supabase link --project-ref plyrhsdkeuvbqgnuiglw
```

### 4.3 Deploy da function
```bash
supabase functions deploy send-scheduled-message
```

### 4.4 Verificar deploy
```bash
supabase functions list
```

Deve aparecer `send-scheduled-message` na lista.

---

## Passo 5: Verificar se Está Funcionando

### 5.1 Verificar jobs do pg_cron
No SQL Editor, rode:
```sql
SELECT * FROM cron.job;
```

Deve mostrar 3 jobs:
- `process-scheduled-messages` (a cada minuto)
- `retry-failed-messages` (a cada 5 minutos)
- `cleanup-old-scheduled-messages` (diariamente às 3h)

### 5.2 Ver histórico de execuções
```sql
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;
```

### 5.3 Testar manualmente
```sql
-- Inserir mensagem de teste
INSERT INTO scheduled_messages (
    organization_id,
    instance_id,
    target_jid,
    message_type,
    content,
    scheduled_for,
    status
) VALUES (
    'SEU_ORG_ID',
    'SEU_INSTANCE_ID',
    '5511999999999@s.whatsapp.net',
    'text',
    'Teste de mensagem agendada!',
    NOW() + INTERVAL '1 minute',
    'pending'
);

-- Aguardar 1-2 minutos e verificar
SELECT id, status, attempts, error_message, sent_at 
FROM scheduled_messages 
ORDER BY created_at DESC 
LIMIT 5;
```

### 5.4 Verificar logs da Edge Function
```bash
supabase functions logs send-scheduled-message --tail
```

---

## Troubleshooting

### "Extension pg_cron is not available"
- Verifique se seu projeto é Pro ou superior
- Extensions são habilitadas no Dashboard, não via SQL

### "Extension pg_net is not available"
- pg_net precisa ser habilitado separadamente no Dashboard

### Mensagens ficam em "processing" para sempre
1. Verifique se a Edge Function está deployada
2. Verifique os logs: `supabase functions logs send-scheduled-message`
3. Verifique se as variáveis `app.settings.*` estão configuradas

### Edge Function retorna 401
- A service_role_key está incorreta ou expirada
- Reconfigure com o comando `ALTER DATABASE` do Passo 2

### UAZAPI retorna erro
- Verifique se o token da instância WhatsApp está ativo
- Verifique se a instância está conectada
- Teste manualmente a API da UAZAPI

---

## Monitoramento

### Query útil para dashboard
```sql
-- Status das mensagens agendadas (últimas 24h)
SELECT 
    status,
    COUNT(*) as total,
    AVG(attempts) as media_tentativas
FROM scheduled_messages
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

### Alertas recomendados
Configure alertas para:
- Mais de 10 mensagens em status `failed`
- Mensagens em `processing` há mais de 5 minutos
- Jobs do cron falhando consecutivamente

---

## Arquitetura

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   pg_cron       │────▶│  pg_net      │────▶│  Edge Function  │
│ (cada minuto)   │     │ (HTTP POST)  │     │ send-scheduled  │
└─────────────────┘     └──────────────┘     └────────┬────────┘
                                                      │
                                                      ▼
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Supabase DB   │◀────│   Retorno    │◀────│    UAZAPI       │
│ (atualiza)      │     │   status     │     │ (envia msg)     │
└─────────────────┘     └──────────────┘     └─────────────────┘
```

---

## Custos Estimados

- **pg_cron:** Incluído no plano Pro+
- **pg_net:** Incluído, sem custo por request
- **Edge Functions:** ~$2/milhão de invocações
- **UAZAPI:** Conforme seu plano

Para 10.000 mensagens/mês: custo adicional ~$0.02 em Edge Functions.
