'use client'

import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import LongText from '@/components/long-text'
import { Book } from '../data/schema'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'
import { BookOpen, HardDrive, Headphones } from 'lucide-react'
import { useState } from 'react'

const bookTypeIcons = {
  HARD_COPY: HardDrive,
  EBOOK: BookOpen,
  AUDIO: Headphones,
}

const bookTypeLabels = {
  HARD_COPY: 'Hard Copy',
  EBOOK: 'eBook',
  AUDIO: 'Audio',
}

// Expandable tags component
function ExpandableTags({
  items,
  variant,
  maxVisible = 1,
}: {
  items: Array<{ name: string }>
  variant?: 'secondary' | 'outline' | 'default'
  maxVisible?: number
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!items || items.length === 0) {
    return <span className='text-muted-foreground text-sm'>None</span>
  }

  const visibleItems = isExpanded ? items : items.slice(0, maxVisible)
  const hiddenCount = items.length - maxVisible

  return (
    <div className='flex flex-wrap gap-1 max-w-48'>
      {visibleItems.map((item, index) => (
        <Badge key={index} variant={variant} className='text-xs'>
          {item.name}
        </Badge>
      ))}
      {!isExpanded && hiddenCount > 0 && (
        <Badge
          variant={variant}
          className='text-xs cursor-pointer hover:opacity-80'
          onClick={() => setIsExpanded(true)}
        >
          +{hiddenCount} more
        </Badge>
      )}
      {isExpanded && items.length > maxVisible && (
        <Badge
          variant='ghost'
          className='text-xs cursor-pointer hover:opacity-80'
          onClick={() => setIsExpanded(false)}
        >
          Show less
        </Badge>
      )}
    </div>
  )
}

export const columns: ColumnDef<Book>[] = [
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
        aria-label='Select row'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Book Name' />
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <LongText className='max-w-48'>{row.getValue('name')}</LongText>
      </div>
    ),
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)] lg:drop-shadow-none',
        'bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
        'sticky left-6 md:table-cell'
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Type' />
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as keyof typeof bookTypeIcons
      const Icon = bookTypeIcons[type]
      return (
        <Badge variant='outline' className='capitalize flex items-center gap-1'>
          <Icon className='h-3 w-3' />
          {bookTypeLabels[type]}
        </Badge>
      )
    },
    meta: { className: 'w-24' },
  },
  {
    accessorKey: 'authors',
    header: 'Authors',
    cell: ({ row }) => {
      const authors = (row.original as any).authors || []
      return <ExpandableTags items={authors} variant='secondary' maxVisible={1} />
    },
    enableSorting: false,
  },
  {
    accessorKey: 'publications',
    header: 'Publications',
    cell: ({ row }) => {
      const publications = (row.original as any).publications || []
      return (
        <div className='flex flex-wrap gap-1 max-w-48'>
          {publications.slice(0, 2).map((pub: any, index: number) => (
            <Badge key={index} variant='outline' className='text-xs'>
              {pub.name}
            </Badge>
          ))}
          {publications.length > 2 && (
            <Badge variant='outline' className='text-xs'>
              +{publications.length - 2} more
            </Badge>
          )}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'categories',
    header: 'Categories',
    cell: ({ row }) => {
      const categories = (row.original as any).categories || []
      return <ExpandableTags items={categories} variant='default' maxVisible={1} />
    },
    enableSorting: false,
  },
  {
    accessorKey: 'numberOfCopies',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Copies' />
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      const copies = row.getValue('numberOfCopies')

      if (type === 'HARD_COPY') {
        return (
          <Badge variant='secondary'>
            {copies || 0} copies
          </Badge>
        )
      }

      return (
        <Badge variant='outline' className='text-muted-foreground'>
          N/A
        </Badge>
      )
    },
    meta: { className: 'w-20' },
  },
  {
    accessorKey: 'entryDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Entry Date' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('entryDate'))
      return <div className='text-sm'>{date.toLocaleDateString()}</div>
    },
    meta: { className: 'w-32' },
  },
  {
    accessorKey: 'entryBy',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Entry By' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-32'>{row.getValue('entryBy')}</LongText>
    ),
    enableSorting: false,
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