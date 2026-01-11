'use client'

import { Plus, RefreshCw, Upload, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBooksContext } from '../context/books-context'
import { BulkImportDrawer } from './bulk-import-drawer'
import { useState } from 'react'
import { invalidateCache } from '../actions'
import { toast } from 'sonner'

export function BooksHeader() {
  const { setOpen, refreshBooks } = useBooksContext()
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  const [isInvalidating, setIsInvalidating] = useState(false)

  const handleAddBook = () => {
    setOpen('create')
  }

  const handleInvalidateCache = async () => {
    setIsInvalidating(true)
    try {
      await invalidateCache()
      toast.success('Books cache invalidated successfully')
      await refreshBooks?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to invalidate cache')
    } finally {
      setIsInvalidating(false)
    }
  }

  return (
      <>
          <div>
              <h2 className='text-xl font-bold tracking-tight'>Books List</h2>
              <p className='text-muted-foreground'>
                  Manage books in your library system
              </p>
          </div>
          <div className='flex flex-wrap gap-2'>
              <Button className='space-x-1' onClick={handleAddBook}>
                  <span className='hidden sm:inline'>Add Book</span> <Plus size={18} />
              </Button>
              <Button onClick={() => setBulkImportOpen(true)} variant='outline' size='icon' className='sm:hidden'>
                  <Upload className="h-4 w-4" />
              </Button>
              <Button className='space-x-1 hidden sm:flex' onClick={() => setBulkImportOpen(true)} variant='outline'>
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Import
              </Button>
              <Button onClick={() => refreshBooks?.()} variant='outline' size='icon' className='sm:hidden'>
                  <RefreshCw className="h-4 w-4" />
              </Button>
              <Button className='space-x-1 hidden sm:flex' onClick={() => refreshBooks?.()} variant='outline'>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
              </Button>
              <Button
                  onClick={handleInvalidateCache}
                  variant='outline'
                  disabled={isInvalidating}
                  size='icon'
                  className='sm:hidden'
              >
                  <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                  className='space-x-1 hidden sm:flex'
                  onClick={handleInvalidateCache}
                  variant='outline'
                  disabled={isInvalidating}
              >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isInvalidating ? 'Invalidating...' : 'Invalidate Cache'}
              </Button>
          </div>

          <BulkImportDrawer
              open={bulkImportOpen}
              onOpenChange={setBulkImportOpen}
              onSuccess={() => refreshBooks?.()}
          />
      </>
  )
}