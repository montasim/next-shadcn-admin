'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Loader2, Save, RefreshCw, Construction, Palette, Search, Mail } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GeneralTab } from './components/general-tab'
import { BrandingTab } from './components/branding-tab'
import { SEOTab } from './components/seo-tab'
import { ContactTab } from './components/contact-tab'
import { ROUTES } from '@/lib/routes/client-routes'

interface SiteSettings {
  id: string
  underConstruction: boolean
  underConstructionMessage: string | null
  maintenanceMode: boolean
  maintenanceMessage: string | null

  // Branding
  siteName: string
  siteSlogan: string | null
  logoUrl: string | null
  directLogoUrl: string | null
  faviconUrl: string | null
  directFaviconUrl: string | null

  // SEO
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  ogImage: string | null
  directOgImageUrl: string | null

  // Contact
  supportEmail: string | null
  contactEmail: string | null
  socialTwitter: string | null
  socialGithub: string | null
  socialFacebook: string | null
  socialInstagram: string | null
  socialLinkedIn: string | null

  createdAt: string
  updatedAt: string
}

function SiteSettingsPageWrapper() {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'general'
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [underConstructionMessage, setUnderConstructionMessage] = useState('')

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/admin/site/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data.data)
        setUnderConstructionMessage(data.data.underConstructionMessage || '')
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch site settings',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch site settings',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    try {
      setIsSaving(true)
      const res = await fetch('/api/admin/site/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          underConstructionMessage: underConstructionMessage,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setSettings(data.data)
        toast({
          title: 'Success',
          description: 'Site settings updated successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update site settings',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to update site settings',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Tabs skeleton */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Failed to load settings</p>
      </div>
    )
  }

  const TABS = [
    { value: 'general', label: 'General', icon: Construction },
    { value: 'branding', label: 'Branding', icon: Palette },
    { value: 'seo', label: 'SEO', icon: Search },
    { value: 'contact', label: 'Contact', icon: Mail },
  ] as const

  const currentTab = TABS.find(t => t.value === activeTab)

  return (
    <div className="pb-6 overflow-y-auto h-full">
      <Tabs value={activeTab} className="space-y-4 h-full flex flex-col">
        {/* Dynamic Header */}
        {activeTab && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              {currentTab && <currentTab.icon className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{currentTab?.label}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your site {currentTab?.label.toLowerCase()} settings
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="w-full overflow-x-auto">
            <TabsList>
              <Link href={`${ROUTES.siteSettings.href}?tab=general`}>
                <TabsTrigger value="general" className="flex items-center gap-2">
                  <Construction className="h-4 w-4" />
                  <span className="hidden sm:inline">General</span>
                </TabsTrigger>
              </Link>
              <Link href={`${ROUTES.siteSettings.href}?tab=branding`}>
                <TabsTrigger value="branding" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">Branding</span>
                </TabsTrigger>
              </Link>
              <Link href={`${ROUTES.siteSettings.href}?tab=seo`}>
                <TabsTrigger value="seo" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">SEO</span>
                </TabsTrigger>
              </Link>
              <Link href={`${ROUTES.siteSettings.href}?tab=contact`}>
                <TabsTrigger value="contact" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Contact</span>
                </TabsTrigger>
              </Link>
            </TabsList>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              onClick={fetchSettings}
              disabled={isLoading}
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin mr-2' : 'mr-2'}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        <TabsContent value="general" className="flex-1 overflow-y-auto">
          <GeneralTab
            settings={settings}
            setSettings={setSettings}
            underConstructionMessage={underConstructionMessage}
            setUnderConstructionMessage={setUnderConstructionMessage}
            isSaving={isSaving}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="branding" className="flex-1 overflow-y-auto">
          <BrandingTab
            settings={settings}
            setSettings={setSettings}
            isSaving={isSaving}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="seo" className="flex-1 overflow-y-auto">
          <SEOTab
            settings={settings}
            setSettings={setSettings}
            isSaving={isSaving}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="contact" className="flex-1 overflow-y-auto">
          <ContactTab
            settings={settings}
            setSettings={setSettings}
            isSaving={isSaving}
            onSave={handleSave}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Wrapper with Suspense boundary for useSearchParams
export default function SiteSettingsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Tabs skeleton */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    }>
      <SiteSettingsPageWrapper />
    </Suspense>
  )
}
