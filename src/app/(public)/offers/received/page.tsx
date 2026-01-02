'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { AuthGuard } from '@/components/auth-guard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
    Tag as OfferIcon,
    Search,
    Loader2,
    ShoppingBag,
    ArrowLeft,
    CheckCircle,
    XCircle,
    Clock,
    RotateCcw,
    MessageSquare,
} from 'lucide-react'
import Link from 'next/link'
import { formatPrice, formatDistanceToNow, getInitials } from '@/lib/utils'
import { OfferStatus } from '@prisma/client'
import { BreadcrumbList } from '@/components/breadcrumb/breadcrumb'
import { DashboardSummary } from '@/components/dashboard/dashboard-summary'

// ============================================================================
// TYPES
// ============================================================================

interface Offer {
    id: string
    offeredPrice: number
    message?: string | null
    status: OfferStatus
    respondedAt?: Date | null
    responseMessage?: string | null
    createdAt: Date
    buyer: {
        id: string
        name: string
        firstName?: string | null
        lastName?: string | null
        avatar?: string | null
        directAvatarUrl?: any
    }
    sellPost: {
        id: string
        title: string
        price: number
        images: string[]
    }
}

interface OffersResponse {
    success: boolean
    data: Offer[]
    message?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG: Record<OfferStatus, { label: string; color: string }> = {
    PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    ACCEPTED: { label: 'Accepted', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    COUNTERED: { label: 'Countered', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    WITHDRAWN: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
    EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
}

// ============================================================================
// COMPONENT
// ============================================================================

function OffersReceivedPageContent() {
    const router = useRouter()
    const { user } = useAuth()
    const [offers, setOffers] = useState<Offer[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<string>('all')

    // Response dialog state
    const [respondDialogOpen, setRespondDialogOpen] = useState(false)
    const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
    const [responseAction, setResponseAction] = useState<'accept' | 'reject' | 'counter'>('accept')
    const [responseMessage, setResponseMessage] = useState('')
    const [counterPrice, setCounterPrice] = useState('')
    const [isResponding, setIsResponding] = useState(false)

    useEffect(() => {
        const fetchOffers = async () => {
            if (!user?.id) return

            setIsLoading(true)
            setError(null)

            try {
                // Get user's sell posts first, then offers for each
                // For simplicity, we'll get all offers for user's posts in one go
                // This would typically be filtered by the API
                const response = await fetch('/api/user/sell-posts')
                const postsResult = await response.json()

                if (postsResult.success) {
                    const posts = postsResult.data.posts
                    const allOffers: Offer[] = []

                    for (const post of posts) {
                        const offersResponse = await fetch(`/api/user/sell-posts/${post.id}/offers`)
                        const offersResult = await offersResponse.json()
                        if (offersResult.success) {
                            allOffers.push(...offersResult.data)
                        }
                    }

                    setOffers(allOffers)
                } else {
                    setError('Failed to fetch your listings')
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch offers')
            } finally {
                setIsLoading(false)
            }
        }

        fetchOffers()
    }, [user?.id])

    const handleRespond = async () => {
        if (!selectedOffer) return

        setIsResponding(true)
        setError(null)

        try {
            let data: any = {
                status: responseAction === 'accept' ? 'ACCEPTED' : responseAction === 'reject' ? 'REJECTED' : 'COUNTERED',
                responseMessage: responseMessage || undefined,
            }

            if (responseAction === 'counter') {
                const price = parseFloat(counterPrice)
                if (isNaN(price) || price <= 0) {
                    setError('Please enter a valid counter price')
                    setIsResponding(false)
                    return
                }
                data.counterPrice = price
            }

            const response = await fetch(`/api/user/offers/${selectedOffer.id}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            const result = await response.json()

            if (result.success) {
                // Update local state
                setOffers(offers.map(offer =>
                    offer.id === selectedOffer.id
                        ? { ...offer, ...result.data }
                        : offer
                ))
                setRespondDialogOpen(false)
                setSelectedOffer(null)
                setResponseMessage('')
                setCounterPrice('')
            } else {
                setError(result.message || 'Failed to respond to offer')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to respond to offer')
        } finally {
            setIsResponding(false)
        }
    }

    const openRespondDialog = (offer: Offer, action: 'accept' | 'reject' | 'counter') => {
        setSelectedOffer(offer)
        setResponseAction(action)
        setResponseMessage('')
        if (action === 'counter') {
            setCounterPrice(offer.offeredPrice.toString())
        }
        setRespondDialogOpen(true)
    }

    const filteredOffers = offers.filter(offer => {
        const matchesStatus = filterStatus === 'all' || offer.status === filterStatus
        const matchesSearch =
            offer.sellPost.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            offer.buyer.name.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesStatus && matchesSearch
    })

    // Stats
    const stats = {
        total: offers.length,
        pending: offers.filter(o => o.status === OfferStatus.PENDING).length,
        accepted: offers.filter(o => o.status === OfferStatus.ACCEPTED).length,
        rejected: offers.filter(o => o.status === OfferStatus.REJECTED).length,
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto p-4 pb-24 lg:pb-8">
                {/* Breadcrumb */}
                <BreadcrumbList
                    items={[
                        { label: 'Marketplace', href: '/marketplace', icon: <ShoppingBag className="h-4 w-4" /> },
                        { label: 'Offers Received', icon: <OfferIcon className="h-4 w-4" /> },
                    ]}
                    className="mb-6"
                />

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-xl font-bold">Offers Received</h1>
                    <p className="text-muted-foreground text-sm">
                        Review and respond to offers on your listings
                    </p>
                </div>

                {/* Stats */}
                <DashboardSummary
                    summaries={[
                        {
                            title: 'Total Offers',
                            value: stats.total,
                            description: 'All offers received',
                        },
                        {
                            title: 'Pending',
                            value: stats.pending,
                            description: 'Awaiting response',
                        },
                        {
                            title: 'Accepted',
                            value: stats.accepted,
                            description: 'Successfully negotiated',
                        },
                        {
                            title: 'Rejected',
                            value: stats.rejected,
                            description: 'Declined offers',
                        },
                    ]}
                />

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by listing or buyer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 text-sm"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                        {(['all', 'PENDING', 'ACCEPTED', 'REJECTED'] as const).map((status) => (
                            <Button
                                key={status}
                                variant={filterStatus === status ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilterStatus(status)}
                            >
                                {status === 'all' ? 'All' : STATUS_CONFIG[status as OfferStatus].label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="text-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading offers...</p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <Card className="border-destructive mb-6">
                        <CardContent className="p-4 text-destructive">
                            {error}
                        </CardContent>
                    </Card>
                )}

                {/* Offers List */}
                {!isLoading && filteredOffers.length === 0 && (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <OfferIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h2 className="text-lg font-semibold mb-2">
                                {filterStatus === 'all' ? 'No offers received yet' : `No ${STATUS_CONFIG[filterStatus as OfferStatus]?.label.toLowerCase()} offers`}
                            </h2>
                            <p className="text-muted-foreground">
                                {searchQuery ? 'Try a different search term' : 'Offers on your listings will appear here.'}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {!isLoading && filteredOffers.length > 0 && (
                    <div className="space-y-4">
                        {filteredOffers.map((offer) => {
                            const statusConfig = STATUS_CONFIG[offer.status]
                            const buyerName = offer.buyer.firstName && offer.buyer.lastName
                                ? `${offer.buyer.firstName} ${offer.buyer.lastName}`
                                : offer.buyer.name
                            const initials = getInitials(offer.buyer.firstName, offer.buyer.lastName, offer.buyer.name)
                            const isPending = offer.status === OfferStatus.PENDING

                            return (
                                <Card key={offer.id} className={isPending ? 'border-primary' : ''}>
                                    <CardContent className="p-4">
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            {/* Thumbnail */}
                                            <Link
                                                href={`/marketplace/${offer.sellPost.id}`}
                                                className="flex-shrink-0 self-start"
                                            >
                                                <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-lg overflow-hidden">
                                                    {offer.sellPost.images[0] ? (
                                                        <img
                                                            src={offer.sellPost.images[0]}
                                                            alt={offer.sellPost.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 space-y-3">
                                                {/* Title and Status Badge */}
                                                        <div className="flex items-start gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <Link
                                                                    href={`/marketplace/${offer.sellPost.id}`}
                                                                    className="font-semibold hover:text-primary"
                                                                >
                                                                    {offer.sellPost.title}
                                                                </Link>
                                                            </div>
                                                            <Badge className={statusConfig.color} variant="secondary">
                                                                {statusConfig.label}
                                                            </Badge>
                                                        </div>

                                                        {/* Price Details */}
                                                        <div className="flex items-center gap-3 text-sm">
                                                            <span className="text-muted-foreground">
                                                                Listed: {formatPrice(offer.sellPost.price)}
                                                            </span>
                                                            <span className="text-muted-foreground">•</span>
                                                            <span className="font-semibold text-primary">
                                                                Offer: {formatPrice(offer.offeredPrice)}
                                                            </span>
                                                            {offer.sellPost.price > offer.offeredPrice && (
                                                                <>
                                                                    <span className="text-muted-foreground">•</span>
                                                                    <span className="text-red-600">
                                                                        (-{Math.round((1 - offer.offeredPrice / offer.sellPost.price) * 100)}%)
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Buyer Info */}
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <span>From {buyerName}</span>
                                                            <span>•</span>
                                                            <span>{formatDistanceToNow(new Date(offer.createdAt))}</span>
                                                        </div>

                                                        {/* Messages */}
                                                        {offer.message && (
                                                            <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                                                                &quot;{offer.message}&quot;
                                                            </p>
                                                        )}
                                                        {offer.responseMessage && (
                                                            <p className="text-sm">
                                                                <span className="font-medium">Your response:</span> {offer.responseMessage}
                                                            </p>
                                                        )}

                                                        {/* Actions - Full width on mobile, auto on desktop */}
                                                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                                            {isPending && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => openRespondDialog(offer, 'accept')}
                                                                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                                                                    >
                                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                                        Accept
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => openRespondDialog(offer, 'counter')}
                                                                        className="w-full sm:w-auto"
                                                                    >
                                                                        <RotateCcw className="h-4 w-4 mr-1" />
                                                                        Counter
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => openRespondDialog(offer, 'reject')}
                                                                        className="text-destructive hover:text-destructive w-full sm:w-auto"
                                                                    >
                                                                        <XCircle className="h-4 w-4 mr-1" />
                                                                        Decline
                                                                    </Button>
                                                                </>
                                                                    )}

                                                            {/* View Conversation - Always available to see full chat history */}
                                                            <Link href={`/messages?sellPostId=${offer.sellPost.id}&buyerId=${offer.buyer.id}`} className="w-full sm:w-auto">
                                                                <Button size="sm" variant={isPending ? "outline" : "default"} className="w-full sm:w-auto">
                                                                    <MessageSquare className="h-4 w-4 mr-2" />
                                                                    Message Buyer
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </main>

            {/* Response Dialog */}
            <Dialog open={respondDialogOpen} onOpenChange={setRespondDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {responseAction === 'accept' && 'Accept Offer'}
                            {responseAction === 'reject' && 'Decline Offer'}
                            {responseAction === 'counter' && 'Counter Offer'}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedOffer && (
                        <div className="space-y-4">
                            <div className="p-3 bg-muted rounded-lg">
                                <p className="font-medium">{selectedOffer.sellPost.title}</p>
                                <p className="text-sm text-muted-foreground">
                                    Their offer: {formatPrice(selectedOffer.offeredPrice)}
                                </p>
                                {selectedOffer.message && (
                                    <p className="text-sm italic mt-2">&quot;{selectedOffer.message}&quot;</p>
                                )}
                            </div>

                            {responseAction === 'counter' && (
                                <div>
                                    <Label>Counter Offer Price</Label>
                                    <div className="relative mt-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                        <Input
                                            type="number"
                                            placeholder="Enter your price"
                                            value={counterPrice}
                                            onChange={(e) => setCounterPrice(e.target.value)}
                                            className="pl-7"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <Label>Response Message (optional)</Label>
                                <Textarea
                                    placeholder="Add a message to the buyer..."
                                    value={responseMessage}
                                    onChange={(e) => setResponseMessage(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setRespondDialogOpen(false)}
                                    disabled={isResponding}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleRespond}
                                    disabled={isResponding}
                                    className={
                                        responseAction === 'reject'
                                            ? 'bg-destructive hover:bg-destructive/90'
                                            : responseAction === 'accept'
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : ''
                                    }
                                >
                                    {isResponding ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            {responseAction === 'accept' && <CheckCircle className="h-4 w-4 mr-2" />}
                                            {responseAction === 'reject' && <XCircle className="h-4 w-4 mr-2" />}
                                            {responseAction === 'counter' && <RotateCcw className="h-4 w-4 mr-2" />}
                                            {responseAction === 'accept' && 'Accept'}
                                            {responseAction === 'reject' && 'Decline'}
                                            {responseAction === 'counter' && 'Send Counter'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default function OffersReceivedPage() {
    return (
        <AuthGuard>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                <OffersReceivedPageContent />
            </Suspense>
        </AuthGuard>
    )
}
