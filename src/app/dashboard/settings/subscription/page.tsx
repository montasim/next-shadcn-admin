import { Metadata } from 'next'
import { SubscriptionManagement } from '@/components/subscription/subscription-management'
import { getSiteName } from '@/lib/utils/site-settings'
import { ROUTES } from '@/lib/routes/client-routes'

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSiteName()
  return {
    title: `Subscription Settings - ${siteName}`,
    description: `Manage your ${siteName} subscription and billing`,
  }
}

export default async function SubscriptionSettingsPage() {
  const siteName = await getSiteName()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription plan and billing preferences
        </p>
      </div>

      <SubscriptionManagement />

      {/* Upgrade Options */}
      <div className="mt-8">
        <h2 className="text-lg font-medium mb-4">Looking to upgrade?</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Explore our premium plans to unlock more features
        </p>
        <a
          href={ROUTES.pricing.href}
          className="text-sm text-primary hover:underline"
        >
          View pricing plans →
        </a>
      </div>
    </div>
  )
}
