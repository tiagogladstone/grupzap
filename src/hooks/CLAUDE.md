# src/hooks — React Hooks Customizados

## Arquivos

- `use-auth.ts` — Hook de autenticação (login, logout, signup, session, user)
- `use-organization.ts` — Hook para dados da organização do usuário logado
- `use-user.ts` — Hook para dados do perfil do usuário
- `index.ts` — Re-exports

## Convenções

- Prefixo `use-` no nome do arquivo (kebab-case)
- Cada hook em seu próprio arquivo
- Hooks dependem do Supabase client-side (`src/lib/supabase/client.ts`)
- Exportados via barrel file (`index.ts`)
