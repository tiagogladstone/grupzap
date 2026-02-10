'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WhatsAppInstance {
  instance_name: string
}

interface WhatsAppGroup {
  name: string
}

interface ScheduledMessage {
  id: string
  instance_id: string
  group_id: string | null
  target_jid: string
  target_type: 'group' | 'individual' | 'broadcast'
  message_type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contact'
  content: string | null
  caption: string | null
  media_url: string | null
  scheduled_for: string
  timezone: string
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | null
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled'
  error_message: string | null
  created_at: string
  whatsapp_instances: WhatsAppInstance | null
  whatsapp_groups: WhatsAppGroup | null
}

type StatusFilter = 'all' | 'pending' | 'sent' | 'failed' | 'cancelled'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

function truncate(text: string | null, max: number): string {
  if (!text) return '-'
  return text.length > max ? text.slice(0, max) + '...' : text
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const statusConfig: Record<ScheduledMessage['status'], { label: string; bg: string; text: string }> = {
  pending: { label: 'Pendente', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  processing: { label: 'Processando', bg: 'bg-blue-100', text: 'text-blue-700' },
  sent: { label: 'Enviada', bg: 'bg-green-100', text: 'text-green-700' },
  failed: { label: 'Falhou', bg: 'bg-red-100', text: 'text-red-700' },
  cancelled: { label: 'Cancelada', bg: 'bg-gray-100', text: 'text-gray-500' },
}

const recurrenceLabels: Record<string, string> = {
  none: 'Unica',
  daily: 'Diaria',
  weekly: 'Semanal',
  monthly: 'Mensal',
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function TextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 6.1H3" />
      <path d="M21 12.1H3" />
      <path d="M15.1 18H3" />
    </svg>
  )
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  )
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </svg>
  )
}

function AudioIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  )
}

function EllipsisIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  )
}

