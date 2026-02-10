'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Perfil', href: '/settings/profile' },
  { label: 'Organização', href: '/settings/organization' },
  { label: 'Equipe', href: '/settings/team' },
  { label: 'Auditoria', href: '/settings/audit' },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div>
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map(tab => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                pathname === tab.href || (tab.href === '/settings/profile' && pathname === '/settings')
                  ? 'border-[#25D366] text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  )
}
