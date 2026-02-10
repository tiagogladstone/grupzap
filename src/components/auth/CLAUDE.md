# auth — Componentes de Autenticação

## Arquivos

- `auth-provider.tsx` — Context provider que gerencia estado de auth (user, session, loading)
- `login-form.tsx` — Formulário de login (email + senha)
- `signup-form.tsx` — Formulário de cadastro
- `index.ts` — Re-exports

## Dependências

- `@supabase/ssr` para criação do client
- `src/lib/supabase/client.ts` para o browser client
- `src/hooks/use-auth.ts` para o hook de autenticação

## Padrões

- Formulários usam estado local (useState)
- Erros exibidos inline no formulário
- Após sucesso, redirecionam via `router.push()`
- AuthProvider envolve a app inteira no layout raiz
