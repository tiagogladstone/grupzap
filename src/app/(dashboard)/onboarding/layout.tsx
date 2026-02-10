'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Determinar step atual baseado no pathname
  const currentStep = pathname.includes('/connect') ? 1
    : pathname.includes('/groups') ? 2
    : pathname.includes('/done') ? 3
    : 1

  const steps = [
    { number: 1, label: 'Conectar WhatsApp' },
    { number: 2, label: 'Sincronizar Grupos' },
    { number: 3, label: 'Concluído' },
  ]

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header com logo e progress bar */}
      <header className="w-full border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-[#25D366] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-[var(--foreground)]">
              Grup<span className="text-[#25D366]">zap</span>
            </span>
          </Link>

          {/* Progress bar */}
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                {/* Step circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      currentStep === step.number
                        ? 'bg-[#25D366] text-white'
                        : currentStep > step.number
                        ? 'bg-[#25D366]/20 text-[#25D366]'
                        : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center ${
                      currentStep >= step.number ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 -mt-6 transition-colors ${
                      currentStep > step.number ? 'bg-[#25D366]/30' : 'bg-[var(--border)]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12">
        {children}
      </main>
    </div>
  )
}
