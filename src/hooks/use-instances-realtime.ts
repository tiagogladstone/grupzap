'use client'

import { useRealtime } from './use-realtime'
import type { Row } from '@/types/supabase'

interface UseInstancesRealtimeOptions {
  organizationId: string | undefined
  onStatusChange?: (instance: Row<'whatsapp_instances'>) => void
  onInstanceCreated?: (instance: Row<'whatsapp_instances'>) => void
  onInstanceDeleted?: (instance: Row<'whatsapp_instances'>) => void
  enabled?: boolean
}

/**
 * Hook para escutar mudanças em tempo real nas instâncias WhatsApp.
 * Útil para atualizar status de conexão (connected/disconnected/qr_code) na UI.
 *
 * @example
 * ```tsx
 * useInstancesRealtime({
 *   organizationId: org.id,
 *   onStatusChange: (instance) => {
 *     // Atualiza o estado local ou invalida cache
 *     refetch()
 *   },
 * })
 * ```
 */
export function useInstancesRealtime(options: UseInstancesRealtimeOptions) {
  useRealtime<Row<'whatsapp_instances'>>({
    table: 'whatsapp_instances',
    filter: options.organizationId
      ? `organization_id=eq.${options.organizationId}`
      : undefined,
    event: '*',
    onUpdate: (instance) => {
      options.onStatusChange?.(instance)
    },
    onInsert: (instance) => {
      options.onInstanceCreated?.(instance)
    },
    onDelete: (instance) => {
      options.onInstanceDeleted?.(instance)
    },
    enabled: options.enabled !== false && !!options.organizationId,
  })
}
