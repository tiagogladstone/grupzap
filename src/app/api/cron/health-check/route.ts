/**
 * API Route: Health Check Cron
 *
 * Verifica o status de saude de todas as instancias WhatsApp ativas.
 * Executado periodicamente via cron (Google Cloud Scheduler / Vercel Cron).
 *
 * @endpoint GET /api/cron/health-check
 * @endpoint POST /api/cron/health-check
 * @auth Header Authorization: Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'crypto'
import { UazapiClient, UazapiError } from '@/lib/uazapi/client'

// ============================================================================
// TIPOS
// ============================================================================

interface InstanceRow {
  id: string
  instance_id: string
  api_token: string
  status: string
  instance_name: string
}

interface HealthCheckResult {
  instanceId: string
  instanceName: string
  status: 'healthy' | 'unhealthy' | 'timeout'
  responseTime: number
  error?: string
  statusChanged: boolean
  newStatus?: string
}

interface ProcessResult {
  total: number
  healthy: number
  unhealthy: number
  timeout: number
  statusChanges: number
  errors: Array<{ instanceId: string; error: string }>
}

// ============================================================================
// CONSTANTES
// ============================================================================

const HEALTH_CHECK_TIMEOUT = 10000 // 10 segundos por instancia

// ============================================================================
// AUTENTICACAO
// ============================================================================

/**
 * Verifica CRON_SECRET com timingSafeEqual (previne timing attacks)
 */
function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[HEALTH-CHECK] CRON_SECRET nao configurado')
    return false
  }

  const token = authHeader?.replace('Bearer ', '') || ''

  // timingSafeEqual exige buffers de mesmo tamanho
  if (token.length !== cronSecret.length) {
    return false
  }

  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(cronSecret))
  } catch {
    return false
  }
}

// ============================================================================
// SUPABASE ADMIN
// ============================================================================

/**
 * Cria cliente Supabase com service role (bypass RLS)
 */
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase credentials not configured')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// ============================================================================
// BUSCAR INSTANCIAS
// ============================================================================

/**
 * Busca todas as instancias ativas (status != 'deleted')
 */
