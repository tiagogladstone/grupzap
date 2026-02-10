import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripe, getPlanByPriceId, PLAN_MAP } from '@/lib/stripe'
import type { Database } from '@/types/supabase'
import Stripe from 'stripe'

// =============================================================================
// Supabase Service Client (Webhook não usa cookies)
// =============================================================================

function getServiceClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase credentials not configured')
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// =============================================================================
// POST /api/webhooks/stripe — Webhook do Stripe
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Ler raw body
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: { message: 'Missing stripe-signature header', code: 'INVALID_SIGNATURE' } },
        { status: 400 }
      )
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
    }

    // Verificar assinatura do webhook
    let event: Stripe.Event
    try {
      event = getStripe().webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: { message: 'Invalid signature', code: 'INVALID_SIGNATURE' } },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()

    // Processar eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        const organizationId = session.metadata?.organization_id
        if (!organizationId) {
          console.error('Missing organization_id in session metadata')
          break
        }

        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        // Atualizar organization com stripe_customer_id
        const { error: orgError } = await supabase
          .from('organizations')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', organizationId)

        if (orgError) {
          console.error('Error updating organization:', orgError)
          break
        }

        // Buscar subscription do Stripe para obter detalhes
        const stripeSubscription = await getStripe().subscriptions.retrieve(subscriptionId) as any
        const priceId = stripeSubscription.items.data[0]?.price.id
        const planType = priceId ? getPlanByPriceId(priceId) : null

        if (!planType || planType === 'free') {
          console.error('Invalid plan type from priceId:', priceId)
          break
        }

        // Criar ou atualizar subscription no banco
        const { error: subError } = await supabase
          .from('subscriptions')
          .upsert({
            organization_id: organizationId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            plan: planType,
            status: stripeSubscription.status as 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | 'incomplete',
            billing_cycle: 'monthly',
            current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: stripeSubscription.cancel_at_period_end,
            quantity: 1,
            metadata: {},
            updated_at: new Date().toISOString(),
          })

        if (subError) {
          console.error('Error upserting subscription:', subError)
        }

        // Atualizar limites da organização
        const planConfig = PLAN_MAP[planType]
        if (planConfig) {
          await supabase
            .from('organizations')
            .update({
              plan: planType,
              max_instances: planConfig.limits.maxInstances,
              max_groups: planConfig.limits.maxGroups === -1 ? 999999 : planConfig.limits.maxGroups,
              updated_at: new Date().toISOString(),
            })
            .eq('id', organizationId)
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any

        const priceId = subscription.items.data[0]?.price.id
        const planType = priceId ? getPlanByPriceId(priceId) : null

        // Buscar subscription no banco pelo stripe_subscription_id
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('organization_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (!existingSub) {
          console.error('Subscription not found in database:', subscription.id)
          break
        }

        // Atualizar subscription
        const { error: subError } = await supabase
          .from('subscriptions')
          .update({
            stripe_price_id: priceId,
            plan: planType || 'free',
            status: subscription.status as 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | 'incomplete',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (subError) {
          console.error('Error updating subscription:', subError)
        }

        // Atualizar plano na organization se mudou
        if (planType && planType !== 'free') {
          const planConfig = PLAN_MAP[planType]
          await supabase
            .from('organizations')
            .update({
              plan: planType,
              max_instances: planConfig.limits.maxInstances,
              max_groups: planConfig.limits.maxGroups === -1 ? 999999 : planConfig.limits.maxGroups,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingSub.organization_id)
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Marcar subscription como canceled
        const { data: existingSub, error: fetchError } = await supabase
          .from('subscriptions')
          .select('organization_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (fetchError || !existingSub) {
          console.error('Subscription not found:', subscription.id)
          break
        }

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        // Downgrade para free
        await supabase
          .from('organizations')
          .update({
            plan: 'free',
            max_instances: 1,
            max_groups: 10,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSub.organization_id)

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any

        if (invoice.subscription) {
          const subscriptionId = typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription.id

          await supabase
            .from('subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId)
        }

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any

        if (invoice.subscription) {
          const subscriptionId = typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription.id

          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId)
        }

        break
      }

      default:
        // Outros eventos são ignorados mas retornam 200
        console.log('Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}
