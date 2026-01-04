/**
 * Create Stripe Checkout Session API Route
 *
 * POST /api/stripe/create-checkout-session
 *
 * Creates a Stripe checkout session for subscription purchase
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createCheckoutSession } from '@/lib/stripe'
import { SubscriptionPlan } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { plan, interval } = body as {
      plan: SubscriptionPlan
      interval: 'month' | 'year'
    }

    if (!plan || !interval) {
      return NextResponse.json(
        { error: 'Missing required fields: plan, interval' },
        { status: 400 }
      )
    }

    if (plan === SubscriptionPlan.FREE) {
      return NextResponse.json(
        { error: 'Cannot create checkout session for free plan' },
        { status: 400 }
      )
    }

    const checkoutSession = await createCheckoutSession({
      userId: session.userId,
      userEmail: session.email || '',
      plan,
      interval,
    })

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
