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
import { MultiSelect } from '@/components/ui/multi-select'
import { Textarea } from '@/components/ui/textarea'
import { MOOD_COLORS } from '../data/schema'
import { Label } from '@/components/ui/label'

const moodFormSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required').regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed'),
  name: z.string().min(1, 'Name is required'),
  emoji: z.string().min(1, 'Emoji is required'),
  description: z.string().min(1, 'Description is required'),
  color: z.string().min(1, 'Color is required'),
  isActive: z.boolean().default(true),
  order: z.number().default(0),
  categoryIds: z.array(z.string()).default([]),
})

type MoodFormValues = z.infer<typeof moodFormSchema>

interface MoodFormProps {
  initialData?: Partial<MoodFormValues>
  onSubmit: (data: MoodFormValues) => Promise<void>
  isEdit?: boolean
  onCancel: () => void
  loading: boolean
  categories: Array<{ value: string; label: string }>
}

// Common emoji options
const EMOJI_OPTIONS = [
  '😊', '🚀', '💕', '🔍', '✨', '📖', '😌', '🤔',
  '😢', '😴', '😎', '🤯', '🥳', '😤', '🥺', '😡',
  '🌟', '🎭', '🎨', '🎮', '🌈', '☀️', '🌙', '🔥',
  '💪', '🧘', '🎵', '📚', '💡', '🌺', '🍕', '🎁',
]

export function MoodForm({ initialData, onSubmit, isEdit = false, onCancel, loading, categories }: MoodFormProps) {
  const form = useForm<MoodFormValues>({
    resolver: zodResolver(moodFormSchema),
    defaultValues: {
      identifier: initialData?.identifier || '',
      name: initialData?.name || '',
      emoji: initialData?.emoji || '',
      description: initialData?.description || '',
      color: initialData?.color || MOOD_COLORS[0].value,
      isActive: initialData?.isActive ?? true,
      order: initialData?.order ?? 0,
      categoryIds: initialData?.categoryIds || [],
    },
  })

  const onFormSubmit = async (values: MoodFormValues) => {
    await onSubmit(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Identifier *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., happy, adventurous" {...field} />
                </FormControl>
                <FormDescription>
                  Unique ID for this mood (lowercase, letters, numbers, hyphens only)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Happy" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="emoji"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emoji *</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Input placeholder="Select or type an emoji" {...field} />
                  <div className="flex flex-wrap gap-1">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => field.onChange(emoji)}
                        className="w-10 h-10 text-xl flex items-center justify-center border rounded hover:bg-muted transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
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
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Feel-good stories and uplifting content"
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color Theme *</FormLabel>
              <FormControl>
                <div className="grid grid-cols-5 gap-2">
                  {MOOD_COLORS.map((colorOption) => (
                    <button
                      key={colorOption.value}
                      type="button"
                      onClick={() => field.onChange(colorOption.value)}
                      className={`h-12 rounded border-2 transition-all ${
                        field.value === colorOption.value
                          ? 'border-primary ring-2 ring-primary ring-offset-2'
                          : 'border-border hover:border-muted-foreground'
                      } ${colorOption.preview}`}
                      title={colorOption.label}
                    />
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categories</FormLabel>
              <FormControl>
                <MultiSelect
                  options={categories}
                  selected={field.value}
                  onChange={field.onChange}
                  placeholder="Select categories for this mood"
                  maxDisplay={5}
                />
              </FormControl>
              <FormDescription>
                Select the book categories that match this mood
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
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
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Active</FormLabel>
                  <FormDescription>
                    Show this mood to users
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
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Mood' : 'Create Mood'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
