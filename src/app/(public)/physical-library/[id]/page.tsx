'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { getUserDisplayName } from '@/lib/utils/user'
import { BookDetailsSkeleton } from '@/components/books/book-details-skeleton'
import { LendBookDialog } from '@/components/books/lend-book-dialog'
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  User as UserIcon,
  Home,
  ArrowLeft,
  Building2,
  X,
  Lock,
} from 'lucide-react'
import { NavigationBreadcrumb } from '@/components/ui/breadcrumb'
import { format } from 'date-fns'
import { MDXViewer } from '@/components/ui/mdx-viewer'

// Types
interface Loan {
  id: string
  loanDate: string
  dueDate: string
  returnDate: string | null
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'CANCELLED'
  notes: string | null
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    username: string | null
    email: string
    image: string | null
  }
  lentBy: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  }
}

interface Book {
  id: string
  name: string
  description: string
  image: string | null
  type: string
  isbn: string | null
  publishedDate: string | null
  pageNumber: number | null
  language: string
  categories: Array<{ id: string; name: string }>
  authors: Array<{ id: string; name: string }>
  publication: { id: string; name: string } | null
  totalCopies: number
  availableCopies: number
  createdAt: string
}

// Timeline Component for Lending History
interface LoanTimelineProps {
  loans: Loan[]
}

