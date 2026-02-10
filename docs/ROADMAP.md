# Grupzap — Roadmap de Desenvolvimento

## Visão Geral

SaaS de gestão de grupos WhatsApp com automação e analytics.
Target: Lançamento público com billing.

---

## Fase 0 — Fundação (Corrigir o que está quebrado)

### Objetivo
Tornar o app funcional de ponta a ponta: signup → login → dashboard.

### Tarefas

#### 0.1 Sincronizar types/supabase.ts
- Reescrever `src/types/supabase.ts` refletindo o `schema.sql` completo
- 11 tabelas: organizations, users, whatsapp_instances, whatsapp_groups, group_members, scheduled_messages, message_logs, subscriptions, health_checks, webhook_events, audit_logs
- Remover tabelas fantasma (profiles, organization_members)

#### 0.2 Corrigir fluxo de signup
- Criar Server Action ou API route `POST /api/auth/signup-complete`
- Após Supabase criar auth.user, criar:
  - Registro em `organizations` (com slug gerado)
  - Registro em `users` (role: owner, vinculado à org)
  - Registro em `subscriptions` (plano: free)
- Usar a função SQL `create_organization_with_owner()` já existente

#### 0.3 Corrigir redirecionamentos pós-auth
- Login: redirecionar para `/dashboard`
- Signup: redirecionar para `/onboarding` ou `/dashboard`
- Callback: respeitar parâmetro `next` da URL
- Middleware: proteger `/dashboard/*` e outras rotas autenticadas

#### 0.4 Criar página reset-password
- `src/app/(auth)/reset-password/page.tsx`
- Formulário: nova senha + confirmar senha
- Chamar `supabase.auth.updateUser({ password })`
- Redirecionar para /login após sucesso

#### 0.5 Consolidar migrations
- Deprecar migration 001 (usa model antigo com profiles/organization_members)
- Criar migration 003 que aplica o schema.sql completo
- Documentar que schema.sql é a source of truth

#### 0.6 Configurar next.config.ts
- Security headers (X-Frame-Options, CSP, HSTS, etc.)
- Image optimization (domains permitidos)
- Redirect de www para non-www (ou vice-versa)

---

## Fase 1 — Dashboard + Layout do App

### Objetivo
Criar o shell da aplicação autenticada.

### Tarefas

#### 1.1 Layout autenticado
- `src/app/(dashboard)/layout.tsx` — Layout com sidebar + header
- Sidebar: navegação (Dashboard, Instâncias, Grupos, Mensagens, Analytics, Configurações)
- Header: org name, user avatar, dropdown (perfil, trocar org, logout)
- Responsivo: sidebar colapsável em mobile

#### 1.2 Dashboard overview
- `src/app/(dashboard)/dashboard/page.tsx`
- Cards de resumo: instâncias ativas, grupos monitorados, mensagens enviadas hoje, próxima mensagem agendada
- Atividade recente: últimas ações (mensagens enviadas, membros que entraram/saíram)
- Health overview: grupos com score baixo

#### 1.3 Configurações
- `src/app/(dashboard)/settings/page.tsx` — Tabs: Perfil, Organização, Equipe, API
- Perfil: editar nome, email, avatar
- Organização: nome, slug, configurações
- Equipe: listar membros, convidar, alterar roles
- API: exibir chaves de API (futuro)

---

## Fase 2 — Core WhatsApp

### Objetivo
Gestão completa de instâncias e grupos WhatsApp.

### Tarefas

#### 2.1 Gestão de instâncias
- `src/app/(dashboard)/instances/page.tsx` — Lista de instâncias
- `src/app/(dashboard)/instances/[id]/page.tsx` — Detalhe da instância
- Fluxo de conexão: criar → exibir QR code → aguardar scan → conectado
- Status em tempo real via Supabase Realtime
- API routes: `POST /api/instances`, `GET /api/instances`, `PATCH /api/instances/[id]`

#### 2.2 Gestão de grupos
- `src/app/(dashboard)/groups/page.tsx` — Lista com filtros e busca
- `src/app/(dashboard)/groups/[id]/page.tsx` — Detalhe do grupo
- Sincronizar grupos da instância UAZAPI → banco local
- Health score visual (gauge/progress bar)
- Membros do grupo com engagement score

#### 2.3 Webhook receiver
- `src/app/api/webhooks/uazapi/route.ts`
- Validar HMAC signature
- Processar eventos: mensagem recebida, membro entrou/saiu, grupo atualizado
- Salvar em `message_logs` e `webhook_events`
- Atualizar contadores em `whatsapp_groups` e `group_members`

#### 2.4 Supabase Realtime
- Subscribe em `whatsapp_instances` (status changes)
- Subscribe em `whatsapp_groups` (new messages, member changes)
- Atualizar UI automaticamente quando dados mudarem

---

## Fase 3 — Mensagens

### Objetivo
Sistema completo de agendamento e envio de mensagens.

### Tarefas