async function fetchActiveInstances(
  supabase: ReturnType<typeof createSupabaseAdmin>
): Promise<InstanceRow[]> {
  const { data, error } = await supabase
    .from('whatsapp_instances')
    .select('id, instance_id, api_token, status, instance_name')
    .neq('status', 'deleted')

  if (error) {
    console.error('[HEALTH-CHECK] Erro ao buscar instancias:', error)
    throw error
  }

  return (data || []) as InstanceRow[]
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Verifica o status de saude de uma instancia via UAZAPI
 */
async function checkInstanceHealth(instance: InstanceRow): Promise<HealthCheckResult> {
  const startTime = Date.now()
  const baseUrl = process.env.UAZAPI_BASE_URL

  if (!baseUrl) {
    return {
      instanceId: instance.id,
      instanceName: instance.instance_name,
      status: 'unhealthy',
      responseTime: 0,
      error: 'UAZAPI_BASE_URL nao configurado',
      statusChanged: false,
    }
  }

  try {
    const uazapi = new UazapiClient({
      baseUrl,
      token: instance.api_token,
      timeout: HEALTH_CHECK_TIMEOUT,
      maxRetries: 1, // Apenas 1 tentativa para health checks
    })

    // Verifica status da instancia
    const statusResponse = await uazapi.instance.getStatus()
    const responseTime = Date.now() - startTime

    // Determinar status baseado na resposta
    const isConnected = statusResponse.data.Connected && statusResponse.data.LoggedIn
    const healthStatus = isConnected ? 'healthy' : 'unhealthy'

    // Determinar novo status da instancia
    let newInstanceStatus: string | undefined
    let statusChanged = false

    if (isConnected && instance.status !== 'connected') {
      newInstanceStatus = 'connected'
      statusChanged = true
    } else if (!isConnected && instance.status === 'connected') {
      newInstanceStatus = 'disconnected'
      statusChanged = true
    }

    return {
      instanceId: instance.id,
      instanceName: instance.instance_name,
      status: healthStatus,
      responseTime,
      statusChanged,
      newStatus: newInstanceStatus,
    }
  } catch (error) {
    const responseTime = Date.now() - startTime

    // Verificar se foi timeout
    if (
      error instanceof UazapiError &&
      (error.code === 408 || error.message.includes('timeout'))
    ) {
      return {
        instanceId: instance.id,
        instanceName: instance.instance_name,
        status: 'timeout',
        responseTime,
        error: 'Timeout',
        statusChanged: false,
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

    return {
      instanceId: instance.id,
      instanceName: instance.instance_name,
      status: 'unhealthy',
      responseTime,
      error: errorMessage,
      statusChanged: false,
    }
  }
}

// ============================================================================
// SALVAR RESULTADO
// ============================================================================

/**
 * Salva resultado do health check no banco e atualiza status da instancia se necessario
 */
async function saveHealthCheckResult(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  result: HealthCheckResult
): Promise<void> {
  // Inserir registro de health check
  const { error: insertError } = await supabase.from('health_checks').insert({
    instance_id: result.instanceId,
    status: result.status,
    response_time_ms: result.responseTime,
    error_message: result.error || null,
    checked_at: new Date().toISOString(),
  })

  if (insertError) {
    console.error(
      `[HEALTH-CHECK] Erro ao salvar health check para ${result.instanceName}:`,
      insertError
    )
  }

  // Atualizar status da instancia se mudou
  if (result.statusChanged && result.newStatus) {
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({
        status: result.newStatus,
        last_health_check: new Date().toISOString(),
      })
      .eq('id', result.instanceId)

    if (updateError) {
      console.error(
        `[HEALTH-CHECK] Erro ao atualizar status de ${result.instanceName}:`,
        updateError
      )
    } else {
      console.log(
        `[HEALTH-CHECK] Status de ${result.instanceName} alterado: ${result.newStatus}`
      )
    }
  }
}

// ============================================================================
// PROCESSAR INSTANCIAS
// ============================================================================

/**
 * Processa health checks de todas as instancias em paralelo
 */
async function processHealthChecks(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  instances: InstanceRow[]
): Promise<ProcessResult> {
  const result: ProcessResult = {
    total: instances.length,
    healthy: 0,
    unhealthy: 0,
    timeout: 0,
    statusChanges: 0,
    errors: [],
  }

  // Executar health checks em paralelo
  const healthCheckPromises = instances.map((instance) => checkInstanceHealth(instance))
  const healthCheckResults = await Promise.allSettled(healthCheckPromises)

  // Processar resultados
  for (let i = 0; i < healthCheckResults.length; i++) {
    const promiseResult = healthCheckResults[i]
    const instance = instances[i]

    if (promiseResult.status === 'fulfilled') {
      const checkResult = promiseResult.value

      // Contabilizar por status
      if (checkResult.status === 'healthy') {
        result.healthy++
      } else if (checkResult.status === 'timeout') {
        result.timeout++
      } else {
        result.unhealthy++
      }

      // Contabilizar mudancas de status
      if (checkResult.statusChanged) {
        result.statusChanges++
      }

      // Registrar erros
      if (checkResult.error) {
        result.errors.push({
          instanceId: checkResult.instanceId,
          error: checkResult.error,
        })
      }

      // Salvar no banco
      await saveHealthCheckResult(supabase, checkResult)

      console.log(
        `[HEALTH-CHECK] ${checkResult.instanceName}: ${checkResult.status} (${checkResult.responseTime}ms)`
      )
    } else {
      // Promise rejeitada (erro critico)
      const errorMessage = promiseResult.reason?.message || 'Erro desconhecido'
      result.unhealthy++
      result.errors.push({
        instanceId: instance.id,
        error: errorMessage,
      })
      console.error(
        `[HEALTH-CHECK] Erro critico ao verificar ${instance.instance_name}:`,
        errorMessage
      )
    }
  }

  return result
}

// ============================================================================
// HANDLER PRINCIPAL
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  console.log('[HEALTH-CHECK] Iniciando verificacao de saude das instancias...')

  // 1. Verificar autenticacao (timingSafeEqual)
  if (!verifyAuth(request)) {
    console.error('[HEALTH-CHECK] Autenticacao falhou')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 2. Criar cliente Supabase (service role)
    const supabase = createSupabaseAdmin()

    // 3. Buscar instancias ativas
    const instances = await fetchActiveInstances(supabase)
    console.log(`[HEALTH-CHECK] Encontradas ${instances.length} instancias para verificar`)

    if (instances.length === 0) {
      const duration = Date.now() - startTime
      return NextResponse.json({
        success: true,
        duration_ms: duration,
        result: {
          total: 0,
          healthy: 0,
          unhealthy: 0,
          timeout: 0,
          statusChanges: 0,
        },
      })
    }

    // 4. Processar health checks
    const result = await processHealthChecks(supabase, instances)

    const duration = Date.now() - startTime

    console.log(
      `[HEALTH-CHECK] Concluido em ${duration}ms - Total: ${result.total}, Healthy: ${result.healthy}, Unhealthy: ${result.unhealthy}, Timeout: ${result.timeout}, Status Changes: ${result.statusChanges}`
    )

    return NextResponse.json({
      success: true,
      duration_ms: duration,
      result: {
        total: result.total,
        healthy: result.healthy,
        unhealthy: result.unhealthy,
        timeout: result.timeout,
        statusChanges: result.statusChanges,
      },
      ...(result.errors.length > 0 && { errors: result.errors }),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[HEALTH-CHECK] Erro fatal:', errorMessage)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        duration_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

// Tambem permite POST (Google Cloud Scheduler envia POST por padrao)
export async function POST(request: NextRequest) {
  return GET(request)
}
