'use client'

import { deleteCategory, getCategories } from './actions'
import { HeaderContainer } from '@/components/ui/header-container'
import { CategoriesHeader } from './components/categories-header'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Category } from './data/schema'
import useDialogState from '@/hooks/use-dialog-state'
import CategoriesContextProvider, { CategoriesDialogType } from './context/categories-context'
import { toast } from '@/hooks/use-toast'
import { DataTable } from '@/components/data-table/data-table'
import { columns } from './components/columns'
import { CategoriesMutateDrawer } from './components/categories-mutate-drawer'
import { CategoriesDeleteDialog } from './components/categories-delete-dialog'
import { EmptyStateCard } from '@/components/ui/empty-state-card'
import { Button } from '@/components/ui/button'
import { Trash2, X } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [totalCount, setTotalCount] = useState(0)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)

  // Store current pagination in a ref to avoid stale closures
  const paginationRef = useRef(pagination)
  paginationRef.current = pagination

  // Track component mount
  const isMountedRef = useRef(false)

  // Track last fetched page to prevent duplicates
  const lastFetchedRef = useRef<string>('')

  const fetchCategoriesForPage = useCallback(async (pageIndex: number, pageSize: number) => {
    const fetchKey = `${pageIndex}-${pageSize}`
    const apiPage = pageIndex + 1

    // Skip if we just fetched this page
    if (lastFetchedRef.current === fetchKey) {
      return
    }

    // Mark as fetching immediately to prevent duplicates
    lastFetchedRef.current = fetchKey

    try {
      const result = await getCategories({
        page: apiPage,
        pageSize: pageSize,
      })
      setCategories(result.categories)
      setTotalCount(result.pagination.total)
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Reset on error so we can retry
      lastFetchedRef.current = ''
    }
  }, [])

  useEffect(() => {
    // Skip first render - let the initial fetch happen naturally
    if (!isMountedRef.current) {
      isMountedRef.current = true
      fetchCategoriesForPage(pagination.pageIndex, pagination.pageSize)
      return
    }

    fetchCategoriesForPage(pagination.pageIndex, pagination.pageSize)
  }, [pagination.pageIndex, pagination.pageSize, fetchCategoriesForPage])

  // Local states
  const [currentRow, setCurrentRow] = useState<Category | null>(null)
  const [open, setOpen] = useDialogState<CategoriesDialogType>(null)

  const refreshCategories = async () => {
    const { pageIndex, pageSize } = paginationRef.current
    await fetchCategoriesForPage(pageIndex, pageSize)
  }

  const handleDelete = async (category: Category) => {
    try {
      await deleteCategory(category.id)
      await refreshCategories()
      toast({
        title: 'The following category has been deleted:',
        description: (
          <pre className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
            <code className='text-white'>
              {JSON.stringify(category, null, 2)}
            </code>
          </pre>
        ),
      })
      // Close the delete modal and clear the current row
      setOpen(null)
      setCurrentRow(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      })
    }
  }

  const handleBulkDelete = async () => {
    try {
      let deletedCount = 0
      let failedCount = 0

      for (const categoryId of selectedRows) {
        try {
          await deleteCategory(categoryId)
          deletedCount++
        } catch (error) {
          console.error(`Failed to delete category ${categoryId}:`, error)
          failedCount++
        }
      }

      await refreshCategories()
      setSelectedRows([])
      setShowBulkDeleteDialog(false)

      if (failedCount > 0) {
        toast({
          title: 'Partial success',
          description: `${deletedCount} ${deletedCount === 1 ? 'category' : 'categories'} deleted. ${failedCount} ${failedCount === 1 ? 'category' : 'categories'} could not be deleted.`,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Categories deleted successfully',
          description: `${deletedCount} ${deletedCount === 1 ? 'category' : 'categories'} deleted.`,
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete categories',
        variant: 'destructive',
      })
    }
  }

  return (
    <CategoriesContextProvider value={{ open, setOpen, currentRow, setCurrentRow, refreshCategories }}>
      <HeaderContainer>
        <CategoriesHeader />
      </HeaderContainer>

      {selectedRows.length > 0 && (
        <div className='mb-4 flex items-center justify-between rounded-lg border bg-muted/50 p-4'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium'>
              {selectedRows.length} {selectedRows.length === 1 ? 'category' : 'categories'} selected
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setSelectedRows([])}
            >
              <X className='mr-2 h-4 w-4' />
              Clear
            </Button>
            <Button
              variant='destructive'
              size='sm'
              onClick={() => setShowBulkDeleteDialog(true)}
            >
              <Trash2 className='mr-2 h-4 w-4' />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
        {categories.length === 0 ? (
          <EmptyStateCard
            title='No categories found'
            description='There are no categories in the system yet. Create your first category to get started.'
          />
        ) : (
          <DataTable
            data={categories}
            columns={columns}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalCount={totalCount}
            onSelectedRowsChange={setSelectedRows}
          />
        )}
      </div>

      <CategoriesMutateDrawer
        key='category-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
        onSuccess={refreshCategories}
      />

      {currentRow && (
        <>
          <CategoriesMutateDrawer
            key={`category-update-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
            onSuccess={refreshCategories}
          />

          <CategoriesDeleteDialog
            key='category-delete'
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            onConfirm={() => handleDelete(currentRow)}
            category={currentRow}
          />
        </>
      )}

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Categories</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRows.length} {selectedRows.length === 1 ? 'category' : 'categories'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CategoriesContextProvider>
  )
}
