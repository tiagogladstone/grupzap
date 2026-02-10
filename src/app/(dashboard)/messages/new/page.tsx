'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Instance {
  id: string
  instance_name: string
  status: string
  phone_number: string | null
}

interface Group {
  id: string
  name: string
  group_jid: string
  participant_count: number
}

type TargetType = 'group' | 'individual'
type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document'
type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPhoneToJid(phone: string): string {
  // Remove tudo que nao e digito
  const digits = phone.replace(/\D/g, '')
  return `${digits}@s.whatsapp.net`
}

function formatDateTime(date: string, time: string): string {
  if (!date || !time) return ''
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(`${date}T${time}`))
  } catch {
    return `${date} ${time}`
  }
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const messageTypes: { key: MessageType; label: string; icon: React.ReactNode }[] = [
  { key: 'text', label: 'Texto', icon: <TextIcon className="w-4 h-4" /> },
  { key: 'image', label: 'Imagem', icon: <ImageIcon className="w-4 h-4" /> },
  { key: 'video', label: 'Video', icon: <VideoIcon className="w-4 h-4" /> },
  { key: 'audio', label: 'Audio', icon: <AudioIcon className="w-4 h-4" /> },
  { key: 'document', label: 'Documento', icon: <DocumentIcon className="w-4 h-4" /> },
]

const recurrenceOptions: { key: Recurrence; label: string }[] = [
  { key: 'none', label: 'Unica (sem recorrencia)' },
  { key: 'daily', label: 'Diaria' },
  { key: 'weekly', label: 'Semanal' },
  { key: 'monthly', label: 'Mensal' },
]

