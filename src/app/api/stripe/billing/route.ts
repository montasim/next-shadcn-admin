/**
 * Get Billing Information API Route
 *
 * GET /api/stripe/billing
 *
 * Returns user's billing information including payment methods and invoices
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user to find Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { stripeCustomerId: true },
    })

    if (!user?.stripeCustomerId) {
      return NextResponse.json({
        customerId: null,
        defaultPaymentMethod: null,
        invoices: [],
      })
    }

    // Fetch customer details from Stripe
    const customer = await stripe.customers.retrieve(user.stripeCustomerId) as any

    // Get default payment method
    let defaultPaymentMethod = null
    if (customer.invoice_settings?.default_payment_method) {
      const paymentMethod = await stripe.paymentMethods.retrieve(
        customer.invoice_settings.default_payment_method
      )
      defaultPaymentMethod = {
        last4: paymentMethod.card?.last4 || '',
        brand: paymentMethod.card?.brand || '',
        expMonth: paymentMethod.card?.exp_month || 0,
        expYear: paymentMethod.card?.exp_year || 0,
      }
    }

    // Fetch invoices
    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 50,
    })

    const formattedInvoices = invoices.data.map((invoice) => ({
      id: invoice.id,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency.toUpperCase(),
      status: invoice.status,
      created: invoice.created,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
    }))

    return NextResponse.json({
      customerId: user.stripeCustomerId,
      defaultPaymentMethod,
      invoices: formattedInvoices,
    })
  } catch (error: any) {
    console.error('Error fetching billing data:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch billing data' },
      { status: 500 }
    )
  }
}
