import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Login - Grupzap',
  description: 'Entre na sua conta Grupzap',
}

function LoginFormFallback() {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-200 rounded mb-4"></div>
      <div className="h-10 bg-gray-200 rounded mb-4"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6">Entrar na sua conta</h2>
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
