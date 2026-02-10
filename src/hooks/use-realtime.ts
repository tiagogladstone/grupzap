'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type TableName = 'whatsapp_instances' | 'whatsapp_groups' | 'scheduled_messages' | 'group_members'

interface UseRealtimeOptions<T extends Record<string, any>> {
  table: TableName
  /** Filtro Postgres, ex: 'organization_id=eq.xxx' */
  filter?: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  onInsert?: (record: T) => void
  onUpdate?: (record: T) => void
  onDelete?: (record: T) => void
  onChange?: (payload: RealtimePostgresChangesPayload<T>) => void
  enabled?: boolean
}

/**
 * Hook genérico para Supabase Realtime (Postgres Changes).
 * Escuta INSERT/UPDATE/DELETE em uma tabela e dispara callbacks.
 *
 * @example
 * ```tsx
 * useRealtime<Row<'whatsapp_instances'>>({
 *   table: 'whatsapp_instances',
 *   filter: `organization_id=eq.${orgId}`,
 *   onUpdate: (instance) => console.log('Atualizado:', instance),
 * })
 * ```
 */
export function useRealtime<T extends Record<string, any>>(options: UseRealtimeOptions<T>) {
  const {
    table,
    filter,
    event = '*',
    onInsert,
    onUpdate,
    onDelete,
    onChange,
    enabled = true,
  } = options

  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()

    const channel = supabase
      .channel(`realtime-${table}-${filter ?? 'all'}`)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          filter,
        },
        (payload: RealtimePostgresChangesPayload<T>) => {
          onChange?.(payload)

          if (payload.eventType === 'INSERT') onInsert?.(payload.new as T)
          if (payload.eventType === 'UPDATE') onUpdate?.(payload.new as T)
          if (payload.eventType === 'DELETE') onDelete?.(payload.old as T)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter, event, enabled])

  return null
}
