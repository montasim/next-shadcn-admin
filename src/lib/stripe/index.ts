/**
 * Stripe Service Module
 *
 * Handles all Stripe-related operations:
 * - Customer management
 * - Checkout session creation
 * - Subscription management
 * - Webhook handling
 */

import Stripe from 'stripe'
import { config } from '@/config'
import { prisma } from '@/lib/prisma'
import { SUBSCRIPTION_TIERS, getSubscriptionTier } from './config'
import { SubscriptionPlan } from '@prisma/client'

// Initialize Stripe
export const stripe = new Stripe(config.stripeSecretKey || '', {
  apiVersion: '2025-12-15.clover',
  typescript: true,
})

// ============================================================================
// CUSTOMER MANAGEMENT
// ============================================================================

/**
 * Get or create Stripe customer for a user
 */
export async function getOrCreateCustomer(userId: string, email: string): Promise<Stripe.Customer> {
  // Check if user already has a Stripe customer ID
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  })

  if (user?.stripeCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(user.stripeCustomerId)
      if (customer && !customer.deleted) {
        return customer as Stripe.Customer
      }
    } catch (error) {
      console.error('Error retrieving Stripe customer:', error)
      // Continue to create a new customer
    }
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  })

  // Update user with Stripe customer ID
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  })

  return customer
}

// ============================================================================
// CHECKOUT SESSION
// ============================================================================

interface CreateCheckoutSessionParams {
  userId: string
  userEmail: string
  plan: SubscriptionPlan
  interval: 'month' | 'year'
  successUrl?: string
  cancelUrl?: string
}

export async function createCheckoutSession({
  userId,
  userEmail,
  plan,
  interval,
  successUrl = `${config.appUrl}/settings/subscription?success=true`,
  cancelUrl = `${config.appUrl}/pricing?canceled=true`,
}: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
  // Get customer
  const customer = await getOrCreateCustomer(userId, userEmail)

  // Get price ID for the selected plan and interval
  const tier = getSubscriptionTier(plan)
  const priceId = interval === 'month' ? tier.plans.monthly : tier.plans.yearly

  if (!priceId) {
    throw new Error(`No price ID configured for ${plan} ${interval}`)
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      plan,
      interval,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    customer_update: {
      address: 'auto',
      name: 'auto',
    },
  })

  return session
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * Get subscription details from Stripe
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.retrieve(subscriptionId)
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscriptionAtPeriodEnd(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
}

/**
 * Resume subscription (remove cancellation)
 */
export async function resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}

/**
 * Cancel subscription immediately
 */
export async function cancelSubscriptionImmediately(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.cancel(subscriptionId)
}

/**
 * Create portal session for managing subscription
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

// ============================================================================
// WEBHOOK HANDLERS
// ============================================================================

/**
 * Handle checkout.session.completed event
 */
export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { userId, plan, interval } = session.metadata as {
    userId: string
    plan: SubscriptionPlan
    interval: string
  }

  if (!userId || !plan) {
    throw new Error('Invalid session metadata')
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

  // Calculate end date based on interval
  const startDate = new Date()
  const endDate = new Date(startDate)
  if (interval === 'month') {
    endDate.setMonth(endDate.getMonth() + 1)
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1)
  }

  // Update or create subscription in database
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan,
      startDate,
      endDate,
      isActive: true,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      plan,
      startDate,
      endDate,
      isActive: true,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  })

  // Update user's premium status
  await prisma.user.update({
    where: { id: userId },
    data: { isPremium: plan !== SubscriptionPlan.FREE },
  })
}

/**
 * Handle customer.subscription.updated event
 */
export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Get user from Stripe customer
  const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer
  const userId = customer.metadata.userId

  if (!userId) {
    throw new Error('No userId found in customer metadata')
  }

  // Get subscription plan from metadata or price
  const priceId = subscription.items.data[0].price.id
  let plan: SubscriptionPlan = SubscriptionPlan.FREE

  // Determine plan based on price ID
  for (const [key, tier] of Object.entries(SUBSCRIPTION_TIERS)) {
    if (tier.plans.monthly === priceId || tier.plans.yearly === priceId) {
      plan = key as SubscriptionPlan
      break
    }
  }

  // Update subscription in database
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      plan,
      isActive: subscription.status === 'active' || subscription.status === 'trialing',
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      endDate: subscription.cancel_at_period_end
        ? new Date((subscription as any).current_period_end * 1000)
        : null,
    },
  })

  // Update user's premium status
  await prisma.user.update({
    where: { id: userId },
    data: {
      isPremium: plan !== SubscriptionPlan.FREE && subscription.status === 'active',
    },
  })
}

/**
 * Handle customer.subscription.deleted event
 */
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Get user from Stripe customer
  const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer
  const userId = customer.metadata.userId

  if (!userId) {
    throw new Error('No userId found in customer metadata')
  }

  // Update subscription in database
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      plan: SubscriptionPlan.FREE,
      isActive: false,
      endDate: new Date(),
      cancelAtPeriodEnd: false,
    },
  })

  // Update user's premium status
  await prisma.user.update({
    where: { id: userId },
    data: { isPremium: false },
  })
}

/**
 * Handle invoice.payment_succeeded event
 */
export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Subscription was renewed
  const subscriptionId = (invoice as any).subscription
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)
    await handleSubscriptionUpdated(subscription)
  }
}

/**
 * Handle invoice.payment_failed event
 */
export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Payment failed, but subscription is still active until retry period ends
  console.log('Payment failed for invoice:', invoice.id)
  // You could send an email to the user here
}

/**
 * Construct webhook event
 */
export async function constructWebhookEvent(payload: string, signature: string): Promise<Stripe.Event> {
  if (!config.stripeWebhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  }

  return stripe.webhooks.constructEvent(
    payload,
    signature,
    config.stripeWebhookSecret
  )
}
