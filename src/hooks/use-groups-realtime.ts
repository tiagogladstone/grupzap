'use client'

import { useRealtime } from './use-realtime'
import type { Row } from '@/types/supabase'

interface UseGroupsRealtimeOptions {
  organizationId: string | undefined
  onGroupUpdated?: (group: Row<'whatsapp_groups'>) => void
  enabled?: boolean
}

/**
 * Hook para escutar mudanças em tempo real nos grupos WhatsApp.
 * Útil para atualizar contadores (participant_count, last_message_at) na UI.
 *
 * @example
 * ```tsx
 * useGroupsRealtime({
 *   organizationId: org.id,
 *   onGroupUpdated: (group) => {
 *     // Atualiza o estado local ou invalida cache
 *     refetch()
 *   },
 * })
 * ```
 */
export function useGroupsRealtime(options: UseGroupsRealtimeOptions) {
  useRealtime<Row<'whatsapp_groups'>>({
    table: 'whatsapp_groups',
    filter: options.organizationId
      ? `organization_id=eq.${options.organizationId}`
      : undefined,
    event: 'UPDATE',
    onUpdate: (group) => {
      options.onGroupUpdated?.(group)
    },
    enabled: options.enabled !== false && !!options.organizationId,
  })
}
