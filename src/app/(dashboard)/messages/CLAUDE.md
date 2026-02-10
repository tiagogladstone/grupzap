# messages -- Agendamento de Mensagens

## Paginas

- `page.tsx` -- Lista com filtros por status, tabela com badges
- `new/page.tsx` -- Formulario completo (instancia, destino, tipo, conteudo, agendamento, recorrencia, preview)
- `[id]/page.tsx` -- Detalhe com info completa, acoes editar/cancelar/reagendar

## API Routes

- `GET /api/messages` -- Listar (filtros: status, instance_id, group_id)
- `POST /api/messages` -- Agendar nova mensagem
- `GET /api/messages/[id]` -- Detalhe
- `PATCH /api/messages/[id]` -- Editar (apenas pending)
- `DELETE /api/messages/[id]` -- Cancelar (apenas pending)

## Status Flow

pending -> processing -> sent
pending -> processing -> failed (retry automatico pelo cron)
pending -> cancelled (pelo usuario)
failed -> pending (reagendamento manual pelo usuario)
