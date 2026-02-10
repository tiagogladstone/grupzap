# Grupzap — Arquitetura do Sistema

## Diagrama de Alto Nível

```
Clientes (Browser)
       │
       ▼
┌──────────────────────────────────────┐
│           VERCEL (Next.js 16)        │
│                                      │
│  Landing Page (SSG)                  │
│  Dashboard App (SSR + Client)        │
│  API Routes (/api/*)                 │
│  Edge Middleware (Auth)              │
│  Swagger UI (/api/docs)             │
└──────┬───────────┬──────────┬────────┘
       │           │          │
       ▼           ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ SUPABASE │ │  UAZAPI  │ │  STRIPE  │
│          │ │  (SaaS)  │ │          │
│ Postgres │ │ WhatsApp │ │ Billing  │
│ Auth     │ │ API      │ │ Payments │
│ RLS      │ │ Webhooks │ │ Webhooks │
│ Realtime │ └──────────┘ └──────────┘
│ Storage  │
└──────────┘
       ▲
       │ Cron (1/min)
┌──────┴───────────────────────────────┐
│         GOOGLE CLOUD                 │
│  Cloud Scheduler → Vercel API        │
│  Workspace (Domínio + Email)         │
└──────────────────────────────────────┘
```

## Fluxo de Dados

### 1. Autenticação (Supabase Auth)
```
Browser → Edge Middleware → Supabase Auth
                ↓
        Valida session cookie
                ↓
        ┌── Autenticado → Permite acesso
        └── Não autenticado → Redirect /login
```

### 2. Operações CRUD (Supabase + RLS)
```
Dashboard UI → API Route → Supabase Client (server)
                               ↓
                    PostgreSQL + RLS
                    (filtra por organization_id)
                               ↓
                    Response com dados da org
```

### 3. Envio de Mensagens (UAZAPI)
```
Usuário agenda mensagem → Salva em scheduled_messages (status: pending)
        ↓
Cloud Scheduler (1/min) → GET /api/cron/process-messages
        ↓
API Route busca pending messages → Envia via UAZAPI
        ↓
Atualiza status: sent/failed
```

### 4. Recepção de Webhooks (UAZAPI → App)
```
WhatsApp → UAZAPI → POST /api/webhooks/uazapi
        ↓
Valida HMAC signature
        ↓
Processa evento:
├── Mensagem recebida → Salva em message_logs
├── Membro entrou → Atualiza group_members
├── Membro saiu → Atualiza group_members
└── Grupo atualizado → Atualiza whatsapp_groups
        ↓
Supabase Realtime notifica Dashboard
```

### 5. Billing (Stripe)
```
Usuário clica "Assinar" → POST /api/billing/checkout
        ↓
Stripe Checkout Session → Usuário paga
        ↓
Stripe envia webhook → POST /api/webhooks/stripe
        ↓
Atualiza tabela subscriptions
        ↓
Enforcement de limites baseado no plano
```

## Segurança

### Multi-tenant
- Toda query passa por RLS (Row Level Security)
- `organization_id` em todas as tabelas
- Funções helper: `get_user_org_id()`, `user_belongs_to_org()`, `user_is_org_admin()`

### Autenticação
- Supabase Auth com JWT
- Edge Middleware valida em cada request
- Cookies httpOnly, secure, sameSite
- Service Role Key apenas em server-side

### API Routes
- Webhook UAZAPI: HMAC SHA256 com `timingSafeEqual`
- Webhook Stripe: Signature verification via `stripe.webhooks.constructEvent`
- Cron: Bearer token com `timingSafeEqual`
- Todas as rotas retornam JSON com status codes apropriados

### Dados Sensíveis
- `api_token` das instâncias: criptografado com pgcrypto (a implementar)
- `SUPABASE_SERVICE_ROLE_KEY`: apenas em variáveis de ambiente server-side
- `CRON_SECRET`: rotacionável, nunca exposto ao client
- Media em Supabase Storage: policies de acesso por org

## Convenções de API Routes

### Estrutura
```
src/app/api/
├── auth/
│   └── signup-complete/route.ts    POST — Finalizar signup
├── instances/
│   ├── route.ts                     GET (list), POST (create)
│   └── [id]/
│       ├── route.ts                 GET, PATCH, DELETE
│       └── connect/route.ts         POST — Conectar instância
├── groups/
│   ├── route.ts                     GET (list)
│   ├── sync/route.ts               POST — Sincronizar da UAZAPI
│   └── [id]/
│       ├── route.ts                 GET, PATCH
│       └── members/route.ts         GET — Membros do grupo
├── messages/
│   ├── route.ts                     GET (list), POST (agendar)
│   └── [id]/route.ts               GET, PATCH, DELETE (cancelar)
├── templates/
│   ├── route.ts                     GET, POST
│   └── [id]/route.ts               GET, PATCH, DELETE
├── billing/
│   ├── checkout/route.ts           POST — Criar checkout
│   └── portal/route.ts             POST — Portal do cliente
├── webhooks/
│   ├── uazapi/route.ts             POST — Eventos UAZAPI
│   └── stripe/route.ts             POST — Eventos Stripe
├── cron/
│   └── process-messages/route.ts   GET/POST — Processar fila
├── analytics/
│   └── route.ts                     GET — Métricas
└── docs/
    ├── route.ts                     GET — Swagger UI
    └── spec/route.ts               GET — OpenAPI JSON
```

### Padrões
- Toda rota usa `createClient()` server-side (respeita RLS)
- Rotas de webhook usam `createClient()` com service_role (bypass RLS)
- Respostas seguem formato:
  ```json
  { "data": {...}, "error": null }
  ou
  { "data": null, "error": { "message": "...", "code": "..." } }
  ```
- Status codes: 200 (ok), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (internal)

## Supabase Realtime

### Channels
```typescript
// Instâncias — status em tempo real
supabase.channel('instances')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'whatsapp_instances',
    filter: `organization_id=eq.${orgId}`
  }, callback)

// Grupos — novas mensagens
supabase.channel('groups')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'whatsapp_groups',
    filter: `organization_id=eq.${orgId}`
  }, callback)

// Mensagens agendadas — status de envio
supabase.channel('scheduled')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'scheduled_messages',
    filter: `organization_id=eq.${orgId}`
  }, callback)
```

## Storage (Supabase)

### Buckets
```
media/
├── {org_id}/
│   ├── messages/          — Mídia de mensagens agendadas
│   │   ├── {msg_id}/image.jpg
│   │   └── {msg_id}/doc.pdf
│   ├── templates/         — Mídia de templates
│   └── avatars/           — Avatares de usuários
```

### Policies
- Cada org só acessa seu próprio bucket (`{org_id}/`)
- Upload limitado por tamanho (10MB imagens, 50MB vídeos, 25MB documentos)
- Tipos MIME permitidos: image/*, video/mp4, audio/ogg, application/pdf, etc.
