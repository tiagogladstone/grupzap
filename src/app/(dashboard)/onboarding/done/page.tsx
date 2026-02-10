'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function OnboardingDonePage() {
  const [stats, setStats] = useState<{ instances: number; groups: number }>({
    instances: 0,
    groups: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)

    try {
      const [instancesRes, groupsRes] = await Promise.all([
        fetch('/api/instances'),
        fetch('/api/groups'),
      ])

      const instancesJson = await instancesRes.json()
      const groupsJson = await groupsRes.json()

      const instances = instancesJson.data || []
      const groups = groupsJson.data || []
      const monitoredGroups = groups.filter((g: { is_monitored: boolean }) => g.is_monitored)

      setStats({
        instances: instances.length,
        groups: monitoredGroups.length,
      })
    } catch {
      // Se falhar, mantém zeros
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header com ícone de sucesso */}
      <div className="text-center space-y-4">
        <div className="w-24 h-24 mx-auto bg-[#25D366]/10 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-[#25D366]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-[var(--foreground)]">Tudo pronto!</h1>
          <p className="text-[var(--muted)] mt-2 text-lg">
            Seu Grupzap está configurado e pronto para usar
          </p>
        </div>
      </div>

      {/* Card de resumo */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Resumo da Configuração</h2>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="w-6 h-6 animate-spin text-[var(--muted)]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* Instâncias */}
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-[#25D366]">{stats.instances}</div>
                <p className="text-sm text-[var(--muted)] mt-1">
                  {stats.instances === 1 ? 'Instância' : 'Instâncias'}
                </p>
              </div>

              {/* Grupos monitorados */}
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-[#25D366]">{stats.groups}</div>
                <p className="text-sm text-[var(--muted)] mt-1">
                  {stats.groups === 1 ? 'Grupo Monitorado' : 'Grupos Monitorados'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botões de ação */}
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Botão principal */}
        <Link
          href="/dashboard"
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold rounded-lg transition-colors text-lg"
        >
          Ir para o Dashboard
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>

        {/* Links secundários */}
        <div className="flex items-center justify-center gap-6 pt-2">
          <Link
            href="/messages/new"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] hover:text-[#25D366] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Agendar primeira mensagem
          </Link>

          <Link
            href="/messages/templates/new"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] hover:text-[#25D366] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Criar template
          </Link>
        </div>
      </div>

      {/* Dica adicional */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-800 mb-1">Próximos passos</h3>
              <p className="text-sm text-blue-700">
                Explore os templates prontos, configure mensagens agendadas e monitore o desempenho dos seus grupos no Analytics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
