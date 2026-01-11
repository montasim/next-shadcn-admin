'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import Image from 'next/image'
import {
    MapPin,
    Calendar,
    Eye,
    MessageSquare,
    Send,
    ShoppingBag,
    Star,
    Shield,
    Loader2,
    Home,
} from 'lucide-react'
import { SellPostGrid } from '@/components/marketplace'
import { BreadcrumbList } from '@/components/breadcrumb/breadcrumb'
import { BookCondition, SellPostStatus } from '@prisma/client'
import { formatPrice, formatDistanceToNow, getInitials } from '@/lib/utils'
import { useMarketplaceSocket } from '@/hooks/use-marketplace-socket'
import { playNotificationSound, showBrowserNotification } from '@/lib/sounds'
import { ROUTES } from '@/lib/routes/client-routes'

// ============================================================================
// TYPES
// ============================================================================

interface SellPostDetail {
    id: string
    title: string
    description?: string | null
    price: number
    negotiable: boolean
    condition: BookCondition
    images: string[]
    directImageUrls?: any
    location?: string | null
    city?: string | null
    status: SellPostStatus
    createdAt: Date
    soldAt?: Date | null
    seller: {
        id: string
        name: string
        firstName?: string | null
        lastName?: string | null
        email?: string | null
        phoneNumber?: string | null
        avatar?: string | null
        directAvatarUrl?: any
    }
    book?: {
        id: string
        name: string
        image?: string | null
        directImageUrl?: any
        authors: Array<{ author: { id: string; name: string } }>
        categories: Array<{ category: { id: string; name: string } }>
    } | null
    offers?: Array<{
        id: string
        offeredPrice: number
        status: string
        message?: string | null
        buyer: {
            id: string
            name: string
            firstName?: string | null
            lastName?: string | null
            avatar?: string | null
            directAvatarUrl?: any
        }
    }>
    reviews?: Array<{
        id: string
        rating: number
        comment?: string | null
        createdAt: Date
        reviewer: {
            id: string
            name: string
            firstName?: string | null
            lastName?: string | null
            avatar?: string | null
            directAvatarUrl?: any
        }
    }>
}

interface RelatedPost {
    id: string
    title: string
    price: number
    negotiable: boolean
    condition: BookCondition
    status: SellPostStatus
    images: string[]
    directImageUrls?: any
    location?: string | null
    city?: string | null
    createdAt: Date
    seller: {
        id: string
        name: string
        firstName?: string | null
        lastName?: string | null
        avatar?: string | null
        directAvatarUrl?: any
    }
    book?: {
        id: string
        name: string
        image?: string | null
        directImageUrl?: any
    } | null
    _count?: {
        views?: number
    } | null
}

interface DetailResponse {
    success: boolean
    data: {
        post: SellPostDetail
        relatedPosts?: RelatedPost[]
    }
    message?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CONDITION_LABELS: Record<BookCondition, string> = {
    NEW: 'New',
    LIKE_NEW: 'Like New',
    GOOD: 'Good',
    FAIR: 'Fair',
    POOR: 'Poor',
}

const CONDITION_COLORS: Record<BookCondition, string> = {
    NEW: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    LIKE_NEW: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    GOOD: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    FAIR: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    POOR: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
}

// ============================================================================
// COMPONENT
// ============================================================================

function SellPostDetailContent() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const id = params.id as string

    const [post, setPost] = useState<SellPostDetail | null>(null)
    const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [offerAmount, setOfferAmount] = useState('')
    const [offerMessage, setOfferMessage] = useState('')
    const [isSubmittingOffer, setIsSubmittingOffer] = useState(false)
    const [offerDialogOpen, setOfferDialogOpen] = useState(false)
    const [messageText, setMessageText] = useState('')
    const [isSendingMessage, setIsSendingMessage] = useState(false)
    const [offers, setOffers] = useState<SellPostDetail['offers']>([])

