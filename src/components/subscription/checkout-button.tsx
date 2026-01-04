'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { SubscriptionPlan } from '@prisma/client'
import { publicConfig } from '@/config'

const stripePromise = loadStripe(publicConfig.stripePublishableKey)

interface CheckoutButtonProps {
  plan: SubscriptionPlan
  interval: 'month' | 'year'
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  children?: React.ReactNode
}

export function CheckoutButton({
  plan,
  interval,
  className,
  variant = 'default',
  children,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          interval,
        }),
      })

      const { sessionId, url, error } = await response.json()

      if (error) {
        toast.error(error)
        setIsLoading(false)
        return
      }

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url
      } else if (sessionId) {
        // Use Stripe.js redirect
        const stripe = await stripePromise
        if (!stripe) {
          toast.error('Failed to load Stripe')
          setIsLoading(false)
          return
        }

        const { error } = await stripe.redirectToCheckout({ sessionId })

        if (error) {
          toast.error(error.message)
          setIsLoading(false)
        }
      }
    } catch (error: any) {
      console.error('Checkout error:', error)
      toast.error(error.message || 'Failed to initiate checkout')
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleCheckout}
      disabled={isLoading || plan === SubscriptionPlan.FREE}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        children || 'Get Started'
      )}
    </Button>
  )
}
