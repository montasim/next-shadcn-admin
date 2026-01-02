/**
 * Reusable Table Skeleton Component
 *
 * Displays a loading skeleton matching the DataTable structure
 * with configurable row count for different page sizes
 */

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface TableSkeletonProps {
  rowCount?: number
  columns?: number
  showSelect?: boolean
  showActions?: boolean
  columnWidths?: string[]
}

export function TableSkeleton({
  rowCount = 10,
  columns = 9,
  showSelect = true,
  showActions = true,
  columnWidths,
}: TableSkeletonProps) {
  // Default column widths matching typical admin tables
  const defaultWidths = showSelect
    ? ['w-10', 'w-48', 'w-20', 'w-32', 'w-36', 'w-28', 'w-16', 'w-20', 'w-32', 'w-12']
    : ['w-48', 'w-20', 'w-32', 'w-36', 'w-28', 'w-16', 'w-20', 'w-32', 'w-12']

  const widths = columnWidths || defaultWidths

  return (
    <div className='space-y-4'>
      <div className='overflow-x-auto rounded-md border'>
        <table className='w-full caption-bottom text-sm'>
          <thead className='[&_tr]:border-b'>
            <tr className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
              {showSelect && (
                <th className='h-12 px-4 text-left align-middle'>
                  <Skeleton className='h-4 w-4' />
                </th>
              )}
              {widths.slice(showSelect ? 1 : 0, showActions ? -1 : undefined).map((width, index) => (
                <th key={index} className='h-12 px-4 text-left align-middle'>
                  <Skeleton className={`h-4 ${width === 'w-auto' ? 'w-24' : width}`} />
                </th>
              ))}
              {showActions && (
                <th className='h-12 px-4 text-left align-middle w-12'>
                  <Skeleton className='h-4 w-8' />
                </th>
              )}
            </tr>
          </thead>
          <tbody className='[&_tr:last-child]:border-0'>
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'
              >
                {showSelect && (
                  <td className='p-4 align-middle'>
                    <Skeleton className='h-4 w-4' />
                  </td>
                )}
                {widths.slice(showSelect ? 1 : 0, showActions ? -1 : undefined).map((width, cellIndex) => (
                  <td key={cellIndex} className='p-4 align-middle'>
                    <Skeleton className={`h-5 ${width === 'w-auto' ? 'w-full max-w-48' : width}`} />
                  </td>
                ))}
                {showActions && (
                  <td className='p-4 align-middle'>
                    <Skeleton className='h-8 w-8 rounded' />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination skeleton */}
      <TablePaginationSkeleton />
    </div>
  )
}

function TablePaginationSkeleton() {
  return (
    <div className='flex items-center justify-between overflow-auto px-2'>
      {/* Selected rows info */}
      <div className='hidden flex-1 text-sm text-muted-foreground sm:block'>
        <Skeleton className='h-4 w-40' />
      </div>
      {/* Pagination controls */}
      <div className='flex items-center sm:space-x-6 lg:space-x-8'>
        {/* Rows per page */}
        <div className='flex items-center space-x-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-8 w-[70px]' />
        </div>
        {/* Page X of Y */}
        <Skeleton className='h-4 w-24' />
        {/* Navigation buttons */}
        <div className='flex items-center space-x-2'>
          <Skeleton className='h-8 w-8' />
          <Skeleton className='h-8 w-8' />
          <Skeleton className='h-8 w-8' />
          <Skeleton className='h-8 w-8' />
        </div>
      </div>
    </div>
  )
}

/**
 * Dashboard Summary Skeleton Component
 *
 * Displays loading skeletons for stat cards in the dashboard summary
 */
export function DashboardSummarySkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Filter Section Skeleton Component
 *
 * Displays loading skeletons for filter inputs and selects
 */
export function FilterSectionSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-20" />
      </div>

      {/* Filter grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>

      {/* Apply button */}
      <div className="mt-4 flex justify-end">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}

/**
 * Filter Tabs Skeleton Component
 *
 * Displays loading skeletons for tab-based filters
 */
export function FilterTabsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Card className="p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-20" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {Array.from({ length: count }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-24" />
        ))}
      </div>
    </Card>
  )
}

/**
 * Ticket List Skeleton Component
 *
 * Displays loading skeletons for support ticket cards
 */
export function TicketListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0 space-y-3">
                {/* Title and badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                {/* Description */}
                <Skeleton className="h-10 w-full" />
                {/* Meta info */}
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Book Request List Skeleton Component
 *
 * Displays loading skeletons for book request cards
 */
export function BookRequestListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="border rounded-lg divide-y">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              {/* Title and badge */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              {/* Author */}
              <Skeleton className="h-4 w-48" />
              {/* Details grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-24" />
              </div>
              {/* Requested by info */}
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Marketplace Listing Skeleton Component
 *
 * Displays loading skeletons for marketplace listing cards
 */
export function MarketplaceListingSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Thumbnail */}
              <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
              {/* Content */}
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Title and badge */}
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    {/* Price */}
                    <Skeleton className="h-6 w-32" />
                    {/* Meta info */}
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-8" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
