# Grupzap - Guia de Deploy e Configuracao

Guia passo a passo para colocar o Grupzap em producao.

---

## Inventario do Projeto

| Item | Quantidade |
|------|-----------|
| Paginas | 27 |
| API Routes | 25 |
| Componentes | 31 |
| Hooks | 9 |
| Libs | 18 |
| Migrations SQL | 8 (003-008 pendentes) |
| Testes | 53 (4 suites) |
| Variaveis de Ambiente | 13 |

---

## Pre-requisitos

Antes de comecar, voce precisa ter:

- [ ] Conta no Supabase (projeto criado)
- [ ] Conta na Vercel (conectada ao GitHub)
- [ ] Conta no Stripe (pode ser test mode)
- [ ] Conta UAZAPI com instancia ativa
- [ ] Repositorio no GitHub (ja existe: tiagogladstone/grupzap)

---

## ETAPA 1: Configurar Supabase

### 1.1 Acessar o projeto Supabase

URL: https://supabase.com/dashboard/project/plyrhsdkeuvbqgnuiglw

### 1.2 Rodar Migrations

No SQL Editor do Supabase, execute AS MIGRATIONS NA ORDEM:

**IMPORTANTE**: Migrations 001 e 002 sao antigas. Comece pela 003.

1. `003_consolidated_schema.sql` — Schema completo (12 tabelas, RLS, funcoes)
2. `004_message_templates.sql` — Tabela de templates
3. `005_fetch_pending_messages_rpc.sql` — RPCs para cron
4. `006_stripe_fields.sql` — Campos do Stripe
5. `007_encrypt_api_tokens.sql` — Criptografia pgcrypto
6. `008_rls_fixes.sql` — Correcoes de RLS

**Se o banco ja tem tabelas da migration 001**: rode a 003 que faz DROP e recria.
**Se o banco esta limpo**: rode apenas 003 em diante.

### 1.3 Copiar Chaves

Em Project Settings > API, copie:
- `Project URL` → sera NEXT_PUBLIC_SUPABASE_URL
- `anon public key` → sera NEXT_PUBLIC_SUPABASE_ANON_KEY
- `service_role key` → sera SUPABASE_SERVICE_ROLE_KEY (NUNCA expor no client)

### 1.4 Configurar Auth

Em Authentication > URL Configuration:
- Site URL: `https://grupzap.vercel.app` (ou seu dominio)
- Redirect URLs adicionar:
  - `https://grupzap.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback` (para dev)

Em Authentication > Providers:
- Email habilitado (ja deve estar)
- Confirmar email: ativado ou desativado (escolha)

---

## ETAPA 2: Configurar Stripe

### 2.1 Criar Produtos no Stripe Dashboard

Acesse: https://dashboard.stripe.com/products

Criar 3 produtos:

**Produto 1: Starter**
- Nome: Grupzap Starter
- Preco: R$ 97,00/mes (recorrente mensal)
- Copie o `price_id` (ex: price_1Pxxx...)

**Produto 2: Pro**
- Nome: Grupzap Pro
- Preco: R$ 197,00/mes (recorrente mensal)
- Copie o `price_id`

**Produto 3: Enterprise**
- Nome: Grupzap Enterprise
- Preco: R$ 497,00/mes (recorrente mensal)
- Copie o `price_id`

### 2.2 Copiar Chaves da API

Em Developers > API Keys:
- `Publishable key` → sera NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- `Secret key` → sera STRIPE_SECRET_KEY

### 2.3 Configurar Webhook (apos deploy)

Em Developers > Webhooks > Add endpoint:
- URL: `https://grupzap.vercel.app/api/webhooks/stripe`
- Eventos a escutar:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
  - `invoice.payment_succeeded`
- Copie o `Signing secret` → sera STRIPE_WEBHOOK_SECRET

---

## ETAPA 3: Configurar UAZAPI

### 3.1 Dados necessarios

