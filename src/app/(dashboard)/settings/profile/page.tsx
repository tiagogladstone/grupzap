'use client'

import { useState } from 'react'

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Email mock (readonly, vem do Supabase Auth na Fase 2)
  const email = 'seu@email.com'

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
      setError('Erro ao salvar perfil. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Meu Perfil</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nome completo */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Seu nome completo"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent outline-none transition-shadow"
            />
          </div>

          {/* Email (readonly) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-400">
              O email não pode ser alterado por aqui.
            </p>
          </div>

          {/* Telefone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Telefone <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+55 11 99999-9999"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent outline-none transition-shadow"
            />
          </div>

          {/* Mensagens de feedback */}
          {success && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">
              Perfil atualizado com sucesso.
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
    </div>
  )
}
