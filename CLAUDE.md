# Grupzap

SaaS de gestão de grupos WhatsApp com automação e analytics.

## Stack

- **Framework:** Next.js 16 (App Router) com React 19
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **WhatsApp API:** UAZAPI
- **Styling:** Tailwind CSS v4
- **Linguagem:** TypeScript strict
- **Deploy:** Vercel
- **Cron:** GitHub Actions (mensagens agendadas)

## Comandos

```bash
npm run dev        # Servidor de desenvolvimento
npm run build      # Build de produção
npm run lint       # ESLint
npm run type-check # Verifica tipos TypeScript
```

## Estrutura do Projeto

```
src/
├── app/                    # App Router (páginas e API routes)
│   ├── (auth)/             # Grupo de rotas de autenticação
│   ├── api/cron/           # API route para processamento de cron
│   ├── layout.tsx          # Layout raiz
│   └── page.tsx            # Landing page
├── components/
│   ├── auth/               # Componentes de autenticação
│   └── landing/            # Componentes da landing page
├── hooks/                  # React hooks customizados
├── lib/
│   ├── supabase/           # Clients Supabase (client/server/middleware)
│   └── uazapi/             # Client UAZAPI (grupos, mensagens, webhooks)
├── types/                  # TypeScript types (Database types Supabase)
└── middleware.ts           # Middleware Next.js (auth com Supabase)
supabase/
├── migrations/             # Migrations SQL
└── schema.sql              # Schema completo do banco
```

## Arquitetura

### Multi-tenant
- Cada cliente é uma `organization`
- Todos os dados são isolados por `organization_id`
- RLS (Row Level Security) garante isolamento no banco
- Roles: owner, admin, member, viewer

### Autenticação
- Supabase Auth (email/password)
- Middleware Next.js protege rotas
- Client-side: `createBrowserClient` (src/lib/supabase/client.ts)
- Server-side: `createServerClient` (src/lib/supabase/server.ts)

### Integração WhatsApp (UAZAPI)
- Client wrapper em src/lib/uazapi/
- Endpoints: instâncias, grupos, mensagens, webhooks
- Cada org pode ter múltiplas instâncias WhatsApp

### Banco de Dados (Supabase/PostgreSQL)
Tabelas principais:
- `organizations` — tenants
- `users` — usuários vinculados a orgs
- `whatsapp_instances` — conexões UAZAPI
- `whatsapp_groups` — grupos monitorados
- `group_members` — membros dos grupos
- `scheduled_messages` — mensagens agendadas
- `message_logs` — analytics (sem conteúdo sensível)
- `subscriptions` — billing (preparado para Stripe)
- `health_checks`, `webhook_events`, `audit_logs`

## Convenções

- Responda sempre em **português do Brasil**
- Use `npm` (não pnpm) para gerenciar dependências
- Siga os padrões do Next.js App Router
- Componentes React: function components com TypeScript
- Nomeação de arquivos: kebab-case
- Nomeação de componentes: PascalCase
- Hooks customizados: prefixo `use-`
- Não exponha `SUPABASE_SERVICE_ROLE_KEY` no client
- Variáveis públicas usam prefixo `NEXT_PUBLIC_`

## Variáveis de Ambiente

Veja `.env.example`. Necessárias:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (apenas server-side)
- `UAZAPI_BASE_URL` / `UAZAPI_TOKEN`
- `CRON_SECRET` (autenticação do cron job)
