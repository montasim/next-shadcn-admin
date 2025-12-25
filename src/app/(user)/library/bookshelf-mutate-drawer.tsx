'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from '@/components/ui/image-upload'
import { createBookshelf, updateBookshelf, getBookshelfById, checkBookshelfNameAvailability } from './actions'
import { getBooks } from '@/app/dashboard/books/actions'
import { Loader2, X, Check, Plus } from 'lucide-react'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  bookshelf?: any
}

const formSchema = z.object({
  name: z.string().min(1, 'Bookshelf name is required.'),
  description: z.string().optional(),
  image: z.union([z.string(), z.any()]).optional(),
  isPublic: z.boolean().default(false),
})

type BookshelfForm = z.infer<typeof formSchema>

export function BookshelfMutateDrawer({ open, onOpenChange, onSuccess, bookshelf }: Props) {
  const [loading, setLoading] = useState(false)
  const [allBooks, setAllBooks] = useState<any[]>([])
  const [booksLoading, setBooksLoading] = useState(false)
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set())
  const [nameAvailability, setNameAvailability] = useState<{ available: boolean; message: string; checking: boolean } | null>(null)
  const [fullBookshelf, setFullBookshelf] = useState<any>(null)
  const nameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isEditing = !!bookshelf

  const form = useForm<BookshelfForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      image: '',
      isPublic: false,
    },
  })

  // Real-time name availability check with debouncing
  const checkNameAvailability = useCallback(async (name: string) => {
    if (!name || name.trim().length === 0) {
      setNameAvailability(null)
      return
    }

    // Clear previous timeout
    if (nameCheckTimeoutRef.current) {
      clearTimeout(nameCheckTimeoutRef.current)
    }

    // Debounce the check
    nameCheckTimeoutRef.current = setTimeout(async () => {
      setNameAvailability({ available: false, message: 'Checking...', checking: true })
      const result = await checkBookshelfNameAvailability(name, bookshelf?.id || fullBookshelf?.id)
      setNameAvailability({ ...result, checking: false })
    }, 500)
  }, [bookshelf?.id, fullBookshelf?.id])

  // Watch name changes and check availability
  const nameValue = form.watch('name')
  useEffect(() => {
    checkNameAvailability(nameValue)
    return () => {
      if (nameCheckTimeoutRef.current) {
        clearTimeout(nameCheckTimeoutRef.current)
      }
    }
  }, [nameValue, checkNameAvailability])

  // Pre-fill form when editing and fetch books
  useEffect(() => {
    const fetchData = async () => {
      if (bookshelf) {
        // If only ID is provided (partial bookshelf object), fetch full data
        if (bookshelf.id && !bookshelf.name) {
          setBooksLoading(true)
          try {
            const bookshelfData = await getBookshelfById(bookshelf.id)
            setFullBookshelf(bookshelfData)

            // Get the IDs of books that are in this bookshelf
            const bookshelfBookIds = bookshelfData?.books.map((b: any) => b.book.id) || []

            // Reset form with full data
            form.reset({
              name: bookshelfData.name || '',
              description: bookshelfData.description || '',
              image: bookshelfData.image || '',
              isPublic: bookshelfData.isPublic || false,
            })

            // Fetch all books
            const books = await getBooks()
            setAllBooks(books)
            setSelectedBooks(new Set(bookshelfBookIds))
          } catch (error) {
            console.error('Error fetching bookshelf:', error)
          } finally {
            setBooksLoading(false)
          }
        } else {
          // Full bookshelf object provided
          form.reset({
            name: bookshelf.name || '',
            description: bookshelf.description || '',
            image: bookshelf.image || '',
            isPublic: bookshelf.isPublic || false,
          })

          // Fetch books in this bookshelf
          setBooksLoading(true)
          try {
            const books = await getBooks()
            const bookshelfData = await getBookshelfById(bookshelf.id)

            // Get the IDs of books that are in this bookshelf
            const bookshelfBookIds = bookshelfData?.books.map((b: any) => b.book.id) || []

            setAllBooks(books)
            setSelectedBooks(new Set(bookshelfBookIds))
          } catch (error) {
            console.error('Error fetching books:', error)
          } finally {
            setBooksLoading(false)
          }
        }
      } else {
        setFullBookshelf(null)
        form.reset({
          name: '',
          description: '',
          image: '',
          isPublic: false,
        })
        setSelectedBooks(new Set())
        setAllBooks([])
      }
    }

    fetchData()
  }, [bookshelf, form, open])

  const onSubmit = async (data: BookshelfForm) => {
    setLoading(true)
    try {
      const formData = new FormData()
      const bookshelfId = bookshelf?.id || fullBookshelf?.id

      if (isEditing && bookshelfId) {
        formData.append('name', data.name)
        formData.append('description', data.description || '')
        formData.append('isPublic', data.isPublic ? 'on' : 'off')

        if (data.image instanceof File) {
          formData.append('image', data.image)
        } else if (typeof data.image === 'string' && data.image) {
          formData.append('existingImageUrl', data.image)
        } else if (data.image === null && (bookshelf?.image || fullBookshelf?.image)) {
          // Image was explicitly removed
          formData.append('removeImage', 'true')
        }

        const result = await updateBookshelf(bookshelfId, formData, Array.from(selectedBooks))

        if (result.success) {
          toast({ title: result.message })
          form.reset()
          setFullBookshelf(null)
          onSuccess?.()
          onOpenChange(false)
        } else {
          toast({ title: result.message, variant: 'destructive' })
        }
      } else {
        formData.append('name', data.name)
        formData.append('description', data.description || '')
        formData.append('isPublic', data.isPublic ? 'on' : 'off')

        if (data.image instanceof File) {
          formData.append('image', data.image)
        }

        const result = await createBookshelf(formData)

        if (result.success) {
          toast({ title: result.message })
          form.reset()
          onSuccess?.()
          onOpenChange(false)
        } else {
          toast({ title: result.message, variant: 'destructive' })
        }
      }
    } catch (error: any) {
      console.error('Error submitting form:', error)
      toast({ title: `Failed to ${isEditing ? 'update' : 'create'} bookshelf`, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const toggleBook = (bookId: string) => {
    setSelectedBooks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(bookId)) {
        newSet.delete(bookId)
      } else {
        newSet.add(bookId)
      }
      return newSet
    })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          form.reset()
        }
        onOpenChange(v)
      }}
    >
      <SheetContent className='flex flex-col max-w-2xl overflow-y-auto'>
        <SheetHeader className='text-left'>
          <SheetTitle>{isEditing ? 'Edit Bookshelf' : 'Create Bookshelf'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Update bookshelf details and manage the books in this collection.'
              : 'Create a new collection to organize your books.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='bookshelf-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-5 flex-1 mt-4'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input {...field} placeholder='e.g., "Summer Reading", "Sci-Fi Favorites"' />
                      {nameAvailability && !nameAvailability.checking && (
                        <div className="absolute right-8 top-1/2 -translate-y-1/2">
                          {nameAvailability.available ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      )}
                      {nameAvailability?.checking && (
                        <div className="absolute right-8 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  {nameAvailability && !nameAvailability.checking && nameValue && (
                    <FormDescription className={nameAvailability.available ? 'text-green-600' : 'text-destructive'}>
                      {nameAvailability.message}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A short description of this bookshelf."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='image'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Cover Image
                    <InfoTooltip content="Max file size: 1MB" />
                  </FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      onRemove={() => field.onChange(null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <FormLabel> Make Public </FormLabel>
                    <InfoTooltip content="Public bookshelves can be viewed by other users." />
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isEditing && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel>Manage Books</FormLabel>
                  {booksLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {selectedBooks.size} {selectedBooks.size === 1 ? 'book' : 'books'} selected
                    </span>
                  )}
                </div>
                <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                  {allBooks.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No books available
                    </div>
                  ) : (
                    allBooks.map((book) => {
                      const isSelected = selectedBooks.has(book.id)
                      return (
                        <div
                          key={book.id}
                          className="flex items-center justify-between p-3 hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Checkbox
                              id={`book-${book.id}`}
                              checked={isSelected}
                              onCheckedChange={() => toggleBook(book.id)}
                            />
                            <label
                              htmlFor={`book-${book.id}`}
                              className="text-sm cursor-pointer flex-1 min-w-0 truncate"
                            >
                              {book.name}
                            </label>
                            <Badge variant="outline" className="text-xs">
                              {book.type}
                            </Badge>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select books to add them to this bookshelf. Uncheck to remove.
                </p>
              </div>
            )}
          </form>
        </Form>
        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline'>Close</Button>
          </SheetClose>
          <Button
            form='bookshelf-form'
            type='submit'
            disabled={loading}
          >
            {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Bookshelf' : 'Create Bookshelf')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
