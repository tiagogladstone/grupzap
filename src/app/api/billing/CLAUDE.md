# billing — API de Cobrança

API routes para integração com billing e Stripe.

## Rotas

### `POST /api/billing/checkout`
Cria sessão de checkout do Stripe.

**Autenticação:** Requerida

**Body:**
```json
{
  "priceId": "price_xxx"
}
```

**Response:**
```json
{
  "data": {
    "url": "https://checkout.stripe.com/..."
  }
}
```

**Fluxo:**
1. Valida autenticação
2. Busca organization_id do user
3. Busca stripe_customer_id da organização (se existir)
4. Cria checkout session no Stripe
5. Retorna URL de checkout

**Errors:**
- `401 UNAUTHORIZED` — Não autenticado
- `404 ORG_NOT_FOUND` — Organização não encontrada
- `400 INVALID_INPUT` — priceId ausente
- `500 CHECKOUT_ERROR` — Erro ao criar checkout

### `POST /api/billing/portal`
Cria sessão do Customer Portal do Stripe.

**Autenticação:** Requerida

**Response:**
```json
{
  "data": {
    "url": "https://billing.stripe.com/..."
  }
}
```

**Fluxo:**
1. Valida autenticação
2. Busca organization_id do user
3. Busca stripe_customer_id da organização
4. Cria portal session no Stripe
5. Retorna URL do portal

**Errors:**
- `401 UNAUTHORIZED` — Não autenticado
- `404 ORG_NOT_FOUND` — Organização não encontrada
- `400 NO_SUBSCRIPTION` — Sem stripe_customer_id
- `500 PORTAL_ERROR` — Erro ao criar portal

## Uso no Frontend

### Fazer Checkout
```typescript
const response = await fetch('/api/billing/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ priceId: 'price_xxx' }),
})

const { data } = await response.json()
window.location.href = data.url  // Redirect para Stripe
```

### Abrir Portal
```typescript
const response = await fetch('/api/billing/portal', {
  method: 'POST',
})

const { data } = await response.json()
window.location.href = data.url  // Redirect para Stripe Portal
```

## Padrões

- Ambas rotas usam `createClient()` de `@/lib/supabase/server` (com cookies)
- Response sempre em formato `{ data: ... }` ou `{ error: { message, code } }`
- Redirect para Stripe acontece no client-side via `window.location.href`
- Stripe success/cancel URLs apontam para `/settings/billing?success=true` ou `?canceled=true`

## Segurança

- Rotas validam autenticação via `supabase.auth.getUser()`
- Apenas owner/admin da org podem acessar (implícito via RLS)
- Nunca expor `STRIPE_SECRET_KEY` no client
- Webhook usa endpoint separado (`/api/webhooks/stripe`) com validação de assinatura
