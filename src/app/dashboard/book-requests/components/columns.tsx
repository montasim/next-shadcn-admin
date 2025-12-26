'use client'

import { BookRequest } from '../data/schema'
import { RequestStatus, BookType } from '@prisma/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { getUserDisplayName } from '@/lib/utils/user'

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

interface DataTableRowActionsProps {
  row: BookRequest
  onRefresh: () => void
}

export function DataTableRowActions({ row, onRefresh }: DataTableRowActionsProps) {
  const [updating, setUpdating] = useState(false)

  const updateStatus = async (status: RequestStatus) => {
    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/book-requests/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      const result = await response.json()

      if (result.success) {
        toast({ title: result.message })
        onRefresh()
      } else {
        toast({ title: result.message, variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast({ title: 'Failed to update status', variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  const handleApprove = () => {
    // TODO: Open upload drawer with pre-filled data
    toast({ title: 'Approve flow - to be implemented with upload drawer integration' })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          disabled={updating}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={() => {/* View details */}}>
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {row.status === RequestStatus.PENDING && (
          <>
            <DropdownMenuItem onClick={() => updateStatus(RequestStatus.IN_PROGRESS)}>
              <Clock className="h-4 w-4 mr-2" />
              Mark In Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleApprove}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateStatus(RequestStatus.REJECTED)}>
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </DropdownMenuItem>
          </>
        )}

        {row.status === RequestStatus.IN_PROGRESS && (
          <>
            <DropdownMenuItem onClick={handleApprove}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateStatus(RequestStatus.REJECTED)}>
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const columns = [
  {
    key: 'bookName',
    header: 'Book Name',
    cell: (row: BookRequest) => (
      <div>
        <div className="font-medium">{row.bookName}</div>
        <div className="text-sm text-muted-foreground">by {row.authorName}</div>
      </div>
    ),
  },
  {
    key: 'authorName',
    header: 'Author',
    cell: (row: BookRequest) => row.authorName,
  },
  {
    key: 'type',
    header: 'Type',
    cell: (row: BookRequest) => typeLabels[row.type],
  },
  {
    key: 'requestedBy',
    header: 'Requested By',
    cell: (row: BookRequest) => (
      <div>
        <div className="font-medium">
          {getUserDisplayName({
            firstName: row.requestedBy?.firstName,
            lastName: row.requestedBy?.lastName,
            username: row.requestedBy?.username,
            name: row.requestedBy?.name,
            email: row.requestedBy?.email || '',
          })}
        </div>
        <div className="text-sm text-muted-foreground">{row.requestedBy?.email}</div>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    cell: (row: BookRequest) => {
      const config = statusConfig[row.status]
      return <Badge variant={config.variant}>{config.label}</Badge>
    },
  },
  {
    key: 'createdAt',
    header: 'Requested On',
    cell: (row: BookRequest) => new Date(row.createdAt).toLocaleDateString(),
  },
  {
    id: 'actions',
    header: '',
    cell: (row: BookRequest) => (
      <DataTableRowActions row={row} onRefresh={() => {}} />
    ),
  },
]
