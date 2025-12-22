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
import { createBookshelf } from './actions'
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
  name: z.string().min(1, 'Bookshelf name is required.'),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
})

type BookshelfForm = z.infer<typeof formSchema>

export function BookshelfMutateDrawer({ open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)

  const form = useForm<BookshelfForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      isPublic: false,
    },
  })

  const onSubmit = async (data: BookshelfForm) => {
    setLoading(true)
    try {
      const result = await createBookshelf(data)

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
      toast({ title: 'Failed to create bookshelf', variant: 'destructive' })
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
          <SheetTitle>Create Bookshelf</SheetTitle>
          <SheetDescription>
            Create a new collection to organize your books.
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
                    <Input {...field} placeholder='e.g., "Summer Reading", "Sci-Fi Favorites"' />
                  </FormControl>
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
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <FormLabel> Make Public </FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Public bookshelves can be viewed by other users.</p>
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
            form='bookshelf-form'
            type='submit'
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Bookshelf'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
