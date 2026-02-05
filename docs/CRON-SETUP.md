# Configuração do Sistema de Cron - Mensagens Agendadas

Este documento explica como funciona o sistema de processamento de mensagens agendadas usando Vercel Cron.

## 📋 Visão Geral

O Grupzap usa **Vercel Cron** para processar mensagens agendadas. Isso substitui o `pg_cron` do PostgreSQL que não está disponível no plano gratuito do Supabase.

### Arquitetura

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Vercel Cron   │ ───▶ │   API Route     │ ───▶ │    Supabase     │
│  (scheduler)    │      │ /api/cron/...   │      │   (database)    │
└─────────────────┘      └────────┬────────┘      └─────────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │     UAZAPI      │
                         │   (WhatsApp)    │
                         └─────────────────┘
```

1. **Vercel Cron** dispara a cada minuto (ou 1x/dia no plano Hobby)
2. **API Route** busca mensagens pendentes no Supabase
3. **UAZAPI Client** envia as mensagens via WhatsApp
4. **Status** é atualizado no banco (sent/failed)

## ⚠️ Limitações por Plano Vercel

| Plano | Frequência Máxima | Cron Jobs | Observação |
|-------|-------------------|-----------|------------|
| **Hobby** (grátis) | 1x por dia | 2 jobs | Apenas schedule diário |
| **Pro** ($20/mês) | 1x por minuto | 10 jobs | Ideal para produção |
| **Enterprise** | 1x por minuto | Ilimitado | - |

### ❗ Importante para Plano Hobby

No plano **Hobby**, o cron só pode rodar **uma vez por dia**. Isso significa que mensagens agendadas só serão processadas no horário configurado no schedule.

**Workaround para Hobby:**
- Configure o cron para rodar no horário mais crítico (ex: `0 9 * * *` = 9h da manhã)
- Ou use um serviço externo de cron (ex: cron-job.org) para chamar a API mais frequentemente

**Para usar a cada minuto:** Faça upgrade para o plano Pro.

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione no Vercel Dashboard (Settings > Environment Variables):

```env
# Obrigatório - Segurança
CRON_SECRET=sua-chave-secreta-muito-longa-aqui

# Supabase (provavelmente já configurado)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# UAZAPI (provavelmente já configurado)
UAZAPI_BASE_URL=https://seu-servidor.uazapi.dev
UAZAPI_TOKEN=seu-token
```

**Como gerar CRON_SECRET:**
```bash
# No terminal
openssl rand -base64 32
# Ou
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Arquivo vercel.json

```json
{
  "crons": [
    {
      "path": "/api/cron/process-messages",
      "schedule": "* * * * *"
    }
  ]
}
```

**Formato do schedule (cron expression):**
```
* * * * *
│ │ │ │ │
│ │ │ │ └── Dia da semana (0-7, 0 e 7 = domingo)
│ │ │ └──── Mês (1-12)
│ │ └────── Dia do mês (1-31)
│ └──────── Hora (0-23)
└────────── Minuto (0-59)
```

**Exemplos:**
- `* * * * *` - Cada minuto (requer Pro)
- `0 * * * *` - Cada hora
- `0 9 * * *` - Todos os dias às 9h
- `0 9,18 * * *` - Às 9h e 18h
- `0 9 * * 1-5` - Dias úteis às 9h

### 3. Verificar o Deploy

Após o deploy, o cron aparecerá no Vercel Dashboard:
1. Acesse seu projeto no Vercel
2. Vá em **Settings** > **Cron Jobs**
3. Você verá o job listado com próxima execução

## 🧪 Testando Localmente

### Usando curl

```bash
# Simular chamada do Vercel Cron
curl -X GET http://localhost:3000/api/cron/process-messages \
  -H "Authorization: Bearer seu-cron-secret"
```

### Usando o Vercel CLI

```bash
# Instalar CLI
npm i -g vercel

# Executar cron manualmente
vercel dev --cron
```

### Script de teste

Crie um arquivo `scripts/test-cron.ts`:

