'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ImageUpload } from '@/components/ui/image-upload'
import { Series } from '../data/schema'
import { createSeries, updateSeries } from '../actions'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { getProxiedImageUrl } from '@/lib/image-proxy'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Series | null
  onSuccess?: () => void
}

const formSchema = z.object({
  name: z.string().min(1, 'Series name is required.'),
  description: z.string().optional(),
  image: z.union([z.string(), z.any()]).optional(),
})

type SeriesForm = z.infer<typeof formSchema>

export function SeriesMutateDrawer({ open, onOpenChange, currentRow, onSuccess }: Props) {
  const isUpdate = !!currentRow
  const [loading, setLoading] = useState(false)

  const form = useForm<SeriesForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      image: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (isUpdate && currentRow) {
        form.reset({
          name: currentRow.name || '',
          description: currentRow.description || '',
          image: currentRow.image || '',
        })
      } else {
        form.reset({
          name: '',
          description: '',
          image: '',
        })
      }
    }
  }, [open, currentRow, isUpdate, form])

  const onSubmit = async (data: SeriesForm) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', data.name)
      if (data.description) formData.append('description', data.description)
      if (data.image) formData.append('image', data.image)

      if (isUpdate && currentRow) {
        await updateSeries(currentRow.id, formData)
        toast({
          title: 'Series updated',
          description: 'The series has been updated successfully.',
        })
      } else {
        await createSeries(formData)
        toast({
          title: 'Series created',
          description: 'The series has been created successfully.',
        })
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error submitting form:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to save series',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isUpdate ? 'Edit Series' : 'Add New Series'}</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Update the series information below.'
              : 'Fill in the details to add a new series.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Series Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Harry Potter" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the series..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Series Image</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value || ''}
                      onChange={(file) => field.onChange(file)}
                      onRemove={() => field.onChange(null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUpdate ? 'Update' : 'Create'} Series
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
