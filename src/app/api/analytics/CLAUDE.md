# api/analytics — API de Analytics

API route para buscar dados de analytics agregados.

## Endpoints

### GET /api/analytics

Query params:
- `period`: '7d' | '30d' | '90d' (default: '7d')

Response:
```json
{
  "data": {
    "summary": {
      "total_messages_sent": 150,
      "total_messages_received": 320,
      "active_groups": 12,
      "active_members": 85,
      "avg_health_score": 72
    },
    "messages_per_day": [
      { "date": "2026-02-01", "sent": 10, "received": 25 },
      ...
    ],
    "top_groups": [
      {
        "id": "uuid",
        "name": "Grupo X",
        "message_count": 150,
        "health_score": 85,
        "member_count": 50
      },
      ... (top 10)
    ],
    "activity_by_hour": [
      { "hour": 0, "count": 5 },
      ... (24 entries)
    ],
    "message_types": [
      { "type": "text", "count": 200 },
      { "type": "image", "count": 50 },
      ...
    ]
  }
}
```

## Logica

1. Summary: contagem de mensagens enviadas/recebidas (direction), grupos ativos (distinct group_jid), membros ativos (sum member_count), health score medio
2. Messages per day: agrupar message_logs por DATE(created_at) e direction
3. Top groups: JOIN whatsapp_groups com contagem de message_logs, ORDER BY count DESC LIMIT 10
4. Activity by hour: EXTRACT(HOUR FROM created_at) dos message_logs, agrupar e contar
5. Message types: agrupar message_logs por message_type

## Padroes

- Autenticado (createClient server)
- Multi-tenant (organization_id)
- Error handling com try/catch
- Response: `{ data: ... }` ou `{ error: { message, code } }`
