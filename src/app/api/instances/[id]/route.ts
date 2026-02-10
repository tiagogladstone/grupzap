import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// =============================================================================
// Helper: Autenticação + organization_id
// =============================================================================
async function getAuthContext() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'UNAUTHORIZED' as const, supabase }
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (userError || !userData?.organization_id) {
    return { error: 'ORG_NOT_FOUND' as const, supabase }
  }

  return { user, orgId: userData.organization_id, supabase }
}

// =============================================================================
// GET /api/instances/[id] — Detalhe de uma instância
// =============================================================================
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await getAuthContext()

    if (auth.error === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: { message: 'Não autenticado', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }
    if (auth.error === 'ORG_NOT_FOUND') {
      return NextResponse.json(
        { error: { message: 'Organização não encontrada', code: 'ORG_NOT_FOUND' } },
        { status: 404 }
      )
    }

    const { orgId, supabase } = auth

    const { data: instance, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single()

    if (error || !instance) {
      return NextResponse.json(
        { error: { message: 'Instância não encontrada', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: instance })
  } catch {
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}

// =============================================================================
// PATCH /api/instances/[id] — Atualizar instância
// =============================================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await getAuthContext()

    if (auth.error === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: { message: 'Não autenticado', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }
    if (auth.error === 'ORG_NOT_FOUND') {
      return NextResponse.json(
        { error: { message: 'Organização não encontrada', code: 'ORG_NOT_FOUND' } },
        { status: 404 }
      )
    }

    const { orgId, supabase } = auth

    const body = await request.json()

    // Campos permitidos para atualização
    const allowedFields = ['instance_name', 'api_token', 'webhook_url', 'webhook_secret'] as const
    const updates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: { message: 'Nenhum campo válido para atualizar', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    const { data: updated, error } = await supabase
      .from('whatsapp_instances')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single()

    if (error || !updated) {
      return NextResponse.json(
        { error: { message: 'Instância não encontrada ou erro ao atualizar', code: 'UPDATE_ERROR' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: updated })
  } catch {
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}

// =============================================================================
// DELETE /api/instances/[id] — Remover instância
// =============================================================================
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await getAuthContext()

    if (auth.error === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: { message: 'Não autenticado', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }
    if (auth.error === 'ORG_NOT_FOUND') {
      return NextResponse.json(
        { error: { message: 'Organização não encontrada', code: 'ORG_NOT_FOUND' } },
        { status: 404 }
      )
    }

    const { orgId, supabase } = auth

    const { error } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId)

    if (error) {
      return NextResponse.json(
        { error: { message: 'Erro ao remover instância', code: 'DELETE_ERROR' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { success: true } })
  } catch {
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}