#### 3.1 Agendamento de mensagens (UI)
- `src/app/(dashboard)/messages/page.tsx` — Lista de mensagens agendadas
- `src/app/(dashboard)/messages/new/page.tsx` — Criar nova mensagem
- Formulário: selecionar instância, grupo/contato, tipo (texto/mídia), conteúdo, data/hora
- Preview da mensagem antes de agendar
- Suporte a recorrência (diária, semanal, mensal)

#### 3.2 Templates de mensagem
- Tabela `message_templates` (criar via migration)
- CRUD de templates com variáveis ({{nome}}, {{grupo}}, etc.)
- Selecionar template ao agendar mensagem

#### 3.3 Corrigir cron
- Suportar multi-instância (criar UazapiClient por instância)
- Implementar RPC SQL com `FOR UPDATE SKIP LOCKED`
- Usar `media_filename` do schema (não hardcoded)
- Implementar sticker, location, contact
- `crypto.timingSafeEqual` para validação do CRON_SECRET

#### 3.4 Swagger/OpenAPI
- Setup de `swagger-jsdoc` + `swagger-ui-react`
- Documentar todas as API routes
- Disponível em `/api/docs`
- OpenAPI spec em `/api/docs/spec.json`

---

## Fase 4 — Billing + Lançamento

### Objetivo
Monetização e preparação para lançamento público.

### Tarefas

#### 4.1 Integração Stripe
- `src/app/api/webhooks/stripe/route.ts` — Processar eventos Stripe
- `src/app/api/billing/checkout/route.ts` — Criar Checkout Session
- `src/app/api/billing/portal/route.ts` — Redirecionar para Customer Portal
- Tabela `subscriptions` já existe — mapear eventos Stripe para ela
- Planos: Free (R$0), Starter (R$97), Pro (R$197), Agência (R$397)

#### 4.2 Enforcement de limites
- Middleware ou hook que verifica limites do plano:
  - `max_instances` — bloquear criação de novas instâncias
  - `max_groups` — bloquear adição de novos grupos
- Mostrar banner de upgrade quando próximo do limite

#### 4.3 Google Cloud Scheduler
- Criar job no Cloud Scheduler: `*/1 * * * *`
- Target: `POST https://grupzap.vercel.app/api/cron/process-messages`
- Header: `Authorization: Bearer CRON_SECRET`
- Retry policy: 3 tentativas, backoff exponencial
- Remover GitHub Actions cron (migrar para GCP)

#### 4.4 Landing page — links funcionais
- "Entrar" → /login
- "Começar Grátis" → /signup
- Pricing CTAs → /signup?plan=starter|pro|agency
- Scroll suave para âncoras

#### 4.5 Onboarding flow
- Após signup: /onboarding/connect — Conectar primeira instância WhatsApp
- /onboarding/groups — Importar grupos
- /onboarding/done — Tudo pronto, ir para dashboard
- Marcar onboarding como completo em `users.settings`

---

## Fase 5 — Analytics + Polimento

### Objetivo
Diferencial competitivo e qualidade de produção.

### Tarefas

#### 5.1 Dashboard de analytics
- `src/app/(dashboard)/analytics/page.tsx`
- Gráficos: mensagens/dia (line chart), atividade por grupo (bar chart)
- Top grupos por engagement
- Membros mais ativos
- Período selecionável (7d, 30d, 90d)

#### 5.2 Audit logs
- `src/app/(dashboard)/settings/audit/page.tsx`
- Listar ações: quem fez o quê, quando
- Filtros: por usuário, ação, período

#### 5.3 Health checks automáticos
- Cron job que verifica status de cada instância a cada 5 min
- Salvar em `health_checks`
- Notificar (email ou in-app) se instância cair

#### 5.4 Segurança e performance
- Rate limiting nas API routes
- Criptografia de `api_token` (pgcrypto)
- RLS fixes (group_members delete policy)
- Security headers completos

#### 5.5 Testes
- Unit tests: hooks, utils, API routes
- E2E tests: signup flow, login flow, agendamento
- CI: rodar testes no GitHub Actions

---

## Infraestrutura

| Serviço | Uso | Tier |
|---------|-----|------|
| Vercel | Next.js hosting + API routes + Edge | Pro (para cron + mais functions) |
| Supabase | PostgreSQL + Auth + RLS + Realtime + Storage | Pro (para mais connections) |
| Google Cloud Scheduler | Cron confiável (1/min) | Free tier cobre |
| Google Workspace | Domínio + email corporativo | Business Starter |
| Stripe | Billing + Payment processing | Pay-as-you-go |
| UAZAPI | WhatsApp API (SaaS gerenciado) | Plano contratado |

---

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| Backend | Next.js API Routes (serverless) |
| Database | Supabase PostgreSQL + RLS |
| Auth | Supabase Auth |
| WhatsApp | UAZAPI (REST API) |
| Billing | Stripe |
| API Docs | Swagger/OpenAPI (swagger-jsdoc) |
| CI/CD | GitHub Actions |
| Cron | Google Cloud Scheduler |
| Monitoring | Vercel Analytics + Supabase Dashboard |
