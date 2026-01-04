import { Metadata } from 'next'
import { Separator } from '@/components/ui/separator'
import { getSiteName } from '@/lib/utils/site-settings'

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSiteName()
  return {
    title: `Settings - ${siteName}`,
    description: `Manage your ${siteName} account settings`,
  }
}

export default async function SettingsPage() {
  const siteName = await getSiteName()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>
      <Separator />
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Profile Settings</h2>
        <p className="text-sm text-muted-foreground">
          Update your profile information, including your name, bio, and avatar.
        </p>
      </div>
    </div>
  )
}
