'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WhatsAppInstance {
  instance_name: string
  phone_number: string | null
}

interface WhatsAppGroup {
  name: string
  group_jid: string
}

interface ScheduledMessage {
  id: string
  organization_id: string
  instance_id: string
  group_id: string | null
  target_jid: string
  target_type: 'group' | 'individual' | 'broadcast'
  message_type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contact'
  content: string | null
  caption: string | null
  media_url: string | null
  media_mime_type: string | null
  media_filename: string | null
  scheduled_for: string
  timezone: string
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | null
  recurrence_end_at: string | null
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled'
  sent_at: string | null
  attempts: number
  max_attempts: number
  error_message: string | null
  external_message_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  whatsapp_instances: WhatsAppInstance | null
  whatsapp_groups: WhatsAppGroup | null
}

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
      second: '2-digit',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

function formatDateShort(dateStr: string): string {
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

const messageTypeLabels: Record<string, string> = {
  text: 'Texto',
  image: 'Imagem',
  video: 'Video',
  audio: 'Audio',
  document: 'Documento',
  sticker: 'Sticker',
  location: 'Localizacao',
  contact: 'Contato',
}

const targetTypeLabels: Record<string, string> = {
  group: 'Grupo',
  individual: 'Individual',
  broadcast: 'Broadcast',
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.75 19.5L8.25 12l7.5-7.5" />
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

function getMessageTypeIcon(type: string): React.ReactNode {
  const iconClass = 'w-5 h-5'
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

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] animate-slide-up">
      {type === 'success' ? (
        <svg className="w-5 h-5 text-[#25D366]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="m9 11 3 3L22 4" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" x2="9" y1="9" y2="15" />
          <line x1="9" x2="15" y1="9" y2="15" />
        </svg>
      )}
      <span className="text-sm">{message}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function MessageDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [message, setMessage] = useState<ScheduledMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Edit state
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editCaption, setEditCaption] = useState('')
  const [editMediaUrl, setEditMediaUrl] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [saving, setSaving] = useState(false)

  // Cancel state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  // Reschedule state (for failed messages)
  const [rescheduling, setRescheduling] = useState(false)

  // Fetch message
  const fetchMessage = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/${id}`)
      const json = await res.json()

      if (!res.ok) {
        setError(json.error?.message || 'Erro ao carregar mensagem')
        return
      }

      setMessage(json.data)
    } catch {
      setError('Erro ao carregar mensagem')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchMessage()
  }, [fetchMessage])

  // Start editing
  function startEdit() {
    if (!message) return
    setEditContent(message.content || '')
    setEditCaption(message.caption || '')
    setEditMediaUrl(message.media_url || '')

    // Parse scheduled_for into date and time
    try {
      const dt = new Date(message.scheduled_for)
      setEditDate(dt.toISOString().split('T')[0])
      setEditTime(dt.toTimeString().slice(0, 5))
    } catch {
      setEditDate('')
      setEditTime('')
    }

    setEditing(true)
  }

  // Save edit
  async function handleSave() {
    if (!message) return
    setSaving(true)

    try {
      const payload: Record<string, unknown> = {}

      if (message.message_type === 'text') {
        if (editContent !== (message.content || '')) payload.content = editContent
      } else {
        if (editCaption !== (message.caption || '')) payload.caption = editCaption
        if (editMediaUrl !== (message.media_url || '')) payload.mediaUrl = editMediaUrl
      }

      if (editDate && editTime) {
        const newScheduled = new Date(`${editDate}T${editTime}`).toISOString()
        if (newScheduled !== message.scheduled_for) {
          payload.scheduledFor = newScheduled
        }
      }

      if (Object.keys(payload).length === 0) {
        setEditing(false)
        return
      }

      const res = await fetch(`/api/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        setToast({ message: json.error?.message || 'Erro ao salvar', type: 'error' })
        return
      }

      setMessage(json.data)
      setEditing(false)
      setToast({ message: 'Mensagem atualizada', type: 'success' })
    } catch {
      setToast({ message: 'Erro ao salvar alteracoes', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // Cancel message
  async function handleCancel() {
    setCancelling(true)
    try {
      const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' })
      const json = await res.json()

      if (!res.ok) {
        setToast({ message: json.error?.message || 'Erro ao cancelar', type: 'error' })
        return
      }

      setToast({ message: 'Mensagem cancelada', type: 'success' })
      await fetchMessage()
    } catch {
      setToast({ message: 'Erro ao cancelar mensagem', type: 'error' })
    } finally {
      setCancelling(false)
      setShowCancelConfirm(false)
    }
  }

  // Reschedule (failed -> pending)
  async function handleReschedule() {
    setRescheduling(true)
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' }),
      })

      const json = await res.json()

      if (!res.ok) {
        setToast({ message: json.error?.message || 'Erro ao reagendar', type: 'error' })
        return
      }

      setMessage(json.data)
      setToast({ message: 'Mensagem reagendada', type: 'success' })
    } catch {
      setToast({ message: 'Erro ao reagendar mensagem', type: 'error' })
    } finally {
      setRescheduling(false)
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-6 w-24 bg-[var(--border)] rounded animate-pulse" />
        <div className="h-8 w-64 bg-[var(--border)] rounded animate-pulse" />
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-4">
          <div className="h-5 w-48 bg-[var(--border)] rounded animate-pulse" />
          <div className="h-5 w-32 bg-[var(--border)] rounded animate-pulse" />
          <div className="h-20 w-full bg-[var(--border)] rounded animate-pulse" />
        </div>
      </div>
    )
  }

  // Error / Not found
  if (error && !message) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/messages"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Mensagens
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    )
  }

  if (!message) return null

  const status = statusConfig[message.status]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/messages"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Mensagens
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(37, 211, 102, 0.1)' }}>
              <span className="text-[#25D366]">
                {getMessageTypeIcon(message.message_type)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[var(--foreground)]">
                  {message.whatsapp_groups?.name || message.target_jid}
                </h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-sm text-[var(--muted)]">
                {messageTypeLabels[message.message_type] || message.message_type} - {targetTypeLabels[message.target_type] || message.target_type}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {message.status === 'pending' && !editing && (
              <button
                onClick={startEdit}
                className="px-3 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--background)] transition-colors"
              >
                Editar
              </button>
            )}
            {message.status === 'pending' && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error section for failed messages */}
      {message.status === 'failed' && message.error_message && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-700 mb-1">Erro no envio</h3>
              <p className="text-sm text-red-600">{message.error_message}</p>
              <p className="text-xs text-red-500 mt-1">
                Tentativas: {message.attempts}/{message.max_attempts}
              </p>
            </div>
            <button
              onClick={handleReschedule}
              disabled={rescheduling}
              className="px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors flex-shrink-0"
            >
              {rescheduling ? 'Reagendando...' : 'Reagendar'}
            </button>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="bg-[var(--card)] border-2 border-[#25D366] rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Editar Mensagem</h2>

          {message.message_type === 'text' ? (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Conteudo</label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 resize-y"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">URL da midia</label>
                <input
                  type="url"
                  value={editMediaUrl}
                  onChange={(e) => setEditMediaUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Legenda</label>
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 resize-y"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Data</label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Hora</label>
              <input
                type="time"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#25D366' }}
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Salvando...
                </>
              ) : (
                'Salvar alteracoes'
              )}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Cancelar edicao
            </button>
          </div>
        </div>
      )}

      {/* Message info */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-5">Informacoes</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InfoField
            label="Tipo"
            value={messageTypeLabels[message.message_type] || message.message_type}
          />
          <InfoField
            label="Destino"
            value={message.whatsapp_groups?.name || message.target_jid}
          />
          <InfoField
            label="Instancia"
            value={message.whatsapp_instances?.instance_name || '-'}
          />
          <InfoField
            label="Tipo de destino"
            value={targetTypeLabels[message.target_type] || message.target_type}
          />
          <InfoField
            label="Agendada para"
            value={formatDateShort(message.scheduled_for)}
          />
          <InfoField
            label="Fuso horario"
            value={message.timezone}
          />
          <InfoField
            label="Recorrencia"
            value={recurrenceLabels[message.recurrence || 'none'] || 'Unica'}
          />
          {message.recurrence && message.recurrence !== 'none' && message.recurrence_end_at && (
            <InfoField
              label="Recorrencia ate"
              value={formatDateShort(message.recurrence_end_at)}
            />
          )}
          <InfoField
            label="Status"
            value={status.label}
          />
          <InfoField
            label="Tentativas"
            value={`${message.attempts}/${message.max_attempts}`}
          />
          {message.sent_at && (
            <InfoField
              label="Enviada em"
              value={formatDateTime(message.sent_at)}
            />
          )}
          {message.external_message_id && (
            <InfoField
              label="ID externo"
              value={message.external_message_id}
              mono
            />
          )}
          <InfoField
            label="Criada em"
            value={formatDateTime(message.created_at)}
          />
          <InfoField
            label="Atualizada em"
            value={formatDateTime(message.updated_at)}
          />
        </div>
      </div>

      {/* Content section */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Conteudo</h2>

        {message.message_type === 'text' ? (
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
            <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap break-words">
              {message.content || '(vazio)'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {message.media_url && (
              <div>
                <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">URL da midia</p>
                <a
                  href={message.media_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#25D366] hover:text-[#128C7E] font-mono break-all"
                >
                  {message.media_url}
                </a>
              </div>
            )}
            {message.media_mime_type && (
              <InfoField label="Tipo MIME" value={message.media_mime_type} mono />
            )}
            {message.media_filename && (
              <InfoField label="Nome do arquivo" value={message.media_filename} />
            )}
            {message.caption && (
              <div>
                <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Legenda</p>
                <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                  <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap break-words">
                    {message.caption}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Target JID */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Detalhes Tecnicos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InfoField label="Target JID" value={message.target_jid} mono />
          <InfoField label="Instance ID" value={message.instance_id} mono />
          {message.group_id && (
            <InfoField label="Group ID" value={message.group_id} mono />
          )}
          {message.created_by && (
            <InfoField label="Criado por (User ID)" value={message.created_by} mono />
          )}
        </div>
      </div>

      {/* Cancel confirmation modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Cancelar mensagem?
            </h3>
            <p className="text-sm text-[var(--muted)] mb-6">
              Tem certeza que deseja cancelar esta mensagem agendada? Esta acao nao pode ser desfeita.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Manter
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                {cancelling ? 'Cancelando...' : 'Sim, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

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
