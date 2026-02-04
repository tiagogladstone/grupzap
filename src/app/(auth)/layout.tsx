import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Grup<span className="text-green-500">zap</span>
          </h1>
          <p className="text-gray-500 mt-2">Automação de WhatsApp para negócios</p>
        </div>

        {/* Card */}
        <div className="bg-white shadow-lg rounded-2xl p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-8">
          © {new Date().getFullYear()} Grupzap. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
