'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import useSWR, { mutate } from 'swr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  BookOpen,
  Users,
  MessageSquare,
  BarChart3,
  FileText,
  ArrowLeft,
  Edit,
  Trash2,
  ExternalLink,
  Eye,
  TrendingUp,
  Calendar,
  Building2,
  Tag,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { BookTypeBadge } from '@/components/books/book-type-badge'
import { ViewsOverTimeChart } from '@/components/analytics/views-over-time-chart'
import { DashboardSummary } from '@/components/dashboard/dashboard-summary'
import { BooksMutateDrawer } from '../components/books-mutate-drawer'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { Book } from '../data/schema'
import {router} from "next/client";
import { MDXViewer } from '@/components/ui/mdx-viewer'
import { Skeleton } from '@/components/ui/skeleton'

// Common styles
const STYLES = {
  metadataLabel: 'text-muted-foreground',
  metadataValue: 'font-medium mt-1',
  metadataValueText: 'text-foreground',
  adminLabel: 'text-xs text-muted-foreground',
  adminValue: 'text-xs font-medium mt-1',
  userLink: 'text-xs font-medium hover:text-primary hover:underline transition-colors',
  expandButton: 'h-8 w-8 p-0',
} as const

// Helper Components
function MetadataItem({ label, value, valueClassName = '' }: { label: string; value: React.ReactNode; valueClassName?: string }) {
  return (
    <div>
      <span className={STYLES.metadataLabel}>{label}</span>
      <div className={`${STYLES.metadataValue} ${STYLES.metadataValueText} ${valueClassName}`}>{value}</div>
    </div>
  )
}

function AdminMetadataItem({ label, value, valueClassName = '' }: { label: string; value: React.ReactNode; valueClassName?: string }) {
  return (
    <div>
      <span className={STYLES.adminLabel}>{label}</span>
      <div className={`${STYLES.adminValue} ${valueClassName}`}>{value}</div>
    </div>
  )
}

function UserLinkButton({ user, className = '' }: { user: any; className?: string }) {
  if (!user) return null
  return (
    <button
      onClick={() => user.id && router.push(`/dashboard/users/${user.id}`)}
      className={`${STYLES.userLink} ${className}`}
    >
      {user.name || user.username || 'Unknown'}
    </button>
  )
}

function ExpandableCardHeader({
  icon: Icon,
  title,
  subtitle,
  isExpanded,
  onToggle,
  actionButton,
}: {
  icon: any
  title: string
  subtitle?: React.ReactNode
  isExpanded: boolean
  onToggle: () => void
  actionButton?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className={STYLES.expandButton} onClick={onToggle}>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
        </div>
      </div>
      {actionButton}
    </div>
  )
}

