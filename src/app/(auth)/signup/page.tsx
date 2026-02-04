import type { Metadata } from 'next'
import { SignupForm } from '@/components/auth/signup-form'

export const metadata: Metadata = {
  title: 'Criar Conta - Grupzap',
  description: 'Crie sua conta no Grupzap',
}

export default function SignupPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6">Criar sua conta</h2>
      <SignupForm />
    </div>
  )
}
