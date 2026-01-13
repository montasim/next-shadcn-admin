'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, MessageSquare, Search, Eye, CheckCircle, Archive, ExternalLink, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { ContactStatus } from '@prisma/client'
import { TableSkeleton, FilterSectionSkeleton } from '@/components/data-table/table-skeleton'
import { DashboardSummary } from '@/components/dashboard/dashboard-summary'
import { DashboardSummarySkeleton } from '@/components/data-table/table-skeleton'
import { CollapsibleSection } from '@/components/ui/collapsible-section'

interface ContactSubmission {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  status: ContactStatus
  ipAddress: string | null
  createdAt: string
  readAt: string | null
  respondedAt: string | null
}

interface Stats {
  NEW: number
  READ: number
  RESPONDED: number
  ARCHIVED: number
}

interface ApiResponse {
  success: boolean
  data: {
    submissions: ContactSubmission[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    stats: Stats
  }
}

const statusColors: Record<ContactStatus, string> = {
  NEW: 'bg-blue-500/10 text-blue-700 border-blue-200',
  READ: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  RESPONDED: 'bg-green-500/10 text-green-700 border-green-200',
  ARCHIVED: 'bg-gray-500/10 text-gray-700 border-gray-200',
}

const statusLabels: Record<ContactStatus, string> = {
  NEW: 'New',
  READ: 'Read',
  RESPONDED: 'Responded',
  ARCHIVED: 'Archived',
}

export default function ContactSubmissionsPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([])
  const [stats, setStats] = useState<Stats>({ NEW: 0, READ: 0, RESPONDED: 0, ARCHIVED: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    fetchSubmissions()
  }, [page, statusFilter])

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      if (search) {
        params.append('search', search)
      }

      const response = await fetch(`/api/admin/contact-submissions?${params}`)
      const data: ApiResponse = await response.json()

      if (data.success) {
        setSubmissions(data.data.submissions)
        setPagination(data.data.pagination)
        setStats(data.data.stats)
      } else {
        toast.error('Failed to load contact submissions')
      }
    } catch (error) {
      console.error('Error fetching contact submissions:', error)
      toast.error('Failed to load contact submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchSubmissions()
  }

  const updateStatus = async (id: string, newStatus: ContactStatus) => {
    try {
      const response = await fetch('/api/admin/contact-submissions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status: newStatus }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Status updated successfully')
        fetchSubmissions()
      } else {
        toast.error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Full page skeleton loader
  if (loading && page === 1 && !search && statusFilter === 'all') {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Contact Submissions</h1>
              <p className="text-muted-foreground">
                Manage messages from the contact form
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <DashboardSummarySkeleton count={4} />

        {/* Filters Skeleton */}
        <FilterSectionSkeleton />

        {/* Table Skeleton */}
        <TableSkeleton rowCount={10} columns={7} showSelect={false} showActions={true} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Contact Submissions</h1>
            <p className="text-muted-foreground">
              Manage messages from the contact form
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <DashboardSummary
        summaries={[
          {
            title: 'New',
            value: stats.NEW.toString(),
            description: 'Unread messages',
            icon: MessageSquare,
          },
          {
            title: 'Read',
            value: stats.READ.toString(),
            description: 'Viewed messages',
            icon: Eye,
          },
          {
            title: 'Responded',
            value: stats.RESPONDED.toString(),
            description: 'Completed replies',
            icon: CheckCircle,
          },
          {
            title: 'Total',
            value: pagination.total.toString(),
            description: 'All submissions',
            icon: Mail,
          },
        ]}
      />

      {/* Filters */}
      <CollapsibleSection title="Filters" icon={Filter}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or message..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ContactStatus | 'all')}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={ContactStatus.NEW}>New</SelectItem>
              <SelectItem value={ContactStatus.READ}>Read</SelectItem>
              <SelectItem value={ContactStatus.RESPONDED}>Responded</SelectItem>
              <SelectItem value={ContactStatus.ARCHIVED}>Archived</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch}>Search</Button>
        </div>
      </CollapsibleSection>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>
            {pagination.total} total submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No submissions found</h3>
              <p className="text-muted-foreground">
                {search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'No contact submissions yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="max-w-md">Message</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <Badge className={statusColors[submission.status]} variant="outline">
                          {statusLabels[submission.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{submission.name}</TableCell>
                      <TableCell>
                        <a
                          href={`mailto:${submission.email}`}
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {submission.email}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>{submission.subject || '-'}</TableCell>
                      <TableCell>
                        <div className="max-w-md truncate text-sm text-muted-foreground">
                          {submission.message}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(submission.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={submission.status}
                          onValueChange={(value) => updateStatus(submission.id, value as ContactStatus)}
                        >
                          <SelectTrigger className="w-[140px] ml-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ContactStatus.NEW}>New</SelectItem>
                            <SelectItem value={ContactStatus.READ}>Mark as Read</SelectItem>
                            <SelectItem value={ContactStatus.RESPONDED}>
                              Mark as Responded
                            </SelectItem>
                            <SelectItem value={ContactStatus.ARCHIVED}>Archive</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {submissions.length > 0 && pagination.totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
