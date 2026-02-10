/**
 * Rate Limit Middleware
 *
 * Helper para aplicar rate limiting nas API routes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, type RateLimitConfig } from './rate-limit'

// Criar limiters com diferentes configuracoes
const limiters = {
  // Padrao: 60 req/min
  default: rateLimit({ interval: 60_000, maxRequests: 60 }),

  // Restrito: 10 req/min (billing, operacoes sensiveis)
  restricted: rateLimit({ interval: 60_000, maxRequests: 10 }),

  // Muito restrito: 5 req/min (signup, operacoes criticas)
  veryRestricted: rateLimit({ interval: 60_000, maxRequests: 5 }),

  // Permissivo: 200 req/min (webhooks)
  permissive: rateLimit({ interval: 60_000, maxRequests: 200 }),
}

/**
 * Verifica rate limit para uma requisicao.
 * Retorna null se permitido, ou Response com erro 429 se limitado.
 *
 * @param request - Request do Next.js
 * @param config - Configuracao de rate limit (ou preset: 'default' | 'restricted' | 'veryRestricted' | 'permissive')
 * @returns null se permitido, Response 429 se limitado
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig | 'default' | 'restricted' | 'veryRestricted' | 'permissive' = 'default'
): Response | null {
  // Obter limiter apropriado
  let limiter: ReturnType<typeof rateLimit>
  let maxRequests: number

  if (typeof config === 'string') {
    limiter = limiters[config]
    maxRequests = {
      default: 60,
      restricted: 10,
      veryRestricted: 5,
      permissive: 200,
    }[config]
  } else {
    limiter = rateLimit(config)
    maxRequests = config.maxRequests
  }

  // Identificar cliente por IP
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  // Verificar rate limit
  const result = limiter.check(ip)

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)

    return NextResponse.json(
      {
        error: {
          message: 'Rate limit excedido. Tente novamente em alguns segundos.',
          code: 'RATE_LIMITED',
        },
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.reset),
          'Retry-After': String(retryAfter),
        },
      }
    )
  }

  return null
}
