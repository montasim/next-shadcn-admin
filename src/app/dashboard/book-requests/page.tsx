'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RequestStatus, BookType } from '@prisma/client'
import { FileText, RefreshCw, MessageCircle, Filter } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useBookRequestsContext } from './context/book-requests-context'
import { BookRequestsProvider } from './context/book-requests-context'
import { BookRequestApproveDrawer } from './components/book-requests-approve-drawer'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { DashboardSummary } from '@/components/dashboard/dashboard-summary'
import { DashboardSummarySkeleton, FilterSectionSkeleton, BookRequestListSkeleton } from '@/components/data-table/table-skeleton'

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
  requestedBy: {
    id: string
    firstName: string
    lastName: string | null
    username: string | null
    name: string
    email: string
    role: string
  }
  cancelledBy: {
    id: string
    firstName: string
    lastName: string | null
    name: string
    email: string
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

function BookRequestsPageContent() {
  const [requests, setRequests] = useState<BookRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [isApproveDrawerOpen, setIsApproveDrawerOpen] = useState(false)
  const [approvingRequest, setApprovingRequest] = useState<BookRequest | null>(null)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [requestToReject, setRequestToReject] = useState<BookRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [reasonError, setReasonError] = useState('')

  const { currentRow, setCurrentRow } = useBookRequestsContext()

  const filteredRequests = useMemo(() => {
    if (statusFilter === 'all') return requests
    return requests.filter((r) => r.status === statusFilter)
  }, [requests, statusFilter])

  const statusCounts = useMemo(() => {
    return {
      all: requests.length,
      [RequestStatus.PENDING]: requests.filter((r) => r.status === RequestStatus.PENDING).length,
      [RequestStatus.IN_PROGRESS]: requests.filter((r) => r.status === RequestStatus.IN_PROGRESS).length,
      [RequestStatus.APPROVED]: requests.filter((r) => r.status === RequestStatus.APPROVED).length,
    }
  }, [requests])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/book-requests')
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

  const updateStatus = async (id: string, status: RequestStatus) => {
    try {
      setUpdatingId(id)
      const response = await fetch(`/api/admin/book-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      const result = await response.json()

      if (result.success) {
        toast({ title: result.message })
        fetchRequests()
      } else {
        toast({ title: result.message, variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast({ title: 'Failed to update status', variant: 'destructive' })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRejectClick = (request: BookRequest) => {
    setRequestToReject(request)
    setRejectReason('')
    setReasonError('')
    setIsRejectDialogOpen(true)
  }

  const handleRejectConfirm = async () => {
    if (!requestToReject) return

    if (!rejectReason.trim()) {
      setReasonError('Please provide a reason for rejecting this request')
      return
    }

    try {
      setUpdatingId(requestToReject.id)
      const response = await fetch(`/api/admin/book-requests/${requestToReject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', cancelReason: rejectReason }),
      })

      const result = await response.json()

      if (result.success) {
        toast({ title: result.message })
        fetchRequests()
        setIsRejectDialogOpen(false)
        setRequestToReject(null)
        setRejectReason('')
        setReasonError('')
      } else {
        toast({ title: result.message, variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast({ title: 'Failed to reject request', variant: 'destructive' })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleApprove = (request: BookRequest) => {
    setApprovingRequest(request)
    setIsApproveDrawerOpen(true)
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Book Requests</h1>
          <p className="text-muted-foreground">
            Manage and process book requests from users
          </p>
        </div>
        <Button onClick={fetchRequests} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {/* Stats Cards */}
        {loading ? (
          <DashboardSummarySkeleton count={4} />
        ) : (
          <DashboardSummary
            summaries={[
              { title: 'Total Requests', value: statusCounts.all, description: 'All requests' },
              { title: 'Pending', value: statusCounts[RequestStatus.PENDING], description: 'Awaiting review' },
              { title: 'In Progress', value: statusCounts[RequestStatus.IN_PROGRESS], description: 'Being processed' },
              { title: 'Approved', value: statusCounts[RequestStatus.APPROVED], description: 'Approved requests' },
            ]}
          />
        )}

        {/* Filters */}
        {loading ? <FilterSectionSkeleton /> : (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </h3>
          </div>
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value={RequestStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={RequestStatus.IN_PROGRESS}>In Progress</SelectItem>
                <SelectItem value={RequestStatus.APPROVED}>Approved</SelectItem>
                <SelectItem value={RequestStatus.REJECTED}>Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      )}

      {/* Requests Table */}
      {loading ? (
        <BookRequestListSkeleton />
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No requests found</h3>
            <p className="text-muted-foreground">
              {statusFilter === 'all'
                ? 'No book requests have been submitted yet.'
                : `No ${statusFilter.toLowerCase()} requests found.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg divide-y">
          {filteredRequests.map((request) => {
            const config = statusConfig[request.status]
            const canApprove = request.status === RequestStatus.PENDING || request.status === RequestStatus.IN_PROGRESS

            return (
              <div key={request.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg">{request.bookName}</h3>
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">by {request.authorName}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Type:</span>{' '}
                        <span className="font-medium">{typeLabels[request.type]}</span>
                      </div>
                      {request.edition && (
                        <div>
                          <span className="text-muted-foreground">Edition:</span>{' '}
                          <span className="font-medium">{request.edition}</span>
                        </div>
                      )}
                      {request.publisher && (
                        <div>
                          <span className="text-muted-foreground">Publisher:</span>{' '}
                          <span className="font-medium">{request.publisher}</span>
                        </div>
                      )}
                      {request.isbn && (
                        <div>
                          <span className="text-muted-foreground">ISBN:</span>{' '}
                          <span className="font-medium">{request.isbn}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Requested by:</span>{' '}
                        <span className="font-medium">
                          {request.requestedBy.firstName || request.requestedBy.name || 'Unknown'}
                        </span>
                        <span className="text-muted-foreground">({request.requestedBy.email})</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">on</span>{' '}
                        <span className="font-medium">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {request.description && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Note:</span> {request.description}
                      </div>
                    )}

                    {request.cancelReason && (
                      <div className="text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-3">
                        <div className="flex items-start gap-2">
                          <MessageCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium">
                              Cancelled by: {request.cancelledBy?.firstName || request.cancelledBy?.name || 'Unknown'} ({request.cancelledBy?.role || 'Unknown'})
                            </div>
                            <div className="mt-1">
                              <span className="font-medium">Reason:</span> {request.cancelReason}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {request.status === RequestStatus.PENDING && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(request.id, RequestStatus.IN_PROGRESS)}
                          disabled={updatingId === request.id}
                        >
                          Mark In Progress
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request)}
                          disabled={updatingId === request.id}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectClick(request)}
                          disabled={updatingId === request.id}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {request.status === RequestStatus.IN_PROGRESS && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request)}
                          disabled={updatingId === request.id}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectClick(request)}
                          disabled={updatingId === request.id}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {(request.status === RequestStatus.APPROVED || request.status === RequestStatus.REJECTED) && (
                      <span className="text-sm text-muted-foreground text-center">
                        Request {request.status === RequestStatus.APPROVED ? 'approved' : 'rejected'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      </div>

      <BookRequestApproveDrawer
        open={isApproveDrawerOpen}
        onOpenChange={setIsApproveDrawerOpen}
        onSuccess={fetchRequests}
        requestData={approvingRequest}
      />

      <ConfirmDialog
        open={isRejectDialogOpen}
        onOpenChange={(open) => {
          setIsRejectDialogOpen(open)
          if (!open) {
            setRejectReason('')
            setReasonError('')
          }
        }}
        title="Reject Book Request"
        desc={
          requestToReject && (
            <div>
              Are you sure you want to reject the request for{' '}
              <strong>&quot;{requestToReject.bookName}&quot;</strong> by {requestToReject.authorName}?
              This action cannot be undone.
            </div>
          )
        }
        cancelBtnText="Keep Request"
        confirmText={updatingId ? 'Rejecting...' : 'Reject Request'}
        destructive
        handleConfirm={handleRejectConfirm}
        disabled={updatingId !== null}
        isLoading={updatingId !== null}
      >
        <div className="space-y-2 py-4">
          <Label htmlFor="reject-reason">
            Reason for rejection <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="reject-reason"
            placeholder="Please provide a reason for rejecting this request..."
            value={rejectReason}
            onChange={(e) => {
              setRejectReason(e.target.value)
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

export default function BookRequestsPage() {
  return (
    <BookRequestsProvider>
      <BookRequestsPageContent />
    </BookRequestsProvider>
  )
}
