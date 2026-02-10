# groups -- Gestao de Grupos WhatsApp

## Paginas

- `page.tsx` -- Lista de grupos (filtros, busca, health score)
- `[id]/page.tsx` -- Detalhe do grupo (info, health, membros)

## API Routes

- `GET /api/groups` -- Listar grupos (filtro por instancia, busca)
- `POST /api/groups/sync` -- Sincronizar grupos de uma instancia UAZAPI
- `GET /api/groups/[id]` -- Detalhe do grupo
- `PATCH /api/groups/[id]` -- Atualizar (is_monitored, settings)
- `GET /api/groups/[id]/members` -- Membros do grupo

## Fluxo de Sync

1. Usuario clica "Sincronizar" (seleciona instancia)
2. POST /api/groups/sync com instanceId
3. API busca grupos via UAZAPI e faz upsert no banco
4. Frontend recarrega lista
