'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Row } from '@/types/supabase'

type Instance = Row<'whatsapp_instances'>

const statusConfig: Record<Instance['status'], { label: string; bg: string; text: string }> = {
  connected: { label: 'Conectado', bg: 'bg-green-100', text: 'text-green-700' },
  disconnected: { label: 'Desconectado', bg: 'bg-gray-100', text: 'text-gray-700' },
  connecting: { label: 'Conectando', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  qr_code: { label: 'QR Code', bg: 'bg-blue-100', text: 'text-blue-700' },
  banned: { label: 'Banido', bg: 'bg-red-100', text: 'text-red-700' },
  error: { label: 'Erro', bg: 'bg-red-100', text: 'text-red-700' },
}

const healthConfig: Record<Instance['health_status'], { label: string; bg: string; text: string }> = {
  healthy: { label: 'Saudável', bg: 'bg-green-50', text: 'text-green-600' },
  degraded: { label: 'Degradado', bg: 'bg-yellow-50', text: 'text-yellow-600' },
  unhealthy: { label: 'Instável', bg: 'bg-red-50', text: 'text-red-600' },
  unknown: { label: 'Desconhecido', bg: 'bg-gray-50', text: 'text-gray-500' },
}

export default function InstancesPage() {
  const [instances, setInstances] = useState<Instance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/instances')
        const json = await res.json()
        if (json.data) {
          setInstances(json.data)
        } else if (json.error) {
          setError(json.error.message)
        }
      } catch {
        setError('Erro ao carregar instâncias')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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
              <div className="h-4 w-32 bg-[var(--border)] rounded animate-pulse mt-3" />
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
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Instâncias WhatsApp</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  if (instances.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Instâncias WhatsApp</h1>
          <p className="text-[var(--muted)] mt-1">Gerencie suas conexões WhatsApp</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center shadow-sm">
          {/* Smartphone/WhatsApp icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#25D366]/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            Nenhuma instância conectada
          </h2>
          <p className="text-[var(--muted)] mb-6 max-w-md mx-auto">
            Conecte sua primeira instância WhatsApp para começar a gerenciar seus grupos e enviar mensagens.
          </p>
          <Link
            href="/instances/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Conectar WhatsApp
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
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Instâncias WhatsApp</h1>
          <p className="text-[var(--muted)] mt-1">
            {instances.length} instância{instances.length !== 1 ? 's' : ''} configurada{instances.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/instances/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white font-medium rounded-lg transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nova Instância
        </Link>
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instances.map((instance) => {
          const status = statusConfig[instance.status]
          const health = healthConfig[instance.health_status]

          return (
            <div
              key={instance.id}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Nome e status */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-[var(--foreground)] truncate pr-2">
                  {instance.instance_name}
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text} flex-shrink-0`}>
                  {status.label}
                </span>
              </div>

              {/* Telefone */}
              <p className="text-sm text-[var(--muted)] mb-1">
                {instance.phone_number || 'Telefone não disponível'}
              </p>

              {/* Health badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${health.bg} ${health.text}`}>
                  {health.label}
                </span>
              </div>

              {/* Botão gerenciar */}
              <Link
                href={`/instances/${instance.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#25D366] hover:text-[#128C7E] transition-colors"
              >
                Gerenciar
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
