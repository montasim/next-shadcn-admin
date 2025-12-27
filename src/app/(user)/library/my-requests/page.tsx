'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Calendar, X, FileText, Plus, MessageCircle } from 'lucide-react'
import { RequestStatus, BookType } from '@prisma/client'
import { toast } from '@/hooks/use-toast'
import { RequestBookDrawer } from '../request-book-drawer'
import { NavigationBreadcrumb } from '@/components/ui/breadcrumb'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface BookRequest {
  id: string
  bookName: string
  authorName: string
  type: BookType
  edition: string | null
  publisher: string | null
  isbn: string | null
  description: string | null
  status: RequestStatus
  cancelReason: string | null
  cancelledById: string | null
  createdAt: string
  cancelledBy: {
    id: string
    firstName: string
    lastName: string | null
    name: string
    role: string
  } | null
}

const statusConfig: Record<RequestStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  [RequestStatus.PENDING]: { label: 'Pending', variant: 'secondary' },
  [RequestStatus.IN_PROGRESS]: { label: 'In Progress', variant: 'default' },
  [RequestStatus.APPROVED]: { label: 'Approved', variant: 'default' },
  [RequestStatus.REJECTED]: { label: 'Rejected', variant: 'destructive' },
}

const typeLabels: Record<BookType, string> = {
  [BookType.HARD_COPY]: 'Hard Copy',
  [BookType.EBOOK]: 'E-Book',
  [BookType.AUDIO]: 'Audio Book',
}

export default function MyRequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<BookRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [isRequestDrawerOpen, setIsRequestDrawerOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [requestToCancel, setRequestToCancel] = useState<BookRequest | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [reasonError, setReasonError] = useState('')

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/book-requests')
      const result = await response.json()

      if (result.success) {
        setRequests(result.data)
      } else {
        toast({ title: 'Failed to load requests', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast({ title: 'Failed to load requests', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRequest = async () => {
    if (!requestToCancel) return

    if (!cancelReason.trim()) {
      setReasonError('Please provide a reason for cancelling this request')
      return
    }

    try {
      setCancellingId(requestToCancel.id)
      const response = await fetch(`/api/user/book-requests/${requestToCancel.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'REJECTED', cancelReason }),
      })

      const result = await response.json()

      if (result.success) {
        toast({ title: 'Request cancelled' })
        fetchRequests()
        setIsCancelDialogOpen(false)
        setRequestToCancel(null)
        setCancelReason('')
        setReasonError('')
      } else {
        toast({ title: result.message, variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error cancelling request:', error)
      toast({ title: 'Failed to cancel request', variant: 'destructive' })
    } finally {
      setCancellingId(null)
    }
  }

  const openCancelDialog = (request: BookRequest) => {
    setRequestToCancel(request)
    setCancelReason('')
    setReasonError('')
    setIsCancelDialogOpen(true)
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading requests...</div>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No requests yet</h3>
          <p className="text-muted-foreground mb-4">
            You haven&apos;t requested any books yet.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => setIsRequestDrawerOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Request Book
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/library'}>
              Browse Library
            </Button>
          </div>
        </div>
        <RequestBookDrawer
          open={isRequestDrawerOpen}
          onOpenChange={setIsRequestDrawerOpen}
          onSuccess={fetchRequests}
        />
      </>
    )
  }

  return (
    <div className="space-y-6">
      <NavigationBreadcrumb
        items={[
          { label: 'Library', href: '/library', icon: <BookOpen className="h-4 w-4" /> },
          { label: 'My Requests', icon: <FileText className="h-4 w-4" /> },
        ]}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Book Requests</h1>
          <p className="text-muted-foreground">
            Track the status of your book requests
          </p>
        </div>
        <Button onClick={() => setIsRequestDrawerOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Request Book
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {requests.map((request) => {
          const config = statusConfig[request.status]
          const canCancel = request.status === RequestStatus.PENDING

          return (
            <Card key={request.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {request.bookName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      by {request.authorName}
                    </p>
                  </div>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>{typeLabels[request.type]}</span>
                </div>

                {(request.edition || request.publisher || request.isbn) && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    {request.edition && <div>Edition: {request.edition}</div>}
                    {request.publisher && <div>Publisher: {request.publisher}</div>}
                    {request.isbn && <div>ISBN: {request.isbn}</div>}
                  </div>
                )}

                {request.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {request.description}
                  </p>
                )}

                {request.cancelReason && (
                  <div className="text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-2 mt-2">
                    <div className="flex items-start gap-2">
                      <MessageCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium text-xs">
                          Cancelled by: {request.cancelledById === user?.id
                            ? 'You'
                            : `${request.cancelledBy?.firstName || request.cancelledBy?.name || 'Unknown'} (${request.cancelledBy?.role || 'Unknown'})`}
                        </div>
                        <div className="text-xs mt-1">
                          <span className="font-medium">Reason:</span> {request.cancelReason}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Requested on {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {canCancel && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => openCancelDialog(request)}
                    disabled={cancellingId === request.id}
                  >
                    {cancellingId === request.id ? (
                      'Cancelling...'
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Cancel Request
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <RequestBookDrawer
        open={isRequestDrawerOpen}
        onOpenChange={setIsRequestDrawerOpen}
        onSuccess={fetchRequests}
      />

      <ConfirmDialog
        open={isCancelDialogOpen}
        onOpenChange={(open) => {
          setIsCancelDialogOpen(open)
          if (!open) {
            setCancelReason('')
            setReasonError('')
          }
        }}
        title="Cancel Request"
        desc={
          requestToCancel && (
            <div>
              Are you sure you want to cancel the request for{' '}
              <strong>&quot;{requestToCancel.bookName}&quot;</strong> by {requestToCancel.authorName}?
              This action cannot be undone.
            </div>
          )
        }
        cancelBtnText="Keep Request"
        confirmText={cancellingId ? 'Cancelling...' : 'Cancel Request'}
        destructive
        handleConfirm={handleCancelRequest}
        disabled={cancellingId !== null}
        isLoading={cancellingId !== null}
      >
        <div className="space-y-2 py-4">
          <Label htmlFor="cancel-reason">
            Reason for cancellation <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="cancel-reason"
            placeholder="Please provide a reason for cancelling this request..."
            value={cancelReason}
            onChange={(e) => {
              setCancelReason(e.target.value)
              setReasonError('')
            }}
            className={reasonError ? 'border-destructive' : ''}
          />
          {reasonError && (
            <p className="text-sm text-destructive">{reasonError}</p>
          )}
        </div>
      </ConfirmDialog>
    </div>
  )
}