function getMessageTypeIcon(type: string): React.ReactNode {
  const iconClass = 'w-4 h-4'
  switch (type) {
    case 'text': return <TextIcon className={iconClass} />
    case 'image': return <ImageIcon className={iconClass} />
    case 'video': return <VideoIcon className={iconClass} />
    case 'audio': return <AudioIcon className={iconClass} />
    case 'document': return <DocumentIcon className={iconClass} />
    default: return <TextIcon className={iconClass} />
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: ScheduledMessage['status'] }) {
  const config = statusConfig[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}

function RecurrenceBadge({ recurrence }: { recurrence: string | null }) {
  const label = recurrenceLabels[recurrence || 'none'] || 'Unica'
  const isRecurrent = recurrence && recurrence !== 'none'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isRecurrent ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
      {label}
    </span>
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

function ActionDropdown({
  message,
  onCancel,
}: {
  message: ScheduledMessage
  onCancel: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        className="p-1.5 rounded-lg hover:bg-[var(--border)] transition-colors"
      >
        <EllipsisIcon className="w-4 h-4 text-[var(--muted)]" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg py-1">
            {message.status === 'pending' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/messages/${message.id}`)
                  setOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--border)]/50 transition-colors"
              >
                Editar
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/messages/${message.id}`)
                setOpen(false)
              }}
              className="w-full text-left px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--border)]/50 transition-colors"
            >
              Ver detalhes
            </button>
            {message.status === 'pending' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCancel(message.id)
                  setOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--border)] flex items-center justify-center mb-4">
        <CalendarIcon className="w-8 h-8 text-[var(--muted)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
        Nenhuma mensagem agendada
      </h3>
      <p className="text-sm text-[var(--muted)] mb-6 max-w-sm">
        Agende sua primeira mensagem para um grupo ou contato.
      </p>
      <Link
        href="/messages/new"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white transition-colors hover:opacity-90"
        style={{ backgroundColor: '#25D366' }}
      >
        <PlusIcon className="w-4 h-4" />
        Agendar Mensagem
      </Link>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function MessagesPage() {
  const router = useRouter()

  const [messages, setMessages] = useState<ScheduledMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<StatusFilter>('all')

  // Contadores por status
  const [counts, setCounts] = useState<Record<string, number>>({
    all: 0,
    pending: 0,
    sent: 0,
    failed: 0,
    cancelled: 0,
  })

  // Buscar mensagens
  const fetchMessages = useCallback(async (tab: StatusFilter) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (tab !== 'all') {
        params.set('status', tab)
      }

      const res = await fetch(`/api/messages?${params.toString()}`)
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error?.message || 'Erro ao buscar mensagens')
      }

      setMessages(json.data || [])

      // Se busca geral (all), calcular contadores
      if (tab === 'all') {
        const all = json.data || []
        setCounts({
          all: all.length,
          pending: all.filter((m: ScheduledMessage) => m.status === 'pending').length,
          sent: all.filter((m: ScheduledMessage) => m.status === 'sent').length,
          failed: all.filter((m: ScheduledMessage) => m.status === 'failed').length,
          cancelled: all.filter((m: ScheduledMessage) => m.status === 'cancelled').length,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  // Buscar contadores na montagem
  useEffect(() => {
    fetchMessages('all')
  }, [fetchMessages])

  // Refetch quando muda a tab
  useEffect(() => {
    if (activeTab !== 'all') {
      fetchMessages(activeTab)
    }
  }, [activeTab, fetchMessages])

  // Mudar tab
  function handleTabChange(tab: StatusFilter) {
    setActiveTab(tab)
    if (tab === 'all') {
      fetchMessages('all')
    }
  }

  // Cancelar mensagem
  async function handleCancel(messageId: string) {
    try {
      const res = await fetch(`/api/messages/${messageId}`, { method: 'DELETE' })
      const json = await res.json()

      if (!res.ok) {
        setToast(json.error?.message || 'Erro ao cancelar')
        return
      }

      setToast('Mensagem cancelada')
      fetchMessages(activeTab === 'all' ? 'all' : activeTab)
    } catch {
      setToast('Erro ao cancelar mensagem')
    }
  }

  // Filtragem local para a tab "all" (mostra tudo ordenado)
  const displayMessages = activeTab === 'all'
    ? messages
    : messages

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'pending', label: 'Pendentes' },
    { key: 'sent', label: 'Enviadas' },
    { key: 'failed', label: 'Falhadas' },
    { key: 'cancelled', label: 'Canceladas' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Mensagens Agendadas</h1>
        <Link
          href="/messages/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white transition-all duration-200 hover:opacity-90"
          style={{ backgroundColor: '#25D366' }}
        >
          <PlusIcon className="w-4 h-4" />
          Nova Mensagem
        </Link>
      </div>

      {/* Tabs de status */}
      <div className="flex gap-1 border-b border-[var(--border)] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-[#25D366] text-[#25D366]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium ${
                activeTab === tab.key
                  ? 'bg-[#25D366]/10 text-[#25D366]'
                  : 'bg-[var(--border)] text-[var(--muted)]'
              }`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
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
            onClick={() => fetchMessages(activeTab)}
            className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      ) : displayMessages.length === 0 ? (
        <EmptyState />
      ) : (
        /* Messages table */
        <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--card)]">
                  <th className="text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-4 py-3">Tipo</th>
                  <th className="text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-4 py-3">Destino</th>
                  <th className="text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-4 py-3 hidden md:table-cell">Conteudo</th>
                  <th className="text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-4 py-3">Agendada para</th>
                  <th className="text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Recorrencia</th>
                  <th className="text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-center text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-4 py-3 w-12">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {displayMessages.map((msg) => (
                  <tr
                    key={msg.id}
                    onClick={() => router.push(`/messages/${msg.id}`)}
                    className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--border)]/30 cursor-pointer transition-colors"
                  >
                    {/* Tipo */}
                    <td className="px-4 py-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(37, 211, 102, 0.1)' }}>
                        <span className="text-[#25D366]">
                          {getMessageTypeIcon(msg.message_type)}
                        </span>
                      </div>
                    </td>

                    {/* Destino */}
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate">
                          {msg.whatsapp_groups?.name || msg.target_jid}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {msg.whatsapp_instances?.instance_name || '-'}
                        </p>
                      </div>
                    </td>

                    {/* Conteudo */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-[var(--muted)] truncate max-w-[200px]">
                        {truncate(msg.content || msg.caption, 50)}
                      </p>
                    </td>

                    {/* Agendada para */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-[var(--foreground)] whitespace-nowrap">
                        {formatDateTime(msg.scheduled_for)}
                      </span>
                    </td>

                    {/* Recorrencia */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <RecurrenceBadge recurrence={msg.recurrence} />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={msg.status} />
                    </td>

                    {/* Acoes */}
                    <td className="px-4 py-3 text-center">
                      <ActionDropdown message={msg} onCancel={handleCancel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer with count */}
          <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--card)]">
            <p className="text-xs text-[var(--muted)]">
              {displayMessages.length} mensage{displayMessages.length !== 1 ? 'ns' : 'm'} encontrada{displayMessages.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Keyframes */}
      <style>{`
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
