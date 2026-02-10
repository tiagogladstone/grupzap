'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface WhatsAppGroup {
  id: string
  name: string
  jid: string
  is_monitored: boolean
}

export default function OnboardingGroupsPage() {
  const router = useRouter()
  const [hasInstance, setHasInstance] = useState<boolean | null>(null)
  const [groups, setGroups] = useState<WhatsAppGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkInstanceAndLoadGroups()
  }, [])

  async function checkInstanceAndLoadGroups() {
    setLoading(true)
    setError(null)

    try {
      // Verificar se tem instância conectada
      const instanceRes = await fetch('/api/instances')
      const instanceJson = await instanceRes.json()

      if (!instanceRes.ok) {
        setError('Erro ao carregar instâncias')
        setHasInstance(false)
        return
      }

      const instances = instanceJson.data || []
      const connectedInstance = instances.find((i: { status: string }) => i.status === 'connected')

      if (!connectedInstance) {
        setHasInstance(false)
        return
      }

      setHasInstance(true)

      // Carregar grupos existentes
      const groupsRes = await fetch('/api/groups')
      const groupsJson = await groupsRes.json()

      if (groupsRes.ok && groupsJson.data) {
        setGroups(groupsJson.data)
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setHasInstance(false)
    } finally {
      setLoading(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    setError(null)

    try {
      const res = await fetch('/api/groups/sync', {
        method: 'POST',
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error?.message || 'Erro ao sincronizar grupos')
        return
      }

      // Recarregar lista de grupos
      await checkInstanceAndLoadGroups()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setSyncing(false)
    }
  }

  async function toggleMonitored(groupId: string, currentValue: boolean) {
    setUpdating(true)

    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_monitored: !currentValue }),
      })

      if (!res.ok) {
        setError('Erro ao atualizar grupo')
        return
      }

      // Atualizar estado local
      setGroups(prev =>
        prev.map(g =>
          g.id === groupId ? { ...g, is_monitored: !currentValue } : g
        )
      )
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setUpdating(false)
    }
  }

  function handleSkip() {
    router.push('/onboarding/done')
  }

  function handleNext() {
    router.push('/onboarding/done')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-[var(--muted)]">
          <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-medium">Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Seus Grupos</h1>
        <p className="text-[var(--muted)] mt-2">
          Selecione quais grupos deseja monitorar
        </p>
      </div>

      {/* Sem instância conectada */}
      {hasInstance === false && (
        <div className="max-w-xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-yellow-800">Nenhuma instância conectada</h2>
              <p className="text-sm text-yellow-700 mt-1">
                Conecte uma instância WhatsApp primeiro para sincronizar seus grupos
              </p>
            </div>

            <div className="flex items-center gap-3 justify-center pt-2">
              <Link
                href="/onboarding/connect"
                className="px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors text-sm"
              >
                Conectar WhatsApp
              </Link>
              <button
                onClick={handleSkip}
                className="px-5 py-2.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Pular
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Com instância conectada */}
      {hasInstance === true && (
        <div className="max-w-3xl mx-auto space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Botão de sincronização */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted)]">
              {groups.length === 0 ? 'Nenhum grupo sincronizado ainda' : `${groups.length} grupo(s) encontrado(s)`}
            </p>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#128C7E] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
            >
              {syncing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sincronizando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Sincronizar Grupos
                </>
              )}
            </button>
          </div>

          {/* Lista de grupos */}
          {groups.length > 0 && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl divide-y divide-[var(--border)] shadow-sm">
              {groups.map(group => (
                <div key={group.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#25D366]/10 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#25D366]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{group.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)] font-mono">{group.jid}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleMonitored(group.id, group.is_monitored)}
                    disabled={updating}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      group.is_monitored ? 'bg-[#25D366]' : 'bg-[var(--muted)]'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        group.is_monitored ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Botões de navegação */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-medium rounded-lg transition-colors"
            >
              Próximo
            </button>
            <button
              onClick={handleSkip}
              className="px-5 py-3 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Pular
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