const timezones = [
  { value: 'America/Sao_Paulo', label: 'Brasilia (GMT-3)' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
  { value: 'America/Bahia', label: 'Bahia (GMT-3)' },
  { value: 'America/Fortaleza', label: 'Fortaleza (GMT-3)' },
  { value: 'America/Recife', label: 'Recife (GMT-3)' },
  { value: 'America/Belem', label: 'Belem (GMT-3)' },
  { value: 'America/Cuiaba', label: 'Cuiaba (GMT-4)' },
  { value: 'America/Porto_Velho', label: 'Porto Velho (GMT-4)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5)' },
  { value: 'America/Noronha', label: 'Fernando de Noronha (GMT-2)' },
]

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

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
// Preview component
// ---------------------------------------------------------------------------

function MessagePreview({
  messageType,
  content,
  caption,
  mediaUrl,
  targetName,
  scheduledDate,
  scheduledTime,
}: {
  messageType: MessageType
  content: string
  caption: string
  mediaUrl: string
  targetName: string
  scheduledDate: string
  scheduledTime: string
}) {
  const hasContent = content || caption || mediaUrl

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Preview da Mensagem</h3>

      {!hasContent ? (
        <div className="text-center py-8">
          <p className="text-sm text-[var(--muted)]">Preencha os campos para ver o preview</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Chat bubble */}
          <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none p-3 max-w-[280px] ml-auto">
            {/* Media preview */}
            {messageType !== 'text' && mediaUrl && (
              <div className="mb-2 rounded-lg overflow-hidden bg-[var(--border)]">
                {messageType === 'image' ? (
                  <div className="w-full h-32 flex items-center justify-center bg-gray-200">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                ) : messageType === 'video' ? (
                  <div className="w-full h-32 flex items-center justify-center bg-gray-800">
                    <VideoIcon className="w-8 h-8 text-white" />
                  </div>
                ) : messageType === 'audio' ? (
                  <div className="w-full h-12 flex items-center justify-center gap-2 bg-gray-100 px-3">
                    <AudioIcon className="w-5 h-5 text-gray-500" />
                    <div className="flex-1 h-1 bg-gray-300 rounded-full" />
                    <span className="text-xs text-gray-500">0:00</span>
                  </div>
                ) : (
                  <div className="w-full h-16 flex items-center gap-3 bg-gray-100 px-3">
                    <DocumentIcon className="w-6 h-6 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-700 font-medium">Documento</p>
                      <p className="text-xs text-gray-400">arquivo</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Text content */}
            {messageType === 'text' && content && (
              <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{content}</p>
            )}

            {/* Caption for media */}
            {messageType !== 'text' && caption && (
              <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{caption}</p>
            )}

            {/* Timestamp */}
            <div className="flex justify-end mt-1">
              <span className="text-[10px] text-gray-500">
                {scheduledTime || '00:00'}
              </span>
            </div>
          </div>

          {/* Meta info */}
          <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
            {targetName && (
              <div className="flex justify-between text-xs">
                <span className="text-[var(--muted)]">Destino</span>
                <span className="text-[var(--foreground)] font-medium">{targetName}</span>
              </div>
            )}
            {scheduledDate && scheduledTime && (
              <div className="flex justify-between text-xs">
                <span className="text-[var(--muted)]">Agendada para</span>
                <span className="text-[var(--foreground)] font-medium">
                  {formatDateTime(scheduledDate, scheduledTime)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function NewMessagePage() {
  const router = useRouter()

  // Data
  const [instances, setInstances] = useState<Instance[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loadingInstances, setLoadingInstances] = useState(true)
  const [loadingGroups, setLoadingGroups] = useState(false)

  // Form state
  const [instanceId, setInstanceId] = useState('')
  const [targetType, setTargetType] = useState<TargetType>('group')
  const [groupId, setGroupId] = useState('')
  const [phone, setPhone] = useState('')
  const [messageType, setMessageType] = useState<MessageType>('text')
  const [content, setContent] = useState('')
  const [caption, setCaption] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [timezone, setTimezone] = useState('America/Sao_Paulo')
  const [recurrence, setRecurrence] = useState<Recurrence>('none')
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Buscar instancias conectadas
  useEffect(() => {
    async function fetchInstances() {
      try {
        const res = await fetch('/api/instances')
        if (res.ok) {
          const json = await res.json()
          const connected = (json.data || []).filter((i: Instance) => i.status === 'connected')
          setInstances(connected)
          // Auto-selecionar se so tem uma
          if (connected.length === 1) {
            setInstanceId(connected[0].id)
          }
        }
      } catch {
        // Ignora
      } finally {
        setLoadingInstances(false)
      }
    }
    fetchInstances()
  }, [])

  // Buscar grupos quando selecionar instancia
  useEffect(() => {
    if (!instanceId || targetType !== 'group') {
      setGroups([])
      setGroupId('')
      return
    }

    async function fetchGroups() {
      setLoadingGroups(true)
      try {
        const res = await fetch(`/api/groups?instance_id=${instanceId}`)
        if (res.ok) {
          const json = await res.json()
          setGroups(json.data || [])
        }
      } catch {
        // Ignora
      } finally {
        setLoadingGroups(false)
      }
    }
    fetchGroups()
  }, [instanceId, targetType])

  // Nome do destino para o preview
  const targetName = targetType === 'group'
    ? groups.find(g => g.id === groupId)?.name || ''
    : phone || ''

  // Validar e submeter
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldErrors({})

    // Validacoes client-side
    const errors: Record<string, string> = {}

    if (!instanceId) errors.instanceId = 'Selecione uma instancia'

    if (targetType === 'group' && !groupId) {
      errors.groupId = 'Selecione um grupo'
    }
    if (targetType === 'individual' && !phone) {
      errors.phone = 'Informe o numero de telefone'
    }

    if (messageType === 'text' && !content.trim()) {
      errors.content = 'Informe o conteudo da mensagem'
    }
    if (messageType !== 'text' && !mediaUrl.trim()) {
      errors.mediaUrl = 'Informe a URL da midia'
    }

    if (!scheduledDate) errors.scheduledDate = 'Selecione a data'
    if (!scheduledTime) errors.scheduledTime = 'Selecione a hora'

    if (scheduledDate && scheduledTime) {
      const scheduled = new Date(`${scheduledDate}T${scheduledTime}`)
      if (scheduled.getTime() <= Date.now()) {
        errors.scheduledDate = 'A data/hora deve ser futura'
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setSubmitting(true)

    try {
      // Montar targetJid
      let targetJid: string
      let selectedGroupId: string | undefined

      if (targetType === 'group') {
        const selectedGroup = groups.find(g => g.id === groupId)
        targetJid = selectedGroup?.group_jid || ''
        selectedGroupId = groupId
      } else {
        targetJid = formatPhoneToJid(phone)
      }

      const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()

      const payload = {
        instanceId,
        groupId: selectedGroupId,
        targetJid,
        targetType,
        messageType,
        content: messageType === 'text' ? content : undefined,
        caption: messageType !== 'text' ? caption : undefined,
        mediaUrl: messageType !== 'text' ? mediaUrl : undefined,
        scheduledFor,
        timezone,
        recurrence,
        recurrenceEndAt: recurrence !== 'none' && recurrenceEndDate
          ? new Date(`${recurrenceEndDate}T23:59:59`).toISOString()
          : undefined,
      }

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        setToast({ message: json.error?.message || 'Erro ao agendar mensagem', type: 'error' })
        return
      }

      setToast({ message: 'Mensagem agendada com sucesso!', type: 'success' })

      // Redirecionar apos breve delay
      setTimeout(() => {
        router.push('/messages')
      }, 1500)
    } catch {
      setToast({ message: 'Erro ao agendar mensagem', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  // Input styles
  const inputClass = 'w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#25D366]/50'
  const labelClass = 'block text-sm font-medium text-[var(--foreground)] mb-1.5'
  const errorClass = 'text-xs text-red-500 mt-1'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/messages"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Mensagens
        </Link>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Nova Mensagem Agendada</h1>
        <p className="text-[var(--muted)] mt-1">Preencha os campos abaixo para agendar uma mensagem.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">

          {/* 1. Instancia */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Instancia</h2>

            {loadingInstances ? (
              <div className="h-10 bg-[var(--border)] rounded-lg animate-pulse" />
            ) : instances.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-[var(--muted)] mb-2">Nenhuma instancia conectada</p>
                <Link
                  href="/instances"
                  className="text-sm font-medium text-[#25D366] hover:text-[#128C7E]"
                >
                  Conectar instancia
                </Link>
              </div>
            ) : (
              <div>
                <label className={labelClass}>Instancia WhatsApp</label>
                <select
                  value={instanceId}
                  onChange={(e) => setInstanceId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecione uma instancia...</option>
                  {instances.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.instance_name} {inst.phone_number ? `(${inst.phone_number})` : ''}
                    </option>
                  ))}
                </select>
                {fieldErrors.instanceId && <p className={errorClass}>{fieldErrors.instanceId}</p>}
              </div>
            )}
          </div>

          {/* 2. Destino */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Destino</h2>

            {/* Radio: Grupo ou Individual */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="targetType"
                  value="group"
                  checked={targetType === 'group'}
                  onChange={() => setTargetType('group')}
                  className="w-4 h-4 text-[#25D366] accent-[#25D366]"
                />
                <span className="text-sm text-[var(--foreground)]">Grupo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="targetType"
                  value="individual"
                  checked={targetType === 'individual'}
                  onChange={() => setTargetType('individual')}
                  className="w-4 h-4 text-[#25D366] accent-[#25D366]"
                />
                <span className="text-sm text-[var(--foreground)]">Contato individual</span>
              </label>
            </div>

            {/* Grupo select */}
            {targetType === 'group' && (
              <div>
                <label className={labelClass}>Grupo</label>
                {!instanceId ? (
                  <p className="text-sm text-[var(--muted)]">Selecione uma instancia primeiro</p>
                ) : loadingGroups ? (
                  <div className="h-10 bg-[var(--border)] rounded-lg animate-pulse" />
                ) : groups.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">Nenhum grupo encontrado para esta instancia</p>
                ) : (
                  <select
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Selecione um grupo...</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name} ({group.participant_count} participantes)
                      </option>
                    ))}
                  </select>
                )}
                {fieldErrors.groupId && <p className={errorClass}>{fieldErrors.groupId}</p>}
              </div>
            )}

            {/* Telefone input */}
            {targetType === 'individual' && (
              <div>
                <label className={labelClass}>Numero de telefone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="5511999998888"
                  className={inputClass}
                />
                <p className="text-xs text-[var(--muted)] mt-1">
                  Inclua o codigo do pais (55) + DDD + numero
                </p>
                {fieldErrors.phone && <p className={errorClass}>{fieldErrors.phone}</p>}
              </div>
            )}
          </div>

          {/* 3. Tipo de mensagem */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Tipo de Mensagem</h2>

            <div className="flex flex-wrap gap-2">
              {messageTypes.map((type) => (
                <button
                  key={type.key}
                  type="button"
                  onClick={() => setMessageType(type.key)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    messageType === type.key
                      ? 'border-[#25D366] bg-[#25D366]/10 text-[#25D366]'
                      : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {type.icon}
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Conteudo */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Conteudo</h2>

            {messageType === 'text' ? (
              <div>
                <label className={labelClass}>Mensagem</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  rows={4}
                  className={`${inputClass} resize-y`}
                />
                {fieldErrors.content && <p className={errorClass}>{fieldErrors.content}</p>}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>URL da midia</label>
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://exemplo.com/arquivo.jpg"
                    className={inputClass}
                  />
                  {fieldErrors.mediaUrl && <p className={errorClass}>{fieldErrors.mediaUrl}</p>}
                </div>
                <div>
                  <label className={labelClass}>Legenda (opcional)</label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Legenda da midia..."
                    rows={2}
                    className={`${inputClass} resize-y`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 5. Agendamento */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Agendamento</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Data</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={inputClass}
                />
                {fieldErrors.scheduledDate && <p className={errorClass}>{fieldErrors.scheduledDate}</p>}
              </div>
              <div>
                <label className={labelClass}>Hora</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className={inputClass}
                />
                {fieldErrors.scheduledTime && <p className={errorClass}>{fieldErrors.scheduledTime}</p>}
              </div>
            </div>

            <div>
              <label className={labelClass}>Fuso horario</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={inputClass}
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 6. Recorrencia */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Recorrencia</h2>

            <div>
              <label className={labelClass}>Frequencia</label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as Recurrence)}
                className={inputClass}
              >
                {recurrenceOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {recurrence !== 'none' && (
              <div>
                <label className={labelClass}>Repetir ate (opcional)</label>
                <input
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  min={scheduledDate || new Date().toISOString().split('T')[0]}
                  className={inputClass}
                />
                <p className="text-xs text-[var(--muted)] mt-1">
                  Deixe em branco para repetir indefinidamente
                </p>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting || loadingInstances}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#25D366' }}
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Agendando...
                </>
              ) : (
                'Agendar Mensagem'
              )}
            </button>
            <Link
              href="/messages"
              className="px-4 py-2.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>

        {/* Preview sidebar */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <MessagePreview
              messageType={messageType}
              content={content}
              caption={caption}
              mediaUrl={mediaUrl}
              targetName={targetName}
              scheduledDate={scheduledDate}
              scheduledTime={scheduledTime}
            />
          </div>
        </div>
      </div>

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
