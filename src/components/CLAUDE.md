# src/components — Componentes React

Componentes reutilizáveis organizados por domínio.

## Estrutura

- `auth/` — Componentes de autenticação (LoginForm, SignupForm, AuthProvider)
- `landing/` — Componentes da landing page (Hero, Features, Pricing, FAQ, etc.)
- Cada pasta tem um `index.ts` com re-exports

## Convenções

- Function components com TypeScript
- Nomes em PascalCase (ex: `LoginForm.tsx`)
- Arquivos em PascalCase (seguindo o padrão existente)
- Props tipadas com interface ou type
- Estilização com Tailwind CSS v4 (classes utilitárias)
- Sem CSS modules ou styled-components
