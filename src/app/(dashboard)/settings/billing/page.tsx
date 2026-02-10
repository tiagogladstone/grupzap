'use client'

import { useEffect, useState } from 'react'
import { PLAN_MAP } from '@/lib/stripe'

// =============================================================================
// Types
// =============================================================================

interface UsageData {
  plan: 'free' | 'starter' | 'pro' | 'enterprise'
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | 'incomplete'
  currentPeriodEnd: string | null
  instances: { used: number; max: number }
  groups: { used: number; max: number }
  messages: { used: number; max: number }
}

// =============================================================================
// Billing Page
// =============================================================================

export default function BillingPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    // Dados mock por enquanto (a API /api/billing/usage pode ser criada depois)
    setTimeout(() => {
      setUsage({
        plan: 'free',
        status: 'active',
        currentPeriodEnd: null,
        instances: { used: 1, max: 1 },
        groups: { used: 5, max: 10 },
        messages: { used: 120, max: 100 },
      })
      setLoading(false)
    }, 500)
  }, [])

  const handleCheckout = async (priceId: string) => {
    setCheckoutLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao criar checkout')
      }

      // Redirecionar para Stripe
      if (data.data?.url) {
        window.location.href = data.data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setCheckoutLoading(false)
    }
  }

  const handlePortal = async () => {
    setPortalLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao abrir portal')
      }

      // Redirecionar para Stripe Portal
      if (data.data?.url) {
        window.location.href = data.data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setPortalLoading(false)
    }
  }

  const getUsagePercentage = (used: number, max: number) => {
    if (max === -1) return 0
    return Math.round((used / max) * 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage < 70) return '#25D366'
    if (percentage < 90) return '#FFA500'
    return '#DC2626'
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      past_due: 'bg-yellow-100 text-yellow-800',
      canceled: 'bg-red-100 text-red-800',
      trialing: 'bg-blue-100 text-blue-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateString))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#25D366]"></div>
      </div>
    )
  }

  if (!usage) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Erro ao carregar dados de cobrança</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Plano e Cobrança</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {usage.plan === 'free' && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-6">
          <strong>Plano Free:</strong> Faça upgrade para desbloquear mais recursos e aumentar seus limites.
        </div>
      )}

      {/* Plano Atual */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Plano Atual</h2>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-2xl font-bold capitalize">{usage.plan}</p>
            <p className="text-gray-500 text-sm">
              {usage.currentPeriodEnd
                ? `Renova em ${formatDate(usage.currentPeriodEnd)}`
                : 'Sem assinatura ativa'}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
              usage.status
            )}`}
          >
            {usage.status}
          </span>
        </div>

        {usage.plan !== 'free' && (
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium disabled:opacity-50"
          >
            {portalLoading ? 'Carregando...' : 'Gerenciar Assinatura'}
          </button>
        )}
      </div>

      {/* Uso Atual */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Uso Atual</h2>

        <div className="space-y-4">
          {/* Instâncias */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Instâncias</span>
              <span className="text-sm text-gray-600">
                {usage.instances.used} / {usage.instances.max === -1 ? 'Ilimitado' : usage.instances.max}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(getUsagePercentage(usage.instances.used, usage.instances.max), 100)}%`,
                  backgroundColor: getUsageColor(getUsagePercentage(usage.instances.used, usage.instances.max)),
                }}
              />
            </div>
          </div>

          {/* Grupos */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Grupos</span>
              <span className="text-sm text-gray-600">
                {usage.groups.used} / {usage.groups.max === -1 ? 'Ilimitado' : usage.groups.max}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(getUsagePercentage(usage.groups.used, usage.groups.max), 100)}%`,
                  backgroundColor: getUsageColor(getUsagePercentage(usage.groups.used, usage.groups.max)),
                }}
              />
            </div>
          </div>

          {/* Mensagens */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Mensagens (mês atual)</span>
              <span className="text-sm text-gray-600">
                {usage.messages.used} / {usage.messages.max === -1 ? 'Ilimitado' : usage.messages.max}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(getUsagePercentage(usage.messages.used, usage.messages.max), 100)}%`,
                  backgroundColor: getUsageColor(getUsagePercentage(usage.messages.used, usage.messages.max)),
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Planos Disponíveis */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Planos Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(PLAN_MAP).map(([key, plan]) => {
            const planKey = key as 'starter' | 'pro' | 'enterprise'
            const isCurrentPlan = usage.plan === planKey

            return (
              <div
                key={planKey}
                className={`bg-white border rounded-lg p-6 ${
                  planKey === 'pro'
                    ? 'border-[#25D366] ring-2 ring-[#25D366]'
                    : 'border-gray-200'
                }`}
              >
                {planKey === 'pro' && (
                  <span className="inline-block bg-[#25D366] text-white text-xs font-bold px-2 py-1 rounded mb-2">
                    MAIS POPULAR
                  </span>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-3xl font-bold mb-4">
                  R$ {(plan.price.monthly / 100).toFixed(2)}
                  <span className="text-sm font-normal text-gray-500">/mês</span>
                </p>
                <ul className="space-y-2 mb-6 text-sm">
                  <li>
                    {plan.limits.maxInstances} {plan.limits.maxInstances === 1 ? 'instância' : 'instâncias'}
                  </li>
                  <li>
                    {plan.limits.maxGroups === -1 ? 'Grupos ilimitados' : `${plan.limits.maxGroups} grupos`}
                  </li>
                  <li>
                    {plan.limits.maxMessagesPerMonth === -1
                      ? 'Mensagens ilimitadas'
                      : `${plan.limits.maxMessagesPerMonth} mensagens/mês`}
                  </li>
                </ul>
                <button
                  onClick={() => handleCheckout(plan.priceId)}
                  disabled={isCurrentPlan || checkoutLoading}
                  className={`w-full py-2 px-4 rounded-lg font-medium ${
                    isCurrentPlan
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#25D366] hover:bg-[#128C7E] text-white'
                  }`}
                >
                  {isCurrentPlan ? 'Plano Atual' : checkoutLoading ? 'Carregando...' : 'Fazer Upgrade'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
