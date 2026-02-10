'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WhatsAppInstance {
  instance_name: string
}

interface WhatsAppGroup {
  id: string
  instance_id: string
  name: string
  description: string | null
  participant_count: number
  admin_count: number
  health_score: number
  activity_level: 'high' | 'normal' | 'low' | 'inactive'
  is_monitored: boolean
  is_archived: boolean
  last_message_at: string | null
  last_sync_at: string | null
  whatsapp_instances: WhatsAppInstance | null
}

interface Instance {
  id: string
  instance_name: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(date: string | null): string {
  if (!date) return 'Nunca'
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'agora'
  if (seconds < 3600) return `ha ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `ha ${Math.floor(seconds / 3600)}h`
  if (seconds < 2592000) return `ha ${Math.floor(seconds / 86400)}d`
  return `ha ${Math.floor(seconds / 2592000)} meses`
}

function getHealthColor(score: number): string {
  if (score >= 80) return '#22c55e' // verde
  if (score >= 50) return '#eab308' // amarelo
  if (score >= 20) return '#f97316' // laranja
  return '#ef4444' // vermelho
}

function getHealthLabel(score: number): string {
  if (score >= 80) return 'Saudavel'
  if (score >= 50) return 'Moderado'
  if (score >= 20) return 'Baixo'
  return 'Critico'
}

function getActivityBadge(level: string): { label: string; color: string; bg: string } {
  switch (level) {
    case 'high':
      return { label: 'Alto', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.1)' }
    case 'normal':
      return { label: 'Normal', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)' }
    case 'low':
      return { label: 'Baixo', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' }
    case 'inactive':
      return { label: 'Inativo', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
    default:
      return { label: level, color: 'var(--muted)', bg: 'rgba(100, 116, 139, 0.1)' }
  }
}

// ---------------------------------------------------------------------------
// Icons SVG
// ---------------------------------------------------------------------------

function GroupIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 21a8 8 0 0 0-16 0" />
      <circle cx="10" cy="8" r="5" />
      <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
    </svg>
  )
}

function SyncIcon({ className, spinning }: { className?: string; spinning?: boolean }) {
  return (
    <svg
      className={className}
      style={spinning ? { animation: 'spin 1s linear infinite' } : undefined}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function HealthBar({ score }: { score: number }) {
  const color = getHealthColor(score)
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 rounded-full bg-[var(--border)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, score))}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-medium" style={{ color }}>{score}</span>
    </div>
  )
}

function ActivityBadge({ level }: { level: string }) {
  const badge = getActivityBadge(level)
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color: badge.color, backgroundColor: badge.bg }}
    >
      {badge.label}
    </span>
  )
}

function MonitorToggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => { e.stopPropagation(); onChange() }}
      disabled={disabled}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ backgroundColor: checked ? '#25D366' : 'var(--border)' }}
    >
      <span
        className="pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: checked ? 'translateX(17px)' : 'translateX(2px)' }}
      />
    </button>
  )
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] animate-slide-up">
      <svg className="w-5 h-5 text-[#25D366]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="m9 11 3 3L22 4" />
      </svg>
      <span className="text-sm">{message}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onSync, syncing }: { onSync: () => void; syncing: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--border)] flex items-center justify-center mb-4">
        <GroupIcon className="w-8 h-8 text-[var(--muted)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
        Nenhum grupo importado
      </h3>
      <p className="text-sm text-[var(--muted)] mb-6 max-w-sm">
        Sincronize seus grupos de uma instancia WhatsApp conectada.
      </p>
      <button
        onClick={onSync}
        disabled={syncing}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white transition-colors disabled:opacity-50"
        style={{ backgroundColor: '#25D366' }}
      >
        <SyncIcon className="w-4 h-4" spinning={syncing} />
        {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function GroupsPage() {
  const router = useRouter()

  const [groups, setGroups] = useState<WhatsAppGroup[]>([])
  const [instances, setInstances] = useState<Instance[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Filtros
  const [selectedInstance, setSelectedInstance] = useState<string>('')
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Buscar instâncias para o dropdown
  useEffect(() => {
    async function fetchInstances() {
      try {
        const res = await fetch('/api/instances')
        if (res.ok) {
          const json = await res.json()
          setInstances(json.data || [])
        }
      } catch {
        // Ignora - dropdown ficará vazio
      }
    }
    fetchInstances()
  }, [])

  // Buscar grupos
  const fetchGroups = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (selectedInstance) params.set('instance_id', selectedInstance)
      if (searchDebounced) params.set('search', searchDebounced)

      const res = await fetch(`/api/groups?${params.toString()}`)
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error?.message || 'Erro ao buscar grupos')
      }

      setGroups(json.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [selectedInstance, searchDebounced])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  // Sincronizar grupos
  const handleSync = async () => {
    // Se nenhuma instância selecionada e temos instâncias, usa a primeira
    const instanceId = selectedInstance || instances[0]?.id
    if (!instanceId) {
      setToast('Selecione uma instancia para sincronizar')
      return
    }

    setSyncing(true)
    try {
      const res = await fetch('/api/groups/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId }),
      })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error?.message || 'Erro ao sincronizar')
      }

      const { synced, created, updated } = json.data
      setToast(`${synced} grupos sincronizados (${created} novos, ${updated} atualizados)`)
      await fetchGroups()
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Erro ao sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  // Toggle monitoramento
  const handleToggleMonitor = async (groupId: string, currentValue: boolean) => {
    // Optimistic update
    setGroups(prev =>
      prev.map(g => g.id === groupId ? { ...g, is_monitored: !currentValue } : g)
    )

    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_monitored: !currentValue }),
      })

      if (!res.ok) {
        // Revert
        setGroups(prev =>
          prev.map(g => g.id === groupId ? { ...g, is_monitored: currentValue } : g)
        )
      }
    } catch {
      // Revert
      setGroups(prev =>
        prev.map(g => g.id === groupId ? { ...g, is_monitored: currentValue } : g)
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Grupos WhatsApp</h1>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#25D366' }}
        >
          <SyncIcon className="w-4 h-4" spinning={syncing} />
          {syncing ? 'Sincronizando...' : 'Sincronizar Grupos'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Instance dropdown */}
        <select
          value={selectedInstance}
          onChange={(e) => setSelectedInstance(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/50"
        >
          <option value="">Todas as instancias</option>
          {instances.map((inst) => (
            <option key={inst.id} value={inst.id}>
              {inst.instance_name}
            </option>
          ))}
        </select>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#25D366]/50"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[#25D366] rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchGroups}
            className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      ) : groups.length === 0 ? (
        <EmptyState onSync={handleSync} syncing={syncing} />
      ) : (
        /* Groups table */
        <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--card)]">
                  <th className="text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-4 py-3">Grupo</th>
                  <th className="text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-4 py-3 hidden md:table-cell">Instancia</th>
                  <th className="text-center text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Participantes</th>
                  <th className="text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Health</th>
                  <th className="text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Atividade</th>
                  <th className="text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Ultima msg</th>
                  <th className="text-center text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-4 py-3">Monitorado</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr
                    key={group.id}
                    onClick={() => router.push(`/groups/${group.id}`)}
                    className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--border)]/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(37, 211, 102, 0.1)' }}>
                          <GroupIcon className="w-4 h-4 text-[#25D366]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--foreground)] truncate">{group.name}</p>
                          {group.description && (
                            <p className="text-xs text-[var(--muted)] truncate max-w-[200px]">{group.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-[var(--muted)]">
                        {group.whatsapp_instances?.instance_name || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="text-sm text-[var(--foreground)]">{group.participant_count}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <HealthBar score={group.health_score} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <ActivityBadge level={group.activity_level} />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-[var(--muted)]">{timeAgo(group.last_message_at)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <MonitorToggle
                        checked={group.is_monitored}
                        onChange={() => handleToggleMonitor(group.id, group.is_monitored)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer with count */}
          <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--card)]">
            <p className="text-xs text-[var(--muted)]">
              {groups.length} grupo{groups.length !== 1 ? 's' : ''} encontrado{groups.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Keyframes for spin animation and slide-up */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
