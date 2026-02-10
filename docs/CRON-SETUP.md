# Configuração do Sistema de Cron - Mensagens Agendadas

Este documento explica como funciona o sistema de processamento de mensagens agendadas usando Vercel Cron ou Google Cloud Scheduler.

## 📋 Visão Geral

O Grupzap usa cron jobs externos para processar mensagens agendadas. Isso substitui o `pg_cron` do PostgreSQL que não está disponível no plano gratuito do Supabase.

**Duas opções disponíveis:**
- **Vercel Cron** (recomendado para simplicidade, limitado no plano Hobby)
- **Google Cloud Scheduler** (recomendado para produção, maior flexibilidade)

### Arquitetura

```
┌──────────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Vercel Cron ou     │ ───▶ │   API Route     │ ───▶ │    Supabase     │
│ Google Cloud         │      │ /api/cron/...   │      │   (database)    │
│   Scheduler          │      │                 │      │                 │
└──────────────────────┘      └────────┬────────┘      └─────────────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │     UAZAPI      │
                              │   (WhatsApp)    │
                              └─────────────────┘
```

1. **Cron Scheduler** dispara periodicamente (a cada 5 minutos recomendado)
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

---

## 🔧 OPÇÃO 1: Vercel Cron (Mais Simples)

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

---

## 🔧 OPÇÃO 2: Google Cloud Scheduler (Produção)

### Por que usar Google Cloud Scheduler?

- Funcionalidade completa no Free Tier (3 jobs gratuitos)
- Execução a cada minuto sem limitações
- Maior confiabilidade e controle
- Monitoramento e logs detalhados
- Retry automático configurável

### Pré-requisitos

1. Conta Google Cloud com billing ativo (mas permanecerá no Free Tier)
2. Google Cloud CLI instalado (opcional, pode usar console web)
3. Projeto criado no Google Cloud Console

### Passo a Passo

#### 1. Criar Projeto no Google Cloud

```bash
# Via CLI
gcloud projects create grupzap-prod --name="Grupzap Production"
gcloud config set project grupzap-prod

# Ou via Console Web
# Acesse: https://console.cloud.google.com/projectcreate
```

#### 2. Habilitar APIs Necessárias

```bash
# Via CLI
gcloud services enable cloudscheduler.googleapis.com

# Ou via Console Web
# Cloud Scheduler API: https://console.cloud.google.com/apis/library/cloudscheduler.googleapis.com
```

#### 3. Configurar Variáveis de Ambiente no Vercel

Certifique-se de ter configurado:

```env
CRON_SECRET=sua-chave-secreta-muito-longa-aqui
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

#### 4. Criar o Job no Cloud Scheduler

**Via Console Web (mais fácil):**

1. Acesse: https://console.cloud.google.com/cloudscheduler
2. Clique em **CREATE JOB**
3. Configure:
   - **Name:** `grupzap-process-messages`
   - **Region:** `us-central1` (ou mais próximo do seu Vercel)
   - **Frequency:** `*/5 * * * *` (a cada 5 minutos)
   - **Timezone:** `America/Sao_Paulo`
   - **Target type:** HTTP
   - **URL:** `https://seu-dominio.vercel.app/api/cron/process-messages`
   - **HTTP method:** GET
   - **Auth header:** Add OAuth token ou Add OIDC token (escolha "Add OAuth token")
     - **Service account:** (crie um novo se necessário)
   - Em **Headers**, adicione:
     - Key: `Authorization`
     - Value: `Bearer SEU_CRON_SECRET`
   - **Retry configuration:**
     - Max retry attempts: 3
     - Max retry duration: 10 minutes
     - Min/Max backoff: 5s / 300s

**Via CLI:**

```bash
gcloud scheduler jobs create http grupzap-process-messages \
  --location=us-central1 \
  --schedule="*/5 * * * *" \
  --uri="https://seu-dominio.vercel.app/api/cron/process-messages" \
  --http-method=GET \
  --headers="Authorization=Bearer SEU_CRON_SECRET" \
  --attempt-deadline=60s \
  --max-retry-attempts=3 \
  --max-retry-duration=10m \
  --time-zone="America/Sao_Paulo" \
  --description="Processa mensagens agendadas do Grupzap a cada 5 minutos"
```

**Importante:** Substitua:
- `seu-dominio.vercel.app` pelo seu domínio real
- `SEU_CRON_SECRET` pelo valor real da variável de ambiente

#### 5. Testar o Job

```bash
# Executar manualmente (via CLI)
gcloud scheduler jobs run grupzap-process-messages --location=us-central1

# Ou via Console Web
# Acesse o job e clique em "FORCE RUN"
```

#### 6. Monitorar Execuções

**Via Console Web:**
1. Acesse: https://console.cloud.google.com/cloudscheduler
2. Clique no job `grupzap-process-messages`
3. Veja histórico na aba **Execution History**
4. Veja logs detalhados em **View Logs** (Google Cloud Logging)

