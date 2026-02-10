'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { useOrganization } from '@/hooks/use-organization'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function getUserFirstName(user: { user_metadata?: { name?: string; full_name?: string }; email?: string } | null): string {
  if (!user) return ''
  const name = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || ''
  return name.split(' ')[0]
}

// ---------------------------------------------------------------------------
// Inline Icons (SVG)
// ---------------------------------------------------------------------------

function PlugIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  )
}

function UsersIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
  )
}

function MessageIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
    </svg>
  )
}

function ClockIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function QrCodeIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.375 6.375h.008v.008h-.008v-.008Zm0 9.75h.008v.008h-.008v-.008Zm9.75-9.75h.008v.008h-.008v-.008ZM13.5 14.625v2.625m3.375-2.625v2.625m0 0h3.375m-3.375 0h-3.375m0 0V21m3.375-6.375V21" />
    </svg>
  )
}

function DownloadIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
    </svg>
  )
}

function CalendarIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  )
}

function ActivityIcon({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
    </svg>
  )
}

function HeartPulseIcon({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// StatCard (inline — pode ser substituído pelo componente compartilhado)
// ---------------------------------------------------------------------------

function StatCard({ title, value, description, icon }: {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Quick Action Card
// ---------------------------------------------------------------------------

function QuickActionCard({ href, icon, label }: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-white p-6 text-gray-600 transition-all hover:border-solid hover:border-[#25D366] hover:bg-green-50/50 hover:text-[#25D366] cursor-pointer"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 transition-colors group-hover:bg-green-100">
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Section Wrapper
// ---------------------------------------------------------------------------

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div>
      {title && <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>}
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { organization, loading: orgLoading } = useOrganization()

  const greeting = useMemo(() => getGreeting(), [])
  const firstName = useMemo(() => getUserFirstName(user), [user])

  const loading = authLoading || orgLoading

  // Limites da organização (do plano, com fallback para free)
  const maxInstances = organization ? (organization as unknown as { max_instances?: number }).max_instances ?? 1 : 1
  const maxGroups = organization ? (organization as unknown as { max_groups?: number }).max_groups ?? 10 : 10

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#25D366]" />
          <p className="text-sm text-gray-500">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* ----------------------------------------------------------------- */}
      {/* Saudacao */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-1 text-gray-500">
          Aqui esta o resumo da sua operacao
        </p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Stat Cards */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Instancias Ativas"
          value="0"
          description={`de ${maxInstances} permitida${maxInstances > 1 ? 's' : ''}`}
          icon={<PlugIcon />}
        />
        <StatCard
          title="Grupos Monitorados"
          value="0"
          description={`de ${maxGroups} permitidos`}
          icon={<UsersIcon />}
        />
        <StatCard
          title="Mensagens Hoje"
          value="0"
          description="enviadas hoje"
          icon={<MessageIcon />}
        />
        <StatCard
          title="Proxima Mensagem"
          value="Nenhuma"
          description="agendada"
          icon={<ClockIcon />}
        />
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Acoes Rapidas */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Acoes Rapidas">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <QuickActionCard
            href="/instances"
            icon={<QrCodeIcon className="w-6 h-6" />}
            label="Conectar WhatsApp"
          />
          <QuickActionCard
            href="/groups"
            icon={<DownloadIcon className="w-6 h-6" />}
            label="Importar Grupos"
          />
          <QuickActionCard
            href="/messages/new"
            icon={<CalendarIcon className="w-6 h-6" />}
            label="Agendar Mensagem"
          />
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Atividade Recente */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Atividade Recente">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-4 text-gray-300">
              <ActivityIcon className="mx-auto h-12 w-12" />
            </div>
            <p className="text-sm text-gray-500">
              Nenhuma atividade ainda. Conecte sua primeira instancia WhatsApp para comecar.
            </p>
            <Link
              href="/instances"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#128C7E]"
            >
              <QrCodeIcon className="h-4 w-4" />
              Conectar WhatsApp
            </Link>
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Saude dos Grupos */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Saude dos Grupos">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-4 text-gray-300">
              <HeartPulseIcon className="mx-auto h-12 w-12" />
            </div>
            <p className="text-sm text-gray-500">
              Seus grupos aparecerao aqui apos a importacao.
            </p>
          </div>
        </div>
      </Section>
    </div>
  )
}
