'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FileText, Save, Plus, Eye, Shield, ScrollText, Cookie, AlertCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyStateCard } from '@/components/ui/empty-state-card'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DashboardPageHeaderActions } from '@/components/dashboard/dashboard-page-header-actions'
import { LegalContentType } from '@prisma/client'

interface LegalContent {
  id: string
  type: string
  title: string
  content: string
  effectiveDate: Date
  updatedAt: Date
  lastUpdatedBy: {
    name: string
  }
}

const LEGAL_CONTENT_TYPES = [
  { value: 'PRIVACY_POLICY', slug: 'privacy', label: 'Privacy Policy', icon: Shield },
  { value: 'TERMS_OF_SERVICE', slug: 'terms', label: 'Terms of Service', icon: ScrollText },
  { value: 'COOKIE_POLICY', slug: 'cookie', label: 'Cookie Policy', icon: Cookie },
  { value: 'DISCLAIMER', slug: 'disclaimer', label: 'Disclaimer', icon: AlertCircle },
  { value: 'ABOUT', slug: 'about', label: 'About Us', icon: Info },
] as const

function LegalContentPageWrapper() {
  const searchParams = useSearchParams()
  const tabSlug = searchParams.get('tab') || 'privacy'

  // Map slug to value
  const activeTab = LEGAL_CONTENT_TYPES.find(t => t.slug === tabSlug)?.value || 'PRIVACY_POLICY'

  const [contents, setContents] = useState<Record<string, LegalContent>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Dialog state - track which type is being seeded
  const [seedDialogOpen, setSeedDialogOpen] = useState(false)
  const [seedingType, setSeedingType] = useState<LegalContentType | null>(null)

  useEffect(() => {
    fetchContents()
  }, [])

  const fetchContents = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/legal')
      const result = await response.json()
      if (result.success) {
        const contentsMap: Record<string, LegalContent> = {}
        result.data.forEach((content: LegalContent) => {
          contentsMap[content.type] = content
        })
        setContents(contentsMap)
      } else {
        toast.error('Failed to fetch legal content')
      }
    } catch (error) {
      toast.error('Failed to fetch legal content')
    } finally {
      setLoading(false)
    }
  }

  const handleSeed = async (type: LegalContentType) => {
    try {
      const response = await fetch('/api/admin/legal/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const result = await response.json()
      if (result.success) {
        toast.success('Legal content seeded successfully')
        fetchContents()
      } else {
        toast.error(result.message || 'Failed to seed legal content')
      }
    } catch (error) {
      toast.error('Failed to seed legal content')
    } finally {
      setSeedDialogOpen(false)
      setSeedingType(null)
    }
  }

  const handleSave = async (type: string, title: string, content: string) => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/legal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title, content }),
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Legal content saved successfully')
        fetchContents()
      } else {
        toast.error(result.message || 'Failed to save legal content')
      }
    } catch (error) {
      toast.error('Failed to save legal content')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = (type: string) => {
    const typeMap: Record<string, string> = {
      'PRIVACY_POLICY': 'privacy',
      'TERMS_OF_SERVICE': 'terms',
      'ABOUT': 'about',
    }
    const path = typeMap[type] || type.toLowerCase()
    window.open(`/${path}`, '_blank')
  }

  const formatMarkdown = (text: string) => {
    return text
      .replace(/^### (.*$)/gim, '<h3 class="text-md font-semibold mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold mt-6 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mt-6 mb-4">$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n\n/gim, '</p><p class="mt-4">')
      .replace(/\n/gim, '<br />')
      .replace(/^(?!$)/gim, '<p>$&</p>')
  }

  return (
    <DashboardPage
      icon={FileText}
      title="Legal Content"
      description="Manage privacy policy, terms of service, and other legal pages"
      actions={
        <DashboardPageHeaderActions
          actions={[
            {
              label: 'Reset',
              icon: Plus,
              onClick: () => {
                if (activeTab) {
                  setSeedingType(activeTab as LegalContentType)
                  setSeedDialogOpen(true)
                }
              },
              variant: 'outline',
            },
            ...(contents[activeTab] ? [{
              label: 'Preview',
              icon: Eye,
              onClick: () => activeTab && handlePreview(activeTab),
              variant: 'outline' as const,
            }] : []),
          ]}
        />
      }
    >
      {loading ? (
        <div className="space-y-4">
          {/* Tab List Skeleton */}
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-24" />
            ))}
          </div>

          {/* Editor and Preview Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : Object.keys(contents).length === 0 ? (
        <EmptyStateCard
          icon={FileText}
          title="No legal content found"
          description="Get started by seeding initial legal content for Privacy Policy, Terms of Service, and other pages."
        />
      ) : (
        <Tabs value={activeTab} className="space-y-4">
          <div className="w-full overflow-x-auto">
            <TabsList>
              {LEGAL_CONTENT_TYPES.map((type) => (
                <Link key={type.value} href={`/dashboard/legal?tab=${type.slug}`}>
                  <TabsTrigger value={type.value} className="flex items-center gap-2">
                    <type.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{type.label}</span>
                  </TabsTrigger>
                </Link>
              ))}
            </TabsList>
          </div>

          {LEGAL_CONTENT_TYPES.map((type) => {
            const content = contents[type.value]
            const Icon = type.icon
            return (
              <TabsContent key={type.value} value={type.value} className="space-y-4">
                {!content ? (
                  <Card>
                    <CardContent className="py-16 text-center">
                      <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Content Yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Get started by clicking the Reset button above to seed initial content for the {type.label} page.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Editor and Preview side by side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Editor */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Edit Content</CardTitle>
                          <CardDescription>
                            Make changes to the {type.label} content
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <LegalContentEditor
                            type={type.value}
                            content={content}
                            saving={saving}
                            onSave={(title, body) => handleSave(type.value, title, body)}
                          />
                        </CardContent>
                      </Card>

                      {/* Preview */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Live Preview</CardTitle>
                          <CardDescription>
                            See how the content appears on the {type.label} page
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-h3:text-md prose-p:text-base prose-p:leading-relaxed prose-a:text-primary prose-a:underline-offset-4 hover:prose-a:text-primary/80 prose-strong:text-foreground prose-code:text-sm prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-pre:bg-background max-h-[600px] overflow-y-auto">
                            <div dangerouslySetInnerHTML={{ __html: formatMarkdown(content.content) }} />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      )}

      {/* Seed Confirmation Dialog */}
      <AlertDialog open={seedDialogOpen} onOpenChange={setSeedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Seed {LEGAL_CONTENT_TYPES.find(t => t.value === seedingType)?.label}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the {LEGAL_CONTENT_TYPES.find(t => t.value === seedingType)?.label} to default content. Any custom changes will be lost. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => seedingType && handleSeed(seedingType)}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardPage>
  )
}

