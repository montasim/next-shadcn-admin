'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { BookmarkPlus, Check, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/auth-context'
import { addBookToBookshelf, getUserBookshelvesForBook, removeBookFromBookshelf } from '@/app/(user)/library/actions'
import { toast } from '@/hooks/use-toast'

interface Bookshelf {
  id: string
  name: string
  hasBook: boolean
  _count: {
    books: number
  }
}

interface AddToBookshelfProps {
  bookId: string
  bookName: string
  variant?: 'add' | 'manage'
  triggerVariant?: 'icon' | 'button'
  triggerClassName?: string
  onRefresh?: () => void
}

export const AddToBookshelf: React.FC<AddToBookshelfProps> = ({
  bookId,
  bookName,
  variant = 'add',
  triggerVariant = 'icon',
  triggerClassName,
  onRefresh,
}) => {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([])
  const [loadingBookshelves, setLoadingBookshelves] = useState(false)
  const [addingToBookshelf, setAddingToBookshelf] = useState<string | null>(null)
  const [removingFromBookshelf, setRemovingFromBookshelf] = useState<string | null>(null)

  // Fetch user's bookshelves when popover opens
  const handleOpenChange = async (open: boolean) => {
    setOpen(open)
    if (open && user) {
      setLoadingBookshelves(true)
      try {
        const shelves = await getUserBookshelvesForBook(bookId)
        setBookshelves(shelves)
      } catch (error) {
        console.error('Failed to fetch bookshelves:', error)
        toast({
          title: 'Error',
          description: 'Failed to load bookshelves. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setLoadingBookshelves(false)
      }
    }
  }

  // Add book to bookshelf
  const handleAddToBookshelf = async (bookshelfId: string, bookshelfName: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please login to add books to your library.',
        variant: 'destructive',
      })
      return
    }

    setAddingToBookshelf(bookshelfId)
    try {
      const result = await addBookToBookshelf(bookshelfId, bookId)
      if (result.success) {
        toast({
          title: 'Added to library',
          description: `"${bookName}" has been added to "${bookshelfName}".`,
        })
        // Refresh bookshelves to update hasBook status
        const shelves = await getUserBookshelvesForBook(bookId)
        setBookshelves(shelves)
        onRefresh?.()
      } else {
        toast({
          title: 'Failed to add',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Failed to add',
        description: 'An error occurred while adding the book.',
        variant: 'destructive',
      })
    } finally {
      setAddingToBookshelf(null)
    }
  }

  // Remove book from bookshelf
  const handleRemoveFromBookshelf = async (bookshelfId: string, bookshelfName: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please login to manage your library.',
        variant: 'destructive',
      })
      return
    }

    setRemovingFromBookshelf(bookshelfId)
    try {
      const result = await removeBookFromBookshelf(bookshelfId, bookId)
      if (result.success) {
        toast({
          title: 'Removed from library',
          description: `"${bookName}" has been removed from "${bookshelfName}".`,
        })
        // Refresh bookshelves to update hasBook status
        const shelves = await getUserBookshelvesForBook(bookId)
        setBookshelves(shelves)
        onRefresh?.()
      } else {
        toast({
          title: 'Failed to remove',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Failed to remove',
        description: 'An error occurred while removing the book.',
        variant: 'destructive',
      })
    } finally {
      setRemovingFromBookshelf(null)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {triggerVariant === 'button' ? (
          <Button
            variant="outline"
            className={triggerClassName}
            onClick={(e) => e.stopPropagation()}
          >
            <BookmarkPlus className="h-4 w-4 mr-2" />
            Add to Bookshelf
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'bg-background/80 hover:bg-background backdrop-blur-sm p-0',
              triggerClassName
            )}
            aria-label="Add to bookshelf"
            onClick={(e) => e.stopPropagation()}
          >
            <BookmarkPlus className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="text-sm font-medium mb-2 px-2">
          {variant === 'manage' ? 'Manage Bookshelves' : 'Add to Bookshelf'}
        </div>
        {variant === 'manage' && (
          <div className="px-2 mb-2">
            <div className="h-px bg-border" />
          </div>
        )}
        {!user ? (
          <div className="text-sm text-muted-foreground py-2 px-2">
            Please login to add books to your bookshelves.
          </div>
        ) : loadingBookshelves ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : bookshelves.length === 0 ? (
          <div className="text-sm text-muted-foreground py-2 px-2">
            No bookshelves found. Create one in your library.
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {bookshelves.map((shelf) => (
              <div
                key={shelf.id}
                className={cn(
                  'flex items-center justify-between px-2 py-2 rounded-md transition-colors',
                  variant === 'manage' && shelf.hasBook ? 'bg-accent/50' : 'hover:bg-accent'
                )}
              >
                <span className="text-sm truncate flex-1">{shelf.name}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-2">
                  {shelf._count.books} {shelf._count.books === 1 ? 'book' : 'books'}
                  {variant === 'add' ? (
                    // Add-only variant: show checkmark if has book, disabled state
                    shelf.hasBook ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : addingToBookshelf === shelf.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <button
                        onClick={() => handleAddToBookshelf(shelf.id, shelf.name)}
                        disabled={addingToBookshelf !== null}
                        className="ml-2 text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <BookmarkPlus className="h-3 w-3" />
                      </button>
                    )
                  ) : (
                    // Manage variant: show add/remove buttons
                    shelf.hasBook ? (
                      <button
                        onClick={() => handleRemoveFromBookshelf(shelf.id, shelf.name)}
                        disabled={removingFromBookshelf === shelf.id}
                        className="ml-2 text-destructive hover:text-destructive/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {removingFromBookshelf === shelf.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-3 w-3" />
                            Remove
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddToBookshelf(shelf.id, shelf.name)}
                        disabled={addingToBookshelf === shelf.id}
                        className="ml-2 text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {addingToBookshelf === shelf.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <BookmarkPlus className="h-3 w-3" />
                            Add
                          </>
                        )}
                      </button>
                    )
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

AddToBookshelf.displayName = 'AddToBookshelf'
