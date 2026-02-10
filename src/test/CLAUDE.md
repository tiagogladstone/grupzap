# src/test — Setup de Testes

Configuração e utilitários de testes do projeto.

## Stack de Testes

- Vitest — Test runner (alternativa moderna ao Jest)
- @testing-library/react — Testes de componentes React
- @testing-library/jest-dom — Matchers customizados para DOM
- jsdom — Ambiente DOM simulado para testes
- @vitejs/plugin-react — Plugin para suporte ao React no Vitest

## Estrutura

- `setup.ts` — Configuração global dos testes (importa jest-dom/vitest)
- Testes ficam em pastas `__tests__/` ao lado dos arquivos testados

## Comandos

```bash
npm test              # Roda testes em modo watch
npm run test:run      # Roda testes uma vez (CI)
npm run test:coverage # Roda testes com coverage report
```

## Convenções

- Arquivos de teste: `*.test.ts` ou `*.test.tsx`
- Testes em `__tests__/` ao lado do código
- Usar `describe` para agrupar testes relacionados
- Usar `it` ou `test` para casos individuais
- Mocks com `vi.mock` e `vi.fn` (Vitest)
- Para componentes: `render` + `screen` do @testing-library/react
- Para API routes: mockar o `createClient` do Supabase

## Exemplos

### Teste de Função Utilitária
```typescript
import { describe, it, expect } from 'vitest'
import { formatDate } from '../utils'

describe('formatDate', () => {
  it('formata data corretamente', () => {
    expect(formatDate('2024-01-15')).toBe('15/01/2024')
  })
})
```

### Teste de Componente React
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MyComponent } from '../my-component'

describe('MyComponent', () => {
  it('renderiza texto corretamente', () => {
    render(<MyComponent title="Hello" />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Teste de API Route (Next.js)
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock ANTES de importar
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { GET } from '../route'
import { createClient } from '@/lib/supabase/server'

describe('GET /api/example', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna 401 quando não autenticado', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        }),
      },
    } as any)

    const response = await GET()
    expect(response.status).toBe(401)
  })
})
```

## Cobertura de Testes Atual

- `src/lib/plans.ts` — 100% (todas as funções de planos)
- `src/lib/utils.ts` — 100% (formatDate, timeAgo, slugify, truncate, formatCurrency)
- `src/app/api/instances/route.ts` — GET endpoint (auth, org lookup, listing)
- `src/components/dashboard/stat-card.tsx` — 100% (renderização, props, trends)

## Próximos Testes

- API routes: POST /api/instances, grupos, mensagens, templates
- Hooks: usePlanUsage, useRealtime
- Componentes: forms, tabelas, modais
- Edge cases e error handling
