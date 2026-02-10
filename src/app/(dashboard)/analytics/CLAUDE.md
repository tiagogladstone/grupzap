# analytics — Dashboard de Analytics

Pagina de visualizacao de metricas e dados de desempenho dos grupos WhatsApp.

## Estrutura

- `page.tsx` — Pagina principal com graficos e estatisticas
  - Seletor de periodo (7d, 30d, 90d)
  - 5 stat cards (mensagens enviadas/recebidas, grupos ativos, membros ativos, health score medio)
  - Grafico multi-line: mensagens por dia (enviadas vs recebidas)
  - Grafico de barras: atividade por hora do dia (24 barras)
  - Grafico donut: tipos de mensagem (text, image, video, audio, document, sticker)
  - Tabela: top 10 grupos por contagem de mensagens

## API

- GET /api/analytics?period=7d|30d|90d
  - Retorna dados agregados do periodo
  - Busca message_logs, whatsapp_groups
  - Agrupamentos: por data (messages_per_day), por hora (activity_by_hour), por tipo (message_types)
  - JOINs: top_groups com health_score e member_count

## Padroes

- Loading states com skeletons
- Empty states quando nao ha dados
- Formatacao de datas com Intl.DateTimeFormat
- Cores WhatsApp (#25D366 verde, #128C7E teal)
- Cards com bordas suaves
- Graficos SVG responsivos (src/components/charts)
