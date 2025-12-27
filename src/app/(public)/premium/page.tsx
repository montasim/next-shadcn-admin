'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Check,
  Crown,
  Star,
  Sparkles,
  Users,
  BookOpen,
  Download,
  Zap,
  Shield,
  ArrowRight,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      'Access to free books-old',
      'Basic reading progress tracking',
      'Up to 3 bookshelves',
      'Community features',
      'Mobile reading'
    ],
    limitations: [
      'Limited to free books-old only',
      'Ads supported experience',
      'Basic reading features',
      'Limited storage'
    ],
    popular: false,
    buttonText: 'Current Plan',
    disabled: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$9.99',
    period: 'month',
    description: 'Most popular for avid readers',
    features: [
      'Access to all premium books-old',
      'Ad-free reading experience',
      'Unlimited bookshelves',
      'Advanced reading stats',
      'Offline downloads',
      'Reading speed adjustment',
      'Custom themes & fonts',
      'Priority customer support'
    ],
    limitations: [],
    popular: true,
    buttonText: 'Start Premium Trial',
    disabled: false
  },
  {
    id: 'premium-plus',
    name: 'Premium Plus',
    price: '$19.99',
    period: 'month',
    description: 'For the ultimate reading experience',
    features: [
      'Everything in Premium',
      'Early access to new books-old',
      'Exclusive author content',
      'Unlimited offline storage',
      'Family sharing (up to 4 members)',
      'Advanced analytics',
      'Custom reading goals',
      'VIP customer support',
      'Monthly book credits',
      'Exclusive member events'
    ],
    limitations: [],
    popular: false,
    buttonText: 'Go Premium Plus',
    disabled: false
  }
]

export default function PremiumPage() {
  const [selectedPlan, setSelectedPlan] = useState('premium')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async (planId: string) => {
    setIsLoading(true)

    try {
      // Create checkout session
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          billingCycle,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()

      // Redirect to checkout
      window.location.href = url
    } catch (error) {
      console.error('Error creating checkout:', error)
      setIsLoading(false)
    }
  }

  const getAdjustedPrice = (plan: typeof plans[0]) => {
    if (billingCycle === 'yearly' && plan.id !== 'free') {
      const monthlyPrice = parseFloat(plan.price.replace('$', ''))
      const yearlyPrice = monthlyPrice * 12 * 0.8 // 20% discount
      return `$${yearlyPrice.toFixed(2)}/year`
    }
    return `${plan.price}/${plan.period}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-primary to-primary/80">
            <Crown className="h-3 w-3 mr-1" />
            Upgrade Your Reading Experience
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Reading Journey
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock premium features, exclusive content, and an enhanced reading experience
            designed for book lovers like you.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-muted rounded-lg p-1 flex items-center">
            <Button
              variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingCycle('monthly')}
              className="rounded-md"
            >
              Monthly
            </Button>
            <Button
              variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingCycle('yearly')}
              className="rounded-md"
            >
              Yearly
              <Badge className="ml-2 bg-green-100 text-green-800">
                Save 20%
              </Badge>
            </Button>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${plan.popular ? 'ring-2 ring-primary shadow-lg scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-primary to-primary/80 px-4 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-6">
                <div className="flex items-center justify-center mb-4">
                  {plan.id === 'free' && <BookOpen className="h-8 w-8 text-muted-foreground" />}
                  {plan.id === 'premium' && <Crown className="h-8 w-8 text-primary" />}
                  {plan.id === 'premium-plus' && <Sparkles className="h-8 w-8 text-yellow-500" />}
                </div>

                <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                <p className="text-muted-foreground mb-4">{plan.description}</p>

                <div className="flex items-baseline justify-center">
                  <span className="text-3xl font-bold">
                    {getAdjustedPrice(plan).split('/')[0]}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    /{getAdjustedPrice(plan).split('/')[1]}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}

                  {/* Limitations */}
                  {plan.limitations.map((limitation, index) => (
                    <div key={index} className="flex items-start gap-2 opacity-60">
                      <div className="h-5 w-5 border border-muted-foreground/30 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="h-0.5 w-2 bg-muted-foreground/30 rotate-45" />
                      </div>
                      <span className="text-sm">{limitation}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* CTA Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={plan.disabled || isLoading}
                  variant={plan.id === 'free' ? 'outline' : 'default'}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {plan.buttonText}
                      {!plan.disabled && <ArrowRight className="h-4 w-4 ml-2" />}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Feature Comparison</h2>
          <Card>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Feature</th>
                      <th className="text-center py-3 px-4">Free</th>
                      <th className="text-center py-3 px-4">Premium</th>
                      <th className="text-center py-3 px-4">Premium Plus</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4">Access to free books</td>
                      <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Access to premium books</td>
                      <td className="text-center py-3 px-4"><div className="h-4 w-4 text-muted-foreground mx-auto">×</div></td>
                      <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Ad-free experience</td>
                      <td className="text-center py-3 px-4"><div className="h-4 w-4 text-muted-foreground mx-auto">×</div></td>
                      <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Offline downloads</td>
                      <td className="text-center py-3 px-4"><div className="h-4 w-4 text-muted-foreground mx-auto">×</div></td>
                      <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Unlimited bookshelves</td>
                      <td className="text-center py-3 px-4"><div className="h-4 w-4 text-muted-foreground mx-auto">×</div></td>
                      <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Family sharing</td>
                      <td className="text-center py-3 px-4"><div className="h-4 w-4 text-muted-foreground mx-auto">×</div></td>
                      <td className="text-center py-3 px-4"><div className="h-4 w-4 text-muted-foreground mx-auto">×</div></td>
                      <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Monthly book credits</td>
                      <td className="text-center py-3 px-4"><div className="h-4 w-4 text-muted-foreground mx-auto">×</div></td>
                      <td className="text-center py-3 px-4"><div className="h-4 w-4 text-muted-foreground mx-auto">×</div></td>
                      <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Priority support</td>
                      <td className="text-center py-3 px-4"><div className="h-4 w-4 text-muted-foreground mx-auto">×</div></td>
                      <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I switch between plans?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately,
                  and we&apos;ll prorate any differences in cost.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! New users get a 14-day free trial of Premium. You can experience all premium features
                  risk-free before deciding which plan is right for you.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We accept all major credit cards, debit cards, and PayPal. All payments are processed
                  securely through Stripe.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Absolutely. You can cancel your subscription at any time with no cancellation fees.
                  You&apos;ll continue to have access to premium features until the end of your billing period.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 max-w-2xl mx-auto">
            <Crown className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Ready to upgrade your reading?</h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of readers who have transformed their reading experience with Premium.
            </p>
            <Button size="lg" onClick={() => handleSubscribe('premium')} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Start Your Free Trial
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}