function LoanTimeline({ loans }: LoanTimelineProps) {
  if (loans.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Lending History</h3>
        <p className="text-muted-foreground">
          This book hasn&apos;t been borrowed yet.
        </p>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'OVERDUE':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'RETURNED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-blue-500">Borrowed</Badge>
      case 'OVERDUE':
        return <Badge variant="destructive">Overdue</Badge>
      case 'RETURNED':
        return <Badge variant="outline" className="border-green-500 text-green-700">Returned</Badge>
      case 'CANCELLED':
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getDaysRemaining = (dueDate: string, returnDate: string | null) => {
    if (returnDate) {
      const returned = new Date(returnDate)
      const due = new Date(dueDate)
      const diffTime = returned.getTime() - due.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return { text: `${diffDays > 0 ? '+' : ''}${diffDays} days`, isLate: diffTime > 0 }
    }
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return { text: `${diffDays} days left`, isLate: diffTime < 0 }
  }

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-6">
        {loans.map((loan, index) => (
          <div key={loan.id} className="relative pl-12">
            {/* Timeline Dot */}
            <div className={cn(
              "absolute left-0 top-1 w-8 h-8 rounded-full border-4 flex items-center justify-center",
              loan.status === 'ACTIVE' && "border-blue-500 bg-background",
              loan.status === 'OVERDUE' && "border-red-500 bg-background",
              loan.status === 'RETURNED' && "border-green-500 bg-background",
              loan.status === 'CANCELLED' && "border-gray-500 bg-background"
            )}>
              {getStatusIcon(loan.status)}
            </div>

            {/* Timeline Content */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {loan.user.image ? (
                        <AvatarImage src={loan.user.image} alt={getUserDisplayName({
                          firstName: loan.user.firstName,
                          lastName: loan.user.lastName,
                          username: loan.user.username,
                          name: '',
                          email: loan.user.email
                        })} />
                      ) : (
                        <AvatarFallback>
                          <UserIcon className="h-5 w-5" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {getUserDisplayName({
                          firstName: loan.user.firstName,
                          lastName: loan.user.lastName,
                          username: loan.user.username,
                          name: '',
                          email: loan.user.email
                        })}
                      </div>
                      <div className="text-sm text-muted-foreground">{loan.user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(loan.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Borrowed Date</div>
                    <div className="font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(loan.loanDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Due Date</div>
                    <div className="font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(loan.dueDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                  {loan.returnDate && (
                    <div>
                      <div className="text-muted-foreground mb-1">Returned Date</div>
                      <div className="font-medium flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        {format(new Date(loan.returnDate), 'MMM d, yyyy')}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-muted-foreground mb-1">Lent By</div>
                    <div className="font-medium">
                      {getUserDisplayName({
                        firstName: loan.lentBy.firstName,
                        lastName: loan.lentBy.lastName,
                        username: '',
                        name: '',
                        email: loan.lentBy.email
                      })}
                    </div>
                  </div>
                </div>

                {loan.notes && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm italic">
                    &ldquo;{loan.notes}&rdquo;
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {loan.status === 'ACTIVE' || loan.status === 'OVERDUE'
                        ? getDaysRemaining(loan.dueDate, loan.returnDate).text
                        : loan.status === 'RETURNED'
                          ? `Returned ${getDaysRemaining(loan.dueDate, loan.returnDate).text}`
                          : 'Cancelled'}
                    </span>
                    {loan.status === 'ACTIVE' || loan.status === 'OVERDUE' ? (
                      <Link href={`/dashboard/loans`}>
                        <Button variant="outline" size="sm">
                          Manage Loan
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LibraryBookDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const bookId = params.id as string

  const [isLendDialogOpen, setIsLendDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details')

  // Fetch book details
  const { data: book, error, isLoading, mutate } = useSWR(
    bookId ? `/api/books/${bookId}` : null,
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch book')
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to fetch book')
      return json.data.book as Book
    }
  )

  // Fetch lending history
  const { data: loansData } = useSWR(
    bookId && user ? `/api/books/${bookId}/loans` : null,
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) return []
      const json = await res.json()
      return json.data.loans || []
    }
  )

  const loans = loansData || []

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto p-4 py-8">
          <BookDetailsSkeleton />
        </main>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto p-4 py-8">
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Book Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The book you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link href="/physical-library">
              <Button>Back to Library</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const canManageLoans = user && user.role !== 'USER'
  const isAvailable = book.availableCopies > 0

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-4 py-8">
        {/* Breadcrumb */}
        <NavigationBreadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Physical Library', href: '/physical-library' },
            { label: book.name },
          ]}
        />

        {/* Back Button */}
        <Link href="/physical-library">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </Link>

        {/* Book Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          {/* Book Cover */}
          <div className="flex-shrink-0">
            <div className="w-64 mx-auto md:mx-0">
              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted shadow-lg">
                {book.image ? (
                  <img
                    src={getProxiedImageUrl(book.image) || book.image}
                    alt={book.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Book Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{book.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {book.authors.map((author) => (
                    <Badge key={author.id} variant="outline">
                      {author.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <div className="text-sm text-muted-foreground">ISBN</div>
                <div className="font-medium">{book.isbn || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Pages</div>
                <div className="font-medium">{book.pageNumber || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Language</div>
                <div className="font-medium">{book.language}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Published</div>
                <div className="font-medium">
                  {book.publishedDate ? format(new Date(book.publishedDate), 'yyyy') : 'N/A'}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-6">
              <Badge variant="secondary" className="text-sm">Hard Copy</Badge>
              {book.categories.map((category) => (
                <Badge key={category.id} variant="outline" className="text-sm">
                  {category.name}
                </Badge>
              ))}
            </div>

            {/* Availability */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Availability</div>
                    <div className="text-2xl font-bold">
                      {book.availableCopies} / {book.totalCopies}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {isAvailable ? 'Available for borrowing' : 'Currently unavailable'}
                    </div>
                  </div>
                  {canManageLoans && isAvailable && (
                    <Button onClick={() => setIsLendDialogOpen(true)}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Lend Book
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="details">Description</TabsTrigger>
            <TabsTrigger value="history">
              Lending History
              {user && loans.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {loans.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="prose max-w-none">
                  <MDXViewer content={book.description || 'No description available.'} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            {!user ? (
              <Card>
                <CardContent className="pt-12 pb-12">
                  <div className="text-center">
                    <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
                    <p className="text-muted-foreground mb-6">
                      Please sign in to view the lending history of this book.
                    </p>
                    <Link href="/auth/sign-in">
                      <Button>Sign In</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <LoanTimeline loans={loans} />
            )}
          </TabsContent>
        </Tabs>

        {/* Lend Book Dialog */}
        {canManageLoans && (
          <LendBookDialog
            open={isLendDialogOpen}
            onOpenChange={setIsLendDialogOpen}
            bookId={book.id}
            bookName={book.name}
            onSuccess={() => {
              mutate()
            }}
          />
        )}
      </main>
    </div>
  )
}