Da sua conta UAZAPI:
- URL base da API (ex: https://sua-instancia.uazapi.com)
- Token de autenticacao

**NOTA**: Cada instancia WhatsApp criada no Grupzap tera seu proprio token.
As variaveis UAZAPI_BASE_URL e UAZAPI_TOKEN sao para a instancia padrao (se houver).

### 3.2 Configurar Webhook na UAZAPI

No painel da UAZAPI, configure o webhook da instancia:
- URL: `https://grupzap.vercel.app/api/webhooks/uazapi`
- Eventos: todos (messages, groups, etc.)

---

## ETAPA 4: Deploy na Vercel

### 4.1 Conectar repositorio

1. Acesse https://vercel.com/new
2. Importe o repositorio `tiagogladstone/grupzap`
3. Framework: Next.js (detectado automaticamente)
4. Root Directory: `.` (padrao)

### 4.2 Configurar Variaveis de Ambiente

Na Vercel, em Settings > Environment Variables, adicione TODAS:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://plyrhsdkeuvbqgnuiglw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_STARTER=price_xxx
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_ENTERPRISE=price_xxx

# UAZAPI
UAZAPI_BASE_URL=https://sua-instancia.uazapi.com
UAZAPI_TOKEN=seu-token-padrao

# Cron
CRON_SECRET=gerar-com-openssl-rand-base64-32

# App
NEXT_PUBLIC_APP_URL=https://grupzap.vercel.app
```

### 4.3 Deploy

Clique "Deploy". O build deve passar (ja testamos localmente).

### 4.4 Configurar Dominio (opcional)

Em Settings > Domains:
- Adicionar dominio customizado (ex: app.grupzap.com)
- Configurar DNS no seu provedor

---

## ETAPA 5: Configurar Cron

### Opcao A: Vercel Cron (mais simples)

Criar arquivo `vercel.json` na raiz:
```json
{
  "crons": [
    {
      "path": "/api/cron/process-messages",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/health-check",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**NOTA**: Vercel Cron requer plano Pro ($20/mes) para frequencia menor que 1 hora.

### Opcao B: Google Cloud Scheduler (gratis)

Veja instrucoes completas em `docs/CRON-SETUP.md`.

Resumo:
```bash
gcloud scheduler jobs create http grupzap-messages \
  --location=us-central1 \
  --schedule="*/5 * * * *" \
  --uri="https://grupzap.vercel.app/api/cron/process-messages" \
  --http-method=GET \
  --headers="Authorization=Bearer SEU_CRON_SECRET"

gcloud scheduler jobs create http grupzap-health \
  --location=us-central1 \
  --schedule="*/5 * * * *" \
  --uri="https://grupzap.vercel.app/api/cron/health-check" \
  --http-method=GET \
  --headers="Authorization=Bearer SEU_CRON_SECRET"
```

---

## ETAPA 6: Testar Tudo

### 6.1 Fluxo de Auth
- [ ] Acessar landing page
- [ ] Clicar "Comecar Gratis" → vai para /signup
- [ ] Criar conta com email e nome da organizacao
- [ ] Confirmar email (se configurado)
- [ ] Login redireciona para /onboarding/connect

### 6.2 Onboarding
- [ ] Conectar instancia WhatsApp (QR code)
- [ ] Sincronizar grupos
- [ ] Concluir onboarding → vai para /dashboard

### 6.3 Dashboard
- [ ] Dashboard mostra stats zerados
- [ ] Sidebar navega corretamente
- [ ] Settings mostra dados do user/org

### 6.4 Instancias
- [ ] Listar instancias
- [ ] Ver detalhe com status
- [ ] Health check funciona

### 6.5 Grupos
- [ ] Sincronizar grupos do WhatsApp
- [ ] Ver lista de grupos
- [ ] Toggle monitorado funciona
- [ ] Ver detalhe do grupo

### 6.6 Mensagens
- [ ] Criar template
- [ ] Agendar mensagem
- [ ] Cron processa e envia
- [ ] Status atualiza (pending → sent)

### 6.7 Billing
- [ ] Ver pagina /settings/billing
- [ ] Clicar "Fazer Upgrade" → redireciona para Stripe
- [ ] Completar checkout com cartao de teste (4242 4242 4242 4242)
- [ ] Webhook processa → plano atualiza no banco
- [ ] Limites do plano sao aplicados

### 6.8 Analytics
- [ ] Ver pagina /analytics
- [ ] Graficos mostram dados (apos ter mensagens)
- [ ] Audit logs registram acoes

---

## ETAPA 7: Ir para Producao

### 7.1 Stripe: Modo Live
- Trocar chaves de teste por chaves de producao
- Recriar produtos/precos no modo live
- Reconfigurar webhook com novo signing secret
- Atualizar variaveis na Vercel

### 7.2 Seguranca
- [ ] Verificar que SUPABASE_SERVICE_ROLE_KEY nao esta exposto
- [ ] Verificar que STRIPE_SECRET_KEY nao esta exposto
- [ ] Gerar CRON_SECRET forte (openssl rand -base64 32)
- [ ] Testar rate limiting nas APIs
- [ ] Verificar RLS em todas as tabelas

### 7.3 Monitoramento
- [ ] Ativar Vercel Analytics
- [ ] Monitorar logs no Vercel
- [ ] Monitorar erros no Supabase
- [ ] Verificar cron no Cloud Scheduler

---

## Variaveis de Ambiente - Referencia Rapida

| Variavel | Onde Obter | Expor no Client? |
|----------|-----------|-----------------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase > Settings > API | Sim |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase > Settings > API | Sim |
| SUPABASE_SERVICE_ROLE_KEY | Supabase > Settings > API | NAO |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Stripe > Developers > API Keys | Sim |
| STRIPE_SECRET_KEY | Stripe > Developers > API Keys | NAO |
| STRIPE_WEBHOOK_SECRET | Stripe > Developers > Webhooks | NAO |
| STRIPE_PRICE_STARTER | Stripe > Products > Starter | NAO |
| STRIPE_PRICE_PRO | Stripe > Products > Pro | NAO |
| STRIPE_PRICE_ENTERPRISE | Stripe > Products > Enterprise | NAO |
| UAZAPI_BASE_URL | Painel UAZAPI | NAO |
| UAZAPI_TOKEN | Painel UAZAPI | NAO |
| CRON_SECRET | Gerar: openssl rand -base64 32 | NAO |
| NEXT_PUBLIC_APP_URL | Seu dominio na Vercel | Sim |

---

## Troubleshooting

### Build falha com "STRIPE_SECRET_KEY is not defined"
O Stripe SDK usa inicializacao lazy. Se ainda falhar, verifique se a variavel esta na Vercel.

### Auth callback retorna erro
Verificar se a URL de redirect esta configurada no Supabase Auth.

### Webhook UAZAPI nao processa
1. Verificar URL do webhook na UAZAPI
2. Verificar logs no Vercel (Functions)
3. Verificar se HMAC secret esta correto

### Cron nao executa
1. Verificar se CRON_SECRET e igual no scheduler e na Vercel
2. Verificar logs do Cloud Scheduler
3. Testar manualmente: `curl -H "Authorization: Bearer SEU_SECRET" https://seu-app/api/cron/process-messages`