// Book Details Skeleton Component
function BookDetailsSkeleton() {
  return (
    <div className="bg-background h-screen overflow-y-auto no-scrollbar pb-4">
      {/* Action Buttons Skeleton */}
      <div className="flex lg:justify-end justify-between gap-2 mb-4 px-4">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-20" />
      </div>

      <div className="space-y-6 px-4">
        {/* Header Skeleton */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Book Image Skeleton */}
          <div className="relative w-full sm:max-w-[350px] lg:w-[410px] lg:h-[600px] aspect-[410/600] rounded-lg bg-muted mx-auto lg:mx-0">
            <Skeleton className="w-full h-full rounded-lg" />
          </div>

          <div className="flex-1 space-y-6">
            {/* Title and Badges Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-7 w-3/4 max-w-md" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-5 w-1/2 max-w-xs" />
            </div>

            {/* Categories Skeleton */}
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-6 w-20" />
            </div>

            {/* Metadata Grid Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
              <MetadataItemSkeleton />
              <MetadataItemSkeleton />
              <MetadataItemSkeleton />
              <MetadataItemSkeleton />
              <MetadataItemSkeleton />
              <MetadataItemSkeleton />
              <MetadataItemSkeleton />
              <MetadataItemSkeleton />
            </div>

            <Skeleton className="h-px w-full" />

            {/* Admin Information Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              <AdminMetadataItemSkeleton />
              <AdminMetadataItemSkeleton />
              <AdminMetadataItemSkeleton />
              <AdminMetadataItemSkeleton />
            </div>

            {/* Dashboard Summary Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <SummaryCardSkeleton />
              <SummaryCardSkeleton />
              <SummaryCardSkeleton />
              <SummaryCardSkeleton />
              <SummaryCardSkeleton />
            </div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-28" />
            </div>
            <Skeleton className="h-9 w-28" />
          </div>

          {/* Tab Content Skeleton */}
          <div className="space-y-4">
            {/* AI Summary Card Skeleton */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8" />
                    <div>
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-32" />
                </div>
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>

            {/* AI Overview Card Skeleton */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8" />
                    <div>
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-32" />
                </div>
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </CardContent>
            </Card>

            {/* Key Questions Card Skeleton */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8" />
                    <div>
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-32" />
                </div>
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <QuestionCardSkeleton />
                  <QuestionCardSkeleton />
                  <QuestionCardSkeleton />
                  <QuestionCardSkeleton />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Metadata Item Skeleton
function MetadataItemSkeleton() {
  return (
    <div>
      <Skeleton className="h-4 w-20 mb-2" />
      <Skeleton className="h-5 w-24" />
    </div>
  )
}

// Admin Metadata Item Skeleton
function AdminMetadataItemSkeleton() {
  return (
    <div>
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-4 w-32" />
    </div>
  )
}

// Summary Card Skeleton
function SummaryCardSkeleton() {
  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

// Question Card Skeleton
function QuestionCardSkeleton() {
  return (
    <div className="p-3 border rounded-lg">
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}

export default function AdminBookDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookId = params.id as string
  const activeTab = searchParams.get('tab') || 'overview'

  // Edit drawer state
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)

  // Edit question state
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [editQuestionText, setEditQuestionText] = useState('')
  const [editAnswerText, setEditAnswerText] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // AI Summary state
  const [isRegeneratingSummary, setIsRegeneratingSummary] = useState(false)
  const [isRegeneratingOverview, setIsRegeneratingOverview] = useState(false)
  const [isRegeneratingQuestions, setIsRegeneratingQuestions] = useState(false)
  const [pollCount, setPollCount] = useState(0)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Expand/collapse state using Set pattern
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set(['ai-summary', 'ai-overview', 'key-questions']))

  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(cardId)) {
        newSet.delete(cardId)
      } else {
        newSet.add(cardId)
      }
      return newSet
    })
  }

  const toggleAllCards = () => {
    const allCards = ['ai-summary', 'ai-overview', 'key-questions']
    if (expandedCards.size === allCards.length) {
      setExpandedCards(new Set())
    } else {
      setExpandedCards(new Set(allCards))
    }
  }

  const fetcher = async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch data')
    const json = await res.json()
    return json
  }

  // Handle edit question
  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question)
    setEditQuestionText(question.question)
    setEditAnswerText(question.answer)
  }

  // Handle save question
  const handleSaveQuestion = async () => {
    if (!editingQuestion) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/books/${bookId}/suggested-questions/${editingQuestion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: editQuestionText,
          answer: editAnswerText,
        }),
      })

      if (!response.ok) throw new Error('Failed to update question')

      toast({ title: 'Question updated successfully' })

      // Close dialog and mutate to refresh data
      setEditingQuestion(null)
      mutate(`/api/admin/books/${bookId}/details`)
    } catch (error) {
      toast({ title: 'Failed to update question', variant: 'destructive' })
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingQuestion(null)
    setEditQuestionText('')
    setEditAnswerText('')
  }

  // Handle regenerate AI summary
  const handleRegenerateSummary = async () => {
    setIsRegeneratingSummary(true)
    setPollCount(0)
    try {
      const response = await fetch(`/api/books/${bookId}/regenerate-summary`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to regenerate summary')
      }

      toast({
        title: 'Summary regeneration started',
        description: 'The AI summary is being generated in the background. You can navigate away and come back.',
      })

      // Start polling for updates
      pollIntervalRef.current = setInterval(() => {
        setPollCount(prev => prev + 1)
        mutate(`/api/admin/books/${bookId}/details`)
      }, 10000) // Poll every 10 seconds

      // Auto-stop polling after 5 minutes
      setTimeout(() => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
          setIsRegeneratingSummary(false)
        }
      }, 300000) // 5 minutes
    } catch (error: any) {
      toast({
        title: 'Failed to regenerate summary',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      })
      setIsRegeneratingSummary(false)
    }
  }

  // Handle regenerate AI overview
  const handleRegenerateOverview = async () => {
    setIsRegeneratingOverview(true)
    setPollCount(0)
    try {
      const response = await fetch(`/api/books/${bookId}/regenerate-overview`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to regenerate overview')
      }

      toast({
        title: 'Overview regeneration started',
        description: 'The AI overview is being generated in the background. You can navigate away and come back.',
      })

      // Start polling for updates
      pollIntervalRef.current = setInterval(() => {
        setPollCount(prev => prev + 1)
        mutate(`/api/admin/books/${bookId}/details`)
      }, 10000) // Poll every 10 seconds

      // Auto-stop polling after 5 minutes
      setTimeout(() => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
          setIsRegeneratingOverview(false)
        }
      }, 300000) // 5 minutes
    } catch (error: any) {
      toast({
        title: 'Failed to regenerate overview',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      })
      setIsRegeneratingOverview(false)
    }
  }

  // Handle regenerate AI questions
  const handleRegenerateQuestions = async () => {
    setIsRegeneratingQuestions(true)
    setPollCount(0)
    try {
      const response = await fetch(`/api/books/${bookId}/regenerate-questions`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to regenerate questions')
      }

      toast({
        title: 'Questions regeneration started',
        description: 'The AI questions are being generated in the background. You can navigate away and come back.',
      })

      // Start polling for updates
      pollIntervalRef.current = setInterval(() => {
        setPollCount(prev => prev + 1)
        mutate(`/api/admin/books/${bookId}/details`)
      }, 10000) // Poll every 10 seconds

      // Auto-stop polling after 5 minutes
      setTimeout(() => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
          setIsRegeneratingQuestions(false)
        }
      }, 300000) // 5 minutes
    } catch (error: any) {
      toast({
        title: 'Failed to regenerate questions',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      })
      setIsRegeneratingQuestions(false)
    }
  }

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  // Fetch book details
  const { data: bookData, isLoading, error } = useSWR(
    `/api/admin/books/${bookId}/details`,
    fetcher
  )

  const book = bookData?.data as Book | null;

  // Stop polling when summary is ready or failed
  useEffect(() => {
    if (book && isRegeneratingSummary) {
      if (book.aiSummaryStatus === 'completed' && book.aiSummary) {
        // Summary is ready
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setIsRegeneratingSummary(false)
        toast({
          title: 'Summary generated successfully',
          description: 'The AI summary has been generated.',
        })
      } else if (book.aiSummaryStatus === 'failed') {
        // Generation failed
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setIsRegeneratingSummary(false)
        toast({
          title: 'Summary generation failed',
          description: 'Failed to generate the summary. Please try again.',
          variant: 'destructive',
        })
      }
    }
  }, [book, isRegeneratingSummary])

  // Stop polling when overview is ready or failed
  useEffect(() => {
    if (book && isRegeneratingOverview) {
      if (book.aiOverviewStatus === 'completed' && book.aiOverview) {
        // Overview is ready
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setIsRegeneratingOverview(false)
        toast({
          title: 'Overview generated successfully',
          description: 'The AI overview has been generated.',
        })
      } else if (book.aiOverviewStatus === 'failed') {
        // Generation failed
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setIsRegeneratingOverview(false)
        toast({
          title: 'Overview generation failed',
          description: 'Failed to generate the overview. Please try again.',
          variant: 'destructive',
        })
      }
    }
  }, [book, isRegeneratingOverview])

  // Stop polling when questions are ready or failed
  useEffect(() => {
    if (book && isRegeneratingQuestions) {
      if (book.questionsStatus === 'completed' && book.questions && book.questions.length > 0) {
        // Questions are ready
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setIsRegeneratingQuestions(false)
        toast({
          title: 'Questions generated successfully',
          description: `Successfully generated ${book.questions.length} questions.`,
        })
      } else if (book.questionsStatus === 'failed') {
        // Generation failed
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setIsRegeneratingQuestions(false)
        toast({
          title: 'Questions generation failed',
          description: 'Failed to generate the questions. Please try again.',
          variant: 'destructive',
        })
      }
    }
  }, [book, isRegeneratingQuestions])

  if (isLoading) {
    return <BookDetailsSkeleton />
  }

  if (error || !book) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load book details</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  // Now we're sure book exists
  // For Google Drive images, use the proxied URL instead of direct URL
  // because direct download URLs don't work in img tags
  const imageUrl = (book.image && getProxiedImageUrl(book.image))
    || book.directImageUrl
    || book.image
    || '/placeholder-book.png'

  return (
    <div className="bg-background h-screen overflow-y-auto no-scrollbar pb-4">
      {/* Action Buttons - Mobile Friendly */}
      <div className="flex lg:justify-end justify-between gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={() => router.push(`/books/${book.id}`)}>
          <ExternalLink className="h-4 w-4 mr-2" />
          View Public Page
        </Button>
        <Button variant="outline" size="sm" onClick={() => setIsEditDrawerOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Book Image - Responsive */}
          <div className="relative w-full sm:max-w-[350px] lg:w-[410px] lg:h-[600px] aspect-[410/600] rounded-lg overflow-hidden shadow-lg bg-muted">
            <Image
              src={imageUrl}
              alt={book.name}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 350px, 410px"
              unoptimized
            />
          </div>

          <div className="flex-1 space-y-6">
            {/* Book Title and Badges */}
            <div className="space-y-4">
              <h1 className="text-xl font-bold">{book.name}</h1>

              <div className="flex flex-wrap items-center gap-2">
                <BookTypeBadge type={book.type} />
                {book.isPublic && <Badge variant="secondary">Public</Badge>}
                {book.requiresPremium && <Badge variant="outline">Premium</Badge>}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {book.authors?.length > 0 && (
                  <span>
                    By{' '}
                    {book.authors.map((a: any, index: number) => (
                      <span key={a.author.id}>
                        {index > 0 && ', '}
                        <button
                          onClick={() => router.push(`/authors/${a.author.id}`)}
                          className="hover:text-foreground hover:underline transition-colors"
                        >
                          {a.author.name}
                        </button>
                      </span>
                    ))}
                  </span>
                )}
              </div>
            </div>

            {/* Categories */}
            {book.categories?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {book.categories.map((c: any) => (
                  <Badge
                    key={c.category.id}
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
                    onClick={() => router.push(`/categories/${c.category.id}`)}
                  >
                    {c.category.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Metadata - Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 text-sm">
              {book.language && <MetadataItem label="Language:" value={book.language} valueClassName="capitalize" />}
              {book.pageNumber && <MetadataItem label="Pages:" value={book.pageNumber} />}
              {book.contentWordCount && <MetadataItem label="Words:" value={book.contentWordCount.toLocaleString()} />}
              <MetadataItem label="Copies:" value={book.numberOfCopies || 'N/A'} />
              <MetadataItem label="Buying Price:" value={`৳${book.buyingPrice || 'N/A'}`} />
              <MetadataItem label="Selling Price:" value={`৳${book.sellingPrice || 'N/A'}`} />
              {book.extractionStatus && (
                <MetadataItem
                  label="Extraction Status:"
                  value={book.extractionStatus}
                  valueClassName={book.extractionStatus === 'completed' ? 'text-green-600' : ''}
                />
              )}
              {book.contentHash && <MetadataItem label="Content Hash:" value={book.contentHash} valueClassName="text-xs break-all" />}
            </div>

            <Separator />

            {/* Admin Information */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              <AdminMetadataItem
                label="Created:"
                value={book.createdAt ? new Date(book.createdAt).toLocaleString() : 'N/A'}
              />
              <AdminMetadataItem
                label="Last Updated:"
                value={book.updatedAt ? new Date(book.updatedAt).toLocaleString() : 'N/A'}
              />
              {book.entryBy && (
                <AdminMetadataItem label="Entered By:" value={
                  <div className="flex items-center gap-2 -mt-1">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={book.entryBy.directAvatarUrl} />
                      <AvatarFallback className="text-[10px]">
                        {book.entryBy.name?.[0] || book.entryBy.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <UserLinkButton user={book.entryBy} />
                  </div>
                } />
              )}
              {book.series && <AdminMetadataItem label="Series:" value={book.series.name} />}
            </div>

              {/* Quick Stats */}
              <DashboardSummary
                summaries={[
                  {
                    title: 'Total Views',
                    value: book.analytics?.totalViews || 0,
                    description: 'All time views',
                    icon: Eye,
                  },
                  {
                    title: 'Readers',
                    value: book.analytics?.totalReaders || 0,
                    description: `${book.analytics?.currentlyReading || 0} currently reading`,
                    icon: Users,
                  },
                  {
                    title: 'Chat Messages',
                    value: book.analytics?.totalChatMessages || 0,
                    description: 'Total messages',
                    icon: MessageSquare,
                  },
                  {
                    title: 'Avg Progress',
                    value: `${Math.round(book.analytics?.avgProgress || 0)}%`,
                    description: 'Average reader progress',
                    icon: TrendingUp,
                  },
                  {
                    title: 'Avg Response Time',
                    value: book.analytics?.avgResponseTime || 'N/A',
                    description: 'Average chat response',
                    icon: MessageSquare,
                  },
                ]}
              />
            </div>
          </div>

        {/* Tabs */}
        <Tabs value={activeTab} className="space-y-4">
          <div className="w-full overflow-x-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <TabsList className="overflow-x-auto w-full sm:w-auto">
                <Link href={`/dashboard/books/${bookId}?tab=overview`}>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                </Link>
                <Link href={`/dashboard/books/${bookId}?tab=analytics`}>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </Link>
                <Link href={`/dashboard/books/${bookId}?tab=readers`}>
                  <TabsTrigger value="readers">Readers</TabsTrigger>
                </Link>
                <Link href={`/dashboard/books/${bookId}?tab=chat`}>
                  <TabsTrigger value="chat">Chat History</TabsTrigger>
                </Link>
              </TabsList>
              {activeTab === 'overview' && (
                <div className="flex gap-2 flex-shrink-0 sm:self-end">
                  <Button onClick={toggleAllCards} variant="outline" size="sm">
                    {expandedCards.size === 3 ? 'Collapse All' : 'Expand All'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* AI Summary */}
            <Card>
              <CardHeader>
                <ExpandableCardHeader
                  icon={Sparkles}
                  title="AI Summary"
                  subtitle={
                    (book.aiSummary || (book.aiSummaryStatus === 'completed' && book.aiSummaryGeneratedAt)) &&
                    `Generated on ${book.aiSummaryGeneratedAt ? new Date(book.aiSummaryGeneratedAt).toLocaleString() : 'recently'}`
                  }
                  isExpanded={expandedCards.has('ai-summary')}
                  onToggle={() => toggleCard('ai-summary')}
                  actionButton={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateSummary}
                      disabled={isRegeneratingSummary}
                    >
                      {isRegeneratingSummary ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline ml-2">Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span className="hidden sm:inline ml-2">{book.aiSummary ? 'Regenerate' : 'Generate'} Summary</span>
                        </>
                      )}
                    </Button>
                  }
                />
                <CardDescription>
                  {isRegeneratingSummary && (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Generating summary... Polling {pollCount > 0 ? `(${pollCount})` : ''}
                    </span>
                  )}
                  {!isRegeneratingSummary && book.aiSummaryStatus === 'pending' && 'Summary is being generated...'}
                  {!isRegeneratingSummary && book.aiSummaryStatus === 'failed' && 'Failed to generate summary. Please try again.'}
                  {!isRegeneratingSummary && !book.aiSummaryStatus && 'Generate an AI summary of this book'}
                </CardDescription>
              </CardHeader>
              {expandedCards.has('ai-summary') && (
                <CardContent>
                  {book.aiSummary ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{book.aiSummary}</p>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No AI summary available yet.</p>
                      <p className="text-xs mt-1">Click the button above to generate one.</p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* AI Overview */}
            <Card>
              <CardHeader>
                <ExpandableCardHeader
                  icon={FileText}
                  title="AI Overview"
                  subtitle={
                    book.aiOverviewStatus === 'completed' && book.aiOverviewGeneratedAt &&
                    `Generated on ${new Date(book.aiOverviewGeneratedAt).toLocaleString()}`
                  }
                  isExpanded={expandedCards.has('ai-overview')}
                  onToggle={() => toggleCard('ai-overview')}
                  actionButton={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateOverview}
                      disabled={isRegeneratingOverview}
                    >
                      {isRegeneratingOverview ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline ml-2">Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span className="hidden sm:inline ml-2">{book.aiOverview ? 'Regenerate' : 'Generate'} Overview</span>
                        </>
                      )}
                    </Button>
                  }
                />
                <CardDescription>
                  {isRegeneratingOverview && (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Generating overview... Polling {pollCount > 0 ? `(${pollCount})` : ''}
                    </span>
                  )}
                  {!isRegeneratingOverview && book.aiOverviewStatus === 'pending' && 'Overview is being generated...'}
                  {!isRegeneratingOverview && book.aiOverviewStatus === 'failed' && 'Failed to generate overview. Please try again.'}
                  {!isRegeneratingOverview && !book.aiOverviewStatus && 'Generate an AI overview of this book'}
                </CardDescription>
              </CardHeader>
              {expandedCards.has('ai-overview') && (
                <CardContent>
                  {book.aiOverview ? (
                    <MDXViewer content={book.aiOverview} />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No AI overview available yet.</p>
                      <p className="text-xs mt-1">Click the button above to generate one.</p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Key Questions */}
            <Card>
              <CardHeader>
                <ExpandableCardHeader
                  icon={MessageSquare}
                  title="Key Questions"
                  subtitle={
                    book.questionsStatus === 'completed' && book.questionsGeneratedAt &&
                    `Generated ${book.questions?.length || 0} questions on ${new Date(book.questionsGeneratedAt).toLocaleString()}`
                  }
                  isExpanded={expandedCards.has('key-questions')}
                  onToggle={() => toggleCard('key-questions')}
                  actionButton={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateQuestions}
                      disabled={isRegeneratingQuestions}
                    >
                      {isRegeneratingQuestions ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline ml-2">Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span className="hidden sm:inline ml-2">{book.questions && book.questions.length > 0 ? 'Regenerate' : 'Generate'} Questions</span>
                        </>
                      )}
                    </Button>
                  }
                />
                <CardDescription>
                  {isRegeneratingQuestions && (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Generating questions... Polling {pollCount > 0 ? `(${pollCount})` : ''}
                    </span>
                  )}
                  {!isRegeneratingQuestions && book.questionsStatus === 'pending' && 'Questions are being generated...'}
                  {!isRegeneratingQuestions && book.questionsStatus === 'failed' && 'Failed to generate questions. Please try again.'}
                </CardDescription>
              </CardHeader>
              {expandedCards.has('key-questions') && (
                <CardContent>
                  {book.questions && book.questions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {book.questions.map((q: any) => (
                        <div key={q.id} className="group relative p-3 border rounded-lg hover:border-primary/50 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{q.question}</p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{q.answer}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0"
                              onClick={() => handleEditQuestion(q)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No key questions available yet.</p>
                      <p className="text-xs mt-1">Click the button above to generate AI-powered questions.</p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsTab bookId={bookId} />
          </TabsContent>

          {/* Readers Tab */}
          <TabsContent value="readers">
            <ReadersTab bookId={bookId} />
          </TabsContent>

          {/* Chat History Tab */}
          <TabsContent value="chat">
            <ChatHistoryTab bookId={bookId} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Question Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>
              Update the question and answer for this suggested question.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Textarea
                id="question"
                value={editQuestionText}
                onChange={(e) => setEditQuestionText(e.target.value)}
                placeholder="Enter the question..."
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer">Answer</Label>
              <Textarea
                id="answer"
                value={editAnswerText}
                onChange={(e) => setEditAnswerText(e.target.value)}
                placeholder="Enter the answer..."
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuestion} disabled={isUpdating || !editQuestionText.trim() || !editAnswerText.trim()}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Book Drawer */}
      {book && (
        <BooksMutateDrawer
          key={`edit-book-${bookId}`}
          open={isEditDrawerOpen}
          onOpenChange={setIsEditDrawerOpen}
          currentRow={book as unknown as Book}
          onSuccess={() => {
            mutate(`/api/admin/books/${bookId}/details`)
            setIsEditDrawerOpen(false)
          }}
        />
      )}
    </div>
  )
}

// Analytics Tab Component
function AnalyticsTab({ bookId }: { bookId: string }) {
  const { data, isLoading } = useSWR(`/api/admin/books/${bookId}/visits?chart=true`, (url) => fetch(url).then(r => r.json()))
  const chartData = data?.data?.chart
  const recentVisits = data?.data?.recentVisits || []

  if (isLoading) {
    return <AnalyticsTabSkeleton />
  }

  return (
    <div className="space-y-4">
      {chartData && (
        <ViewsOverTimeChart
          data={chartData}
          title="Views Over Time"
        />
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest views on this book</CardDescription>
        </CardHeader>
        <CardContent>
          {recentVisits.length > 0 ? (
            <div className="space-y-3">
              {recentVisits.map((visit: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Eye className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">
                        {visit.user?.name || visit.user?.username || 'Anonymous User'}
                      </p>
                      {visit.user?.name && (
                        <span className="text-xs text-muted-foreground">
                          viewed this book
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(visit.visitedAt || visit.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(visit.visitedAt || visit.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No recent activity yet</p>
              <p className="text-xs text-muted-foreground mt-1">Views will appear here when users visit this book</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Analytics Tab Skeleton Component
function AnalyticsTabSkeleton() {
  return (
    <div className="space-y-4">
      {/* Chart Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          {/* Chart area skeleton */}
          <div className="space-y-3">
            <div className="flex items-end justify-between gap-2 h-48 px-2">
              {/* Generate 12 chart bars */}
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${40 + Math.random() * 60}%` }} />
              ))}
            </div>
            {/* X-axis labels skeleton */}
            <div className="flex justify-between px-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-3 w-12" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                <Skeleton className="flex-shrink-0 w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <div className="flex gap-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Readers Tab Component
function ReadersTab({ bookId }: { bookId: string }) {
  const { data, isLoading } = useSWR(`/api/admin/books/${bookId}/readers`, (url) => fetch(url).then(r => r.json()))
  const readers = data?.data?.readers?.readers || []

  if (isLoading) {
    return <ReadersTabSkeleton />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Readers</CardTitle>
        <CardDescription>{readers.length} readers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {readers.map((reader: any) => (
            <div key={reader.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={reader.user.directAvatarUrl} />
                  <AvatarFallback>{reader.user.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{reader.user.name || reader.user.username}</p>
                  <p className="text-sm text-muted-foreground">Last read: {new Date(reader.lastReadAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6">
                <p className="font-medium">{Math.round(reader.progress)}%</p>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden flex-shrink-0">
                  <div className="h-full bg-primary" style={{ width: `${reader.progress}%` }} />
                </div>
              </div>
            </div>
          ))}
          {readers.length === 0 && (
            <p className="text-center text-muted-foreground">No readers yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Readers Tab Skeleton Component
function ReadersTabSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24 mb-2" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="w-24 h-2 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Chat History Tab Component
function ChatHistoryTab({ bookId }: { bookId: string }) {
  const { data, isLoading } = useSWR(`/api/admin/books/${bookId}/chats`, (url) => fetch(url).then(r => r.json()))
  const sessions = data?.data?.sessions?.sessions || []
  const stats = data?.data?.stats

  // State to track expanded users - MUST be before any early return
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())

  if (isLoading) {
    return <ChatHistoryTabSkeleton />
  }

  const toggleUser = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  // Group sessions by user
  const groupedByUser = sessions.reduce((acc: any, session: any) => {
    const userId = session.user?.id || session.userId || 'unknown'
    if (!acc[userId]) {
      acc[userId] = {
        user: session.user,
        sessions: []
      }
    }
    acc[userId].sessions.push(session)
    return acc
  }, {})

  // Group sessions by date for each user
  const groupSessionsByDate = (sessions: any[]) => {
    return sessions.reduce((acc: any, session: any) => {
      const date = new Date(session.firstMessageAt).toLocaleDateString()
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(session)
      return acc
    }, {})
  }

  return (
    <div className="space-y-4">
      {/* Most Asked Questions Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Most Asked Questions Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session: any, index: number) => (
              <div key={session.sessionId} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {session.firstMessage || 'Question not available'}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                    <span>
                      {session.user?.name || session.user?.username || 'Anonymous'}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(session.firstMessageAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>
                      {session.messageCount} message{session.messageCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-center text-muted-foreground text-sm">No questions yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Chat History by User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(groupedByUser).map(([userId, userData]: [string, any]) => {
              const userSessions = userData.sessions
              const totalMessages = userSessions.reduce((sum: number, s: any) => sum + (s.messageCount || 0), 0)
              const sessionsByDate = groupSessionsByDate(userSessions)
              const isExpanded = expandedUsers.has(userId)

              return (
                <Card key={userId} className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleUser(userId)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Avatar>
                          <AvatarImage src={userData.user?.directAvatarUrl} />
                          <AvatarFallback>
                            {userData.user?.name?.[0] || userData.user?.username?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <button
                            onClick={() => {
                              if (userId && userId !== 'unknown') {
                                router.push(`/dashboard/users/${userId}`)
                              }
                            }}
                            className="font-medium hover:text-primary hover:underline transition-colors text-left truncate block"
                          >
                            {userData.user?.name || userData.user?.username || 'Unknown User'}
                          </button>
                          <p className="text-xs text-muted-foreground">
                            {userSessions.length} session{userSessions.length > 1 ? 's' : ''} • {totalMessages} message{totalMessages !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {Object.entries(sessionsByDate).map(([date, dateSessions]: [string, any]) => (
                          <div key={date} className="pl-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm font-medium">{date}</p>
                            </div>
                            <div className="space-y-2 ml-6">
                              {dateSessions.map((session: any) => (
                                <div
                                  key={session.sessionId}
                                  className="p-3 border rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                                    <p className="text-sm font-medium">
                                      {new Date(session.firstMessageAt).toLocaleTimeString()} - {new Date(session.lastMessageAt).toLocaleTimeString()}
                                    </p>
                                    <Badge variant="secondary" className="text-xs w-fit">
                                      {session.messageCount} messages
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground break-all">
                                    Session ID: {session.sessionId}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
            {sessions.length === 0 && (
              <p className="text-center text-muted-foreground">No chat sessions yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Chat History Tab Skeleton Component
function ChatHistoryTabSkeleton() {
  return (
    <div className="space-y-4">
      {/* Most Asked Questions Highlights Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-64" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                <Skeleton className="flex-shrink-0 w-6 h-6 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users List Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                </CardHeader>

                {/* Expanded content skeleton */}
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <div className="space-y-2 ml-6">
                        <div className="p-3 border rounded-lg bg-muted/50">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-5 w-20" />
                          </div>
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <div className="p-3 border rounded-lg bg-muted/50">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-5 w-16" />
                          </div>
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
