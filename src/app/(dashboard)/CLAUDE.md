# (dashboard) — Layout Autenticado

Grupo de rotas que compartilham o layout do dashboard (sidebar + header).

## Estrutura

- `layout.tsx` — Layout com Sidebar + Header + main content area
- `dashboard/page.tsx` — Página principal (overview)
- `settings/` — Configurações (perfil, org, equipe)
- `instances/` — Gestão de instâncias WhatsApp (Fase 2)
- `groups/` — Gestão de grupos (Fase 2)
- `messages/` — Agendamento de mensagens (Fase 3)
- `analytics/` — Dashboard de analytics (Fase 5)

## Componentes

Componentes compartilhados em `src/components/dashboard/`:
- `sidebar.tsx` — Navegação lateral
- `header.tsx` — Barra superior
- `stat-card.tsx` — Card de estatística reutilizável

## Padrões

- Todas as páginas herdam o layout com sidebar + header
- Título do header é derivado do pathname
- Sidebar colapsa em mobile (hamburger menu)
- Conteúdo em `<main>` com padding e scroll independente
