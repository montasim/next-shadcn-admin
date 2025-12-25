'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { FileUpload } from '@/components/ui/file-upload'
import { ImageUpload } from '@/components/ui/image-upload'
import { createBook, updateBook } from './actions'
import { InfoTooltip } from '@/components/ui/info-tooltip'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  book?: any // Book object for editing
  prefillData?: {
    bookName: string
    authorName: string
    type: 'HARD_COPY' | 'EBOOK' | 'AUDIO'
    edition?: string
    publisher?: string
    isbn?: string
    description?: string
    requestId: string
  }
}

const formSchema = z.object({
  name: z.string().min(1, 'Book name is required.'),
  author: z.string().min(1, 'Author name is required.'),
  type: z.enum(['HARD_COPY', 'EBOOK', 'AUDIO'] as const),
  fileUrl: z.union([z.string(), z.any()]).optional(),
  image: z.union([z.string(), z.any()]).optional(),
  isPublic: z.boolean().default(false),
}).superRefine((data, ctx) => {
  // Only require file/image for new books (not editing)
  if (!data.fileUrl && typeof data.fileUrl === 'string' && data.fileUrl === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'File is required',
      path: ['fileUrl'],
    });
  }
  if (!data.image && typeof data.image === 'string' && data.image === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Cover image is required',
      path: ['image'],
    });
  }
});

type BookForm = z.infer<typeof formSchema>

export function UploadBooksMutateDrawer({ open, onOpenChange, onSuccess, book, prefillData }: Props) {
  const [loading, setLoading] = useState(false)
  const isEditing = !!book
  const isApprovingRequest = !!prefillData

  const form = useForm<BookForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      author: '',
      type: 'EBOOK',
      fileUrl: '',
      image: '',
      isPublic: false,
    },
  })

  // Pre-fill form when editing or approving a request
  useEffect(() => {
    if (book) {
      form.reset({
        name: book.name || '',
        author: book.authors?.[0]?.name || '',
        type: book.type || 'EBOOK',
        fileUrl: book.fileUrl || '',
        image: book.image || '',
        isPublic: book.isPublic || false,
      })
    } else if (prefillData) {
      form.reset({
        name: prefillData.bookName,
        author: prefillData.authorName,
        type: prefillData.type === 'HARD_COPY' ? 'EBOOK' : prefillData.type, // Convert HARD_COPY to EBOOK for uploads
        fileUrl: '',
        image: '',
        isPublic: false,
      })
    } else {
      form.reset({
        name: '',
        author: '',
        type: 'EBOOK',
        fileUrl: '',
        image: '',
        isPublic: false,
      })
    }
  }, [book, prefillData, form, open])

  const onSubmit = async (data: BookForm) => {
    setLoading(true)
    try {
      const formData = new FormData()

      if (isEditing) {
        formData.append('id', book.id)
      }

      formData.append('name', data.name)
      formData.append('author', data.author)
      formData.append('type', data.type)
      formData.append('isPublic', data.isPublic ? 'on' : 'off')

      if (data.fileUrl instanceof File) {
        formData.append('file', data.fileUrl)
      } else if (typeof data.fileUrl === 'string' && data.fileUrl) {
        formData.append('existingFileUrl', data.fileUrl)
      } else if (data.fileUrl === null && isEditing && book?.fileUrl) {
        // File was explicitly removed
        formData.append('removeFile', 'true')
      }

      if (data.image instanceof File) {
        formData.append('image', data.image)
      } else if (typeof data.image === 'string' && data.image) {
        formData.append('existingImageUrl', data.image)
      } else if (data.image === null && isEditing && book?.image) {
        // Image was explicitly removed
        formData.append('removeImage', 'true')
      }

      // Add requestId if approving a request
      if (isApprovingRequest && prefillData?.requestId) {
        formData.append('requestId', prefillData.requestId)
      }

      const result = isEditing
        ? await updateBook(book.id, formData)
        : await createBook(formData)

      if (result.success) {
        toast({ title: result.message })
        form.reset()
        onSuccess?.()
        onOpenChange(false)
      } else {
        toast({ title: result.message, variant: 'destructive' })
      }
    } catch (error: any) {
      console.error('Error submitting form:', error)
      toast({ title: `Failed to ${isEditing ? 'update' : 'create'} book`, variant: 'destructive' })
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
          <SheetTitle>
            {isEditing ? 'Edit Book' : isApprovingRequest ? 'Approve Book Request' : 'Upload Book'}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Update the book details. Change the file or image if needed.'
              : isApprovingRequest
              ? 'Complete the book details to approve this request. The information has been pre-filled from the request.'
              : 'Add a new book to your collection. You can choose to make it public.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='my-books-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-5 flex-1 mt-4'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Book Title <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Enter book title' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='author'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Enter author name' />
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
                  <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select book type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='EBOOK'>E-Book</SelectItem>
                      <SelectItem value='AUDIO'>Audio Book</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='fileUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    File Upload {isEditing && <span className="text-muted-foreground">(optional)</span>}
                    {!isEditing && <span className="text-destructive">*</span>}
                    <InfoTooltip content="Max file size: 10MB" />
                  </FormLabel>
                  <FormControl>
                    <FileUpload
                      value={field.value}
                      onChange={field.onChange}
                      onRemove={() => field.onChange(null)}
                      accept={form.watch('type') === 'EBOOK' ? '.pdf' : '.mp3'}
                      directUrl={book?.directFileUrl}
                      isPdf={form.watch('type') === 'EBOOK'}
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
                    Cover Image {isEditing && <span className="text-muted-foreground">(optional)</span>}
                    {!isEditing && <span className="text-destructive">*</span>}
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
                      <FormLabel className="flex items-center gap-2">
                      Make Public
                    </FormLabel>
                    <InfoTooltip content="This book will be visible to other users in the library." />
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
            form='my-books-form'
            type='submit'
            disabled={loading || !form.formState.isValid}
          >
            {loading
              ? (isApprovingRequest ? 'Approving...' : isEditing ? 'Updating...' : 'Uploading...')
              : (isApprovingRequest ? 'Approve Request' : isEditing ? 'Update Book' : 'Upload Book')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