```typescript
// Executar: npx tsx scripts/test-cron.ts

async function testCron() {
  const response = await fetch('http://localhost:3000/api/cron/process-messages', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`,
    },
  });
  
  const data = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));
}

testCron().catch(console.error);
```

## 📊 Monitoramento

### Logs no Vercel

1. Acesse **Deployments** > selecione o deploy
2. Vá em **Functions**
3. Encontre `/api/cron/process-messages`
4. Veja os logs de execução

### Resposta da API

```json
{
  "success": true,
  "duration_ms": 1234,
  "result": {
    "processed": 5,
    "sent": 4,
    "failed": 1,
    "retried": 2
  },
  "errors": [
    { "id": "uuid-da-mensagem", "error": "Timeout ao enviar" }
  ]
}
```

### Métricas no Supabase

Consulta para verificar status das mensagens:

```sql
-- Mensagens por status nas últimas 24h
SELECT 
  status, 
  COUNT(*) as total
FROM scheduled_messages
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Mensagens falhadas com detalhes
SELECT 
  id,
  target_jid,
  attempts,
  error_message,
  scheduled_for,
  updated_at
FROM scheduled_messages
WHERE status = 'failed'
ORDER BY updated_at DESC
LIMIT 20;
```

## 🔒 Segurança

### Proteção da Rota

A rota verifica o header `Authorization: Bearer <CRON_SECRET>`. Sem o secret correto, retorna 401.

O Vercel Cron automaticamente inclui este header ao chamar a rota.

### Evitando Duplicação (Race Conditions)

O código implementa:
1. **Atomic update** - Só processa se status ainda for `pending`
2. **Batch processing** - Máximo 10 mensagens por execução
3. **Increment attempts** - Evita loops infinitos de retry

Idealmente, em produção com múltiplas instâncias, usar uma função RPC com `FOR UPDATE SKIP LOCKED`:

```sql
CREATE OR REPLACE FUNCTION claim_pending_messages(batch_size INT)
RETURNS SETOF scheduled_messages AS $$
BEGIN
  RETURN QUERY
  UPDATE scheduled_messages
  SET status = 'processing', attempts = attempts + 1
  WHERE id IN (
    SELECT id FROM scheduled_messages
    WHERE status = 'pending'
      AND scheduled_for <= NOW()
      AND attempts < max_attempts
    ORDER BY scheduled_for
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$ LANGUAGE plpgsql;
```

## 🔄 Retry Logic

| Tentativa | Espera até retry | Comportamento |
|-----------|------------------|---------------|
| 1ª | - | Processa imediatamente |
| 2ª | 5 minutos | Auto-retry se falhou |
| 3ª | 5 minutos | Última tentativa |
| Após 3ª | - | Marcado como `failed` permanente |

Para reprocessar manualmente uma mensagem falhada:

```sql
UPDATE scheduled_messages
SET status = 'pending', attempts = 0, error_message = NULL
WHERE id = 'uuid-da-mensagem';
```

## 🚨 Troubleshooting

### Cron não está executando

1. Verifique se o deploy foi feito com `vercel.json` atualizado
2. Confirme que está no plano correto para a frequência desejada
3. Verifique os logs em Vercel > Deployments > Functions

### Erro 401 Unauthorized

1. Confirme que `CRON_SECRET` está configurado no Vercel
2. Verifique se o valor é exatamente igual nos dois lugares

### Mensagens não sendo enviadas

1. Verifique se `UAZAPI_BASE_URL` e `UAZAPI_TOKEN` estão corretos
2. Confirme que a instância UAZAPI está conectada
3. Verifique se há mensagens com status `pending` e `scheduled_for <= NOW()`

### Muitos erros de timeout

1. Aumente o timeout no cliente UAZAPI
2. Reduza o `BATCH_SIZE` se necessário
3. Verifique latência entre Vercel e UAZAPI

## 📚 Referências

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Cron Expression Generator](https://crontab.guru/)
- [Supabase RPC Functions](https://supabase.com/docs/guides/database/functions)