// Wrapper with Suspense boundary for useSearchParams
export default function LegalContentPage() {
  return (
    <Suspense fallback={
      <DashboardPage
        icon={FileText}
        title="Legal Content"
        description="Manage privacy policy, terms of service, and other legal pages"
      >
        <div className="space-y-4">
          {/* Tab List Skeleton */}
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-24" />
            ))}
          </div>

          {/* Editor and Preview Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-32 w-full" />
            </div>
            <div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </DashboardPage>
    }>
      <LegalContentPageWrapper />
    </Suspense>
  )
}

interface LegalContentEditorProps {
  type: string
  content: LegalContent
  saving: boolean
  onSave: (title: string, content: string) => void
}

function LegalContentEditor({
  type,
  content,
  saving,
  onSave,
}: LegalContentEditorProps) {
  const [title, setTitle] = useState(content.title)
  const [body, setBody] = useState(content.content)
  const [hasChanges, setHasChanges] = useState(false)

  const handleSave = () => {
    onSave(title, body)
    setHasChanges(false)
  }

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setHasChanges(true)
            }}
            placeholder="Enter title..."
          />
        </div>

        <div className="space-y-2">
          <Label>Content (Markdown supported)</Label>
          <Textarea
            value={body}
            onChange={(e) => {
              setBody(e.target.value)
              setHasChanges(true)
            }}
            placeholder="Enter content in Markdown format..."
            rows={20}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Tip: You can use Markdown formatting for headings (#, ##), lists, links, and more.
          </p>
        </div>

        {hasChanges && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">You have unsaved changes</p>
            <Button onClick={handleSave} disabled={saving} size="sm">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
