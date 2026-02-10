# supabase — Clients Supabase

## Arquivos

- `client.ts` — `createBrowserClient()` para uso client-side (browser)
  - Usa `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Seguro para componentes React (client components)
- `server.ts` — `createServerClient()` para uso server-side (Server Components, API routes)
  - Acessa cookies para manter sessão
  - Usa em Server Components, Route Handlers, Server Actions
- `middleware.ts` — Client para o middleware Next.js
  - Atualiza sessão/tokens automaticamente em cada request
  - Usado em `src/middleware.ts`

## Segurança

- `SUPABASE_SERVICE_ROLE_KEY` só deve ser usado em API routes server-side (bypass RLS)
- Client-side usa apenas `NEXT_PUBLIC_SUPABASE_ANON_KEY` (respeita RLS)
- Nunca importe `server.ts` em componentes com "use client"

## Pacotes

- `@supabase/supabase-js` v2 — Client principal
- `@supabase/ssr` v0.8 — Helpers para SSR (cookies management)
