# charts — Componentes de Graficos SVG

Componentes de graficos puros em SVG (sem bibliotecas externas).

## Componentes

- `line-chart.tsx` — Grafico de linhas simples
  - Props: `{ data: { label, value }[], color?, height?, showGrid? }`
  - Hover para tooltip
  - Grid opcional

- `multi-line-chart.tsx` — Grafico de multiplas linhas
  - Props: `{ data: { label, values: number[] }[], lines: { color, label }[], height?, showGrid? }`
  - Usado para comparar series de dados (ex: enviadas vs recebidas)

- `bar-chart.tsx` — Grafico de barras verticais
  - Props: `{ data: { label, value, color? }[], height?, defaultColor? }`
  - Hover para tooltip

- `donut-chart.tsx` — Grafico donut com legenda
  - Props: `{ data: { label, value, color }[], size? }`
  - Total no centro
  - Legenda lateral com porcentagens

## Padroes

- SVG responsivo (viewBox)
- Cores padrao do WhatsApp (#25D366, #128C7E, etc.)
- Tooltips no hover (exceto donut)
- Grid lines suaves
- Estados de vazio (empty states)
- Labels formatados
- TypeScript strict