**Via CLI:**
```bash
# Listar jobs
gcloud scheduler jobs list --location=us-central1

# Ver detalhes de um job
gcloud scheduler jobs describe grupzap-process-messages --location=us-central1

# Ver logs (requer logging API habilitada)
gcloud logging read "resource.type=cloud_scheduler_job AND resource.labels.job_id=grupzap-process-messages" --limit 50 --format json
```

### Configuração Recomendada para Produção

| Parâmetro | Valor Recomendado | Motivo |
|-----------|-------------------|--------|
| **Frequência** | `*/5 * * * *` (a cada 5 minutos) | Balanceia latência e custos |
| **Timeout** | 60 segundos | Tempo suficiente para processar batch |
| **Max Retry** | 3 tentativas | Evita custos excessivos em caso de erro |
| **Backoff** | 5s min, 300s max | Retry gradual para erros temporários |
| **Timezone** | America/Sao_Paulo | Horário local do Brasil |

### Frequências Alternativas

```bash
# A cada minuto (máxima responsividade)
--schedule="* * * * *"

# A cada 10 minutos (economia de custos)
--schedule="*/10 * * * *"

# A cada hora (baixo volume)
--schedule="0 * * * *"

# Horário comercial apenas (9h-18h, dias úteis)
--schedule="*/5 9-18 * * 1-5"
```

### Custos

Google Cloud Scheduler Free Tier:
- **3 jobs gratuitos por mês**
- Jobs adicionais: $0.10/job/mês
- Execuções gratuitas: sem custo adicional

Para o Grupzap com 1 job a cada 5 minutos:
- **Custo: $0.00/mês** (dentro do Free Tier)

### Segurança

**Autenticação:**
O Cloud Scheduler envia requests com o header `Authorization: Bearer CRON_SECRET`.
A API Route valida este header antes de processar.

**Recomendações:**
- Use CRON_SECRET forte (32+ caracteres aleatórios)
- Não exponha o secret em logs ou console
- Rotacione o secret periodicamente (a cada 90 dias)
- Use HTTPS sempre (Vercel já força HTTPS)

### Atualizar um Job Existente

```bash
# Atualizar frequência
gcloud scheduler jobs update http grupzap-process-messages \
  --location=us-central1 \
  --schedule="*/10 * * * *"

# Atualizar URL
gcloud scheduler jobs update http grupzap-process-messages \
  --location=us-central1 \
  --uri="https://novo-dominio.vercel.app/api/cron/process-messages"

# Atualizar headers (trocar secret)
gcloud scheduler jobs update http grupzap-process-messages \
  --location=us-central1 \
  --update-headers="Authorization=Bearer NOVO_CRON_SECRET"
```

### Deletar um Job

```bash
gcloud scheduler jobs delete grupzap-process-messages --location=us-central1
```

---

## 📊 Comparação: Vercel Cron vs Google Cloud Scheduler

| Característica | Vercel Cron | Google Cloud Scheduler |
|----------------|-------------|------------------------|
| **Setup** | Muito simples (vercel.json) | Moderado (CLI ou Console) |
| **Plano Gratuito** | 2 jobs, 1x/dia | 3 jobs, execuções ilimitadas |
| **Frequência Máxima** | 1x/minuto (Pro) / 1x/dia (Hobby) | 1x/minuto (qualquer plano) |
| **Confiabilidade** | Alta | Muito alta |
| **Monitoramento** | Logs básicos no Vercel | Logs detalhados + métricas |
| **Retry** | Automático | Configurável (tentativas, backoff) |
| **Custo (Pro)** | Incluído nos $20/mês | Gratuito (3 jobs) |
| **Recomendado para** | Protótipos, MVPs | Produção, alto volume |

### Recomendação Final

- **Desenvolvimento/MVP:** Use Vercel Cron (simplicidade)
- **Produção com Vercel Pro:** Use Vercel Cron (já incluso)
- **Produção com Vercel Hobby:** Use Google Cloud Scheduler (sem limitações)
- **Produção crítica:** Use Google Cloud Scheduler (maior controle)

---

## 🧪 Testando Localmente

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

## 🔐 Variáveis de Ambiente Necessárias

Configurar no Vercel Dashboard (Settings > Environment Variables):

```env
# Segurança - Obrigatório
CRON_SECRET=sua-chave-secreta-muito-longa-aqui

# Supabase (já deve estar configurado)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# UAZAPI (já deve estar configurado)
UAZAPI_BASE_URL=https://seu-servidor.uazapi.dev
UAZAPI_TOKEN=seu-token
```

**Como gerar CRON_SECRET:**

```bash
# Opção 1: OpenSSL
openssl rand -base64 32

# Opção 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Opção 3: Online (use site confiável)
# https://www.random.org/strings/
```

## 📚 Referências

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Google Cloud Scheduler Documentation](https://cloud.google.com/scheduler/docs)
- [Cron Expression Generator](https://crontab.guru/)
- [Supabase RPC Functions](https://supabase.com/docs/guides/database/functions)
- [Google Cloud Free Tier](https://cloud.google.com/free)
