# Stripe Setup — Guia de Configuração

## Pré-requisitos

- Conta Stripe (criar em https://stripe.com)
- Acesso ao Stripe Dashboard
- Acesso ao Supabase Dashboard
- Acesso ao Vercel Dashboard (ou ambiente de deploy)

## Passo 1: Criar Produtos e Preços no Stripe

### 1.1 Acessar Stripe Dashboard
1. Acesse https://dashboard.stripe.com
2. Certifique-se de estar em modo **Test** (toggle no canto superior direito)

### 1.2 Criar Produto Starter
1. Vá em **Produtos** → **Adicionar produto**
2. Preencha:
   - Nome: `Grupzap Starter`
   - Descrição: `Plano Starter - 2 instâncias, 50 grupos, 500 mensagens/mês`
   - Preço: `R$ 97,00`
   - Cobrança: `Recorrente - Mensal`
   - Tipo de preço: `Padrão`
3. Clique em **Salvar produto**
4. Copie o **Price ID** (começa com `price_`) e anote

### 1.3 Criar Produto Pro
1. Vá em **Produtos** → **Adicionar produto**
2. Preencha:
   - Nome: `Grupzap Pro`
   - Descrição: `Plano Pro - 5 instâncias, 200 grupos, 2000 mensagens/mês`
   - Preço: `R$ 197,00`
   - Cobrança: `Recorrente - Mensal`
   - Tipo de preço: `Padrão`
3. Clique em **Salvar produto**
4. Copie o **Price ID** e anote

### 1.4 Criar Produto Enterprise
1. Vá em **Produtos** → **Adicionar produto**
2. Preencha:
   - Nome: `Grupzap Enterprise`
   - Descrição: `Plano Enterprise - 20 instâncias, grupos ilimitados, mensagens ilimitadas`
   - Preço: `R$ 497,00`
   - Cobrança: `Recorrente - Mensal`
   - Tipo de preço: `Padrão`
3. Clique em **Salvar produto**
4. Copie o **Price ID** e anote

## Passo 2: Configurar Webhook

### 2.1 Criar Endpoint de Webhook
1. Vá em **Desenvolvedores** → **Webhooks** → **Adicionar endpoint**
2. Preencha:
   - URL do endpoint: `https://seu-dominio.com/api/webhooks/stripe`
   - Descrição: `Grupzap Billing Events`
3. Selecione os eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
4. Clique em **Adicionar endpoint**
5. Copie o **Signing secret** (começa com `whsec_`) e anote

### 2.2 Copiar Chaves da API
1. Vá em **Desenvolvedores** → **Chaves da API**
2. Copie:
   - **Publishable key** (começa com `pk_test_`)
   - **Secret key** (começa com `sk_test_`) - clique em **Revelar chave de teste**
3. Anote ambas

## Passo 3: Configurar Variáveis de Ambiente

### 3.1 Desenvolvimento Local
1. Abra o arquivo `.env.local` (crie se não existir)
2. Adicione as variáveis:

```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_SEU_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_test_SEU_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_SEU_WEBHOOK_SECRET
STRIPE_PRICE_STARTER=price_SEU_PRICE_ID_STARTER
STRIPE_PRICE_PRO=price_SEU_PRICE_ID_PRO
STRIPE_PRICE_ENTERPRISE=price_SEU_PRICE_ID_ENTERPRISE

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3.2 Vercel (Produção/Preview)
1. Acesse o projeto no Vercel Dashboard
2. Vá em **Settings** → **Environment Variables**
3. Adicione cada variável (uma por vez):
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → valor → Environment: Production, Preview, Development
   - `STRIPE_SECRET_KEY` → valor → Environment: Production, Preview, Development
   - `STRIPE_WEBHOOK_SECRET` → valor → Environment: Production, Preview
   - `STRIPE_PRICE_STARTER` → valor → Environment: Production, Preview, Development
   - `STRIPE_PRICE_PRO` → valor → Environment: Production, Preview, Development
   - `STRIPE_PRICE_ENTERPRISE` → valor → Environment: Production, Preview, Development
   - `NEXT_PUBLIC_APP_URL` → `https://seu-dominio.com` → Environment: Production, Preview

## Passo 4: Rodar Migration no Supabase

### 4.1 Via Supabase Dashboard
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Clique em **New query**
5. Cole o conteúdo de `supabase/migrations/006_stripe_fields.sql`
6. Clique em **Run**

### 4.2 Via Supabase CLI (alternativa)
```bash
npx supabase db push
```

## Passo 5: Testar Integração

### 5.1 Testar Checkout (Desenvolvimento)
1. Rode o projeto localmente: `npm run dev`
2. Acesse http://localhost:3000/settings/billing
3. Clique em **Fazer Upgrade** em um dos planos
4. Use cartão de teste do Stripe:
   - Número: `4242 4242 4242 4242`
   - Data: qualquer data futura
   - CVC: qualquer 3 dígitos
   - CEP: qualquer CEP
5. Complete o checkout
6. Verifique se foi redirecionado para `/settings/billing?success=true`

### 5.2 Testar Webhook (Desenvolvimento)
Para testar webhook localmente, use Stripe CLI:

1. Instale Stripe CLI: https://stripe.com/docs/stripe-cli
2. Faça login:
   ```bash
   stripe login
   ```
3. Redirecione webhooks para localhost:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Em outro terminal, faça um checkout
5. Verifique os logs do webhook no terminal do Stripe CLI

### 5.3 Testar Portal
1. Acesse `/settings/billing`
2. Clique em **Gerenciar Assinatura**
3. Verifique se abre o Stripe Customer Portal
4. Teste as ações:
   - Ver histórico de faturas
   - Atualizar cartão
   - Cancelar assinatura (em modo test é seguro)

## Passo 6: Verificar no Banco de Dados

Após um checkout bem-sucedido, verifique no Supabase:

### 6.1 Tabela organizations
```sql
SELECT id, name, stripe_customer_id, stripe_subscription_id, plan
FROM organizations
WHERE stripe_customer_id IS NOT NULL;
```

Deve mostrar:
- `stripe_customer_id` preenchido (cus_xxx)
- `stripe_subscription_id` preenchido (sub_xxx)
- `plan` atualizado (starter/pro/enterprise)

### 6.2 Tabela subscriptions
```sql
SELECT organization_id, plan, status, stripe_subscription_id, current_period_end
FROM subscriptions
WHERE stripe_subscription_id IS NOT NULL;
```

Deve mostrar:
- Status `active`
- Datas de período preenchidas
- Plan correto

## Passo 7: Ativar em Produção

### 7.1 Repetir Passos 1-2 em Modo Live
1. No Stripe Dashboard, mude para modo **Live** (toggle no canto superior direito)
2. Repita a criação de produtos (Passo 1)
3. Repita a criação de webhook (Passo 2)
   - Use URL de produção: `https://seu-dominio.com/api/webhooks/stripe`
4. Copie as novas chaves (agora começam com `pk_live_` e `sk_live_`)

### 7.2 Atualizar Variáveis no Vercel
1. Vá em **Settings** → **Environment Variables**
2. Atualize as variáveis com valores de **produção**:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
   - `STRIPE_SECRET_KEY` → `sk_live_...`
   - `STRIPE_WEBHOOK_SECRET` → `whsec_...` (webhook live)
   - Price IDs dos produtos live
3. Faça um novo deploy

### 7.3 Testar em Produção
1. Use cartão real ou cartão de teste (se ainda em modo test)
2. Verifique fluxo completo
3. Monitore logs do webhook no Stripe Dashboard

## Solução de Problemas

### Webhook não está recebendo eventos
1. Verifique se a URL está correta no Stripe Dashboard
2. Verifique se o `STRIPE_WEBHOOK_SECRET` está correto
3. Teste o endpoint manualmente:
   ```bash
   curl -X POST https://seu-dominio.com/api/webhooks/stripe \
     -H "stripe-signature: xxx" \
     -d '{}'
   ```
4. Veja logs do webhook no Stripe Dashboard → Desenvolvedores → Webhooks

### Checkout não atualiza banco
1. Verifique logs do webhook no Stripe Dashboard
2. Verifique logs da aplicação (Vercel Logs ou console local)
3. Verifique se `metadata.organization_id` está sendo enviado
4. Verifique se migration 006 foi aplicada

### Portal dá erro 400
1. Verifique se a organização tem `stripe_customer_id`
2. Verifique se user está autenticado
3. Verifique logs da API route

### Limites não são aplicados
1. Verifique se `organizations.plan` foi atualizado
2. Verifique se `organizations.max_instances` e `max_groups` foram atualizados
3. Os limites são enforced pelas APIs existentes (não pelo Stripe)

## Links Úteis

- Stripe Dashboard: https://dashboard.stripe.com
- Stripe Docs: https://stripe.com/docs
- Stripe CLI: https://stripe.com/docs/stripe-cli
- Cartões de teste: https://stripe.com/docs/testing
- Webhooks troubleshooting: https://stripe.com/docs/webhooks/test

## Próximos Passos

Depois de configurar:
- [ ] Testar fluxo completo em desenvolvimento
- [ ] Testar webhook localmente com Stripe CLI
- [ ] Configurar produtos em modo live
- [ ] Atualizar env vars com chaves live
- [ ] Deploy para produção
- [ ] Teste final em produção
- [ ] Monitorar primeiras transações
- [ ] Configurar alertas no Stripe (optional)
