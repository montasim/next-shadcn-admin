'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MultiSelect } from '@/components/ui/multi-select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Book } from '../data/schema'
import { createBook, updateBook, getAuthorsForSelect, getPublicationsForSelect, getCategoriesForSelect, getBookTypesForSelect } from '../actions'
import { IconLoader2, IconCheck, IconX } from '@tabler/icons-react'
import { BookType } from '@prisma/client'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Book
  onSuccess?: () => void
}

const formSchema = z.object({
  name: z.string().min(1, 'Book name is required.'),
  image: z.string().optional(),
  type: z.enum(['HARD_COPY', 'EBOOK', 'AUDIO'] as const),
  summary: z.string().optional(),
  buyingPrice: z.string().optional(),
  sellingPrice: z.string().optional(),
  numberOfCopies: z.string().optional(),
  purchaseDate: z.string().optional(),
  authorIds: z.array(z.string()).min(1, 'At least one author is required.'),
  publicationIds: z.array(z.string()).min(1, 'At least one publication is required.'),
  categoryIds: z.array(z.string()).min(1, 'At least one category is required.'),
})

type BookForm = z.infer<typeof formSchema>

interface Author {
  id: string
  name: string
}

interface Publication {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
}

interface BookTypeOption {
  value: BookType
  label: string
}

export function BooksMutateDrawer({ open, onOpenChange, currentRow, onSuccess }: Props) {
  const isUpdate = !!currentRow

  const [authors, setAuthors] = useState<Author[]>([])
  const [publications, setPublications] = useState<Publication[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [bookTypes, setBookTypes] = useState<BookTypeOption[]>([])
  const [loading, setLoading] = useState(false)

  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(
    currentRow?.purchaseDate ? new Date(currentRow.purchaseDate) : undefined
  )

  const form = useForm<BookForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isUpdate && currentRow ? {
      name: currentRow.name || '',
      image: currentRow.image || '',
      type: currentRow.type,
      summary: currentRow.summary || '',
      buyingPrice: currentRow.buyingPrice?.toString() || '',
      sellingPrice: currentRow.sellingPrice?.toString() || '',
      numberOfCopies: currentRow.numberOfCopies?.toString() || '',
      purchaseDate: currentRow.purchaseDate || '',
      authorIds: currentRow.authors.map(author => author.id) || [],
      publicationIds: currentRow.publications.map(pub => pub.id) || [],
      categoryIds: currentRow.categories.map(cat => cat.id) || [],
    } : {
      name: '',
      image: '',
      type: 'HARD_COPY',
      summary: '',
      buyingPrice: '',
      sellingPrice: '',
      numberOfCopies: '',
      purchaseDate: '',
      authorIds: [],
      publicationIds: [],
      categoryIds: [],
    },
    mode: 'onChange',
  })

  const watchType = form.watch('type')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [authorsData, publicationsData, categoriesData, bookTypesData] = await Promise.all([
          getAuthorsForSelect(),
          getPublicationsForSelect(),
          getCategoriesForSelect(),
          getBookTypesForSelect(),
        ])

        setAuthors(authorsData)
        setPublications(publicationsData)
        setCategories(categoriesData)
        setBookTypes(bookTypesData)
      } catch (error) {
        console.error('Error fetching form data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load form data',
          variant: 'destructive',
        })
      }
    }

    if (open) {
      fetchData()
    }
  }, [open])

  const onSubmit = async (data: BookForm) => {
    setLoading(true)
    try {
      const formData = new FormData()

      // Convert form data to proper format
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(item => formData.append(key, item))
        } else {
          formData.append(key, value)
        }
      })

      if (isUpdate && currentRow) {
        await updateBook(currentRow.id, formData)
        toast({
          title: 'Book updated successfully',
          description: (
            <pre className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
              <code className='text-white'>{JSON.stringify(data, null, 2)}</code>
            </pre>
          ),
        })
        onSuccess?.()
      } else {
        await createBook(formData)
        toast({
          title: 'Book created successfully',
          description: (
            <pre className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
              <code className='text-white'>{JSON.stringify(data, null, 2)}</code>
            </pre>
          ),
        })
        onSuccess?.()
      }

      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Error submitting form:', error)
      toast({
        title: 'Error',
        description: `Failed to ${isUpdate ? 'update' : 'create'} book`,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const isFormDisabled = () => {
    if (loading) return true

    const type = watchType
    const numberOfCopies = form.getValues('numberOfCopies')

    // For HARD_COPY, numberOfCopies is required
    if (type === 'HARD_COPY' && (!numberOfCopies || parseInt(numberOfCopies) <= 0)) {
      return true
    }

    return !form.formState.isValid
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        form.reset()
        setPurchaseDate(undefined)
      }}
    >
      <SheetContent className='flex flex-col max-w-2xl overflow-y-auto'>
        <SheetHeader className='text-left'>
          <SheetTitle>{isUpdate ? 'Update' : 'Create'} Book</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Update the book by providing necessary info.'
              : 'Add a new book by providing necessary info.'}
            Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='books-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-5 flex-1'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Book Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Enter book name' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Book Type <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select book type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bookTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='image'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Enter image URL' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='summary'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Enter book summary'
                      className='resize-none'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='buyingPrice'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buying Price</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        step='0.01'
                        placeholder='0.00'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='sellingPrice'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling Price</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        step='0.01'
                        placeholder='0.00'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {watchType === 'HARD_COPY' && (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='numberOfCopies'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Copies <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='1'
                          placeholder='Enter number of copies'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='purchaseDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant='outline'
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={purchaseDate}
                            onSelect={(date) => {
                              setPurchaseDate(date)
                              field.onChange(date ? date.toISOString().split('T')[0] : '')
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name='authorIds'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Authors <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={authors.map(author => ({
                        label: author.name,
                        value: author.id,
                      }))}
                      selected={field.value}
                      onChange={field.onChange}
                      placeholder='Select authors'
                      emptyText='No authors found'
                      maxVisible={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='publicationIds'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Publications <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={publications.map(pub => ({
                        label: pub.name,
                        value: pub.id,
                      }))}
                      selected={field.value}
                      onChange={field.onChange}
                      placeholder='Select publications'
                      emptyText='No publications found'
                      maxVisible={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='categoryIds'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categories <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={categories.map(category => ({
                        label: category.name,
                        value: category.id,
                      }))}
                      selected={field.value}
                      onChange={field.onChange}
                      placeholder='Select categories'
                      emptyText='No categories found'
                      maxVisible={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline'>Close</Button>
          </SheetClose>
          <Button
            form='books-form'
            type='submit'
            disabled={isFormDisabled()}
          >
            {loading ? 'Saving...' : isUpdate ? 'Update Book' : 'Create Book'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}