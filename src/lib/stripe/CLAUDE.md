# stripe — Integração Stripe

Módulo de integração com Stripe para billing e subscriptions.

## Arquivos

- `index.ts` — Client Stripe SDK e funções principais

## Funções Exportadas

### `stripe`
Instância do Stripe SDK configurada com `STRIPE_SECRET_KEY`.

### `PLAN_MAP`
Mapeamento de planos com configuração de limites e preços:
- `starter`: 2 instâncias, 50 grupos, 500 msgs/mês - R$ 97
- `pro`: 5 instâncias, 200 grupos, 2000 msgs/mês - R$ 197
- `enterprise`: 20 instâncias, ilimitado, ilimitado - R$ 497

### `getPlanByPriceId(priceId: string)`
Retorna o tipo do plano baseado no `price_id` do Stripe.

### `createCheckoutSession(organizationId, priceId, customerId?)`
Cria sessão de checkout do Stripe.
- Se `customerId` fornecido, usa customer existente
- Senão, cria novo customer automaticamente
- Retorna session com URL de checkout

### `createCustomerPortalSession(customerId)`
Cria sessão do Customer Portal para gerenciar assinatura.

### `getSubscription(subscriptionId)`
Busca subscription do Stripe por ID.

### `cancelSubscription(subscriptionId)`
Cancela subscription no Stripe.

## Variáveis de Ambiente

```env
STRIPE_SECRET_KEY=sk_test_xxx           # Secret key (server-side only)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx  # Publishable key (client-side)
STRIPE_WEBHOOK_SECRET=whsec_xxx         # Webhook signing secret
STRIPE_PRICE_STARTER=price_xxx          # Price ID do plano Starter
STRIPE_PRICE_PRO=price_xxx              # Price ID do plano Pro
STRIPE_PRICE_ENTERPRISE=price_xxx       # Price ID do plano Enterprise
NEXT_PUBLIC_APP_URL=https://app.grupzap.com  # URL base para redirects
```

## Webhooks

O webhook do Stripe processa eventos em `/api/webhooks/stripe`:
- `checkout.session.completed` — Atualiza org com customer_id, cria subscription
- `customer.subscription.updated` — Atualiza dados da subscription
- `customer.subscription.deleted` — Marca como canceled, downgrade para free
- `invoice.payment_failed` — Marca como past_due
- `invoice.payment_succeeded` — Marca como active

## Segurança

- `STRIPE_SECRET_KEY` NUNCA deve ser exposta no client
- Use `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` para operações client-side
- Webhook usa `STRIPE_WEBHOOK_SECRET` para validar assinatura
- Webhook usa service role do Supabase (bypass RLS) - não usa cookies
