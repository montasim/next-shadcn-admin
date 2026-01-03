'use client'

import { useState } from 'react'

interface SubscriptionManagementProps {
  userId: string
}

export function SubscriptionManagement({ userId }: SubscriptionManagementProps) {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-2">Current Plan</h2>
        <p className="text-muted-foreground mb-4">
          You are currently on the free plan.
        </p>
        <button
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Upgrade to Premium'}
        </button>
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-2">Billing History</h2>
        <p className="text-muted-foreground">
          No billing history available.
        </p>
      </div>
    </div>
  )
}
