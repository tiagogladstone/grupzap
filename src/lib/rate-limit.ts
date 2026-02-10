/**
 * Rate Limiter In-Memory
 *
 * Implementacao simples de rate limiting usando Map em memoria.
 * Para producao com multiplas instancias, considerar Redis.
 */

export interface RateLimitConfig {
  interval: number // Janela de tempo em ms
  maxRequests: number // Maximo de requisicoes na janela
}

interface TokenBucket {
  count: number
  resetAt: number
}

/**
 * Cria um rate limiter com sliding window simples
 */
export function rateLimit(config: RateLimitConfig) {
  const tokenMap = new Map<string, TokenBucket>()

  return {
    /**
     * Verifica se a chave pode fazer uma requisicao
     * @param key - Identificador unico (ex: IP, user ID)
     * @returns success: true se permitido, remaining: requisicoes restantes, reset: timestamp de reset
     */
    check(key: string): { success: boolean; remaining: number; reset: number } {
      const now = Date.now()
      const bucket = tokenMap.get(key)

      // Se nao existe ou expirou, criar novo bucket
      if (!bucket || now >= bucket.resetAt) {
        const newBucket: TokenBucket = {
          count: 1,
          resetAt: now + config.interval,
        }
        tokenMap.set(key, newBucket)

        return {
          success: true,
          remaining: config.maxRequests - 1,
          reset: newBucket.resetAt,
        }
      }

      // Bucket ainda valido
      if (bucket.count < config.maxRequests) {
        // Permitir requisicao e incrementar contador
        bucket.count++
        tokenMap.set(key, bucket)

        return {
          success: true,
          remaining: config.maxRequests - bucket.count,
          reset: bucket.resetAt,
        }
      }

      // Limite excedido
      return {
        success: false,
        remaining: 0,
        reset: bucket.resetAt,
      }
    },

    /**
     * Reseta o contador de uma chave especifica (util para testes)
     */
    reset(key: string): void {
      tokenMap.delete(key)
    },

    /**
     * Limpa todos os buckets expirados (util para garbage collection)
     */
    cleanup(): void {
      const now = Date.now()
      for (const [key, bucket] of tokenMap.entries()) {
        if (now >= bucket.resetAt) {
          tokenMap.delete(key)
        }
      }
    },
  }
}
