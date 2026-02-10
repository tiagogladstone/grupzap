'use client'

import { useState } from 'react'

const planLabels: Record<string, { label: string; color: string }> = {
  free: { label: 'Free', color: 'bg-gray-100 text-gray-700' },
  starter: { label: 'Starter', color: 'bg-blue-100 text-blue-700' },
  pro: { label: 'Pro', color: 'bg-green-100 text-green-700' },
  enterprise: { label: 'Agência', color: 'bg-purple-100 text-purple-700' },
}

export default function OrganizationPage() {
  // Dados mock — integração real na Fase 2
  const currentPlan = 'free'
  const planInfo = planLabels[currentPlan]

  const [formData, setFormData] = useState({
    name: 'Minha Organização',
    slug: 'minha-organizacao',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSlugChange = (value: string) => {
    // Slug: apenas lowercase, números e hifens
    const sanitized = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-/, '')
    setFormData(prev => ({ ...prev, slug: sanitized }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError(null)

    try {
      // Simulação — integração real na Fase 2
      await new Promise(resolve => setTimeout(resolve, 800))
      setSuccess(true)
    } catch {
      setError('Erro ao salvar organização. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Organização</h2>

      {/* Card: Dados da organização */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nome da organização */}
          <div>
            <label htmlFor="org-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome da organização
            </label>
            <input
              id="org-name"
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome da sua organização"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent outline-none transition-shadow"
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="org-slug" className="block text-sm font-medium text-gray-700 mb-1">
              Slug
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-500 text-sm">
                grupzap.com/
              </span>
              <input
                id="org-slug"
                type="text"
                value={formData.slug}
                onChange={e => handleSlugChange(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent outline-none transition-shadow"
              />
            </div>
          </div>

          {/* Plano atual (readonly) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plano atual
            </label>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${planInfo.color}`}>
              {planInfo.label}
            </span>
          </div>

          {/* Mensagens de feedback */}
          {success && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">
              Organização atualizada com sucesso.
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Botão salvar */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`bg-[#25D366] hover:bg-[#128C7E] text-white px-6 py-2 rounded-lg font-medium transition-colors ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>

      {/* Card: Plano e Cobrança */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Plano e Cobrança</h3>

        <div className="flex items-center gap-3 mb-5">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${planInfo.color}`}>
            {planInfo.label}
          </span>
          <span className="text-sm text-gray-500">Plano atual</span>
        </div>

        {/* Limites */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Instâncias WhatsApp</span>
            <span className="text-sm font-medium text-gray-900">1 de 1</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-[#25D366] h-2 rounded-full" style={{ width: '100%' }} />
          </div>

          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-600">Grupos monitorados</span>
            <span className="text-sm font-medium text-gray-900">0 de 10</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-[#25D366] h-2 rounded-full" style={{ width: '0%' }} />
          </div>
        </div>

        {/* Botão upgrade */}
        <button
          type="button"
          className="bg-[#25D366] hover:bg-[#128C7E] text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Fazer upgrade
        </button>
      </div>
    </div>
  )
}
