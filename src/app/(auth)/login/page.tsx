import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Login - Grupzap',
  description: 'Entre na sua conta Grupzap',
}

export default function LoginPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6">Entrar na sua conta</h2>
      <LoginForm />
    </div>
  )
}
