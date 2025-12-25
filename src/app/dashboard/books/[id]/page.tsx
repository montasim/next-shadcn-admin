'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
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
} from 'lucide-react'
import { NavigationBreadcrumb } from '@/components/ui/breadcrumb'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { BookTypeBadge } from '@/components/books/book-type-badge'
import { ViewsOverTimeChart } from '@/components/analytics/views-over-time-chart'

export default function AdminBookDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.id as string
  const [activeTab, setActiveTab] = useState('overview')

  const fetcher = async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch data')
    const json = await res.json()
    return json
  }

  // Fetch book details
  const { data: bookData, isLoading, error } = useSWR(
    `/api/admin/books/${bookId}/details`,
    fetcher
  )

  const book = bookData?.data

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
  const imageUrl = book.directImageUrl || getProxiedImageUrl(book.image) || book.image || '/placeholder-book.png'

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
            <img
              src={imageUrl}
              alt={book.name}
              className="w-32 h-44 object-cover rounded-lg shadow-lg"
            />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{book.name}</h1>
              <div className="flex items-center gap-2">
                <BookTypeBadge type={book.type} />
                {book.isPublic && <Badge variant="secondary">Public</Badge>}
                {book.requiresPremium && <Badge variant="outline">Premium</Badge>}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {book.authors?.length > 0 && (
                  <span>By {book.authors.map((a: any) => a.author.name).join(', ')}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/books/${book.id}`)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Public Page
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/books?edit=${book.id}`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{book.analytics?.totalViews || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Readers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{book.analytics?.totalReaders || 0}</div>
              <p className="text-xs text-muted-foreground">
                {book.analytics?.currentlyReading || 0} currently reading
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Chat Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{book.analytics?.totalChatMessages || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(book.analytics?.avgProgress || 0)}%</div>
            </CardContent>
          </Card>
        </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Book Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Book Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Type:</span>
                      <BookTypeBadge type={book.type} />
                    </div>
                    {book.bindingType && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Binding:</span>
                        <span>{book.bindingType}</span>
                      </div>
                    )}
                    {book.pageNumber && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Pages:</span>
                        <span>{book.pageNumber}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Copies:</span>
                      <span>{book.numberOfCopies || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Buying Price:</span>
                      <span>${book.buyingPrice || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Selling Price:</span>
                      <span>${book.sellingPrice || 'N/A'}</span>
                    </div>
                  </div>
                  {book.summary && (
                    <div>
                      <span className="text-sm text-muted-foreground">Summary:</span>
                      <p className="text-sm mt-1">{book.summary}</p>
                    </div>
                  )}
                  {book.purchaseDate && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Purchase Date:</span>
                      <span className="ml-2">{new Date(book.purchaseDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Summary */}
              {book.aiSummary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      AI Summary
                    </CardTitle>
                    <CardDescription>
                      Generated on {book.aiSummaryGeneratedAt ? new Date(book.aiSummaryGeneratedAt).toLocaleDateString() : 'N/A'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{book.aiSummary}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Suggested Questions */}
            {book.questions && book.questions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Suggested Questions</CardTitle>
                  <CardDescription>
                    {book.questions.length} AI-generated questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {book.questions.map((q: any) => (
                      <div key={q.id} className="p-3 border rounded-lg">
                        <p className="text-sm font-medium">{q.question}</p>
                        <p className="text-xs text-muted-foreground mt-1">{q.answer}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalConversations || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMessages || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.uniqueUsers || 0}</div>
          </CardContent>
        </Card>
      </div>

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
