'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BlogPostForm } from '../components/blog-post-form'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { FileText, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function NewBlogPostPage() {
  const router = useRouter()
  const formRef = useRef<{ submit: () => void }>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Handle mounting state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Form Skeleton */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Main Form Card */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <div className="border-t" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-48" />
              <div className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
              </div>
            </CardContent>
          </Card>

          {/* Preview Card */}
          <Card>
            <CardContent className="p-4">
              <div className="pb-4 border-b">
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-48 w-full mt-4" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <DashboardPage
      icon={FileText}
      title="Create New Post"
      description="Write and publish a new blog post"
      actions={[
        {
          label: 'Create Post',
          icon: FileText,
          onClick: () => formRef.current?.submit(),
        },
        {
          label: 'Cancel',
          icon: X,
          onClick: () => router.back(),
          variant: 'outline',
        },
      ]}
    >
      <BlogPostForm ref={formRef} />
    </DashboardPage>
  )
}
