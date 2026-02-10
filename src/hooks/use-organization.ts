'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from './use-user'

interface Organization {
  id: string
  name: string
  slug: string
  plan: 'free' | 'starter' | 'pro' | 'enterprise'
  created_at: string
  updated_at: string
}

interface OrganizationMember {
  id: string
  organization_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  created_at: string
}

interface UserWithOrg {
  id: string
  organization_id: string | null
  role: 'owner' | 'admin' | 'member' | 'viewer'
  created_at: string
  organization: Organization | null
}

interface UseOrganizationReturn {
  organization: Organization | null
  membership: OrganizationMember | null
  organizations: Organization[]
  loading: boolean
  error: Error | null
  switchOrganization: (orgId: string) => Promise<void>
  createOrganization: (name: string) => Promise<{ organization: Organization | null; error: Error | null }>
  updateOrganization: (updates: Partial<Organization>) => Promise<{ error: Error | null }>
  refreshOrganization: () => Promise<void>
}

const ACTIVE_ORG_KEY = 'grupzap_active_org'

export function useOrganization(): UseOrganizationReturn {
  const { user } = useUser()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [membership, setMembership] = useState<OrganizationMember | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  const fetchOrganizations = useCallback(async (userId: string) => {
    try {
      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, organization_id, role, created_at')
        .eq('id', userId)
        .single()

      if (userError) throw userError

      if (!userData?.organization_id) {
        setOrganizations([])
        setOrganization(null)
        setMembership(null)
        setLoading(false)
        return
      }

      // Get organization data
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', userData.organization_id)
        .single()

      if (orgError) throw orgError

      const org = orgData as Organization
      setOrganizations([org])
      setOrganization(org)

      setMembership({
        id: userData.id,
        organization_id: userData.organization_id,
        role: userData.role,
        created_at: userData.created_at,
      })
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const switchOrganization = useCallback(async (orgId: string) => {
    const org = organizations.find(o => o.id === orgId)
    if (!org) {
      setError(new Error('Organization not found'))
      return
    }

    localStorage.setItem(ACTIVE_ORG_KEY, orgId)
    setOrganization(org)

    // Update membership for the new org
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('id, organization_id, role, created_at')
        .eq('organization_id', orgId)
        .eq('id', user.id)
        .single()

      if (userData?.organization_id) {
        setMembership({
          id: userData.id,
          organization_id: userData.organization_id,
          role: userData.role,
          created_at: userData.created_at,
        })
      }
    }
  }, [organizations, user, supabase])

  const createOrganization = useCallback(async (name: string) => {
    if (!user) {
      return { organization: null, error: new Error('No user logged in') }
    }

    try {
      // Create slug from name
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name,
          slug,
          plan: 'free',
        } as never)
        .select()
        .single()

      if (orgError) throw orgError

      const createdOrg = org as Organization

      // Update user to link to organization
      const { error: userError } = await supabase
        .from('users')
        .update({
          organization_id: createdOrg.id,
          role: 'owner',
        } as never)
        .eq('id', user.id)

      if (userError) throw userError

      // Refresh organizations list
      await fetchOrganizations(user.id)

      // Set as active
      localStorage.setItem(ACTIVE_ORG_KEY, createdOrg.id)
      setOrganization(createdOrg)

      return { organization: createdOrg, error: null }
    } catch (err) {
      return { organization: null, error: err as Error }
    }
  }, [user, supabase, fetchOrganizations])

  const updateOrganization = useCallback(async (updates: Partial<Organization>) => {
    if (!organization) {
      return { error: new Error('No organization selected') }
    }

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', organization.id)

      if (error) throw error

      // Refresh organization data
      const { data: updatedOrg } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organization.id)
        .single()

      if (updatedOrg) {
        setOrganization(updatedOrg as Organization)
      }

      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }, [organization, supabase])

  const refreshOrganization = useCallback(async () => {
    if (user) {
      await fetchOrganizations(user.id)
    }
  }, [user, fetchOrganizations])

  useEffect(() => {
    if (user) {
      fetchOrganizations(user.id)
    } else {
      setOrganization(null)
      setMembership(null)
      setOrganizations([])
      setLoading(false)
    }
  }, [user, fetchOrganizations])

  return {
    organization,
    membership,
    organizations,
    loading,
    error,
    switchOrganization,
    createOrganization,
    updateOrganization,
    refreshOrganization,
  }
}
