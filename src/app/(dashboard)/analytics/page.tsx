'use client'

import { useEffect, useState } from 'react'
import { StatCard } from '@/components/dashboard/stat-card'
import { BarChart, DonutChart, MultiLineChart } from '@/components/charts'

type Period = '7d' | '30d' | '90d'

interface AnalyticsData {
  summary: {
    total_messages_sent: number
    total_messages_received: number
    active_groups: number
    active_members: number
    avg_health_score: number
  }
  messages_per_day: Array<{
    date: string
    sent: number
    received: number
  }>
  top_groups: Array<{
    id: string
    name: string
    message_count: number
    health_score: number
    member_count: number
  }>
  activity_by_hour: Array<{
    hour: number
    count: number
  }>
  message_types: Array<{
    type: string
    count: number
  }>
}

const MESSAGE_TYPE_COLORS: Record<string, string> = {
  text: '#25D366',
  image: '#128C7E',
  video: '#075E54',
  audio: '#34B7F1',
  document: '#ECE5DD',
  sticker: '#DCF8C6',
}

const MESSAGE_TYPE_LABELS: Record<string, string> = {
  text: 'Texto',
  image: 'Imagem',
  video: 'Video',
  audio: 'Audio',
  document: 'Documento',
  sticker: 'Sticker',
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('7d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  async function fetchAnalytics() {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/analytics?period=${period}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Erro ao buscar dados')
      }

      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const periodLabels: Record<Period, string> = {
    '7d': 'Ultimos 7 dias',
    '30d': 'Ultimos 30 dias',
    '90d': 'Ultimos 90 dias',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">
            Visualize metricas e desempenho dos seus grupos
          </p>
        </div>

        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-[#25D366] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 h-80 animate-pulse">
            <div className="h-full bg-gray-100 rounded" />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <StatCard
              title="Mensagens Enviadas"
              value={data.summary.total_messages_sent.toLocaleString('pt-BR')}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
            />
            <StatCard
              title="Mensagens Recebidas"
              value={data.summary.total_messages_received.toLocaleString('pt-BR')}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />
            <StatCard
              title="Grupos Ativos"
              value={data.summary.active_groups.toLocaleString('pt-BR')}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />
            <StatCard
              title="Membros Ativos"
              value={data.summary.active_members.toLocaleString('pt-BR')}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
            />
            <StatCard
              title="Health Score Medio"
              value={`${data.summary.avg_health_score}%`}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          {data.messages_per_day.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Mensagens por Dia</h2>
              <div className="space-y-4">
                <MultiLineChart
                  data={data.messages_per_day.map(d => ({
                    label: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                    values: [d.sent, d.received],
                  }))}
                  lines={[
                    { color: '#25D366', label: 'Enviadas' },
                    { color: '#128C7E', label: 'Recebidas' },
                  ]}
                  height={300}
                />
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#25D366]" />
                    <span className="text-gray-600">Enviadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#128C7E]" />
                    <span className="text-gray-600">Recebidas</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
              <p className="text-gray-500">Sem dados de mensagens no periodo selecionado</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Atividade por Hora</h2>
              {data.activity_by_hour.some(h => h.count > 0) ? (
                <BarChart
                  data={data.activity_by_hour.map(h => ({
                    label: `${h.hour}h`,
                    value: h.count,
                  }))}
                  height={300}
                  defaultColor="#25D366"
                />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-400 text-sm">Sem dados de atividade</p>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tipos de Mensagem</h2>
              {data.message_types.length > 0 ? (
                <DonutChart
                  data={data.message_types.map(mt => ({
                    label: MESSAGE_TYPE_LABELS[mt.type] || mt.type,
                    value: mt.count,
                    color: MESSAGE_TYPE_COLORS[mt.type] || '#6B7280',
                  }))}
                  size={200}
                />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-400 text-sm">Sem dados de tipos de mensagem</p>
                </div>
              )}
            </div>
          </div>

          {data.top_groups.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Grupos</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Nome</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Mensagens</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Health Score</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Membros</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_groups.map((group, i) => (
                      <tr key={group.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center text-sm font-medium text-[#25D366]">
                              {i + 1}
                            </div>
                            <span className="text-sm text-gray-900">{group.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {group.message_count.toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${group.health_score}%`,
                                  backgroundColor:
                                    group.health_score >= 80
                                      ? '#25D366'
                                      : group.health_score >= 50
                                      ? '#F59E0B'
                                      : '#EF4444',
                                }}
                              />
                            </div>
                            <span className="text-sm text-gray-700 min-w-[40px]">
                              {group.health_score}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {group.member_count.toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.top_groups.length === 0 && data.messages_per_day.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum dado disponivel</h3>
              <p className="text-sm text-gray-500">
                Nao ha dados de analytics para o periodo selecionado.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
