import { SubscriptionPlan } from '@prisma/client'

export interface SubscriptionTier {
  id: string
  name: string
  description: string
  plans: {
    monthly: string // Stripe Price ID
    yearly: string // Stripe Price ID
  }
  features: {
    text: string
    included: boolean
  }[]
  price: {
    monthly: number
    yearly: number
  }
  popular?: boolean
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionPlan, SubscriptionTier> = {
  [SubscriptionPlan.FREE]: {
    id: 'free',
    name: 'Free',
    description: 'Perfect for exploring the platform',
    plans: {
      monthly: '',
      yearly: '',
    },
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      { text: 'Access to public library', included: true },
      { text: 'Basic book browsing', included: true },
      { text: 'Community features', included: true },
      { text: 'Up to 10 book uploads', included: true },
      { text: 'Ad-supported experience', included: true },
      { text: 'Unlimited book reading', included: false },
      { text: 'AI recommendations', included: false },
      { text: 'Advanced analytics', included: false },
      { text: 'Priority support', included: false },
      { text: 'Early access to new features', included: false },
    ],
  },
  [SubscriptionPlan.PREMIUM]: {
    id: 'premium',
    name: 'Premium',
    description: 'For avid readers who want more',
    plans: {
      monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || '',
      yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || '',
    },
    price: {
      monthly: 999, // $9.99 in cents
      yearly: 9999, // $99.99 in cents
    },
    popular: true,
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'Unlimited book reading', included: true },
      { text: 'Up to 100 book uploads', included: true },
      { text: 'AI-powered recommendations', included: true },
      { text: 'Ad-free experience', included: true },
      { text: 'Advanced reading statistics', included: true },
      { text: 'Offline reading mode', included: true },
      { text: 'Custom bookmarks & highlights', included: true },
      { text: 'Priority support', included: false },
      { text: 'Early access to new features', included: false },
    ],
  },
  [SubscriptionPlan.PREMIUM_PLUS]: {
    id: 'premium-plus',
    name: 'Premium Plus',
    description: 'Ultimate experience for power users',
    plans: {
      monthly: process.env.STRIPE_PREMIUM_PLUS_MONTHLY_PRICE_ID || '',
      yearly: process.env.STRIPE_PREMIUM_PLUS_YEARLY_PRICE_ID || '',
    },
    price: {
      monthly: 1999, // $19.99 in cents
      yearly: 19999, // $199.99 in cents
    },
    features: [
      { text: 'Everything in Premium', included: true },
      { text: 'Unlimited book uploads', included: true },
      { text: 'Priority support', included: true },
      { text: 'Early access to new features', included: true },
      { text: 'Advanced AI recommendations', included: true },
      { text: 'Bulk book operations', included: true },
      { text: 'API access', included: true },
      { text: 'Custom themes & fonts', included: true },
      { text: 'White-label options', included: true },
      { text: 'Dedicated account manager', included: true },
    ],
  },
}

export function getSubscriptionTier(plan: SubscriptionPlan): SubscriptionTier {
  return SUBSCRIPTION_TIERS[plan]
}

export function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function getYearlySavings(monthlyPrice: number, yearlyPrice: number): number {
  const monthlyTotal = monthlyPrice * 12
  const savings = monthlyTotal - yearlyPrice
  return Math.round((savings / monthlyTotal) * 100)
}
