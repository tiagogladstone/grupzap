'use client'

import { useEffect, useState } from 'react'

interface AuditLog {
  id: string
  user_id: string
  user_name: string
  user_email: string
  action: string
  entity_type: string
  entity_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

interface Pagination {
  page: number
  per_page: number
  total: number
  total_pages: number
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  update: 'bg-blue-100 text-blue-800 border-blue-200',
  delete: 'bg-red-100 text-red-800 border-red-200',
  login: 'bg-gray-100 text-gray-800 border-gray-200',
  logout: 'bg-gray-100 text-gray-800 border-gray-200',
}

const ACTION_LABELS: Record<string, string> = {
  create: 'Criar',
  update: 'Atualizar',
  delete: 'Deletar',
  login: 'Login',
  logout: 'Logout',
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  instance: 'Instancia',
  group: 'Grupo',
  message: 'Mensagem',
  template: 'Template',
  user: 'Usuario',
  organization: 'Organizacao',
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    per_page: 50,
    total: 0,
    total_pages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [filters, setFilters] = useState({
    user_id: '',
    action: '',
    entity_type: '',
    from: '',
    to: '',
  })

  useEffect(() => {
    fetchLogs()
  }, [pagination.page])

  async function fetchLogs() {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set('page', pagination.page.toString())
      params.set('per_page', pagination.per_page.toString())

      if (filters.user_id) params.set('user_id', filters.user_id)
      if (filters.action) params.set('action', filters.action)
      if (filters.entity_type) params.set('entity_type', filters.entity_type)
      if (filters.from) params.set('from', filters.from)
      if (filters.to) params.set('to', filters.to)

      const response = await fetch(`/api/audit-logs?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Erro ao buscar logs')
      }

      setLogs(result.data)
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchLogs()
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date)
  }

  function getDescription(log: AuditLog): string {
    const action = ACTION_LABELS[log.action] || log.action
    const entityType = ENTITY_TYPE_LABELS[log.entity_type] || log.entity_type
    const entityName = log.metadata?.name as string | undefined

    if (entityName) {
      return `${action} ${entityType.toLowerCase()}: ${entityName}`
    }
    return `${action} ${entityType.toLowerCase()}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Auditoria</h2>
        <p className="text-sm text-gray-600 mt-1">
          Visualize o historico de acoes realizadas na organizacao
        </p>
      </div>

      <form onSubmit={handleFilterSubmit} className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Acao
            </label>
            <select
              value={filters.action}
              onChange={e => setFilters(prev => ({ ...prev, action: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
            >
              <option value="">Todas</option>
              <option value="create">Criar</option>
              <option value="update">Atualizar</option>
              <option value="delete">Deletar</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={filters.entity_type}
              onChange={e => setFilters(prev => ({ ...prev, entity_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="instance">Instancia</option>
              <option value="group">Grupo</option>
              <option value="message">Mensagem</option>
              <option value="template">Template</option>
              <option value="user">Usuario</option>
              <option value="organization">Organizacao</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              De
            </label>
            <input
              type="date"
              value={filters.from}
              onChange={e => setFilters(prev => ({ ...prev, from: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ate
            </label>
            <input
              type="date"
              value={filters.to}
              onChange={e => setFilters(prev => ({ ...prev, to: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-[#25D366] text-white rounded-lg text-sm font-medium hover:bg-[#128C7E] transition-colors"
            >
              Filtrar
            </button>
          </div>
        </div>
      </form>

      {loading && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-32 h-4 bg-gray-200 rounded" />
                <div className="flex-1 h-4 bg-gray-200 rounded" />
                <div className="w-24 h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum registro encontrado</h3>
          <p className="text-sm text-gray-500">
            Nao ha logs de auditoria para os filtros selecionados.
          </p>
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Data/Hora</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Usuario</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Acao</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tipo</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Descricao</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                            {log.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{log.user_name}</div>
                            <div className="text-xs text-gray-500">{log.user_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${
                            ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}
                        >
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {ENTITY_TYPE_LABELS[log.entity_type] || log.entity_type}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {getDescription(log)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between px-4">
              <div className="text-sm text-gray-600">
                Pagina {pagination.page} de {pagination.total_pages} ({pagination.total} registros)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.total_pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.total_pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Proxima
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
