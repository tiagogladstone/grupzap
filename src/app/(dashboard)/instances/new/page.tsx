'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewInstancePage() {
  const router = useRouter()
  const [instanceName, setInstanceName] = useState('')
  const [instanceId, setInstanceId] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName, instanceId, apiToken }),
      })

      const json = await res.json()

      if (!res.ok) {
        if (json.error?.code === 'LIMIT_EXCEEDED') {
          setError('Limite de instâncias do seu plano atingido. Faça upgrade para adicionar mais instâncias.')
        } else {
          setError(json.error?.message || 'Erro ao criar instância')
        }
        return
      }

      if (json.data?.id) {
        router.push(`/instances/${json.data.id}`)
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Nova Instância WhatsApp</h1>
        <p className="text-[var(--muted)] mt-1">
          Configure uma nova conexão WhatsApp com sua instância UAZAPI.
        </p>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-5">
        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Nome da instância */}
        <div>
          <label htmlFor="instanceName" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
            Nome da instância
          </label>
          <input
            id="instanceName"
            type="text"
            required
            value={instanceName}
            onChange={(e) => setInstanceName(e.target.value)}
            placeholder="Ex: WhatsApp Principal"
            className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366] transition-colors"
          />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Um nome amigável para identificar esta instância.
          </p>
        </div>

        {/* ID da instância */}
        <div>
          <label htmlFor="instanceId" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
            ID da instância UAZAPI
          </label>
          <input
            id="instanceId"
            type="text"
            required
            value={instanceId}
            onChange={(e) => setInstanceId(e.target.value)}
            placeholder="ID fornecido pela UAZAPI"
            className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366] transition-colors font-mono text-sm"
          />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            O identificador único da instância no painel UAZAPI.
          </p>
        </div>

        {/* Token da API */}
        <div>
          <label htmlFor="apiToken" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
            Token da API
          </label>
          <input
            id="apiToken"
            type="password"
            required
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="Token da instância"
            className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366] transition-colors font-mono text-sm"
          />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            O token de autenticação da instância UAZAPI. Será armazenado de forma segura.
          </p>
        </div>

        {/* Botões */}
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
                Criando...
              </>
            ) : (
              'Criar Instância'
            )}
          </button>
          <Link
            href="/instances"
            className="px-5 py-2.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800 mb-1">Como obter as credenciais?</h3>
            <p className="text-sm text-blue-700">
              Acesse o painel da UAZAPI para criar ou visualizar suas instâncias. O ID e o token estão disponíveis na aba de configurações de cada instância.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
