'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WhatsAppInstance {
  instance_name: string
  phone_number: string | null
}

interface GroupStats {
  total_members: number
  total_admins: number
  messages_today: number
  messages_week: number
  active_members: number
}

interface GroupDetail {
  id: string
  instance_id: string
  group_jid: string
  name: string
  description: string | null
  picture_url: string | null
  invite_link: string | null
  participant_count: number
  admin_count: number
  health_score: number
  activity_level: 'high' | 'normal' | 'low' | 'inactive'
  is_monitored: boolean
  is_archived: boolean
  settings: unknown
  last_message_at: string | null
  last_sync_at: string | null
  metadata: unknown
  created_at: string
  updated_at: string
  whatsapp_instances: WhatsAppInstance | null
  stats: GroupStats | null
}

interface GroupMember {
  id: string
  group_id: string
  phone_jid: string
  phone_number: string | null
  name: string | null
  push_name: string | null
  is_admin: boolean
  is_super_admin: boolean
  engagement_score: number
  last_message_at: string | null
  message_count: number
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

function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getHealthColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 50) return '#eab308'
  if (score >= 20) return '#f97316'
  return '#ef4444'
}

function getHealthText(score: number): string {
  if (score >= 80) return 'Grupo saudavel e ativo'
  if (score >= 50) return 'Atividade moderada'
  if (score >= 20) return 'Baixa atividade, considere engajar'
  return 'Grupo inativo'
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

function getEngagementColor(score: number): string {
  if (score >= 70) return '#22c55e'
  if (score >= 40) return '#eab308'
  if (score >= 15) return '#f97316'
  return '#ef4444'
}

function formatPhone(jid: string | null, phone: string | null): string {
  if (phone) return phone
  if (jid) return jid.replace('@s.whatsapp.net', '')
  return '-'
}

// ---------------------------------------------------------------------------
// Icons SVG
// ---------------------------------------------------------------------------

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}

function GroupIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 21a8 8 0 0 0-16 0" />
      <circle cx="10" cy="8" r="5" />
      <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
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

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  )
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MonitorToggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ backgroundColor: checked ? '#25D366' : 'var(--border)' }}
    >
      <span
        className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
      />
    </button>
  )
}

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-1">{label}</dt>
      <dd className={`text-sm text-[var(--foreground)] ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  )
}

function MemberRoleBadge({ isAdmin, isSuperAdmin }: { isAdmin: boolean; isSuperAdmin: boolean }) {
  if (isSuperAdmin) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
        <ShieldIcon className="w-3 h-3" />
        Super Admin
      </span>
    )
  }
  if (isAdmin) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.1)' }}>
        <ShieldIcon className="w-3 h-3" />
        Admin
      </span>
    )
  }
  return null
}

function EngagementBar({ score }: { score: number }) {
  const color = getEngagementColor(score)
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, score))}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-[var(--muted)]">{score}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function GroupDetailPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.id as string

  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [membersCount, setMembersCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [membersLoading, setMembersLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [memberSearch, setMemberSearch] = useState('')
  const [memberSearchDebounced, setMemberSearchDebounced] = useState('')

  // Debounce member search
  useEffect(() => {
    const timer = setTimeout(() => setMemberSearchDebounced(memberSearch), 300)
    return () => clearTimeout(timer)
  }, [memberSearch])

  // Fetch group detail
  useEffect(() => {
    async function fetchGroup() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/groups/${groupId}`)
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json.error?.message || 'Erro ao buscar grupo')
        }

        setGroup(json.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    if (groupId) fetchGroup()
  }, [groupId])

  // Fetch members
  const fetchMembers = useCallback(async () => {
    setMembersLoading(true)
    try {
      const params = new URLSearchParams()
      if (memberSearchDebounced) params.set('search', memberSearchDebounced)

      const res = await fetch(`/api/groups/${groupId}/members?${params.toString()}`)
      const json = await res.json()

      if (res.ok) {
        setMembers(json.data || [])
        setMembersCount(json.count || 0)
      }
    } catch {
      // Ignore
    } finally {
      setMembersLoading(false)
    }
  }, [groupId, memberSearchDebounced])

  useEffect(() => {
    if (groupId) fetchMembers()
  }, [groupId, fetchMembers])

  // Toggle monitored
  const handleToggleMonitor = async () => {
    if (!group) return
    const newValue = !group.is_monitored
    setGroup({ ...group, is_monitored: newValue })

    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_monitored: newValue }),
      })
      if (!res.ok) {
        setGroup({ ...group, is_monitored: !newValue })
      }
    } catch {
      setGroup({ ...group, is_monitored: !newValue })
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[#25D366] rounded-full animate-spin" />
      </div>
    )
  }

  // Error state
  if (error || !group) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-red-500 mb-4">{error || 'Grupo nao encontrado'}</p>
        <button
          onClick={() => router.push('/groups')}
          className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
        >
          Voltar para Grupos
        </button>
      </div>
    )
  }

  const healthColor = getHealthColor(group.health_score)
  const activityBadge = getActivityBadge(group.activity_level)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/groups')}
            className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Grupos
          </button>
          <div className="h-6 w-px bg-[var(--border)]" />
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">{group.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {/* Health badge */}
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ color: healthColor, backgroundColor: `${healthColor}15` }}
              >
                {group.health_score}
              </span>
              {/* Activity badge */}
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ color: activityBadge.color, backgroundColor: activityBadge.bg }}
              >
                {activityBadge.label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--muted)]">Monitorado</span>
          <MonitorToggle checked={group.is_monitored} onChange={handleToggleMonitor} />
        </div>
      </div>

      {/* Section: Informacoes */}
      <section className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <InfoIcon className="w-4 h-4 text-[var(--muted)]" />
          <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider">Informacoes</h2>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <InfoCard label="Nome" value={group.name} />
          <InfoCard label="Descricao" value={group.description || '-'} />
          <InfoCard label="JID" value={group.group_jid} mono />
          <InfoCard label="Instancia" value={group.whatsapp_instances?.instance_name || '-'} />
          <InfoCard label="Participantes" value={String(group.participant_count)} />
          <InfoCard label="Admins" value={String(group.admin_count)} />
          <InfoCard label="Ultima mensagem" value={timeAgo(group.last_message_at)} />
          <InfoCard label="Ultimo sync" value={formatDate(group.last_sync_at)} />
          {group.invite_link && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-1">Link de convite</dt>
              <dd className="flex items-center gap-2">
                <LinkIcon className="w-3.5 h-3.5 text-[#25D366]" />
                <a
                  href={group.invite_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#25D366] hover:underline truncate"
                >
                  {group.invite_link}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </section>

      {/* Section: Health Score */}
      <section className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <ChartIcon className="w-4 h-4 text-[var(--muted)]" />
          <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider">Health Score</h2>
        </div>

        {/* Large health bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold" style={{ color: healthColor }}>
              {group.health_score}
            </span>
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
              style={{ color: activityBadge.color, backgroundColor: activityBadge.bg }}
            >
              Atividade: {activityBadge.label}
            </span>
          </div>
          <div className="w-full h-4 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, Math.max(0, group.health_score))}%`,
                backgroundColor: healthColor,
              }}
            />
          </div>
          <p className="text-sm text-[var(--muted)]">{getHealthText(group.health_score)}</p>
        </div>

        {/* Stats from RPC */}
        {group.stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[var(--border)]">
            <div>
              <p className="text-xs text-[var(--muted)] uppercase tracking-wider">Mensagens hoje</p>
              <p className="text-xl font-bold text-[var(--foreground)] mt-1">{group.stats.messages_today}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)] uppercase tracking-wider">Mensagens semana</p>
              <p className="text-xl font-bold text-[var(--foreground)] mt-1">{group.stats.messages_week}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)] uppercase tracking-wider">Membros ativos</p>
              <p className="text-xl font-bold text-[var(--foreground)] mt-1">{group.stats.active_members}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)] uppercase tracking-wider">Total admins</p>
              <p className="text-xl font-bold text-[var(--foreground)] mt-1">{group.stats.total_admins}</p>
            </div>
          </div>
        )}
      </section>

      {/* Section: Membros */}
      <section className="border border-[var(--border)] rounded-lg bg-[var(--card)] overflow-hidden">
        <div className="p-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <GroupIcon className="w-4 h-4 text-[var(--muted)]" />
              <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider">
                Membros ({membersCount})
              </h2>
            </div>
            <div className="relative max-w-xs">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Buscar membro..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#25D366]/50"
              />
            </div>
          </div>
        </div>

        {membersLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-[var(--border)] border-t-[#25D366] rounded-full animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-10 text-sm text-[var(--muted)]">
            {memberSearchDebounced ? 'Nenhum membro encontrado' : 'Nenhum membro sincronizado'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-b border-[var(--border)]">
                  <th className="text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-6 py-3">Nome</th>
                  <th className="text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Telefone</th>
                  <th className="text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-4 py-3 hidden md:table-cell">Cargo</th>
                  <th className="text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Engagement</th>
                  <th className="text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Ultima msg</th>
                  <th className="text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-6 py-3 hidden md:table-cell">Mensagens</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-[var(--border)] last:border-b-0">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
                          style={{
                            backgroundColor: member.is_admin || member.is_super_admin ? 'rgba(37, 99, 235, 0.1)' : 'var(--border)',
                            color: member.is_admin || member.is_super_admin ? '#2563eb' : 'var(--muted)',
                          }}
                        >
                          {(member.push_name || member.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-[var(--foreground)] truncate">
                          {member.push_name || member.name || 'Desconhecido'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-[var(--muted)] font-mono">
                        {formatPhone(member.phone_jid, member.phone_number)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <MemberRoleBadge isAdmin={member.is_admin} isSuperAdmin={member.is_super_admin} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <EngagementBar score={member.engagement_score} />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-[var(--muted)]">{timeAgo(member.last_message_at)}</span>
                    </td>
                    <td className="px-6 py-3 text-right hidden md:table-cell">
                      <span className="text-sm text-[var(--foreground)]">{member.message_count}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section: Atividade Recente (placeholder) */}
      <section className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <ChartIcon className="w-4 h-4 text-[var(--muted)]" />
          <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider">Atividade Recente</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--border)] flex items-center justify-center mb-3">
            <ChartIcon className="w-6 h-6 text-[var(--muted)]" />
          </div>
          <p className="text-sm text-[var(--muted)]">
            Estatisticas de atividade aparecerão aqui quando houver dados.
          </p>
        </div>
      </section>
    </div>
  )
}
