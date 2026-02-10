# src/app — App Router

Diretório principal do Next.js App Router.

## Estrutura

- `page.tsx` — Landing page pública (composta por componentes de `../components/landing/`)
- `layout.tsx` — Layout raiz com AuthProvider, fonts, globals.css
- `globals.css` — Estilos globais (Tailwind v4)
- `(auth)/` — Grupo de rotas de autenticação (layout próprio)
- `api/cron/` — API routes para processamento de cron jobs

## Padrões

- Rotas agrupadas com `()` não afetam a URL
- Layouts são herdados automaticamente (cascata)
- `page.tsx` = rota pública, proteja com middleware se necessário
- API routes usam `route.ts` com handlers GET/POST
