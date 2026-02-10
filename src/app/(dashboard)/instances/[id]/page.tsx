'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Row } from '@/types/supabase'

type Instance = Row<'whatsapp_instances'>

const statusConfig: Record<Instance['status'], { label: string; bg: string; text: string }> = {
  connected: { label: 'Conectado', bg: 'bg-green-100', text: 'text-green-700' },
  disconnected: { label: 'Desconectado', bg: 'bg-gray-100', text: 'text-gray-700' },
  connecting: { label: 'Conectando', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  qr_code: { label: 'QR Code', bg: 'bg-blue-100', text: 'text-blue-700' },
  banned: { label: 'Banido', bg: 'bg-red-100', text: 'text-red-700' },
  error: { label: 'Erro', bg: 'bg-red-100', text: 'text-red-700' },
}

export default function InstanceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [instance, setInstance] = useState<Instance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Conexão
  const [connecting, setConnecting] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrExpiresAt, setQrExpiresAt] = useState<string | null>(null)
  const [pollingStatus, setPollingStatus] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Exclusão
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Health checks
  const [healthStats, setHealthStats] = useState<{
    checks: Array<{
      id: string
      status: 'healthy' | 'unhealthy' | 'timeout'
      checked_at: string
      response_time_ms: number
    }>
    uptime_percentage: number
    avg_response_time: number
  } | null>(null)
  const [loadingHealth, setLoadingHealth] = useState(false)

  // ---- Fetch instância ----
  const fetchInstance = useCallback(async () => {
    try {
      const res = await fetch(`/api/instances/${id}`)
      const json = await res.json()
      if (json.data) {
        setInstance(json.data)
        if (json.data.qr_code && json.data.status === 'qr_code') {
          setQrCode(json.data.qr_code)
          setQrExpiresAt(json.data.qr_code_expires_at)
        }
      } else if (json.error) {
        setError(json.error.message)
      }
    } catch {
      setError('Erro ao carregar instância')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchInstance()
    fetchHealthStats()
  }, [fetchInstance])

  // ---- Fetch health stats ----
  const fetchHealthStats = useCallback(async () => {
    setLoadingHealth(true)
    try {
      const res = await fetch(`/api/instances/${id}/health`)
      const json = await res.json()
      if (json.data) {
        setHealthStats(json.data)
      }
    } catch (err) {
      console.error('Erro ao carregar health stats:', err)
    } finally {
      setLoadingHealth(false)
    }
  }, [id])

  // ---- Polling de status (quando QR code ativo) ----
  const startPolling = useCallback(() => {
    if (pollingRef.current) return
    setPollingStatus(true)

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/instances/${id}/status`)
        const json = await res.json()

        if (json.data?.status === 'connected') {
          // Conectou! Parar polling e atualizar
          if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
          setPollingStatus(false)
          setQrCode(null)
          setQrExpiresAt(null)
          await fetchInstance()
        }
      } catch {
        // Ignora erros de polling
      }
    }, 5000)
  }, [id, fetchInstance])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    setPollingStatus(false)
  }, [])

  // Limpar polling ao desmontar
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  // Iniciar polling automaticamente se status for qr_code
  useEffect(() => {
    if (instance?.status === 'qr_code' || qrCode) {
      startPolling()
    } else {
      stopPolling()
    }
  }, [instance?.status, qrCode, startPolling, stopPolling])

  // ---- Conectar ----
  async function handleConnect() {
    setConnecting(true)
    setError(null)

    try {
      const res = await fetch(`/api/instances/${id}/connect`, { method: 'POST' })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error?.message || 'Erro ao conectar')
        return
      }

      if (json.data?.connected) {
        await fetchInstance()
      } else if (json.data?.qrCode) {
        setQrCode(json.data.qrCode)
        setQrExpiresAt(json.data.expiresAt)
        setInstance((prev) => prev ? { ...prev, status: 'qr_code' } : prev)
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setConnecting(false)
    }
  }

  // ---- Desconectar ----
  async function handleDisconnect() {
    try {
      // Atualiza status no banco via PATCH
      await fetch(`/api/instances/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'disconnected' }),
      })
      stopPolling()
      setQrCode(null)
      await fetchInstance()
    } catch {
      setError('Erro ao desconectar')
    }
  }

  // ---- Excluir ----
  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/instances/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/instances')
      } else {
        const json = await res.json()
        setError(json.error?.message || 'Erro ao excluir instância')
      }
    } catch {
      setError('Erro ao excluir instância')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // ---- Loading ----
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-6 w-24 bg-[var(--border)] rounded animate-pulse" />
        <div className="h-8 w-64 bg-[var(--border)] rounded animate-pulse" />
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-4">
          <div className="h-5 w-48 bg-[var(--border)] rounded animate-pulse" />
          <div className="h-40 w-40 bg-[var(--border)] rounded animate-pulse mx-auto" />
        </div>
      </div>
    )
  }

  // ---- Erro / Não encontrado ----
  if (error && !instance) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/instances"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Instâncias
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    )
  }

  if (!instance) return null

  const status = statusConfig[instance.status]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/instances"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Instâncias
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{instance.instance_name}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/instances/${id}`}
              onClick={(e) => {
                e.preventDefault()
                // TODO: abrir modal de edição
              }}
              className="px-3 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--background)] transition-colors"
            >
              Editar
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Seção: Conexão */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Conexão</h2>

        {/* Desconectado ou erro */}
        {(instance.status === 'disconnected' || instance.status === 'error') && !qrCode && (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l8.735 8.735m0 0a.374.374 0 11.53.53m-.53-.53l.53.53m0 0L21 21M14.652 9.348a3.75 3.75 0 010 5.304m2.121-7.425a6.75 6.75 0 010 9.546m2.121-11.667C21.004 7.211 22.5 9.467 22.5 12s-1.496 4.789-3.606 6.894" />
              </svg>
            </div>
            <p className="text-[var(--muted)] mb-4">
              {instance.status === 'error' ? 'Ocorreu um erro na conexão.' : 'A instância está desconectada.'}
            </p>
            {instance.error_message && (
              <p className="text-sm text-red-600 mb-4">{instance.error_message}</p>
            )}
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#128C7E] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {connecting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Conectando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-2.556a4.5 4.5 0 0 0-1.242-7.244l-4.5-4.5a4.5 4.5 0 0 0-6.364 6.364L4.343 8.88" />
                  </svg>
                  Conectar
                </>
              )}
            </button>
          </div>
        )}

        {/* QR Code */}
        {(instance.status === 'qr_code' || qrCode) && (
          <div className="text-center py-6">
            <p className="text-[var(--foreground)] font-medium mb-4">
              Escaneie o QR code com seu WhatsApp
            </p>
            {qrCode && (
              <div className="inline-block p-4 bg-white rounded-xl border border-[var(--border)] mb-4">
                <img
                  src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                  alt="QR Code WhatsApp"
                  className="w-64 h-64"
                />
              </div>
            )}
            <div className="space-y-2">
              {qrExpiresAt && (
                <QRTimer expiresAt={qrExpiresAt} />
              )}
              {pollingStatus && (
                <p className="text-xs text-[var(--muted-foreground)] flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  Verificando conexão...
                </p>
              )}
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="text-sm text-[#25D366] hover:text-[#128C7E] font-medium"
              >
                {connecting ? 'Atualizando...' : 'Atualizar QR code'}
              </button>
            </div>
          </div>
        )}

        {/* Connecting */}
        {instance.status === 'connecting' && !qrCode && (
          <div className="text-center py-6">
            <svg className="w-12 h-12 text-yellow-500 mx-auto mb-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-[var(--muted)]">Estabelecendo conexão...</p>
          </div>
        )}

        {/* Conectado */}
        {instance.status === 'connected' && !qrCode && (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-green-700 font-medium mb-1">Conectado</p>
            {instance.phone_number && (
              <p className="text-[var(--muted)] text-sm mb-4">{instance.phone_number}</p>
            )}
            <button
              onClick={handleDisconnect}
              className="text-sm text-red-600 hover:text-red-700 font-medium border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              Desconectar
            </button>
          </div>
        )}

        {/* Banido */}
        {instance.status === 'banned' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <p className="text-red-700 font-medium mb-1">Instância Banida</p>
            <p className="text-sm text-[var(--muted)]">
              Esta instância foi banida pelo WhatsApp. Crie uma nova instância com outro número.
            </p>
          </div>
        )}
      </div>

      {/* Seção: Informações */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Informações</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="Nome" value={instance.instance_name} />
          <InfoField label="Instance ID" value={instance.instance_id} mono />
          <InfoField label="Telefone" value={instance.phone_number || 'Não disponível'} />
          <InfoField label="Webhook URL" value={instance.webhook_url || 'Não configurado'} mono />
          <InfoField
            label="Último Health Check"
            value={instance.last_health_check ? formatDate(instance.last_health_check) : 'Nunca'}
          />
          <InfoField label="Criado em" value={formatDate(instance.created_at)} />
        </div>
      </div>

      {/* Seção: Health Status */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Status de Saude</h2>

        {loadingHealth ? (
          <div className="space-y-4">
            <div className="h-4 w-32 bg-[var(--border)] rounded animate-pulse" />
            <div className="h-20 bg-[var(--border)] rounded animate-pulse" />
          </div>
        ) : healthStats && healthStats.checks.length > 0 ? (
          <div className="space-y-4">
            {/* Metricas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                  Uptime (24h)
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    {healthStats.uptime_percentage}%
                  </p>
                  <UptimeBadge uptime={healthStats.uptime_percentage} />
                </div>
              </div>
              <div>
                <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                  Tempo de Resposta Medio
                </p>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {healthStats.avg_response_time}ms
                </p>
              </div>
            </div>

            {/* Timeline de checks */}
            <div>
              <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                Ultimos 20 checks
              </p>
              <div className="flex items-center gap-1">
                {healthStats.checks.map((check) => (
                  <HealthCheckDot key={check.id} status={check.status} checkedAt={check.checked_at} />
                ))}
              </div>
            </div>

            {/* Ultimo check */}
            {healthStats.checks[0] && (
              <p className="text-xs text-[var(--muted-foreground)]">
                Ultimo check: {formatRelativeTime(healthStats.checks[0].checked_at)}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-[var(--muted)]">Nenhum check realizado ainda</p>
          </div>
        )}
      </div>

      {/* Seção: Grupos (placeholder) */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Grupos</h2>
        <div className="text-center py-6">
          <p className="text-[var(--muted)] mb-3">
            Grupos vinculados a esta instância aparecerão aqui.
          </p>
          <Link
            href="/groups"
            className="text-sm font-medium text-[#25D366] hover:text-[#128C7E] transition-colors"
          >
            Ver todos os grupos &rarr;
          </Link>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Excluir instância?
            </h3>
            <p className="text-sm text-[var(--muted)] mb-6">
              Tem certeza que deseja excluir <strong>{instance.instance_name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                {deleting ? 'Excluindo...' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Componentes auxiliares
// =============================================================================

function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm text-[var(--foreground)] ${mono ? 'font-mono' : ''} break-all`}>
        {value}
      </p>
    </div>
  )
}

