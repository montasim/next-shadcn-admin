'use client'

import { Crown } from 'lucide-react'
import { PricingCards } from '@/components/subscription/pricing-cards'
import { FAQSection } from '@/components/faq-section'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SubscriptionPlan } from '@prisma/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function PricingContent() {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('billing') || 'month'

  return (
    <div className="min-h-screen">
      <main className="container mx-auto p-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
                Simple, Transparent Pricing
              </h1>
              <p className="text-sm text-muted-foreground">
                Choose the perfect plan for your reading journey
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8 max-w-2xl">
          <p className="text-muted-foreground">
            All plans include access to our extensive library. Start with our free plan and upgrade
            whenever you're ready. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <Tabs value={activeTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <Link href="/pricing?billing=month">
              <TabsTrigger value="month">Monthly Billing</TabsTrigger>
            </Link>
            <Link href="/pricing?billing=year">
              <TabsTrigger value="year">Yearly Billing (Save 17%)</TabsTrigger>
            </Link>
          </TabsList>

          <TabsContent value="month">
            <PricingCards interval="month" currentPlan={SubscriptionPlan.FREE} showCheckoutButton={true} />
          </TabsContent>

          <TabsContent value="year">
            <PricingCards interval="year" currentPlan={SubscriptionPlan.FREE} showCheckoutButton={true} />
          </TabsContent>
        </Tabs>

        {/* FAQ Section */}
        <FAQSection />

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Cancel Anytime</span>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <main className="container mx-auto p-4 py-8 md:py-12">
          <div className="mb-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
                  Simple, Transparent Pricing
                </h1>
                <p className="text-sm text-muted-foreground">
                  Choose the perfect plan for your reading journey
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    }>
      <PricingContent />
    </Suspense>
  )
}
