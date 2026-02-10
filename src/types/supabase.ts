export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // -----------------------------------------------------------------------
      // ORGANIZATIONS (Multi-tenant)
      // -----------------------------------------------------------------------
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          plan: 'free' | 'starter' | 'pro' | 'enterprise'
          settings: Json
          max_instances: number
          max_groups: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          is_active: boolean
          trial_ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          plan?: 'free' | 'starter' | 'pro' | 'enterprise'
          settings?: Json
          max_instances?: number
          max_groups?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          is_active?: boolean
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          plan?: 'free' | 'starter' | 'pro' | 'enterprise'
          settings?: Json
          max_instances?: number
          max_groups?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          is_active?: boolean
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // -----------------------------------------------------------------------
      // USERS
      // -----------------------------------------------------------------------
      users: {
        Row: {
          id: string
          organization_id: string | null
          email: string
          name: string | null
          avatar_url: string | null
          role: 'owner' | 'admin' | 'member' | 'viewer'
          phone: string | null
          settings: Json
          last_login_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id?: string | null
          email: string
          name?: string | null
          avatar_url?: string | null
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          phone?: string | null
          settings?: Json
          last_login_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          email?: string
          name?: string | null
          avatar_url?: string | null
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          phone?: string | null
          settings?: Json
          last_login_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // -----------------------------------------------------------------------
      // WHATSAPP_INSTANCES
      // -----------------------------------------------------------------------
      whatsapp_instances: {
        Row: {
          id: string
          organization_id: string
          instance_name: string
          instance_id: string
          api_token: string | null
          encrypted_api_token: string | null
          phone_number: string | null
          status: 'connected' | 'disconnected' | 'connecting' | 'qr_code' | 'banned' | 'error'
          qr_code: string | null
          qr_code_expires_at: string | null
          webhook_url: string | null
          webhook_secret: string | null
          last_health_check: string | null
          health_status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
          error_message: string | null
          metadata: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          instance_name: string
          instance_id: string
          api_token?: string | null
          encrypted_api_token?: string | null
          phone_number?: string | null
          status?: 'connected' | 'disconnected' | 'connecting' | 'qr_code' | 'banned' | 'error'
          qr_code?: string | null
          qr_code_expires_at?: string | null
          webhook_url?: string | null
          webhook_secret?: string | null
          last_health_check?: string | null
          health_status?: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
          error_message?: string | null
          metadata?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          instance_name?: string
          instance_id?: string
          api_token?: string | null
          encrypted_api_token?: string | null
          phone_number?: string | null
          status?: 'connected' | 'disconnected' | 'connecting' | 'qr_code' | 'banned' | 'error'
          qr_code?: string | null
          qr_code_expires_at?: string | null
          webhook_url?: string | null
          webhook_secret?: string | null
          last_health_check?: string | null
          health_status?: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
          error_message?: string | null
          metadata?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // -----------------------------------------------------------------------
      // WHATSAPP_GROUPS
      // -----------------------------------------------------------------------
      whatsapp_groups: {
        Row: {
          id: string
          instance_id: string
          organization_id: string
          group_jid: string
          name: string
          description: string | null
          picture_url: string | null
          invite_link: string | null
          participant_count: number
          admin_count: number
          is_monitored: boolean
          is_archived: boolean
          health_score: number
          activity_level: 'high' | 'normal' | 'low' | 'inactive'
          settings: Json
          last_message_at: string | null
          last_sync_at: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          instance_id: string
          organization_id: string
          group_jid: string
          name: string
          description?: string | null
          picture_url?: string | null
          invite_link?: string | null
          participant_count?: number
          admin_count?: number
          is_monitored?: boolean
          is_archived?: boolean
          health_score?: number
          activity_level?: 'high' | 'normal' | 'low' | 'inactive'
          settings?: Json
          last_message_at?: string | null
          last_sync_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          instance_id?: string
          organization_id?: string
          group_jid?: string
          name?: string
          description?: string | null
          picture_url?: string | null
          invite_link?: string | null
          participant_count?: number
          admin_count?: number
          is_monitored?: boolean
          is_archived?: boolean
          health_score?: number
          activity_level?: 'high' | 'normal' | 'low' | 'inactive'
          settings?: Json
          last_message_at?: string | null
          last_sync_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // -----------------------------------------------------------------------
      // GROUP_MEMBERS
      // -----------------------------------------------------------------------
      group_members: {
        Row: {
          id: string
          group_id: string
          organization_id: string
          phone_jid: string
          phone_number: string | null
          name: string | null
          push_name: string | null
          is_admin: boolean
          is_super_admin: boolean
          joined_at: string | null
          added_by: string | null
          last_seen: string | null
          last_message_at: string | null
          message_count: number
          engagement_score: number
          tags: string[]
          notes: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          organization_id: string
          phone_jid: string
          phone_number?: string | null
          name?: string | null
          push_name?: string | null
          is_admin?: boolean
          is_super_admin?: boolean
          joined_at?: string | null
          added_by?: string | null
          last_seen?: string | null
          last_message_at?: string | null
          message_count?: number
          engagement_score?: number
          tags?: string[]
          notes?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          organization_id?: string
          phone_jid?: string
          phone_number?: string | null
          name?: string | null
          push_name?: string | null
          is_admin?: boolean
          is_super_admin?: boolean
          joined_at?: string | null
          added_by?: string | null
          last_seen?: string | null
          last_message_at?: string | null
          message_count?: number
          engagement_score?: number
          tags?: string[]
          notes?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // -----------------------------------------------------------------------
      // SCHEDULED_MESSAGES
      // -----------------------------------------------------------------------
      scheduled_messages: {
        Row: {
          id: string
          organization_id: string
          instance_id: string
          group_id: string | null
          target_jid: string
          target_type: 'group' | 'individual' | 'broadcast'
          message_type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contact'
          content: string | null
          caption: string | null
          media_url: string | null
          media_mime_type: string | null
          media_filename: string | null
          buttons: Json | null
          scheduled_for: string
          timezone: string
          recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | null
          recurrence_end_at: string | null
          status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled'
          sent_at: string | null
          attempts: number
          max_attempts: number
          error_message: string | null
          external_message_id: string | null
          created_by: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          instance_id: string
          group_id?: string | null
          target_jid: string
          target_type?: 'group' | 'individual' | 'broadcast'
          message_type?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contact'
          content?: string | null
          caption?: string | null
          media_url?: string | null
          media_mime_type?: string | null
          media_filename?: string | null
          buttons?: Json | null
          scheduled_for: string
          timezone?: string
          recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | null
          recurrence_end_at?: string | null
          status?: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled'
          sent_at?: string | null
          attempts?: number
          max_attempts?: number
          error_message?: string | null
          external_message_id?: string | null
          created_by?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          instance_id?: string
          group_id?: string | null
          target_jid?: string
          target_type?: 'group' | 'individual' | 'broadcast'
          message_type?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contact'
          content?: string | null
          caption?: string | null
          media_url?: string | null
          media_mime_type?: string | null
          media_filename?: string | null
          buttons?: Json | null
          scheduled_for?: string
          timezone?: string
          recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | null
          recurrence_end_at?: string | null
          status?: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled'
          sent_at?: string | null
          attempts?: number
          max_attempts?: number
          error_message?: string | null
          external_message_id?: string | null
          created_by?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // -----------------------------------------------------------------------
      // MESSAGE_LOGS
      // -----------------------------------------------------------------------
      message_logs: {
        Row: {
          id: string
          organization_id: string
          instance_id: string
          group_id: string | null
          sender_jid: string | null
          sender_name: string | null
          message_type: string
          is_from_me: boolean
          is_forwarded: boolean
          has_media: boolean
          reply_to_id: string | null
          message_timestamp: string
          external_message_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          instance_id: string
          group_id?: string | null
          sender_jid?: string | null
          sender_name?: string | null
          message_type: string
          is_from_me?: boolean
          is_forwarded?: boolean
          has_media?: boolean
          reply_to_id?: string | null
          message_timestamp: string
          external_message_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          instance_id?: string
          group_id?: string | null
          sender_jid?: string | null
          sender_name?: string | null
          message_type?: string
          is_from_me?: boolean
          is_forwarded?: boolean
          has_media?: boolean
          reply_to_id?: string | null
          message_timestamp?: string
          external_message_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }

      // -----------------------------------------------------------------------
      // SUBSCRIPTIONS
      // -----------------------------------------------------------------------
      subscriptions: {
        Row: {
          id: string
          organization_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          plan: 'free' | 'starter' | 'pro' | 'enterprise'
          status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | 'incomplete'
          billing_cycle: 'monthly' | 'yearly'
          current_period_start: string | null
          current_period_end: string | null
          cancel_at: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          trial_start: string | null
          trial_end: string | null
          quantity: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          plan?: 'free' | 'starter' | 'pro' | 'enterprise'
          status?: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | 'incomplete'
          billing_cycle?: 'monthly' | 'yearly'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          quantity?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          plan?: 'free' | 'starter' | 'pro' | 'enterprise'
          status?: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | 'incomplete'
          billing_cycle?: 'monthly' | 'yearly'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          quantity?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // -----------------------------------------------------------------------
      // HEALTH_CHECKS
      // -----------------------------------------------------------------------
      health_checks: {
        Row: {
          id: string
          instance_id: string
          organization_id: string
          status: 'healthy' | 'degraded' | 'unhealthy' | 'timeout' | 'error'
          response_time_ms: number | null
          error_message: string | null
          details: Json
          checked_at: string
        }
        Insert: {
          id?: string
          instance_id: string
          organization_id: string
          status: 'healthy' | 'degraded' | 'unhealthy' | 'timeout' | 'error'
          response_time_ms?: number | null
          error_message?: string | null
          details?: Json
          checked_at?: string
        }
        Update: {
          id?: string
          instance_id?: string
          organization_id?: string
          status?: 'healthy' | 'degraded' | 'unhealthy' | 'timeout' | 'error'
          response_time_ms?: number | null
          error_message?: string | null
          details?: Json
          checked_at?: string
        }
        Relationships: []
      }

      // -----------------------------------------------------------------------
      // WEBHOOK_EVENTS
      // -----------------------------------------------------------------------
      webhook_events: {
        Row: {
          id: string
          instance_id: string | null
          organization_id: string | null
          event_type: string
          payload: Json
          status: 'pending' | 'processing' | 'processed' | 'failed'
          attempts: number
          error_message: string | null
          processed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          instance_id?: string | null
          organization_id?: string | null
          event_type: string
          payload: Json
          status?: 'pending' | 'processing' | 'processed' | 'failed'
          attempts?: number
          error_message?: string | null
          processed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          instance_id?: string | null
          organization_id?: string | null
          event_type?: string
          payload?: Json
          status?: 'pending' | 'processing' | 'processed' | 'failed'
          attempts?: number
          error_message?: string | null
          processed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }

      // -----------------------------------------------------------------------
      // AUDIT_LOGS
      // -----------------------------------------------------------------------
      audit_logs: {
        Row: {
          id: string
          organization_id: string | null
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }

      // -----------------------------------------------------------------------
      // MESSAGE_TEMPLATES
      // -----------------------------------------------------------------------
      message_templates: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          message_type: 'text' | 'image' | 'video' | 'audio' | 'document'
          content: string | null
          caption: string | null
          media_url: string | null
          media_filename: string | null
          variables: string[]
          category: 'general' | 'welcome' | 'reminder' | 'announcement' | 'promotion'
          is_active: boolean
          usage_count: number
          created_by: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          message_type?: 'text' | 'image' | 'video' | 'audio' | 'document'
          content?: string | null
          caption?: string | null
          media_url?: string | null
          media_filename?: string | null
          variables?: string[]
          category?: 'general' | 'welcome' | 'reminder' | 'announcement' | 'promotion'
          is_active?: boolean
          usage_count?: number
          created_by?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          message_type?: 'text' | 'image' | 'video' | 'audio' | 'document'
          content?: string | null
          caption?: string | null
          media_url?: string | null
          media_filename?: string | null
          variables?: string[]
          category?: 'general' | 'welcome' | 'reminder' | 'announcement' | 'promotion'
          is_active?: boolean
          usage_count?: number
          created_by?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }

    Views: {
      [_ in never]: never
    }

    Functions: {
      create_organization_with_owner: {
        Args: {
          org_name: string
          org_slug: string
          owner_email: string
          owner_name?: string | null
        }
        Returns: {
          organization_id: string
          user_id: string
        }[]
      }
      get_group_stats: {
        Args: {
          p_group_id: string
        }
        Returns: {
          total_members: number
          total_admins: number
          messages_today: number
          messages_week: number
          active_members: number
        }[]
      }
      update_group_health_score: {
        Args: {
          p_group_id: string
        }
        Returns: number
      }
      user_belongs_to_org: {
        Args: {
          org_id: string
        }
        Returns: boolean
      }
      get_user_org_id: {
        Args: Record<string, never>
        Returns: string
      }
      user_is_org_admin: {
        Args: {
          org_id: string
        }
        Returns: boolean
      }
      fetch_and_lock_pending_messages: {
        Args: {
          p_batch_size?: number
        }
        Returns: {
          id: string
          target_jid: string
          target_type: string
          message_type: string
          content: string | null
          caption: string | null
          media_url: string | null
          media_filename: string | null
          media_mime_type: string | null
          buttons: Json | null
          attempts: number
          max_attempts: number
          instance_api_token: string
          instance_id_external: string
          scheduled_message_id: string
        }[]
      }
      reset_failed_messages: {
        Args: {
          p_cooldown_minutes?: number
        }
        Returns: number
      }
    }

    Enums: {
      [_ in never]: never
    }

    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// =============================================================================
// TYPE HELPERS
// =============================================================================

/** Todas as tabelas do schema public */
export type Tables = Database['public']['Tables']

/** Nomes das tabelas disponíveis */
export type TableName = keyof Tables

/** Tipo de linha (Row) de uma tabela */
export type Row<T extends TableName> = Tables[T]['Row']

/** Tipo de inserção (Insert) de uma tabela */
export type InsertRow<T extends TableName> = Tables[T]['Insert']

/** Tipo de atualização (Update) de uma tabela */
export type UpdateRow<T extends TableName> = Tables[T]['Update']