    const isOwnPost = user?.id === post?.seller.id
    const isAuthenticated = !!user

    // Fetch offers without full page refresh
    const fetchOffers = useCallback(async () => {
        if (!post) return

        try {
            const response = await fetch(`/api/user/sell-posts/${id}/offers`)
            const result = await response.json()

            if (result.success) {
                setOffers(result.data)
            }
        } catch (err) {
            console.error('Failed to fetch offers:', err)
        }
    }, [id, post])

    const fetchPost = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/marketplace/posts/${id}`)
            const result: DetailResponse = await response.json()

            if (result.success && result.data.post) {
                setPost(result.data.post)
                setRelatedPosts(result.data.relatedPosts || [])
                setOffers(result.data.post.offers || [])

                // Pre-fill offer with list price
                if (result.data.post.negotiable) {
                    setOfferAmount(result.data.post.price.toString())
                }
            } else {
                setError(result.message || 'Listing not found')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch listing')
        } finally {
            setIsLoading(false)
        }
    }, [id])

    useEffect(() => {
        fetchPost()
    }, [fetchPost])

    // Refetch post data when window regains focus or becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && post && !isLoading) {
                fetchPost()
            }
        }

        const handleFocus = () => {
            if (post && !isLoading) {
                fetchPost()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('focus', handleFocus)

        // Also refresh every 30 seconds if post is not sold
        const refreshInterval = setInterval(() => {
            if (post && post.status !== SellPostStatus.SOLD && !isLoading) {
                fetchPost()
            }
        }, 30000)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('focus', handleFocus)
            clearInterval(refreshInterval)
        }
    }, [fetchPost, post, isLoading])

    // Real-time socket updates for offers and messages
    useMarketplaceSocket({
        sellPostId: id,
        sellerId: post?.seller.id || '',
        onNewOffer: useCallback((data: { sellPostId: string; offer: any; sellerId: string }) => {
            // Seller receives new offer notification with sound
            playNotificationSound('offer')
            showBrowserNotification('New Offer Received!', {
                body: `Someone made an offer on ${post?.title || 'your listing'}`,
                tag: `offer-${data.offer.id}`
            })
            // Fetch offers without full page refresh
            fetchOffers()
        }, [post?.title, fetchOffers]),
        onOfferUpdated: useCallback((data: { offerId: string; status: string; sellPostId: string; offer: any }) => {
            // Buyer receives offer update notification with sound
            playNotificationSound('offer')
            const statusMessages: Record<string, string> = {
                'ACCEPTED': 'Your offer was accepted!',
                'REJECTED': 'Your offer was rejected',
                'COUNTERED': 'You received a counter offer',
            }
            showBrowserNotification('Offer Update', {
                body: statusMessages[data.status] || `Your offer status: ${data.status}`,
                tag: `offer-${data.offerId}`
            })
            // Refresh post data to show updated status
            fetchPost()
        }, [fetchPost]),
        onNewMessage: useCallback((message: any) => {
            // Both buyer and seller receive message notification with sound
            playNotificationSound('message')
            showBrowserNotification('New Message', {
                body: typeof message.content === 'string'
                    ? message.content.slice(0, 100)
                    : 'You received a new message',
                tag: `message-${message.id}`
            })
        }, [])
    })

    const handleMakeOffer = async () => {
        if (!isAuthenticated) {
            router.push(ROUTES.signIn.href)
            return
        }

        const amount = parseFloat(offerAmount)
        if (isNaN(amount) || amount <= 0) {
            setError('Please enter a valid amount')
            return
        }

        setIsSubmittingOffer(true)
        setError(null)

        try {
            const response = await fetch(`/api/user/sell-posts/${id}/offers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    offeredPrice: amount,
                    message: offerMessage,
                }),
            })

            const result = await response.json()

            if (result.success) {
                setOfferDialogOpen(false)
                setOfferAmount('')
                setOfferMessage('')
                // Show success message or redirect
                router.push(`/messages?conversation=${result.data.conversationId}`)
            } else {
                setError(result.message || 'Failed to submit offer')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to submit offer')
        } finally {
            setIsSubmittingOffer(false)
        }
    }

    const handleSendMessage = async () => {
        if (!isAuthenticated) {
            router.push(ROUTES.signIn.href)
            return
        }

        if (!messageText.trim()) {
            setError('Please enter a message')
            return
        }

        setIsSendingMessage(true)
        setError(null)

        try {
            // First get or create conversation
            const convResponse = await fetch('/api/user/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sellPostId: id,
                }),
            })

            const convResult = await convResponse.json()

            if (!convResult.success) {
                setError(convResult.message || 'Failed to start conversation')
                return
            }

            // Send message
            const msgResponse = await fetch(`/api/user/conversations/${convResult.data.conversation.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: messageText,
                }),
            })

            if (msgResponse.ok) {
                setMessageText('')
                router.push(`/messages/${convResult.data.conversation.id}`)
            } else {
                const msgResult = await msgResponse.json()
                setError(msgResult.message || 'Failed to send message')
            }
        } catch (err) {
            console.error('Failed to send message:', err)
            setError('Failed to send message. Please try again.')
        } finally {
            setIsSendingMessage(false)
        }
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Error state
    if (error || !post) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="container mx-auto px-4 py-16">
                    <Card className="max-w-2xl mx-auto border-2">
                        <CardContent className="p-12 text-center space-y-6">
                            {/* Icon */}
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted">
                                <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                            </div>

                            {/* Heading */}
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold">Listing Not Found</h1>
                                <p className="text-muted-foreground text-lg">
                                    We couldn&apos;t find the listing you&apos;re looking for
                                </p>
                            </div>

                            {/* Helpful suggestions */}
                            <div className="text-left space-y-3 max-w-md mx-auto">
                                <p className="text-sm font-medium">This might have happened because:</p>
                                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>The listing ID might be incorrect or mistyped</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>The listing has been removed by the seller</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>The listing might have been sold or is no longer available</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                <Button asChild size="lg" className="w-full sm:w-auto">
                                    <Link href={ROUTES.marketplace.href}>
                                        <ShoppingBag className="h-4 w-4 mr-2" />
                                        Browse Marketplace
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                                    <Link href={ROUTES.home.href}>
                                        <Home className="h-4 w-4 mr-2" />
                                        Go to Homepage
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    const sellerName = post.seller.firstName && post.seller.lastName
        ? `${post.seller.firstName} ${post.seller.lastName}`
        : post.seller.name
    const initials = getInitials(post.seller.firstName, post.seller.lastName, post.seller.name)

    const isSold = post.status === SellPostStatus.SOLD

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto p-4 pb-6">
                {/* Breadcrumb */}
                <BreadcrumbList
                    items={[
                        { label: 'Marketplace', href: ROUTES.marketplace.href, icon: <ShoppingBag className="h-4 w-4" /> },
                        { label: post.title },
                    ]}
                    className="mb-4"
                />

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Images and Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Images */}
                        <Card>
                            <CardContent className="p-0">
                                <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                                    <Image
                                        src={post.images[0] || '/placeholder-book.png'}
                                        alt={post.title}
                                        fill
                                        className="object-cover"
                                        priority
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        unoptimized
                                    />
                                    {isSold && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <Badge className="text-lg px-4 py-2 bg-red-600">SOLD</Badge>
                                        </div>
                                    )}
                                </div>
                                {post.images.length > 1 && (
                                    <div className="flex gap-2 p-4 overflow-x-auto">
                                        {post.images.map((img, idx) => (
                                            <div
                                                key={idx}
                                                className="relative aspect-square w-20 flex-shrink-0 bg-muted rounded overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary"
                                            >
                                                <Image src={img} alt={`${post.title} ${idx + 1}`} fill className="object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Safety Tips */}
                        <Card className="bg-muted/50">
                            <CardHeader>
                                <CardTitle className="text-base">Safety Tips</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2 text-muted-foreground">
                                <p>• Meet in a public place during daylight hours</p>
                                <p>• Bring a friend if possible</p>
                                <p>• Check the item thoroughly before paying</p>
                                <p>• Cash is recommended for in-person transactions</p>
                            </CardContent>
                        </Card>

                        {/* Seller Reviews (if any) */}
                        {post.reviews && post.reviews.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Star className="h-5 w-5" />
                                        Seller Reviews ({post.reviews.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {post.reviews.slice(0, 3).map(review => (
                                        <div key={review.id} className="border-b pb-4 last:border-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="flex">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDistanceToNow(new Date(review.createdAt))}
                                                </span>
                                            </div>
                                            {review.comment && (
                                                <p className="text-sm text-muted-foreground">{review.comment}</p>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Related Posts */}
                        {relatedPosts.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Similar Listings</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <SellPostGrid posts={relatedPosts} compact={true} showSeller={true} />
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Seller and Actions */}
                    <div className="space-y-6">
                        {/* Book Info (if linked) */}
                        {post.book && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Based On Book</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-3">
                                        {post.book.image && (
                                            <Image
                                                src={post.book.image}
                                                alt={post.book.name}
                                                width={20}
                                                height={32}
                                                className="flex-shrink-0 rounded object-cover"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <Link href={`/books/${post.book.id}`} className="font-medium hover:text-primary line-clamp-1">
                                                {post.book.name}
                                            </Link>
                                            {post.book.authors.length > 0 && (
                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                    by {post.book.authors.map(a => a.author.name).join(', ')}
                                                </p>
                                            )}
                                            {post.book.categories.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {post.book.categories.slice(0, 2).map(c => (
                                                        <Badge key={c.category.id} variant="outline" className="text-xs">
                                                            {c.category.name}
                                                        </Badge>
                                                    ))}
                                                    {post.book.categories.length > 2 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{post.book.categories.length - 2}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Details */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h1 className="text-xl font-bold mb-2">{post.title}</h1>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge className={CONDITION_COLORS[post.condition]}>
                                                {CONDITION_LABELS[post.condition]}
                                            </Badge>
                                            {post.negotiable && (
                                                <Badge variant="secondary">Price Negotiable</Badge>
                                            )}
                                            <span className="text-muted-foreground text-sm flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                Listed {formatDistanceToNow(new Date(post.createdAt))}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold">{formatPrice(post.price)}</div>
                                        {isSold && (
                                            <div className="text-sm text-muted-foreground">
                                                Sold {post.soldAt ? formatDistanceToNow(new Date(post.soldAt)) : 'recently'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Description */}
                                {post.description && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Description</h3>
                                        <p className="text-muted-foreground whitespace-pre-wrap">{post.description}</p>
                                    </div>
                                )}

                                {/* Location */}
                                {(post.city || post.location) && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        <span>{[post.city, post.location].filter(Boolean).join(', ')}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Seller Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Seller Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={post.seller.avatar || post.seller.directAvatarUrl} />
                                        <AvatarFallback>{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{sellerName}</p>
                                        <p className="text-sm text-muted-foreground">Member since {new Date().getFullYear()}</p>
                                    </div>
                                </div>

                                {!isOwnPost && (
                                    <div className="space-y-2">
                                        <Textarea
                                            placeholder="Ask a question about this item..."
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            rows={3}
                                        />
                                        {error && error.includes('message') && (
                                            <p className="text-sm text-destructive">{error}</p>
                                        )}
                                        <Button
                                            onClick={handleSendMessage}
                                            disabled={isSendingMessage || !messageText.trim() || isSold}
                                            className="w-full"
                                            size="sm"
                                        >
                                            {isSendingMessage ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Send className="h-4 w-4 mr-2" />
                                            )}
                                            Message Seller
                                        </Button>
                                    </div>
                                )}

                                {isOwnPost && (
                                    <Link href={`/marketplace/my-posts/${id}/edit`} className='mt-6 block'>
                                        <Button variant="outline" className="w-full">
                                            Edit Listing
                                        </Button>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>

                        {/* Offers Section - Only visible to seller */}
                        {isOwnPost && offers && offers.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <MessageSquare className="h-5 w-5" />
                                            Offers ({offers.length})
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                            Live Updates
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {offers.map((offer) => {
                                        const buyerName = offer.buyer.firstName && offer.buyer.lastName
                                            ? `${offer.buyer.firstName} ${offer.buyer.lastName}`
                                            : offer.buyer.name
                                        const buyerInitials = getInitials(offer.buyer.firstName, offer.buyer.lastName, offer.buyer.name)

                                        const statusColors: Record<string, string> = {
                                            PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                                            ACCEPTED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                                            REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                                            COUNTERED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                                            WITHDRAWN: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
                                        }

                                        return (
                                            <div
                                                key={offer.id}
                                                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                                                onClick={() => router.push(`/messages?offer=${offer.id}`)}
                                            >
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={offer.buyer.avatar || offer.buyer.directAvatarUrl} />
                                                    <AvatarFallback>{buyerInitials}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="font-medium truncate">{buyerName}</p>
                                                        <Badge className={`text-xs ${statusColors[offer.status] || statusColors.PENDING}`}>
                                                            {offer.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-lg font-semibold text-primary">
                                                        {formatPrice(offer.offeredPrice)}
                                                    </p>
                                                    {offer.message && (
                                                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                                            {offer.message}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </CardContent>
                            </Card>
                        )}

                        {/* Action Card */}
                        {!isOwnPost && !isSold && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Make an Offer</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Dialog open={offerDialogOpen} onOpenChange={(open) => {
                                        if (!open) setError(null)
                                        setOfferDialogOpen(open)
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button className="w-full" size="lg" disabled={!isAuthenticated}>
                                                {isAuthenticated ? 'Make Offer' : 'Sign In to Make Offer'}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Make an Offer</DialogTitle>
                                            </DialogHeader>
                                            {error && (
                                                <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                                                    {error}
                                                </div>
                                            )}
                                            <div className="space-y-4">
                                                <div>
                                                    <Label>Listing Price: {formatPrice(post.price)}</Label>
                                                </div>
                                                <div>
                                                    <Label htmlFor="offerAmount">Your Offer *</Label>
                                                    <div className="relative mt-1">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                            $
                                                        </span>
                                                        <Input
                                                            id="offerAmount"
                                                            type="number"
                                                            placeholder="Enter your offer"
                                                            value={offerAmount}
                                                            onChange={(e) => setOfferAmount(e.target.value)}
                                                            className="pl-7"
                                                            min="0"
                                                            step="0.01"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label htmlFor="offerMessage">Message (optional)</Label>
                                                    <Textarea
                                                        id="offerMessage"
                                                        placeholder="Add a message to the seller..."
                                                        value={offerMessage}
                                                        onChange={(e) => setOfferMessage(e.target.value)}
                                                        rows={3}
                                                    />
                                                </div>
                                                <Button
                                                    onClick={handleMakeOffer}
                                                    disabled={isSubmittingOffer}
                                                    className="w-full"
                                                >
                                                    {isSubmittingOffer ? (
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    ) : (
                                                        'Submit Offer'
                                                    )}
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    <div className="text-center text-sm text-muted-foreground">
                                        <p>Meet in person to complete the sale</p>
                                        <p className="flex items-center justify-center gap-1 mt-1">
                                            <Shield className="h-3 w-3" />
                                            Always meet in a safe, public location
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default function SellPostDetailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <SellPostDetailContent />
        </Suspense>
    )
}
