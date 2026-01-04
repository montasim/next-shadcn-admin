/**
 * Cancel Subscription API Route
 *
 * POST /api/stripe/subscription/cancel
 *
 * Cancels the user's subscription (at period end or immediately)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { immediate = false } = body as { immediate?: boolean }

    // Get user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.userId },
    })

    if (!subscription || !subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Cancel subscription in Stripe
    if (immediate) {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId)
    } else {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      })
    }

    // Update subscription in database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: !immediate,
        isActive: !immediate,
        endDate: immediate ? new Date() : subscription.endDate,
      },
    })

    return NextResponse.json({
      success: true,
      message: immediate
        ? 'Subscription cancelled immediately'
        : 'Subscription will be cancelled at the end of the billing period',
    })
  } catch (error: any) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
