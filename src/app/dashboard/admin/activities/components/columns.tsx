'use client'

import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import LongText from '@/components/long-text'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Activity, formatActionName, formatResourceType, getActionBadgeColor } from '../data/schema'
import { ActivityAction, ActivityResourceType } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'

export const columns: ColumnDef<Activity>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-[2px]'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Time' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return (
        <div className='text-nowrap'>
          {formatDistanceToNow(date, { addSuffix: true })}
        </div>
      )
    },
    meta: { className: 'w-40' },
  },
  {
    accessorKey: 'action',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Action' />
    ),
    cell: ({ row }) => {
      const action = row.getValue('action') as ActivityAction
      return (
        <Badge className={cn('font-normal', getActionBadgeColor(action))}>
          {formatActionName(action)}
        </Badge>
      )
    },
    meta: { className: 'w-44' },
  },
  {
    accessorKey: 'user',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='User' />
    ),
    cell: ({ row }) => {
      const user = row.original.user as Activity['user']
      const userRole = row.original.userRole

      if (!user) {
        return <span className='text-muted-foreground'>System</span>
      }

      const displayName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.name || user.email

      return (
        <div className='flex flex-col'>
          <LongText className='max-w-32 font-medium'>{displayName}</LongText>
          <span className='text-xs text-muted-foreground'>{user.email}</span>
          {userRole && (
            <Badge variant='outline' className='mt-1 w-fit text-xs'>
              {userRole}
            </Badge>
          )}
        </div>
      )
    },
    meta: { className: 'w-44' },
  },
  {
    accessorKey: 'resourceType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Resource Type' />
    ),
    cell: ({ row }) => {
      const resourceType = row.getValue('resourceType') as ActivityResourceType
      return (
        <span className='text-sm'>{formatResourceType(resourceType)}</span>
      )
    },
    meta: { className: 'w-36' },
  },
  {
    accessorKey: 'resourceName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Resource' />
    ),
    cell: ({ row }) => {
      const resourceName = row.getValue('resourceName') as string | null
      return (
        <LongText className='max-w-40'>{resourceName || '-'}</LongText>
      )
    },
    meta: { className: 'w-48' },
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Description' />
    ),
    cell: ({ row }) => {
      const description = row.getValue('description') as string | null
      return (
        <LongText className='max-w-64'>{description || '-'}</LongText>
      )
    },
  },
  {
    accessorKey: 'success',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const success = row.getValue('success') as boolean
      return (
        <Badge variant={success ? 'default' : 'destructive'} className='font-normal'>
          {success ? 'Success' : 'Failed'}
        </Badge>
      )
    },
    meta: { className: 'w-24' },
  },
  {
    accessorKey: 'ipAddress',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='IP Address' />
    ),
    cell: ({ row }) => {
      const ipAddress = row.getValue('ipAddress') as string | null
      return (
        <span className='text-xs text-muted-foreground font-mono'>
          {ipAddress || '-'}
        </span>
      )
    },
    meta: { className: 'w-28' },
  },
]
