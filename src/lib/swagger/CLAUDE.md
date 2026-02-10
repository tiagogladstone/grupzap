# swagger — Documentação OpenAPI

## Arquivos

- `spec.ts` — Spec OpenAPI 3.0.3 completa do Grupzap
- `types.ts` — Tipos TypeScript do OpenAPI (sem dependência externa)

## Endpoints

- `GET /api/docs` — Swagger UI (HTML)
- `GET /api/docs/spec` — OpenAPI JSON spec

## Como adicionar novas rotas

1. Edite `src/lib/swagger/spec.ts`
2. Adicione o path em `paths` seguindo o padrão existente
3. Adicione schemas necessários em `components.schemas`
4. Acesse /api/docs para verificar
