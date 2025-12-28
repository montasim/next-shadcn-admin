'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import useSWR, { mutate } from 'swr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
} from 'lucide-react'
import { NavigationBreadcrumb } from '@/components/ui/breadcrumb'
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

export default function AdminBookDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.id as string
  const [activeTab, setActiveTab] = useState('overview')

  // Edit drawer state
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)

  // Edit question state
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [editQuestionText, setEditQuestionText] = useState('')
  const [editAnswerText, setEditAnswerText] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // AI Summary state
  const [isRegeneratingSummary, setIsRegeneratingSummary] = useState(false)
  const [isRegeneratingQuestions, setIsRegeneratingQuestions] = useState(false)
  const [pollCount, setPollCount] = useState(0)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

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

  const book = bookData?.data

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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>Loading book details...</p>
        </div>
      </div>
    )
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
    <div className="bg-background overflow-auto pb-20 md:pb-6">
      <div className="container mx-auto py-6 space-y-6">
        {/* Breadcrumb */}
        <NavigationBreadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Books', href: '/dashboard/books' },
            { label: book.name, href: `/dashboard/books/${book.id}` },
          ]}
        />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex gap-6">
            <div className="relative w-32 h-44 rounded-lg overflow-hidden shadow-lg flex-shrink-0">
              <Image
                src={imageUrl}
                alt={book.name}
                fill
                className="object-cover"
                sizes="128px"
                unoptimized
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold">{book.name}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <BookTypeBadge type={book.type} />
                {book.isPublic && <Badge variant="secondary">Public</Badge>}
                {book.requiresPremium && <Badge variant="outline">Premium</Badge>}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
              {book.categories?.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
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
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {book.pageNumber && (
                  <div className="flex items-center gap-2">
                    <span>Pages:</span>
                    <span className="font-medium text-foreground">{book.pageNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span>Copies:</span>
                  <span className="font-medium text-foreground">{book.numberOfCopies || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Buying Price:</span>
                  <span className="font-medium text-foreground">${book.buyingPrice || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Selling Price:</span>
                  <span className="font-medium text-foreground">${book.sellingPrice || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/books/${book.id}`)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Public Page
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditDrawerOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
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
          ]}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="readers">Readers</TabsTrigger>
            <TabsTrigger value="chat">Chat History</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* AI Summary */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Summary
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateSummary}
                    disabled={isRegeneratingSummary}
                  >
                    {isRegeneratingSummary ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        {book.aiSummary ? 'Regenerate' : 'Generate'} Summary
                      </>
                    )}
                  </Button>
                </div>
                <CardDescription>
                  {isRegeneratingSummary && (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Generating summary... Polling {pollCount > 0 ? `(${pollCount})` : ''}
                    </span>
                  )}
                  {!isRegeneratingSummary && book.aiSummaryStatus === 'pending' && 'Summary is being generated...'}
                  {!isRegeneratingSummary && book.aiSummaryStatus === 'failed' && 'Failed to generate summary. Please try again.'}
                  {!isRegeneratingSummary && book.aiSummaryStatus === 'completed' && `Generated on ${book.aiSummaryGeneratedAt ? new Date(book.aiSummaryGeneratedAt).toLocaleString() : 'recently'}`}
                  {!isRegeneratingSummary && !book.aiSummaryStatus && 'Generate an AI summary of this book'}
                </CardDescription>
              </CardHeader>
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
            </Card>

            {/* Suggested Questions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Key Questions
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateQuestions}
                    disabled={isRegeneratingQuestions}
                  >
                    {isRegeneratingQuestions ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        {book.questions && book.questions.length > 0 ? 'Regenerate' : 'Generate'} Questions
                      </>
                    )}
                  </Button>
                </div>
                <CardDescription>
                  {isRegeneratingQuestions && (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Generating questions... Polling {pollCount > 0 ? `(${pollCount})` : ''}
                    </span>
                  )}
                  {!isRegeneratingQuestions && book.questionsStatus === 'pending' && 'Questions are being generated...'}
                  {!isRegeneratingQuestions && book.questionsStatus === 'failed' && 'Failed to generate questions. Please try again.'}
                  {!isRegeneratingQuestions && book.questionsStatus === 'completed' && `Generated ${book.questions?.length || 0} questions${book.questionsGeneratedAt ? ` on ${new Date(book.questionsGeneratedAt).toLocaleString()}` : ''}`}
                  {!isRegeneratingQuestions && !book.questionsStatus && 'Generate AI-powered questions about this book'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {book.questions && book.questions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                            className="h-8 w-8 flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
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
            </Card>

            {/* Content Extraction Status */}
            <Card>
              <CardHeader>
                <CardTitle>Content Extraction Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className="ml-2" variant={book.extractionStatus === 'completed' ? 'default' : 'secondary'}>
                      {book.extractionStatus || 'Not started'}
                    </Badge>
                  </div>
                  {book.contentPageCount && (
                    <div>
                      <span className="text-muted-foreground">Pages:</span>
                      <span className="ml-2">{book.contentPageCount}</span>
                    </div>
                  )}
                  {book.contentWordCount && (
                    <div>
                      <span className="text-muted-foreground">Words:</span>
                      <span className="ml-2">{book.contentWordCount.toLocaleString()}</span>
                    </div>
                  )}
                  {book.contentExtractedAt && (
                    <div>
                      <span className="text-muted-foreground">Extracted:</span>
                      <span className="ml-2">{new Date(book.contentExtractedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
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

          {/* Content Tab */}
          <TabsContent value="content">
            <ContentTab book={book} />
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
  const { data } = useSWR(`/api/admin/books/${bookId}/visits?chart=true`, (url) => fetch(url).then(r => r.json()))
  const chartData = data?.data?.chart

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
          <p className="text-sm text-muted-foreground">Recent visits list coming soon</p>
        </CardContent>
      </Card>
    </div>
  )
}

// Readers Tab Component
function ReadersTab({ bookId }: { bookId: string }) {
  const { data } = useSWR(`/api/admin/books/${bookId}/readers`, (url) => fetch(url).then(r => r.json()))
  const readers = data?.data?.readers?.readers || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Readers</CardTitle>
        <CardDescription>{readers.length} readers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {readers.map((reader: any) => (
            <div key={reader.id} className="flex items-center justify-between p-3 border rounded-lg">
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
              <div className="text-right">
                <p className="font-medium">{Math.round(reader.progress)}%</p>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
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

// Chat History Tab Component
function ChatHistoryTab({ bookId }: { bookId: string }) {
  const { data } = useSWR(`/api/admin/books/${bookId}/chats`, (url) => fetch(url).then(r => r.json()))
  const sessions = data?.data?.sessions?.sessions || []
  const stats = data?.data?.stats

  return (
    <div className="space-y-4">
      {/* Chat Stats */}
      <DashboardSummary
        summaries={[
          {
            title: 'Total Conversations',
            value: stats?.totalConversations || 0,
            description: 'All chat sessions',
          },
          {
            title: 'Total Messages',
            value: stats?.totalMessages || 0,
            description: 'Messages exchanged',
          },
          {
            title: 'Unique Users',
            value: stats?.uniqueUsers || 0,
            description: 'Distinct users',
          },
        ]}
      />

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Chat Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessions.map((session: any) => (
              <div key={session.sessionId} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={session.user?.directAvatarUrl} />
                      <AvatarFallback>{session.user?.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{session.user?.name || session.user?.username}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.firstMessageAt).toLocaleString()} - {new Date(session.lastMessageAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge>{session.messageCount} messages</Badge>
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-center text-muted-foreground">No chat sessions yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Content Tab Component
function ContentTab({ book }: any) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Content Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Extraction Status:</span>
              <Badge className="ml-2" variant={book.extractionStatus === 'completed' ? 'default' : 'secondary'}>
                {book.extractionStatus || 'Not started'}
              </Badge>
            </div>
            {book.contentPageCount && (
              <div>
                <span className="text-sm text-muted-foreground">Page Count:</span>
                <span className="ml-2 font-medium">{book.contentPageCount}</span>
              </div>
            )}
            {book.contentWordCount && (
              <div>
                <span className="text-sm text-muted-foreground">Word Count:</span>
                <span className="ml-2 font-medium">{book.contentWordCount.toLocaleString()}</span>
              </div>
            )}
            {book.contentExtractedAt && (
              <div>
                <span className="text-sm text-muted-foreground">Last Extracted:</span>
                <span className="ml-2">{new Date(book.contentExtractedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {book.contentHash && (
            <div>
              <span className="text-sm text-muted-foreground">Content Hash:</span>
              <code className="ml-2 text-xs bg-muted px-2 py-1 rounded">{book.contentHash}</code>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Content Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Summary Status:</span>
              <Badge className="ml-2" variant={book.aiSummaryStatus === 'completed' ? 'default' : 'secondary'}>
                {book.aiSummaryStatus || 'Not generated'}
              </Badge>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Questions Status:</span>
              <Badge className="ml-2" variant={book.questionsStatus === 'completed' ? 'default' : 'secondary'}>
                {book.questionsStatus || 'Not generated'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
