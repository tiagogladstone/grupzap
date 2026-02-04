'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from './use-user'

interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  plan: 'free' | 'starter' | 'pro' | 'enterprise'
  created_at: string
  updated_at: string
}

interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  created_at: string
}

interface MembershipWithOrg extends OrganizationMember {
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
      // Get all organizations the user is a member of
      const { data: memberships, error: memberError } = await supabase
        .from('organization_members')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('user_id', userId)

      if (memberError) throw memberError

      const typedMemberships = memberships as MembershipWithOrg[] | null
      
      const orgs = typedMemberships
        ?.map(m => m.organization)
        .filter((org): org is Organization => org !== null) ?? []

      setOrganizations(orgs)

      // Get or set active organization
      const activeOrgId = localStorage.getItem(ACTIVE_ORG_KEY)
      let activeOrg = orgs.find(o => o.id === activeOrgId)

      // If no active org or stored one doesn't exist, use first
      if (!activeOrg && orgs.length > 0) {
        activeOrg = orgs[0]
        localStorage.setItem(ACTIVE_ORG_KEY, activeOrg.id)
      }

      if (activeOrg) {
        setOrganization(activeOrg)
        const activeMembership = typedMemberships?.find(
          m => m.organization_id === activeOrg!.id
        )
        if (activeMembership) {
          const { organization: _, ...membershipWithoutOrg } = activeMembership
          setMembership(membershipWithoutOrg)
        } else {
          setMembership(null)
        }
      }
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
      const { data: membershipData } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', orgId)
        .eq('user_id', user.id)
        .single()

      setMembership(membershipData)
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
        })
        .select()
        .single()

      if (orgError) throw orgError

      // Add user as owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner',
        })

      if (memberError) throw memberError

      // Refresh organizations list
      await fetchOrganizations(user.id)

      // Set as active
      localStorage.setItem(ACTIVE_ORG_KEY, org.id)
      setOrganization(org)

      return { organization: org, error: null }
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
        })
        .eq('id', organization.id)

      if (error) throw error

      // Refresh organization data
      const { data: updatedOrg } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organization.id)
        .single()

      if (updatedOrg) {
        setOrganization(updatedOrg)
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
