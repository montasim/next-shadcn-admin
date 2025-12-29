'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { AuthGuard } from '@/components/auth-guard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from '@/components/ui/image-upload'
import { ShoppingBag, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { BookCondition } from '@prisma/client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'

// ============================================================================
// SCHEMA
// ============================================================================

const sellPostFormSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().optional(),
    price: z.string().min(1, 'Price is required'),
    negotiable: z.boolean().default(true),
    condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']),
    images: z.array(z.union([z.string(), z.instanceof(File)])).min(1, 'At least one image is required'),
    bookId: z.string().optional(),
    location: z.string().optional(),
    city: z.string().optional(),
})

type SellPostFormValues = z.infer<typeof sellPostFormSchema>

// ============================================================================
// CONSTANTS
// ============================================================================

const CONDITION_OPTIONS = [
    { value: 'NEW', label: 'New', description: 'Brand new, unused' },
    { value: 'LIKE_NEW', label: 'Like New', description: 'Minimal signs of use' },
    { value: 'GOOD', label: 'Good', description: 'Some signs of use but well cared for' },
    { value: 'FAIR', label: 'Fair', description: 'Noticeable wear' },
    { value: 'POOR', label: 'Poor', description: 'Significant wear or damage' },
]

// ============================================================================
// COMPONENT
// ============================================================================

function CreateSellPostPageContent() {
    const router = useRouter()
    const { user } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
    })

    const handleSubmit = async (values: SellPostFormValues) => {
        if (!user?.id) {
            setError('You must be logged in to create a listing')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            // Process images - upload File objects and keep string URLs
            const processedImages: string[] = []
            const directImageUrls: any = {}

            for (let i = 0; i < values.images.length; i++) {
                const img = values.images[i]
                if (img instanceof File) {
                    // For now, we'll convert to base64 (in production, upload to cloud storage)
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
                    title: values.title,
                    description: values.description || undefined,
                    price: parseFloat(values.price),
                    negotiable: values.negotiable,
                    condition: values.condition,
                    images: processedImages,
                    directImageUrls: Object.keys(directImageUrls).length > 0 ? directImageUrls : undefined,
                    bookId: values.bookId || undefined,
                    sellerId: user.id,
                    location: values.location || undefined,
                    city: values.city || undefined,
                }),
            })

            const result = await response.json()

            if (result.success) {
                router.push(`/marketplace/${result.data.id}`)
            } else {
                setError(result.message || 'Failed to create listing')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create listing')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto p-4 pb-24 lg:pb-8 max-w-4xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/marketplace">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Marketplace
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <ShoppingBag className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Create Listing</h1>
                            <p className="text-muted-foreground text-sm">
                                Sell your hard copy book on the marketplace
                            </p>
                        </div>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        {/* Images */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Photos *</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={form.control}
                                    name="images"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <ImageUpload
                                                    value={field.value?.[0]}
                                                    onChange={(file) => field.onChange(file ? [file] : [])}
                                                    onRemove={() => field.onChange([])}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs text-muted-foreground mt-2">
                                                Add up to 5 photos. Show the cover, any notable wear, and page edges.
                                                The first photo will be the cover image.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                            </CardContent>
                        </Card>

                        {/* Location */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Location</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                            </CardContent>
                        </Card>

                        {/* Safety Notice */}
                        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                            <CardContent className="p-4">
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
                            </CardContent>
                        </Card>

                        {/* Error */}
                        {error && (
                            <Card className="border-destructive">
                                <CardContent className="p-4 text-destructive">
                                    {error}
                                </CardContent>
                            </Card>
                        )}

                        {/* Submit */}
                        <div className="flex gap-4">
                            <Link href="/marketplace" className="flex-1">
                                <Button type="button" variant="outline" className="w-full" size="lg">
                                    Cancel
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1"
                                size="lg"
                            >
                                {isSubmitting ? (
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
                        </div>
                    </form>
                </Form>
            </main>
        </div>
    )
}

export default function CreateSellPostPage() {
    return (
        <AuthGuard>
            <CreateSellPostPageContent />
        </AuthGuard>
    )
}
