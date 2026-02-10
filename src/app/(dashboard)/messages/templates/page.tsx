'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Row } from '@/types/supabase'

type Template = Row<'message_templates'>

type Category = 'all' | Template['category']

const categoryConfig: Record<Category, { label: string; bg: string; text: string }> = {
  all: { label: 'Todos', bg: '', text: '' },
  general: { label: 'Geral', bg: 'bg-gray-100', text: 'text-gray-700' },
  welcome: { label: 'Boas-vindas', bg: 'bg-green-100', text: 'text-green-700' },
  reminder: { label: 'Lembrete', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  announcement: { label: 'Anuncio', bg: 'bg-blue-100', text: 'text-blue-700' },
  promotion: { label: 'Promocao', bg: 'bg-purple-100', text: 'text-purple-700' },
}

const messageTypeIcons: Record<Template['message_type'], { label: string; icon: React.ReactNode }> = {
  text: {
    label: 'Texto',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.2 48.2 0 0 0 5.017-.508c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
    ),
  },
  image: {
    label: 'Imagem',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
      </svg>
    ),
  },
  video: {
    label: 'Video',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  },
  audio: {
    label: 'Audio',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
      </svg>
    ),
  },
  document: {
    label: 'Documento',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
}

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (activeCategory !== 'all') params.set('category', activeCategory)
      if (search) params.set('search', search)

      const res = await fetch(`/api/templates?${params.toString()}`)
      const json = await res.json()
      if (json.data) {
        setTemplates(json.data)
      } else if (json.error) {
        setError(json.error.message)
      }
    } catch {
      setError('Erro ao carregar templates')
    } finally {
      setLoading(false)
    }
  }, [activeCategory, search])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Tem certeza que deseja excluir o template "${name}"?`)) return

    setDeleting(id)
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id))
      } else {
        const json = await res.json()
        alert(json.error?.message || 'Erro ao excluir template')
      }
    } catch {
      alert('Erro de conexao. Tente novamente.')
    } finally {
      setDeleting(null)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-64 bg-[var(--border)] rounded animate-pulse" />
            <div className="h-4 w-48 bg-[var(--border)] rounded animate-pulse mt-2" />
          </div>
          <div className="h-10 w-36 bg-[var(--border)] rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
              <div className="h-5 w-40 bg-[var(--border)] rounded animate-pulse" />
              <div className="h-4 w-full bg-[var(--border)] rounded animate-pulse mt-3" />
              <div className="h-4 w-24 bg-[var(--border)] rounded animate-pulse mt-2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Templates de Mensagem</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={() => { setError(null); loadTemplates() }}
            className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  // Empty state (sem templates e sem filtros)
  if (templates.length === 0 && activeCategory === 'all' && !search) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Templates de Mensagem</h1>
          <p className="text-[var(--muted)] mt-1">Crie e gerencie templates reutilizaveis</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#25D366]/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-[#25D366]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            Nenhum template criado
          </h2>
          <p className="text-[var(--muted)] mb-6 max-w-md mx-auto">
            Crie templates reutilizaveis para agilizar o envio de mensagens. Use variaveis como {'{{nome}}'} e {'{{grupo}}'} para personalizar.
          </p>
          <Link
            href="/messages/templates/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Criar Primeiro Template
          </Link>
        </div>
      </div>
    )
  }

  // List state
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Templates de Mensagem</h1>
          <p className="text-[var(--muted)] mt-1">
            {templates.length} template{templates.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/messages/templates/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white font-medium rounded-lg transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo Template
        </Link>
      </div>

      {/* Filtros: tabs de categoria + busca */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {(Object.keys(categoryConfig) as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-[#25D366] text-white'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]/50'
              }`}
            >
              {categoryConfig[cat].label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar template..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366] transition-colors"
          />
        </div>
      </div>

      {/* Empty state filtrado */}
      {templates.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 text-center shadow-sm">
          <p className="text-[var(--muted)]">Nenhum template encontrado com esses filtros.</p>
        </div>
      ) : (
        /* Grid de cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const catConfig = categoryConfig[template.category] || categoryConfig.general
            const typeConfig = messageTypeIcons[template.message_type] || messageTypeIcons.text

            return (
              <div
                key={template.id}
                className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Header: nome + categoria */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-[var(--foreground)] truncate pr-2">
                    {template.name}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${catConfig.bg} ${catConfig.text} flex-shrink-0`}>
                    {catConfig.label}
                  </span>
                </div>

                {/* Preview do conteudo */}
                <p className="text-sm text-[var(--muted)] mb-3 line-clamp-2 min-h-[2.5rem]">
                  {template.content
                    ? template.content.length > 100
                      ? template.content.slice(0, 100) + '...'
                      : template.content
                    : template.caption || 'Sem conteudo de texto'}
                </p>

                {/* Tipo de mensagem */}
                <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] mb-2">
                  {typeConfig.icon}
                  <span>{typeConfig.label}</span>
                </div>

                {/* Variaveis */}
                {template.variables && template.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.variables.map((v) => (
                      <span
                        key={v}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono bg-[#25D366]/10 text-[#128C7E]"
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                )}

                {/* Usage count */}
                <p className="text-xs text-[var(--muted)] mb-4">
                  Usado {template.usage_count} vez{template.usage_count !== 1 ? 'es' : ''}
                </p>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Acoes */}
                <div className="flex items-center gap-2 pt-3 border-t border-[var(--border)]">
                  <Link
                    href={`/messages/templates/${template.id}/edit`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                    Editar
                  </Link>
                  <button
                    onClick={() => router.push(`/messages/new?template=${template.id}`)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-[#25D366] hover:text-[#128C7E] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                    </svg>
                    Usar
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => handleDelete(template.id, template.name)}
                    disabled={deleting === template.id}
                    className="inline-flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                  >
                    {deleting === template.id ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    )}
                    Excluir
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
