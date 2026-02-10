'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document'
type Category = 'general' | 'welcome' | 'reminder' | 'announcement' | 'promotion'

const categoryOptions: { value: Category; label: string }[] = [
  { value: 'general', label: 'Geral' },
  { value: 'welcome', label: 'Boas-vindas' },
  { value: 'reminder', label: 'Lembrete' },
  { value: 'announcement', label: 'Anuncio' },
  { value: 'promotion', label: 'Promocao' },
]

const messageTypeOptions: { value: MessageType; label: string; icon: React.ReactNode }[] = [
  {
    value: 'text',
    label: 'Texto',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.2 48.2 0 0 0 5.017-.508c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
    ),
  },
  {
    value: 'image',
    label: 'Imagem',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
      </svg>
    ),
  },
  {
    value: 'video',
    label: 'Video',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  },
  {
    value: 'audio',
    label: 'Audio',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
      </svg>
    ),
  },
  {
    value: 'document',
    label: 'Documento',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
]

/** Extrai variaveis do texto */
function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))]
}

/** Renderiza preview com variaveis destacadas */
function renderPreview(text: string): React.ReactNode[] {
  if (!text) return []
  const parts = text.split(/(\{\{\w+\}\})/g)
  return parts.map((part, i) => {
    if (/^\{\{\w+\}\}$/.test(part)) {
      return (
        <span key={i} className="inline-flex items-center px-1 py-0.5 mx-0.5 rounded text-xs font-mono bg-[#25D366]/20 text-[#128C7E] font-semibold">
          {part}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export default function EditTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('general')
  const [messageType, setMessageType] = useState<MessageType>('text')
  const [content, setContent] = useState('')
  const [caption, setCaption] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [loadingData, setLoadingData] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const isMedia = messageType !== 'text'

  // Detectar variaveis automaticamente
  const detectedVars = useMemo(() => {
    const fromContent = extractVariables(content)
    const fromCaption = extractVariables(caption)
    return [...new Set([...fromContent, ...fromCaption])]
  }, [content, caption])

  // Carregar dados do template
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/templates/${templateId}`)
        const json = await res.json()

        if (!res.ok || !json.data) {
          setLoadError(json.error?.message || 'Template nao encontrado')
          return
        }

        const t = json.data
        setName(t.name || '')
        setDescription(t.description || '')
        setCategory(t.category || 'general')
        setMessageType(t.message_type || 'text')
        setContent(t.content || '')
        setCaption(t.caption || '')
        setMediaUrl(t.media_url || '')
      } catch {
        setLoadError('Erro ao carregar template')
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [templateId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          messageType,
          content: content || null,
          caption: caption || null,
          mediaUrl: mediaUrl || null,
          category,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error?.message || 'Erro ao atualizar template')
        return
      }

      router.push('/messages/templates')
    } catch {
      setError('Erro de conexao. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (loadingData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div className="h-4 w-20 bg-[var(--border)] rounded animate-pulse mb-4" />
          <div className="h-8 w-64 bg-[var(--border)] rounded animate-pulse" />
          <div className="h-4 w-48 bg-[var(--border)] rounded animate-pulse mt-2" />
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-4 w-24 bg-[var(--border)] rounded animate-pulse mb-2" />
              <div className="h-10 w-full bg-[var(--border)] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Load error
  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link
            href="/messages/templates"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Templates
          </Link>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Editar Template</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <p className="text-red-700 font-medium">{loadError}</p>
          <Link
            href="/messages/templates"
            className="mt-3 inline-block text-sm text-red-600 hover:text-red-800 underline"
          >
            Voltar para templates
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/messages/templates"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Templates
        </Link>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Editar Template</h1>
        <p className="text-[var(--muted)] mt-1">
          Atualize as informacoes do template.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Formulario (3 colunas) */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-5">
            {/* Erro */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Nome */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Nome do template *
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Boas-vindas ao grupo"
                className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366] transition-colors"
              />
            </div>

            {/* Descricao */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Descricao
              </label>
              <textarea
                id="description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descricao curta do template (opcional)"
                className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366] transition-colors resize-none"
              />
            </div>

            {/* Categoria */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Categoria
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366] transition-colors"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de mensagem */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Tipo de mensagem
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {messageTypeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMessageType(opt.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors ${
                      messageType === opt.value
                        ? 'border-[#25D366] bg-[#25D366]/10 text-[#128C7E]'
                        : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--foreground)]/20'
                    }`}
                  >
                    {opt.icon}
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Conteudo */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Conteudo da mensagem
              </label>
              <textarea
                id="content"
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Digite o texto da mensagem. Use {{variavel}} para inserir variaveis dinamicas."
                className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366] transition-colors resize-none font-mono text-sm"
              />
              <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
                Use {'{{variavel}}'} para inserir variaveis dinamicas. Ex: Ola {'{{nome}}'}, bem-vindo ao {'{{grupo}}'}!
              </p>
            </div>

            {/* Variaveis detectadas */}
            {detectedVars.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[var(--muted)] font-medium">Variaveis detectadas:</span>
                {detectedVars.map((v) => (
                  <span
                    key={v}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-[#25D366]/10 text-[#128C7E]"
                  >
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            )}

            {/* Campos de midia */}
            {isMedia && (
              <>
                <div>
                  <label htmlFor="mediaUrl" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    URL da midia
                  </label>
                  <input
                    id="mediaUrl"
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://exemplo.com/arquivo.jpg"
                    className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366] transition-colors font-mono text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="caption" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    Legenda
                  </label>
                  <textarea
                    id="caption"
                    rows={2}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Legenda para a midia (opcional). Tambem aceita {{variaveis}}."
                    className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366] transition-colors resize-none"
                  />
                </div>
              </>
            )}

            {/* Botoes */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#128C7E] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Salvando...
                  </>
                ) : (
                  'Salvar Alteracoes'
                )}
              </button>
              <Link
                href="/messages/templates"
                className="px-5 py-2.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Cancelar
              </Link>
            </div>
          </div>
        </form>

        {/* Preview ao vivo (2 colunas) */}
        <div className="lg:col-span-2">
          <div className="sticky top-6">
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Preview</h3>
            <div className="bg-[#ECE5DD] rounded-xl p-4 min-h-[200px]">
              {/* Balao de mensagem estilo WhatsApp */}
              <div className="max-w-[90%] ml-auto">
                <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none p-3 shadow-sm">
                  {/* Midia placeholder */}
                  {isMedia && (
                    <div className="bg-[#c8e6b0] rounded-lg p-4 mb-2 flex items-center justify-center min-h-[80px]">
                      <div className="text-center text-[#6a9b50]">
                        {messageType === 'image' && (
                          <svg className="w-8 h-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                          </svg>
                        )}
                        {messageType === 'video' && (
                          <svg className="w-8 h-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                          </svg>
                        )}
                        {messageType === 'audio' && (
                          <svg className="w-8 h-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                          </svg>
                        )}
                        {messageType === 'document' && (
                          <svg className="w-8 h-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                          </svg>
                        )}
                        <span className="text-xs">{mediaUrl ? 'Midia' : 'Sem midia'}</span>
                      </div>
                    </div>
                  )}

                  {/* Conteudo do texto */}
                  {(content || (!isMedia && !content)) && (
                    <p className="text-sm text-[#303030] whitespace-pre-wrap leading-relaxed">
                      {content ? renderPreview(content) : (
                        <span className="text-[#999] italic">Digite o conteudo...</span>
                      )}
                    </p>
                  )}

                  {/* Legenda da midia */}
                  {isMedia && caption && (
                    <p className="text-sm text-[#303030] whitespace-pre-wrap leading-relaxed mt-1">
                      {renderPreview(caption)}
                    </p>
                  )}

                  {/* Horario */}
                  <div className="flex justify-end mt-1">
                    <span className="text-[10px] text-[#999]">12:00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info de variaveis */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                <div>
                  <h4 className="text-xs font-medium text-blue-800 mb-1">Variaveis disponiveis</h4>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    As variaveis serao substituidas ao usar o template. Exemplos comuns: {'{{nome}}'}, {'{{grupo}}'}, {'{{data}}'}, {'{{link}}'}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
