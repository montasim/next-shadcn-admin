'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MultiSelect } from '@/components/ui/multi-select'
import { bookTypes } from '../data/schema'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const bookFormSchema = z.object({
  name: z.string().min(1, 'Book name is required'),
  image: z.string().optional(),
  type: z.enum(['HARD_COPY', 'EBOOK', 'AUDIO']),
  buyingPrice: z.string().optional(),
  sellingPrice: z.string().optional(),
  numberOfCopies: z.string().optional(),
  purchaseDate: z.string().optional(),
  authorIds: z.array(z.string()).min(1, 'At least one author is required'),
  publicationIds: z.array(z.string()).min(1, 'At least one publication is required'),
  categoryIds: z.array(z.string()).optional(),
})

type BookFormValues = z.infer<typeof bookFormSchema>

interface BookFormProps {
  initialData?: Partial<BookFormValues>
  onSubmit: (data: FormData) => Promise<void>
  isEdit?: boolean
  onCancel: () => void
}

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

export function BookForm({ initialData, onSubmit, isEdit = false, onCancel }: BookFormProps) {
  const [authors, setAuthors] = useState<Author[]>([])
  const [publications, setPublications] = useState<Publication[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(
    initialData?.purchaseDate ? new Date(initialData.purchaseDate) : undefined
  )

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      image: initialData?.image || '',
      type: initialData?.type || 'HARD_COPY',
      buyingPrice: initialData?.buyingPrice || '',
      sellingPrice: initialData?.sellingPrice || '',
      numberOfCopies: initialData?.numberOfCopies || '',
      purchaseDate: initialData?.purchaseDate || '',
      authorIds: initialData?.authorIds || [],
      publicationIds: initialData?.publicationIds || [],
      categoryIds: initialData?.categoryIds || [],
    },
  })

  const watchType = form.watch('type')

  useEffect(() => {
    // Fetch data for dropdowns
    const fetchData = async () => {
      try {
        // In a real implementation, these would be API calls
        // For now, we'll use placeholder data
        setAuthors([
          { id: '1', name: 'J.K. Rowling' },
          { id: '2', name: 'Stephen King' },
          { id: '3', name: 'George R.R. Martin' },
        ])
        setPublications([
          { id: '1', name: 'Penguin Books' },
          { id: '2', name: 'HarperCollins' },
          { id: '3', name: 'Simon & Schuster' },
        ])
        setCategories([
          { id: '1', name: 'Fiction' },
          { id: '2', name: 'Non-Fiction' },
          { id: '3', name: 'Science Fiction' },
          { id: '4', name: 'Fantasy' },
        ])
      } catch (error) {
        console.error('Error fetching form data:', error)
      }
    }

    fetchData()
  }, [])

  const onFormSubmit = async (values: BookFormValues) => {
    setLoading(true)
    try {
      const formData = new FormData()

      Object.entries(values).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(item => formData.append(key, item))
        } else {
          formData.append(key, value)
        }
      })

      await onSubmit(formData)
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className='space-y-6'>
          <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                  <FormItem>
                      <FormLabel>Book Name *</FormLabel>
                      <FormControl>
                          <Input placeholder='Enter book name' {...field} />
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
                      <FormLabel>Book Type *</FormLabel>
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
                <Input placeholder='Enter image URL' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormField
              control={form.control}
              name='numberOfCopies'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Copies *</FormLabel>
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
              <FormLabel>Authors *</FormLabel>
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
              <FormLabel>Publications *</FormLabel>
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
              <FormLabel>Categories</FormLabel>
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex justify-end gap-4'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button type='submit' disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Book' : 'Create Book'}
          </Button>
        </div>
      </form>
    </Form>
  )
}