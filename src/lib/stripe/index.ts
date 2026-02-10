import Stripe from 'stripe'

// =============================================================================
// Stripe SDK Instance
// =============================================================================

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    })
  }
  return _stripe
}


// =============================================================================
// Plan Configuration
// =============================================================================

export type PlanType = 'free' | 'starter' | 'pro' | 'enterprise'

interface PlanConfig {
  name: string
  priceId: string
  limits: {
    maxInstances: number
    maxGroups: number
    maxMessagesPerMonth: number
  }
  price: {
    monthly: number
    currency: string
  }
}

export const PLAN_MAP: Record<Exclude<PlanType, 'free'>, PlanConfig> = {
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_PRICE_STARTER || '',
    limits: {
      maxInstances: 2,
      maxGroups: 50,
      maxMessagesPerMonth: 500,
    },
    price: {
      monthly: 9700, // R$ 97.00 em centavos
      currency: 'BRL',
    },
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_PRO || '',
    limits: {
      maxInstances: 5,
      maxGroups: 200,
      maxMessagesPerMonth: 2000,
    },
    price: {
      monthly: 19700, // R$ 197.00 em centavos
      currency: 'BRL',
    },
  },
  enterprise: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || '',
    limits: {
      maxInstances: 20,
      maxGroups: -1, // ilimitado
      maxMessagesPerMonth: -1, // ilimitado
    },
    price: {
      monthly: 49700, // R$ 497.00 em centavos
      currency: 'BRL',
    },
  },
}

// Helper para buscar plano pelo priceId
export function getPlanByPriceId(priceId: string): PlanType | null {
  for (const [plan, config] of Object.entries(PLAN_MAP)) {
    if (config.priceId === priceId) {
      return plan as PlanType
    }
  }
  return null
}

// =============================================================================
// Stripe Functions
// =============================================================================

/**
 * Cria sessão de checkout do Stripe
 */
export async function createCheckoutSession(
  organizationId: string,
  priceId: string,
  customerId?: string
): Promise<Stripe.Checkout.Session> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/settings/billing?success=true`,
    cancel_url: `${baseUrl}/settings/billing?canceled=true`,
    metadata: {
      organization_id: organizationId,
    },
  }

  // Se já existe customer_id, usa ele. Senão, cria novo customer
  if (customerId) {
    sessionParams.customer = customerId
  } else {
    sessionParams.customer_creation = 'always'
  }

  const session = await getStripe().checkout.sessions.create(sessionParams)
  return session
}

/**
 * Cria sessão do Customer Portal do Stripe
 */
export async function createCustomerPortalSession(
  customerId: string
): Promise<Stripe.BillingPortal.Session> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/settings/billing`,
  })

  return session
}

/**
 * Busca subscription do Stripe
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
  return subscription
}

/**
 * Cancela subscription do Stripe
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const subscription = await getStripe().subscriptions.cancel(subscriptionId)
  return subscription
}
