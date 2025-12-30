'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'
import { Campaign } from '../data/schema'

export const columns: ColumnDef<Campaign>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const name = row.getValue('name') as string
      return (
        <div className="font-medium">{name}</div>
      )
    },
  },
  {
    accessorKey: 'subject',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subject" />
    ),
    cell: ({ row }) => {
      const subject = row.getValue('subject') as string
      return (
        <div className="max-w-[300px] truncate">{subject}</div>
      )
    },
  },
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      return (
        <Badge variant="outline">
          {type === 'ONE_TIME' ? 'One-time' : 'Recurring'}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string

      const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        DRAFT: 'secondary',
        SCHEDULED: 'default',
        SENDING: 'default',
        SENT: 'default',
        FAILED: 'destructive',
        CANCELLED: 'outline',
      }

      const labelMap: Record<string, string> = {
        DRAFT: 'Draft',
        SCHEDULED: 'Scheduled',
        SENDING: 'Sending',
        SENT: 'Sent',
        FAILED: 'Failed',
        CANCELLED: 'Cancelled',
      }

      return (
        <Badge variant={variantMap[status] || 'default'}>
          {labelMap[status] || status}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'stats',
    header: 'Stats',
    cell: ({ row }) => {
      const sentCount = row.original.sentCount
      const deliveredCount = row.original.deliveredCount
      const openedCount = row.original.openedCount
      const clickedCount = row.original.clickedCount

      return (
        <div className="flex gap-2 text-xs">
          <span title="Sent">{sentCount}</span>
          <span className="text-green-600" title="Delivered">{deliveredCount}</span>
          <span className="text-blue-600" title="Opened">{openedCount}</span>
          <span className="text-purple-600" title="Clicked">{clickedCount}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'scheduledAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Scheduled" />
    ),
    cell: ({ row }) => {
      const scheduledAt = row.getValue('scheduledAt') as string | null
      if (!scheduledAt) return <span className="text-muted-foreground">-</span>
      return (
        <span className="text-sm">
          {new Date(scheduledAt).toLocaleDateString()} {new Date(scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as string
      return (
        <span className="text-sm text-muted-foreground">
          {new Date(createdAt).toLocaleDateString()}
        </span>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
