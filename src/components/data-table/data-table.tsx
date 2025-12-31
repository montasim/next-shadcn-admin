'use client'

import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { DataTableToolbar } from './data-table-toolbar'
import { FilterConfig } from './data-table-toolbar'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  filterColumn?: string
  filterPlaceholder?: string
  filters?: FilterConfig[]
  defaultVisibility?: VisibilityState
  responsiveColumns?: {
    [key: string]: number // breakpoint width
  }
  pagination?: PaginationState
  onPaginationChange?: (pagination: PaginationState) => void
  totalCount?: number
  onSelectedRowsChange?: (selectedRows: string[]) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterColumn,
  filterPlaceholder,
  filters,
  defaultVisibility = {},
  responsiveColumns = {},
  pagination: externalPagination,
  onPaginationChange: externalOnPaginationChange,
  totalCount,
  onSelectedRowsChange,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({})

  // Notify parent of selection changes
  React.useEffect(() => {
    if (onSelectedRowsChange) {
      const selectedIds = Object.keys(rowSelection).filter(key => rowSelection[key as keyof typeof rowSelection])
      onSelectedRowsChange(selectedIds)
    }
  }, [rowSelection, onSelectedRowsChange])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(defaultVisibility)

  // Use external pagination if provided, otherwise use internal state
  const [internalPagination, setInternalPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const pagination = externalPagination ?? internalPagination
  const setPagination = externalOnPaginationChange ?? setInternalPagination

  // Determine if using API-based pagination
  const isApiPagination = !!externalPagination && totalCount !== undefined

  // Apply responsive columns on client-side only
  React.useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(responsiveColumns).length > 0) {
      setColumnVisibility(prev => {
        const newVisibility = { ...prev }
        Object.entries(responsiveColumns).forEach(([column, breakpoint]) => {
          newVisibility[column] = window.innerWidth > breakpoint
        })
        return newVisibility
      })
    }
  }, [responsiveColumns])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])

  // Handle window resize
  React.useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(responsiveColumns).length > 0) {
      const handleResize = () => {
        setColumnVisibility(prev => {
          const newVisibility = { ...prev }
          Object.entries(responsiveColumns).forEach(([column, breakpoint]) => {
            newVisibility[column] = window.innerWidth > breakpoint
          })
          return newVisibility
        })
      }

      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [responsiveColumns])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updaterOrValue) => {
      setPagination(
        typeof updaterOrValue === 'function'
          ? updaterOrValue(pagination)
          : updaterOrValue
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // Only use client-side pagination if not using API pagination
    ...(!isApiPagination && {
      getPaginationRowModel: getPaginationRowModel(),
    }),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    // When using API pagination, auto-reset pagination index when data changes
    ...(isApiPagination && {
      autoResetPageIndex: false,
    }),
  })

  return (
    <div className='space-y-4'>
      {filterColumn && (
        <DataTableToolbar
          table={table}
          filterColumn={filterColumn}
          placeholder={filterPlaceholder}
          filters={filters}
        />
      )}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} totalCount={totalCount} isApiPagination={isApiPagination} />
    </div>
  )
}
