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
import { BookType } from '@prisma/client'
import { MDXEditor } from '@/components/ui/mdx-editor'
import { ImageUpload } from '@/components/ui/image-upload'
import { FileUpload } from '@/components/ui/file-upload'
import { Switch } from '@/components/ui/switch'
import { InfoTooltip } from '@/components/ui/info-tooltip'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Book
  onSuccess?: () => void
}

const formSchema = z.object({
  name: z.string().min(1, 'Book name is required.'),
  image: z.union([z.string(), z.any()]).optional(),
  type: z.enum(['HARD_COPY', 'EBOOK', 'AUDIO'] as const),
  bindingType: z.enum(['HARDCOVER', 'PAPERBACK']).optional(),
  pageNumber: z.string().optional(),
  fileUrl: z.union([z.string(), z.any()]).optional(),
  summary: z.string().optional(),
  buyingPrice: z.string().optional(),
  sellingPrice: z.string().optional(),
  numberOfCopies: z.string().optional(),
  purchaseDate: z.string().optional(),
  authorIds: z.array(z.string()).min(1, 'At least one author is required.'),
  publicationIds: z.array(z.string()).min(1, 'At least one publication is required.'),
  categoryIds: z.array(z.string()).min(1, 'At least one category is required.'),
  isPublic: z.boolean().default(false),
  requiresPremium: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (data.type === 'HARD_COPY') {
    if (!data.bindingType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Binding type is required for hard copy books-old',
        path: ['bindingType'],
      });
    }
    if (!data.pageNumber || isNaN(Number(data.pageNumber)) || Number(data.pageNumber) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Page number is required and must be a positive number',
        path: ['pageNumber'],
      });
    }
  } else if (data.type === 'EBOOK') {
    if (!data.pageNumber || isNaN(Number(data.pageNumber)) || Number(data.pageNumber) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Page number is required and must be a positive number',
        path: ['pageNumber'],
      });
    }
    if (!data.fileUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'File is required for eBooks',
        path: ['fileUrl'],
      });
    }
  } else if (data.type === 'AUDIO') {
    if (!data.fileUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'File is required for audio books-old',
        path: ['fileUrl'],
      });
    }
  }
});

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
    defaultValues: {
      name: '',
      image: '',
      type: 'HARD_COPY',
      bindingType: undefined,
      pageNumber: '',
      fileUrl: '',
      summary: '',
      buyingPrice: '',
      sellingPrice: '',
      numberOfCopies: '',
      purchaseDate: '',
      authorIds: [],
      publicationIds: [],
      categoryIds: [],
      isPublic: false,
      requiresPremium: false,
    },
    mode: 'onChange',
  })

  useEffect(() => {
    if (open) {
      const defaultValues = isUpdate && currentRow ? {
        name: currentRow.name || '',
        image: currentRow.image || '',
        type: currentRow.type,
        bindingType: currentRow.bindingType || undefined,
        pageNumber: currentRow.pageNumber?.toString() || '',
        fileUrl: currentRow.fileUrl || '',
        summary: currentRow.summary || '',
        buyingPrice: currentRow.buyingPrice?.toString() || '',
        sellingPrice: currentRow.sellingPrice?.toString() || '',
        numberOfCopies: currentRow.numberOfCopies?.toString() || '',
        purchaseDate: currentRow.purchaseDate || '',
        authorIds: currentRow.authors.map(author => author.id) || [],
        publicationIds: currentRow.publications.map(pub => pub.id) || [],
        categoryIds: currentRow.categories.map(cat => cat.id) || [],
        isPublic: currentRow.isPublic || false,
        requiresPremium: currentRow.requiresPremium || false,
      } : {
        name: '',
        image: '',
        type: 'HARD_COPY',
        bindingType: undefined,
        pageNumber: '',
        fileUrl: '',
        summary: '',
        buyingPrice: '',
        sellingPrice: '',
        numberOfCopies: '',
        purchaseDate: '',
        authorIds: [],
        publicationIds: [],
        categoryIds: [],
        isPublic: false,
        requiresPremium: false,
      };
      form.reset(defaultValues);
      setPurchaseDate(currentRow?.purchaseDate ? new Date(currentRow.purchaseDate) : undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentRow, isUpdate]);

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

      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(item => formData.append(key, item))
        } else if (value instanceof File) {
          formData.append(key, value)
        } else if (value !== null && value !== undefined) {
          // Handle boolean fields - convert to 'true'/'false' string
          const formValue = typeof value === 'boolean' ? String(value) : value
          formData.append(key, formValue as string)
        }
      })

      if (isUpdate && currentRow) {
        await updateBook(currentRow.id, formData)
        toast({
          title: 'Book updated successfully',
        })
      } else {
        await createBook(formData)
        toast({
          title: 'Book created successfully',
        })
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error submitting form:', error)
      toast({
        title: 'Error',
        description: error.message || `Failed to ${isUpdate ? 'update' : 'create'} book`,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          form.reset();
        }
        onOpenChange(v)
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
                  <Select onValueChange={field.onChange} value={field.value}>
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

            {watchType === 'HARD_COPY' && (
                <FormField
                  control={form.control}
                  name='bindingType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Binding Type <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select binding type' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='HARDCOVER'>Hardcover</SelectItem>
                          <SelectItem value='PAPERBACK'>Paperback</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}

            {(watchType === 'HARD_COPY' || watchType === 'EBOOK') && (
                <FormField
                  control={form.control}
                  name='pageNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Number <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='1'
                          placeholder='Enter number of pages'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}

            {(watchType === 'EBOOK' || watchType === 'AUDIO') && (
                <FormField
                  control={form.control}
                  name='fileUrl'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Upload <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <FileUpload
                          value={field.value}
                          onChange={field.onChange}
                          onRemove={() => field.onChange(null)}
                          accept={watchType === 'EBOOK' ? '.pdf,.epub' : '.mp3,.wav'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}

            <FormField
              control={form.control}
              name='image'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Book Cover Image</FormLabel>
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
              name='summary'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <MDXEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder='Enter book summary in markdown format...'
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
                      selected={field.value || []}
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
                      selected={field.value || []}
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
                      selected={field.value || []}
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

            <FormField
              control={form.control}
              name='isPublic'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between space-y-0'>
                  <div className='flex items-center gap-2'>
                    <FormLabel className='flex items-center gap-2'>
                      Make Public
                    </FormLabel>
                    <InfoTooltip content="Enabling this book will make the book publicly visible." />
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

            <FormField
              control={form.control}
              name='requiresPremium'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between space-y-0'>
                  <div className='flex items-center gap-2'>
                    <FormLabel className='flex items-center gap-2'>
                      Requires Premium
                    </FormLabel>
                    <InfoTooltip content="Enabling this will require users to have premium access to view this book." />
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
          </form>
        </Form>
        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline'>Close</Button>
          </SheetClose>
          <Button
            form='books-form'
            type='submit'
            disabled={loading || !form.formState.isValid}
          >
            {loading ? 'Saving...' : isUpdate ? 'Update Book' : 'Create Book'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}