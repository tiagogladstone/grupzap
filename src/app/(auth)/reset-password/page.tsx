'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { updatePassword } = useAuth()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validações
    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    try {
      const { error } = await updatePassword(password)
      if (error) {
        setError(error.message)
        return
      }
      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mb-4 text-4xl">✅</div>
        <h2 className="text-xl font-semibold mb-2">Senha redefinida com sucesso!</h2>
        <p className="text-gray-600 mb-4">
          Você será redirecionado para o login em instantes...
        </p>
        <Link href="/login" className="text-blue-600 hover:underline font-medium">
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-2">Redefinir senha</h2>
      <p className="text-gray-600 text-center mb-6">
        Digite sua nova senha abaixo
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* New Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Nova senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="••••••••"
          />
          <p className="text-xs text-gray-500 mt-1">Mínimo de 8 caracteres</p>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar senha
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#25D366] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#1fb855] focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Redefinindo...
            </span>
          ) : (
            'Redefinir senha'
          )}
        </button>

        {/* Back to Login */}
        <p className="text-center text-sm text-gray-600">
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Voltar para o login
          </Link>
        </p>
      </form>
    </div>
  )
}
