# instances — Gestão de Instâncias WhatsApp

## Páginas

- `page.tsx` — Lista de instâncias (grid de cards)
- `new/page.tsx` — Formulário de nova instância
- `[id]/page.tsx` — Detalhe com conexão, QR code, status

## API Routes

- `GET /api/instances` — Listar instâncias da org
- `POST /api/instances` — Criar nova instância
- `GET /api/instances/[id]` — Detalhe
- `PATCH /api/instances/[id]` — Atualizar
- `DELETE /api/instances/[id]` — Remover
- `POST /api/instances/[id]/connect` — Conectar (obter QR code)
- `GET /api/instances/[id]/status` — Verificar status

## Fluxo de Conexão

1. Criar instância (POST /api/instances)
2. Conectar (POST /api/instances/[id]/connect)
3. Se QR code: exibir e fazer polling de status
4. Quando conectado: atualizar badge e habilitar features
