import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlanLimits, type PlanType } from '@/lib/plans';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { message: 'Não autenticado', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return NextResponse.json(
        { error: { message: 'Organização não encontrada', code: 'ORG_NOT_FOUND' } },
        { status: 404 }
      );
    }

    const orgId = userData.organization_id;

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('organization_id', orgId)
      .single();

    if (subError) {
      return NextResponse.json(
        { error: { message: 'Erro ao buscar assinatura', code: 'SUBSCRIPTION_ERROR' } },
        { status: 500 }
      );
    }

    const plan = (subscription?.plan || 'free') as PlanType;
    const limits = getPlanLimits(plan);

    const { count: instancesCount, error: instancesError } = await supabase
      .from('whatsapp_instances')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    if (instancesError) {
      return NextResponse.json(
        { error: { message: 'Erro ao contar instâncias', code: 'COUNT_ERROR' } },
        { status: 500 }
      );
    }

    const { count: groupsCount, error: groupsError } = await supabase
      .from('whatsapp_groups')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('is_monitored', true);

    if (groupsError) {
      return NextResponse.json(
        { error: { message: 'Erro ao contar grupos', code: 'COUNT_ERROR' } },
        { status: 500 }
      );
    }

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const { count: messagesCount, error: messagesError } = await supabase
      .from('scheduled_messages')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', firstDayOfMonth.toISOString());

    if (messagesError) {
      return NextResponse.json(
        { error: { message: 'Erro ao contar mensagens', code: 'COUNT_ERROR' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        plan,
        limits,
        usage: {
          instances: instancesCount ?? 0,
          groups: groupsCount ?? 0,
          messages_this_month: messagesCount ?? 0,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
