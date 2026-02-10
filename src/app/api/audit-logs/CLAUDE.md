# api/audit-logs — API de Audit Logs

API route para buscar logs de auditoria com filtros e paginacao.

## Endpoints

### GET /api/audit-logs

Query params:
- `user_id` (opcional): filtrar por ID do usuario
- `action` (opcional): filtrar por acao (create, update, delete, login, logout, etc.)
- `entity_type` (opcional): filtrar por tipo de entidade (instance, group, message, template, user, organization)
- `from` (opcional): data inicial (ISO string)
- `to` (opcional): data final (ISO string)
- `page` (opcional): numero da pagina (default: 1)
- `per_page` (opcional): registros por pagina (default: 50, max: 100)

Response:
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user_name": "Nome do Usuario",
      "user_email": "email@example.com",
      "action": "create",
      "entity_type": "instance",
      "entity_id": "uuid",
      "metadata": { "name": "Instancia X" },
      "created_at": "2026-02-10T10:00:00Z"
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 150,
    "total_pages": 3
  }
}
```

## Logica

1. Buscar audit_logs WHERE organization_id = orgId
2. Aplicar filtros opcionais (user_id, action, entity_type, from, to)
3. JOIN com users para pegar full_name e email
4. ORDER BY created_at DESC
5. Paginar com range(offset, offset + per_page - 1)
6. Retornar dados + paginacao (page, per_page, total, total_pages)

## Padroes

- Autenticado (createClient server)
- Multi-tenant (organization_id)
- Error handling com try/catch
- Response: `{ data: ..., pagination: ... }` ou `{ error: { message, code } }`
- Validacao: page >= 1, per_page entre 1 e 100
