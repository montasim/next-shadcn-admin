'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { createBook } from './actions'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const formSchema = z.object({
  name: z.string().min(1, 'Book name is required.'),
  author: z.string().min(1, 'Author name is required.'),
  type: z.enum(['EBOOK', 'AUDIO'] as const),
  fileUrl: z.union([z.string(), z.any()]).optional(),
  image: z.union([z.string(), z.any()]).optional(),
  isPublic: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (!data.fileUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'File is required',
      path: ['fileUrl'],
    });
  }
  if (!data.image) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Cover image is required',
      path: ['image'],
    });
  }
});

type BookForm = z.infer<typeof formSchema>

export function UploadBooksMutateDrawer({ open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)

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

  const onSubmit = async (data: BookForm) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('author', data.author)
      formData.append('type', data.type)
      formData.append('isPublic', data.isPublic ? 'on' : 'off')
      
      if (data.fileUrl instanceof File) {
        formData.append('file', data.fileUrl)
      }
      
      if (data.image instanceof File) {
        formData.append('image', data.image)
      }

      const result = await createBook(formData)

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
      toast({ title: 'Failed to create book', variant: 'destructive' })
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
          <SheetTitle>Upload Book</SheetTitle>
          <SheetDescription>
            Add a new book to your collection. You can choose to make it public.
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                    File Upload <span className="text-destructive">*</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Max file size: 10MB</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <FileUpload
                      value={field.value}
                      onChange={field.onChange}
                      onRemove={() => field.onChange(null)}
                      accept={form.watch('type') === 'EBOOK' ? '.pdf,.epub' : '.mp3,.wav'}
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
                    Cover Image <span className="text-destructive">*</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Max file size: 1MB</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This book will be visible to other users in the library.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
            {loading ? 'Uploading...' : 'Upload Book'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
