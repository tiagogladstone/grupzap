'use client'

import { useState } from 'react'

type MemberRole = 'owner' | 'admin' | 'member'

interface TeamMember {
  id: string
  name: string
  email: string
  role: MemberRole
}

const roleConfig: Record<MemberRole, { label: string; color: string }> = {
  owner: { label: 'Owner', color: 'bg-purple-100 text-purple-700' },
  admin: { label: 'Admin', color: 'bg-blue-100 text-blue-700' },
  member: { label: 'Membro', color: 'bg-gray-100 text-gray-700' },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function TeamPage() {
  // Dados mock — integração real na Fase 2
  const [members] = useState<TeamMember[]>([
    { id: '1', name: 'Você', email: 'seu@email.com', role: 'owner' },
  ])

  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Membros da Equipe</h2>

        {/* Botão convidar (disabled) */}
        <div className="relative">
          <button
            type="button"
            disabled
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="bg-[#25D366] text-white px-4 py-2 rounded-lg font-medium opacity-50 cursor-not-allowed flex items-center gap-2"
          >
            {/* Ícone + */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            Convidar membro
          </button>

          {/* Tooltip */}
          {showTooltip && (
            <div className="absolute right-0 top-full mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10">
              Em breve
              <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 rotate-45" />
            </div>
          )}
        </div>
      </div>

      {/* Tabela de membros */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Membro
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Email
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Cargo
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {members.map(member => {
              const role = roleConfig[member.role]
              return (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  {/* Avatar + Nome */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center text-xs font-medium">
                        {getInitials(member.name)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {member.name}
                      </span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{member.email}</span>
                  </td>

                  {/* Role badge */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${role.color}`}>
                      {role.label}
                    </span>
                  </td>

                  {/* Ações */}
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs text-gray-400">--</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Info */}
      <p className="mt-4 text-xs text-gray-400">
        A gestão completa de membros estará disponível em breve.
      </p>
    </div>
  )
}
