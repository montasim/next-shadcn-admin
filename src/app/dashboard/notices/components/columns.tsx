'use client'

import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import LongText from '@/components/long-text'
import { Notice } from '../data/schema'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

export const columns: ColumnDef<Notice>[] = [
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
    meta: {
      className: cn(
        'sticky md:table-cell left-0 z-10 rounded-tl',
        'bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted'
      ),
    },
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
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => (
      <LongText className="max-w-48 font-medium">{row.getValue('title')}</LongText>
    ),
  },
  {
    accessorKey: 'content',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Content" />
    ),
    cell: ({ row }) => {
      const content = row.getValue('content') as string
      return (
        <LongText className="max-w-64">
          {content || 'No content'}
        </LongText>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Active" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean
      return (
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    meta: { className: 'w-24' },
  },
  {
    accessorKey: 'validFrom',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Valid From" />
    ),
    cell: ({ row }) => {
      const validFrom = row.getValue('validFrom') as string | null
      return (
        <span className="text-sm">
          {validFrom ? new Date(validFrom).toLocaleDateString() : 'Not set'}
        </span>
      )
    },
    meta: { className: 'w-32' },
  },
  {
    accessorKey: 'validTo',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Valid To" />
    ),
    cell: ({ row }) => {
      const validTo = row.getValue('validTo') as string | null
      return (
        <span className="text-sm">
          {validTo ? new Date(validTo).toLocaleDateString() : 'Not set'}
        </span>
      )
    },
    meta: { className: 'w-32' },
  },
  {
    accessorKey: 'order',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order" />
    ),
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue('order')}</span>
    ),
    meta: { className: 'w-20' },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
    meta: {
      className: cn(
        'sticky right-0 bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
        'rounded-tr'
      ),
    },
  },
]