function QRTimer({ expiresAt }: { expiresAt: string }) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    return Math.max(0, Math.floor(diff / 1000))
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      const secs = Math.max(0, Math.floor(diff / 1000))
      setSecondsLeft(secs)
      if (secs <= 0) clearInterval(interval)
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  if (secondsLeft <= 0) {
    return (
      <p className="text-xs text-red-500 font-medium">
        QR code expirado. Clique em &quot;Atualizar QR code&quot;.
      </p>
    )
  }

  return (
    <p className="text-xs text-[var(--muted-foreground)]">
      Expira em {secondsLeft}s
    </p>
  )
}

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = Date.now()
    const diffMs = now - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'agora'
    if (diffMins === 1) return 'ha 1 minuto'
    if (diffMins < 60) return `ha ${diffMins} minutos`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours === 1) return 'ha 1 hora'
    if (diffHours < 24) return `ha ${diffHours} horas`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'ha 1 dia'
    return `ha ${diffDays} dias`
  } catch {
    return dateStr
  }
}

function UptimeBadge({ uptime }: { uptime: number }) {
  if (uptime >= 99) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
        Excelente
      </span>
    )
  }
  if (uptime >= 95) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
        Bom
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
      Ruim
    </span>
  )
}

function HealthCheckDot({
  status,
  checkedAt,
}: {
  status: 'healthy' | 'unhealthy' | 'timeout'
  checkedAt: string
}) {
  const colors = {
    healthy: 'bg-green-500',
    unhealthy: 'bg-red-500',
    timeout: 'bg-yellow-500',
  }

  const labels = {
    healthy: 'Saudavel',
    unhealthy: 'Problemas',
    timeout: 'Timeout',
  }

  return (
    <div
      className={`w-3 h-3 rounded-full ${colors[status]}`}
      title={`${labels[status]} - ${formatDate(checkedAt)}`}
    />
  )
}
