'use client'

import { useEffect, useState } from 'react'
import { Megaphone, Calendar, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MDXViewer } from '@/components/ui/mdx-viewer'
import { HeaderContainer } from '@/components/ui/header-container'
import { NavigationBreadcrumb } from '@/components/ui/breadcrumb'
import { Home } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface Notice {
  id: string
  title: string
  content: string
  isActive: boolean
  validFrom: string | null
  validTo: string | null
  order: number
  createdAt: string
}

interface NoticesResponse {
  success: boolean
  data: {
    notices: Notice[]
    total: number
  }
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchNotices() {
      try {
        const res = await fetch('/api/public/notices', {
          cache: 'no-store',
        })
        if (res.ok) {
          const data: NoticesResponse = await res.json()
          setNotices(data.data.notices)
        }
      } catch (error) {
        console.error('Failed to fetch notices:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotices()
  }, [])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const isNoticeValid = (notice: Notice) => {
    const now = new Date()
    if (notice.validFrom && new Date(notice.validFrom) > now) return false
    if (notice.validTo && new Date(notice.validTo) < now) return false
    return true
  }

  const validNotices = notices.filter(isNoticeValid)

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <HeaderContainer>
          <NavigationBreadcrumb
            className="mb-4"
            items={[
              { label: 'Home', href: '/', icon: <Home className="h-4 w-4" /> },
              { label: 'Notices' },
            ]}
          />
        </HeaderContainer>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Megaphone className="h-6 w-6 text-primary" />
                Notices & Announcements
              </h1>
              <p className="text-muted-foreground">
                Stay updated with the latest news and announcements
              </p>
            </div>
            <Badge variant="secondary" className="text-sm shrink-0">
              {validNotices.length} Active
            </Badge>
          </div>
        </div>
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : validNotices.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Notices</h3>
              <p className="text-muted-foreground">
                Check back later for new announcements and updates.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {validNotices.map((notice) => (
              <Card key={notice.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{notice.title}</CardTitle>
                      <CardDescription className="flex items-center gap-4 text-sm">
                        {notice.validFrom && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            From: {formatDate(notice.validFrom)}
                          </span>
                        )}
                        {notice.validTo && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            To: {formatDate(notice.validTo)}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <MDXViewer content={notice.content} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
