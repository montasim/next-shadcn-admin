'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { Switch } from '@/components/ui/switch'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Mood } from '../data/schema'
import { createMood, updateMood, getCategories } from '../actions'
import { MultiSelect } from '@/components/ui/multi-select'
import { Label } from '@/components/ui/label'
import { MOOD_COLORS } from '../data/schema'
import dynamic from 'next/dynamic'

// Dynamically import the emoji picker to avoid SSR issues
const EmojiPicker = dynamic(
  () => import('emoji-picker-react'),
  { ssr: false }
)

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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Mood | null
  onSuccess?: () => void
}

export function MoodsMutateDrawer({ open, onOpenChange, currentRow, onSuccess }: Props) {
  const isUpdate = !!currentRow
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const form = useForm<MoodFormValues>({
    resolver: zodResolver(moodFormSchema),
    defaultValues: {
      identifier: '',
      name: '',
      emoji: '',
      description: '',
      color: MOOD_COLORS[0].value,
      isActive: true,
      order: 0,
      categoryIds: [],
    },
  })

  // Load categories when drawer opens
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await getCategories()
        setCategories(cats.map((c: any) => ({ value: c.id, label: c.name })))
      } catch (error) {
        console.error('Failed to load categories:', error)
      }
    }

    // Set form values when drawer opens
    if (open) {
      loadCategories()
      if (isUpdate && currentRow) {
        form.reset({
          identifier: currentRow.identifier || '',
          name: currentRow.name || '',
          emoji: currentRow.emoji || '',
          description: currentRow.description || '',
          color: currentRow.color || MOOD_COLORS[0].value,
          isActive: currentRow.isActive ?? true,
          order: currentRow.order ?? 0,
          categoryIds: currentRow.categoryIds || [],
        })
      } else {
        form.reset()
      }
    }
  }, [open, currentRow, isUpdate, form])

  const onSubmit = async (data: MoodFormValues) => {
    setLoading(true)
    try {
      if (isUpdate && currentRow) {
        await updateMood(currentRow.id, data)
        toast({
          title: 'Mood updated successfully',
        })
      } else {
        await createMood(data)
        toast({
          title: 'Mood created successfully',
        })
      }
      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${isUpdate ? 'update' : 'create'} mood`,
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
          form.reset()
        }
        onOpenChange(v)
      }}
    >
      <SheetContent className="flex flex-col overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>{isUpdate ? 'Update' : 'Create'} Mood</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Update the mood and its category mappings.'
              : 'Add a new mood for book recommendations.'}
            Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id="moods-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 flex-1"
          >
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

            <FormField
              control={form.control}
              name="emoji"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emoji *</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Click to select an emoji"
                          {...field}
                          readOnly
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="cursor-pointer"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                          {field.value || '😀'}
                        </Button>
                      </div>
                      {showEmojiPicker && (
                        <div className="border rounded-md p-2 bg-background">
                          <EmojiPicker
                            onEmojiClick={(emojiData) => {
                              field.onChange(emojiData.emoji)
                              setShowEmojiPicker(false)
                            }}
                            height={350}
                            width="100%"
                          />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Click the input or button to select an emoji
                  </FormDescription>
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
                    <Input
                      placeholder="e.g., Feel-good stories and uplifting content"
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
                    />
                  </FormControl>
                  <FormDescription>
                    Select the book categories that match this mood
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
          </form>
        </Form>
        <SheetFooter className="gap-2">
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
          <Button
            form="moods-form"
            type="submit"
            disabled={loading || !form.formState.isValid}
          >
            {loading ? 'Saving...' : isUpdate ? 'Update Mood' : 'Create Mood'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
