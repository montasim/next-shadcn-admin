'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SUBSCRIPTION_TIERS, formatPrice, getYearlySavings, getSubscriptionTier } from '@/lib/stripe/config'
import { SubscriptionPlan } from '@prisma/client'
import { CheckoutButton } from '@/components/subscription/checkout-button'

interface PricingCardsProps {
  interval?: 'month' | 'year'
  currentPlan?: SubscriptionPlan
  showCheckoutButton?: boolean
}

export function PricingCards({
  interval = 'month',
  currentPlan = SubscriptionPlan.FREE,
  showCheckoutButton = true,
}: PricingCardsProps) {
  return (
    <div className="grid gap-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {Object.values(SUBSCRIPTION_TIERS).map((tier) => {
        const tierKey = tier.id.toUpperCase().replace('-', '_') as SubscriptionPlan
        const price = tier.price[interval === 'month' ? 'monthly' : 'yearly']
        const isCurrentPlan = tierKey === currentPlan
        const savings = interval === 'year' ? getYearlySavings(tier.price.monthly, tier.price.yearly) : 0

        return (
          <Card
            key={tier.id}
            className={`relative ${tier.popular ? 'border-primary shadow-lg scale-105' : ''}`}
          >
            {tier.popular && (
              <Badge className="absolute -top-2 left-1/2 -translate-x-1/2" variant="default">
                Most Popular
              </Badge>
            )}

            <CardHeader>
              <CardTitle className="text-xl">{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${formatPrice(price)}</span>
                  <span className="text-muted-foreground">/{interval}</span>
                </div>
                {savings > 0 && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    Save {savings}% with yearly billing
                  </p>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {tier.features.map((feature) => (
                <div key={feature.text} className="flex items-start gap-2">
                  <Check
                    className={`h-5 w-5 mt-0.5 ${feature.included ? 'text-green-600' : 'text-muted-foreground'}`}
                  />
                  <span
                    className={`text-sm ${feature.included ? 'text-foreground' : 'text-muted-foreground line-through'}`}
                  >
                    {feature.text}
                  </span>
                </div>
              ))}
            </CardContent>

            <CardFooter>
              {isCurrentPlan ? (
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              ) : tierKey === SubscriptionPlan.FREE ? (
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              ) : showCheckoutButton ? (
                <CheckoutButton
                  plan={tierKey}
                  interval={interval}
                  className="w-full"
                  variant={tier.popular ? 'default' : 'outline'}
                >
                  Upgrade to {tier.name}
                </CheckoutButton>
              ) : (
                <Button
                  className="w-full"
                  variant={tier.popular ? 'default' : 'outline'}
                  asChild
                >
                  <Link href={`/pricing?plan=${tierKey}&interval=${interval}`}>
                    Choose {tier.name}
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
