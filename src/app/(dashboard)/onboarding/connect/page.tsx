'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function OnboardingConnectPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'qrcode' | 'connected'>('form')

  // Form state
  const [instanceName, setInstanceName] = useState('')
  const [instanceId, setInstanceId] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // QR Code state
  const [createdInstanceId, setCreatedInstanceId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval)
    }
  }, [pollingInterval])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Criar instância
      const createRes = await fetch('/api/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName, instanceId, apiToken }),
      })

      const createJson = await createRes.json()

      if (!createRes.ok) {
        setError(createJson.error?.message || 'Erro ao criar instância')
        return
      }

      const newInstanceId = createJson.data?.id
      if (!newInstanceId) {
        setError('ID da instância não retornado')
        return
      }

      setCreatedInstanceId(newInstanceId)

      // 2. Conectar e obter QR Code
      const connectRes = await fetch(`/api/instances/${newInstanceId}/connect`, {
        method: 'POST',
      })

      const connectJson = await connectRes.json()

      if (!connectRes.ok) {
        setError(connectJson.error?.message || 'Erro ao conectar')
        return
      }

      const qr = connectJson.data?.qrCode
      if (!qr) {
        setError('QR Code não gerado')
        return
      }

      setQrCode(qr)
      setStep('qrcode')

      // 3. Iniciar polling de status
      startStatusPolling(newInstanceId)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function startStatusPolling(instanceId: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/instances/${instanceId}/status`)
        const json = await res.json()

        if (res.ok && json.data?.status === 'connected') {
          clearInterval(interval)
          setStep('connected')
        }
      } catch {
        // Silently fail polling
      }
    }, 5000) // Poll a cada 5 segundos

    setPollingInterval(interval)
  }

  function handleSkip() {
    router.push('/onboarding/groups')
  }

  function handleNext() {
    router.push('/onboarding/groups')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Conecte seu WhatsApp</h1>
        <p className="text-[var(--muted)] mt-2">
          Escaneie o QR Code com seu WhatsApp para começar
        </p>
      </div>

      {/* Form step */}
      {step === 'form' && (
        <div className="max-w-xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

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
            </div>

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
            </div>

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
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#25D366] hover:bg-[#128C7E] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Conectando...
                  </>
                ) : (
                  'Conectar WhatsApp'
                )}
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="px-5 py-3 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Pular
              </button>
            </div>
          </form>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
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
      )}

      {/* QR Code step */}
      {step === 'qrcode' && qrCode && (
        <div className="max-w-lg mx-auto">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 shadow-sm text-center space-y-6">
            <div className="w-64 h-64 mx-auto bg-white p-4 rounded-xl border-2 border-[var(--border)]">
              <img
                src={qrCode}
                alt="QR Code do WhatsApp"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-[var(--muted)]">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm font-medium">Aguardando conexão...</span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Abra o WhatsApp no seu celular e escaneie o código acima
              </p>
            </div>

            <div className="pt-4 border-t border-[var(--border)]">
              <button
                onClick={handleSkip}
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Pular por enquanto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connected step */}
      {step === 'connected' && (
        <div className="max-w-lg mx-auto">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 shadow-sm text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-[#25D366]/10 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-[#25D366]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[var(--foreground)]">WhatsApp Conectado!</h2>
              <p className="text-[var(--muted)] mt-2">
                Sua instância foi conectada com sucesso
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full px-5 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-medium rounded-lg transition-colors"
            >
              Próximo: Sincronizar Grupos
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
