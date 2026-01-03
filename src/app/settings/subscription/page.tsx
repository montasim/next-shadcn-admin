import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { SubscriptionManagement } from '@/components/subscription/subscription-management'

export const metadata: Metadata = {
  title: 'Manage Subscription - Book Heaven',
  description: 'Manage your subscription plan and billing',
}

export default async function SubscriptionSettingsPage() {
  const session = await getSession()

  if (!session) {
    redirect('/auth/sign-in')
  }

  return (
    <div className="container mx-auto p-4 py-8 md:py-12">
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your subscription plan
          </p>
        </div>

        <SubscriptionManagement userId={session.userId} />
      </div>
    </div>
  )
}
