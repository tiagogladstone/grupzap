'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { useAuth } from '@/hooks/use-auth'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await resetPassword(email)
      if (error) {
        setError(error.message)
        return
      }
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mb-4 text-4xl">📧</div>
        <h2 className="text-xl font-semibold mb-2">Email enviado!</h2>
        <p className="text-gray-600 mb-4">
          Se existe uma conta com o email <strong>{email}</strong>, você receberá instruções para redefinir sua senha.
        </p>
        <Link href="/login" className="text-blue-600 hover:underline font-medium">
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-2">Esqueceu sua senha?</h2>
      <p className="text-gray-600 text-center mb-6">
        Digite seu email e enviaremos instruções para redefinir sua senha.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="seu@email.com"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Enviando...
            </span>
          ) : (
            'Enviar instruções'
          )}
        </button>

        {/* Back to Login */}
        <p className="text-center text-sm text-gray-600">
          Lembrou sua senha?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Voltar para o login
          </Link>
        </p>
      </form>
    </div>
  )
}
