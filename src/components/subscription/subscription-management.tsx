'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { SubscriptionPlan } from '@prisma/client'
import { CheckoutButton } from './checkout-button'

interface SubscriptionData {
  plan: SubscriptionPlan
  isActive: boolean
  endDate: string | null
  cancelAtPeriodEnd: boolean
}

export function SubscriptionManagement() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/subscription')
      const data = await response.json()
      setSubscription(data)
    } catch (error) {
      console.error('Error fetching subscription:', error)
      toast.error('Failed to load subscription details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async (immediate: boolean = false) => {
    try {
      const response = await fetch('/api/stripe/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ immediate }),
      })

      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      toast.success(data.message)
      fetchSubscription()
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast.error('Failed to cancel subscription')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-48" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Alert>
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load subscription details. Please refresh the page.
        </AlertDescription>
      </Alert>
    )
  }

  const isFree = subscription.plan === SubscriptionPlan.FREE
  const isPremium = subscription.plan === SubscriptionPlan.PREMIUM
  const isPremiumPlus = subscription.plan === SubscriptionPlan.PREMIUM_PLUS

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your subscription details and billing information</CardDescription>
          </div>
          <Badge variant={isFree ? 'secondary' : 'default'} className="text-sm">
            {subscription.plan.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Active Status */}
        <div className="flex items-center gap-2">
          {subscription.isActive ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <span className="text-sm font-medium">
            {subscription.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Plan Details */}
        {isFree ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              You are currently on the Free plan. Upgrade to Premium to unlock all features.
            </p>
            <div className="flex gap-2">
              <CheckoutButton plan={SubscriptionPlan.PREMIUM} interval="month">
                Upgrade to Premium
              </CheckoutButton>
              <CheckoutButton
                plan={SubscriptionPlan.PREMIUM_PLUS}
                interval="month"
                variant="outline"
              >
                Upgrade to Premium Plus
              </CheckoutButton>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* End Date */}
            {subscription.endDate && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {subscription.cancelAtPeriodEnd
                    ? `Your subscription will be cancelled on ${new Date(subscription.endDate).toLocaleDateString()}`
                    : `Next billing date: ${new Date(subscription.endDate).toLocaleDateString()}`
                  }
                </p>
              </div>
            )}

            {/* Cancellation Notice */}
            {subscription.cancelAtPeriodEnd && (
              <Alert>
                <AlertDescription>
                  Your subscription has been cancelled and will not renew. You can continue using premium
                  features until the end date.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {!subscription.cancelAtPeriodEnd && (
                <Button
                  variant="outline"
                  onClick={() => handleCancel(false)}
                  className="text-destructive hover:text-destructive"
                >
                  Cancel Subscription
                </Button>
              )}
              <CheckoutButton
                plan={isPremium ? SubscriptionPlan.PREMIUM_PLUS : SubscriptionPlan.PREMIUM}
                interval="month"
                variant="outline"
              >
                {isPremium ? 'Upgrade to Premium Plus' : 'Downgrade to Premium'}
              </CheckoutButton>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
