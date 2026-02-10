# src/lib — Bibliotecas e Integrações

Código de infraestrutura e integrações com serviços externos.

## Estrutura

- `supabase/` — Clients Supabase (browser, server, middleware)
- `uazapi/` — Client wrapper para API UAZAPI (WhatsApp)

## Convenções

- Cada integração em sua própria pasta
- Clients são singletons ou factories
- Tipos definidos junto com a integração
- Nunca importe server clients em componentes client-side
