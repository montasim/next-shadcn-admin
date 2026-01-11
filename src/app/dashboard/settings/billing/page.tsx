import { Metadata } from 'next'
import { BillingManagement } from '@/components/subscription/billing-management'
import { getSiteName } from '@/lib/utils/site-settings'

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSiteName()
  return {
    title: `Billing - ${siteName}`,
    description: `View your billing history and invoices`,
  }
}

export default async function BillingPage() {
  const siteName = await getSiteName()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          View your billing information and invoice history
        </p>
      </div>

      <BillingManagement />
    </div>
  )
}
