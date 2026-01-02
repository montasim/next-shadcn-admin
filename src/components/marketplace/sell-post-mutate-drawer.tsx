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
  FormDescription,
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
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from '@/components/ui/image-upload'
import { ShoppingBag, Loader2 } from 'lucide-react'
import { BookCondition } from '@prisma/client'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const sellPostFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().optional(),
  price: z.string().min(1, 'Price is required'),
  negotiable: z.boolean().default(true),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']),
  images: z.array(z.union([z.string(), z.any()])).min(1, 'At least one image is required'),
  location: z.string().optional(),
  city: z.string().optional(),
})

type SellPostFormValues = z.infer<typeof sellPostFormSchema>

const CONDITION_OPTIONS = [
  { value: 'NEW', label: 'New', description: 'Brand new, unused' },
  { value: 'LIKE_NEW', label: 'Like New', description: 'Minimal signs of use' },
  { value: 'GOOD', label: 'Good', description: 'Some signs of use but well cared for' },
  { value: 'FAIR', label: 'Fair', description: 'Noticeable wear' },
  { value: 'POOR', label: 'Poor', description: 'Significant wear or damage' },
]

export function SellPostMutateDrawer({ open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)

  const form = useForm<SellPostFormValues>({
    resolver: zodResolver(sellPostFormSchema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      negotiable: true,
      condition: 'GOOD',
      images: [],
      location: '',
      city: '',
    },
    mode: 'onChange',
  })

  const onSubmit = async (data: SellPostFormValues) => {
    setLoading(true)
    try {
      // Process images - upload File objects and keep string URLs
      const processedImages: string[] = []
      const directImageUrls: any = {}

      for (let i = 0; i < data.images.length; i++) {
        const img = data.images[i]
        if (img instanceof File) {
          // Convert to base64
          const reader = new FileReader()
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.readAsDataURL(img)
          })
          const base64 = await base64Promise
          processedImages.push(base64)
          directImageUrls[i] = { base64 }
        } else {
          processedImages.push(img)
        }
      }

      const response = await fetch('/api/user/sell-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description || undefined,
          price: parseFloat(data.price),
          negotiable: data.negotiable,
          condition: data.condition,
          images: processedImages,
          directImageUrls: Object.keys(directImageUrls).length > 0 ? directImageUrls : undefined,
          location: data.location || undefined,
          city: data.city || undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Listing created successfully',
        })
        onSuccess?.()
        onOpenChange(false)
        form.reset()
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to create listing',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      console.error('Error submitting form:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to create listing',
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
      <SheetContent className="flex flex-col max-w-2xl overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Create Listing</SheetTitle>
          <SheetDescription>
            Sell your hard copy book on the marketplace. Fill in the details below.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id="sell-post-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 flex-1"
          >
            {/* Image Upload */}
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photos *</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value?.[0]}
                      onChange={(file) => field.onChange(file ? [file] : [])}
                      onRemove={() => field.onChange([])}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    Add up to 5 photos. Show the cover, any notable wear, and page edges.
                    The first photo will be the cover image.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 'The Great Gatsby - Hardcover First Edition'"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Include the book title, edition, and any distinguishing features.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the book's condition, any notes, edition details..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Mention any highlights, notes, wear, or special features.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price and Condition */}
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="pl-7"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONDITION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {option.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Negotiable Switch */}
            <FormField
              control={form.control}
              name="negotiable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Price Negotiable</FormLabel>
                    <FormDescription className="text-xs">
                      Allow buyers to make offers on your listing
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

            {/* Location */}
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., San Francisco, CA"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Helps buyers find listings near them
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meetup Location (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Downtown public library, Starbucks on Main St..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Suggest where you'd prefer to meet for the exchange
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Safety Notice */}
            <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 p-4">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Safety Reminder
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Meet in a safe, public location during daylight hours</li>
                <li>• Bring a friend if possible</li>
                <li>• Check the item carefully before payment</li>
                <li>• Cash is recommended for in-person transactions</li>
              </ul>
            </div>
          </form>
        </Form>
        <SheetFooter className="gap-2">
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button
            form="sell-post-form"
            type="submit"
            disabled={loading || !form.formState.isValid}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Create Listing
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
