'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'

const noticeFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  isActive: z.boolean().default(true),
  validFrom: z.string().nullable(),
  validTo: z.string().nullable(),
  order: z.number().default(0),
})

export type NoticeFormValues = z.infer<typeof noticeFormSchema>

interface NoticeFormProps {
  initialData?: Partial<NoticeFormValues>
  onSubmit: (data: NoticeFormValues) => Promise<void>
  isEdit?: boolean
  onCancel: () => void
  loading: boolean
}

export function NoticeForm({ initialData, onSubmit, isEdit = false, onCancel, loading }: NoticeFormProps) {
  const form = useForm<NoticeFormValues>({
    resolver: zodResolver(noticeFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      content: initialData?.content || '',
      isActive: initialData?.isActive ?? true,
      validFrom: initialData?.validFrom || null,
      validTo: initialData?.validTo || null,
      order: initialData?.order ?? 0,
    },
  })

  const onFormSubmit = async (values: NoticeFormValues) => {
    await onSubmit(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., New books available!" {...field} />
              </FormControl>
              <FormDescription>
                A short, attention-grabbing headline for the notice
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., We've added 50 new books to our collection. Check them out now!"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The main message content of the notice
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

          <FormField
              control={form.control}
              name="validFrom"
              render={({ field }) => (
                  <FormItem>
                      <FormLabel>Valid From</FormLabel>
                      <FormControl>
                          <Input
                              type="datetime-local"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value || null)}
                          />
                      </FormControl>
                      <FormDescription>
                          Optional: When should this notice start showing?
                      </FormDescription>
                      <FormMessage />
                  </FormItem>
              )}
          />

          <FormField
              control={form.control}
              name="validTo"
              render={({ field }) => (
                  <FormItem>
                      <FormLabel>Valid To</FormLabel>
                      <FormControl>
                          <Input
                              type="datetime-local"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value || null)}
                          />
                      </FormControl>
                      <FormDescription>
                          Optional: When should this notice stop showing?
                      </FormDescription>
                      <FormMessage />
                  </FormItem>
              )}
          />

          <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                  <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                          <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                      </FormControl>
                      <FormDescription>
                          Lower numbers appear first
                      </FormDescription>
                      <FormMessage />
                  </FormItem>
              )}
          />

          <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                          <FormLabel>Active</FormLabel>
                          <FormDescription>
                              Show this notice to users
                          </FormDescription>
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

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Notice' : 'Create Notice'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
