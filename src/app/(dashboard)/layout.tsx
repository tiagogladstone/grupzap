'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar, Header } from '@/components/dashboard'

const titleMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/instances': 'Instâncias',
  '/groups': 'Grupos',
  '/messages': 'Mensagens',
  '/analytics': 'Analytics',
  '/settings': 'Configurações',
  '/settings/profile': 'Perfil',
}

function getPageTitle(pathname: string): string {
  // Exact match first
  if (titleMap[pathname]) {
    return titleMap[pathname]
  }

  // Check prefix match for nested routes (e.g. /settings/team → "Configurações")
  const segments = pathname.split('/')
  while (segments.length > 1) {
    segments.pop()
    const parent = segments.join('/') || '/'
    if (titleMap[parent]) {
      return titleMap[parent]
    }
  }

  return 'Dashboard'
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)

  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={pageTitle} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
