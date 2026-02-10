# (auth) — Rotas de Autenticação

Grupo de rotas para login, signup e recuperação de senha.
O parênteses `(auth)` não aparece na URL.

## Páginas

- `login/page.tsx` — Página de login
- `signup/page.tsx` — Página de cadastro
- `forgot-password/page.tsx` — Recuperação de senha
- `auth/callback/route.ts` — Callback do Supabase Auth (troca code por session)
- `layout.tsx` — Layout compartilhado das páginas de auth (centralizado, sem header)

## Dependências

- Componentes: `src/components/auth/` (LoginForm, SignupForm)
- Auth: Supabase Auth via `src/lib/supabase/`
- Após login bem-sucedido, redireciona para dashboard (a implementar)
