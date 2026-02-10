import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock do Supabase ANTES de importar o handler
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Importar DEPOIS do mock
import { GET } from '../route'
import { createClient } from '@/lib/supabase/server'

describe('GET /api/instances', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset o mock do createClient
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  it('retorna 401 quando não autenticado', async () => {
    // Mock: usuário não autenticado
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error.code).toBe('UNAUTHORIZED')
    expect(data.error.message).toBe('Não autenticado')
  })

  it('retorna 404 quando organização não encontrada', async () => {
    // Mock: usuário autenticado
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    // Mock: select users retorna erro
    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockReturnThis()
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'User not found' },
    })

    mockSupabase.from.mockImplementation(() => ({
      select: mockSelect,
    }))

    mockSelect.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      single: mockSingle,
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error.code).toBe('ORG_NOT_FOUND')
    expect(data.error.message).toBe('Organização não encontrada')
  })

  it('retorna lista de instâncias quando autenticado', async () => {
    // Mock: usuário autenticado
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const mockInstances = [
      {
        id: 'inst-1',
        instance_name: 'WhatsApp Teste',
        instance_id: 'test-123',
        status: 'connected',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'inst-2',
        instance_name: 'WhatsApp Produção',
        instance_id: 'prod-456',
        status: 'disconnected',
        created_at: '2024-01-02T00:00:00Z',
      },
    ]

    // Mock: primeira chamada retorna userData, segunda retorna instances
    let callCount = 0
    const mockSelect = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // Primeira chamada: select users
        return {
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { organization_id: 'org-123' },
              error: null,
            }),
          }),
        }
      } else {
        // Segunda chamada: select whatsapp_instances
        return {
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockInstances,
              error: null,
            }),
          }),
        }
      }
    })

    mockSupabase.from.mockImplementation(() => ({
      select: mockSelect,
    }))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toEqual(mockInstances)
    expect(data.data).toHaveLength(2)
    expect(data.data[0].instance_name).toBe('WhatsApp Teste')
  })

  it('retorna formato correto { data: [...] }', async () => {
    // Mock: usuário autenticado
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const mockInstances = [
      {
        id: 'inst-1',
        instance_name: 'Test',
        instance_id: 'test-123',
        status: 'connected',
      },
    ]

    let callCount = 0
    const mockSelect = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { organization_id: 'org-123' },
              error: null,
            }),
          }),
        }
      } else {
        return {
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockInstances,
              error: null,
            }),
          }),
        }
      }
    })

    mockSupabase.from.mockImplementation(() => ({
      select: mockSelect,
    }))

    const response = await GET()
    const data = await response.json()

    expect(data).toHaveProperty('data')
    expect(Array.isArray(data.data)).toBe(true)
    expect(data).not.toHaveProperty('error')
  })

  it('retorna 500 quando erro ao buscar instâncias', async () => {
    // Mock: usuário autenticado
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    // Mock: primeira chamada retorna userData, segunda retorna erro
    let callCount = 0
    const mockSelect = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { organization_id: 'org-123' },
              error: null,
            }),
          }),
        }
      } else {
        return {
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }
      }
    })

    mockSupabase.from.mockImplementation(() => ({
      select: mockSelect,
    }))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error.code).toBe('QUERY_ERROR')
    expect(data.error.message).toBe('Erro ao buscar instâncias')
  })
})
