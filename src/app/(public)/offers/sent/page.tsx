'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { AuthGuard } from '@/components/auth-guard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DashboardSummary } from '@/components/dashboard/dashboard-summary'
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
} from 'lucide-react'
import Link from 'next/link'
import { formatPrice, formatDistanceToNow, getInitials } from '@/lib/utils'
import { OfferStatus } from '@prisma/client'

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
    sellPost: {
        id: string
        title: string
        price: number
        condition: string
        images: string[]
        city?: string | null
        seller: {
            id: string
            name: string
            firstName?: string | null
            lastName?: string | null
            avatar?: string | null
            directAvatarUrl?: any
        }
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

const STATUS_CONFIG: Record<OfferStatus, { label: string; color: string; icon: any }> = {
    PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
    ACCEPTED: { label: 'Accepted', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
    REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
    COUNTERED: { label: 'Countered', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: RotateCcw },
    WITHDRAWN: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: XCircle },
    EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: Clock },
}

// ============================================================================
// COMPONENT
// ============================================================================

function OffersSentPageContent() {
    const router = useRouter()
    const { user } = useAuth()
    const [offers, setOffers] = useState<Offer[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<OfferStatus | 'all'>('all')
    const [withdrawingIds, setWithdrawingIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        const fetchOffers = async () => {
            if (!user?.id) return

            setIsLoading(true)
            setError(null)

            try {
                const response = await fetch('/api/user/my-offers')
                const result: OffersResponse = await response.json()

                if (result.success) {
                    setOffers(result.data)
                } else {
                    setError(result.message || 'Failed to fetch your offers')
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch your offers')
            } finally {
                setIsLoading(false)
            }
        }

        fetchOffers()
    }, [user?.id])

    const handleWithdraw = async (offerId: string) => {
        setWithdrawingIds(prev => new Set([...prev, offerId]))
        setError(null)

        try {
            const response = await fetch(`/api/user/offers/${offerId}`, {
                method: 'DELETE',
            })

            const result = await response.json()

            if (result.success) {
                // Update local state
                setOffers(offers.map(offer =>
                    offer.id === offerId
                        ? { ...offer, status: OfferStatus.WITHDRAWN }
                        : offer
                ))
            } else {
                setError(result.message || 'Failed to withdraw offer')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to withdraw offer')
        } finally {
            setWithdrawingIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(offerId)
                return newSet
            })
        }
    }

    const filteredOffers = offers.filter(offer => {
        const matchesStatus = filterStatus === 'all' || offer.status === filterStatus
        const matchesSearch =
            offer.sellPost.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            offer.sellPost.seller.name.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesStatus && matchesSearch
    })

    // Stats
    const stats = {
        total: offers.length,
        pending: offers.filter(o => o.status === OfferStatus.PENDING).length,
        accepted: offers.filter(o => o.status === OfferStatus.ACCEPTED).length,
        countered: offers.filter(o => o.status === OfferStatus.COUNTERED).length,
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto p-4 pb-24 lg:pb-8 max-w-5xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/marketplace">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Marketplace
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <OfferIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">My Offers</h1>
                            <p className="text-muted-foreground text-sm">
                                Track your offers on listings
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                <DashboardSummary
                    summaries={[
                        {
                            title: 'Total Offers',
                            value: stats.total,
                            description: 'All offers sent',
                            icon: OfferIcon,
                        },
                        {
                            title: 'Pending',
                            value: stats.pending,
                            description: 'Waiting for response',
                            icon: Clock,
                        },
                        {
                            title: 'Accepted',
                            value: stats.accepted,
                            description: 'Successfully accepted',
                            icon: CheckCircle,
                        },
                        {
                            title: 'Countered',
                            value: stats.countered,
                            description: 'Counter offers received',
                            icon: RotateCcw,
                        },
                    ]}
                />

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by listing or seller..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                        {(['all', 'PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED'] as const).map((status) => (
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
                        <p className="text-muted-foreground">Loading your offers...</p>
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
                                {filterStatus === 'all' ? 'No offers yet' : `No ${STATUS_CONFIG[filterStatus as OfferStatus]?.label.toLowerCase()} offers`}
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                {searchQuery
                                    ? 'Try a different search term'
                                    : 'Make offers on listings to track them here.'}
                            </p>
                            {!searchQuery && filterStatus === 'all' && (
                                <Link href="/marketplace">
                                    <Button>Browse Marketplace</Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                )}

                {!isLoading && filteredOffers.length > 0 && (
                    <div className="space-y-4">
                        {filteredOffers.map((offer) => {
                            const statusConfig = STATUS_CONFIG[offer.status]
                            const StatusIcon = statusConfig.icon
                            const sellerName = offer.sellPost.seller.firstName && offer.sellPost.seller.lastName
                                ? `${offer.sellPost.seller.firstName} ${offer.sellPost.seller.lastName}`
                                : offer.sellPost.seller.name
                            const initials = getInitials(
                                offer.sellPost.seller.firstName,
                                offer.sellPost.seller.lastName,
                                offer.sellPost.seller.name
                            )

                            return (
                                <Card key={offer.id} className={offer.status === OfferStatus.ACCEPTED ? 'border-green-500' : ''}>
                                    <CardContent className="p-4">
                                        <div className="flex gap-4">
                                            {/* Thumbnail */}
                                            <Link
                                                href={`/marketplace/${offer.sellPost.id}`}
                                                className="flex-shrink-0"
                                            >
                                                <div className="relative w-20 h-20 bg-muted rounded-lg overflow-hidden">
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
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Link
                                                                href={`/marketplace/${offer.sellPost.id}`}
                                                                className="font-semibold hover:text-primary truncate"
                                                            >
                                                                {offer.sellPost.title}
                                                            </Link>
                                                            <Badge className={statusConfig.color}>
                                                                <StatusIcon className="h-3 w-3 mr-1" />
                                                                {statusConfig.label}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm mb-1">
                                                            <span className="text-muted-foreground">
                                                                Listed: {formatPrice(offer.sellPost.price)}
                                                            </span>
                                                            <span className="font-semibold text-primary">
                                                                Your offer: {formatPrice(offer.offeredPrice)}
                                                            </span>
                                                            {offer.status === OfferStatus.COUNTERED && (
                                                                <span className="text-blue-600">
                                                                    Counter: {formatPrice(offer.offeredPrice)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                            <span>
                                                                From {sellerName}
                                                            </span>
                                                            <span>•</span>
                                                            <span>
                                                                {formatDistanceToNow(new Date(offer.createdAt))}
                                                            </span>
                                                        </div>
                                                        {offer.message && (
                                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                                                &quot;{offer.message}&quot;
                                                            </p>
                                                        )}
                                                        {offer.responseMessage && (
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                <span className="font-medium">Response:</span> {offer.responseMessage}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    {offer.status === OfferStatus.PENDING && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleWithdraw(offer.id)}
                                                            disabled={withdrawingIds.has(offer.id)}
                                                        >
                                                            {withdrawingIds.has(offer.id) ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                'Withdraw'
                                                            )}
                                                        </Button>
                                                    )}

                                                    {offer.status === OfferStatus.ACCEPTED && (
                                                        <Link href={`/messages?offer=${offer.id}`}>
                                                            <Button size="sm">
                                                                <ShoppingBag className="h-4 w-4 mr-2" />
                                                                Message Seller
                                                            </Button>
                                                        </Link>
                                                    )}
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
        </div>
    )
}

export default function OffersSentPage() {
    return (
        <AuthGuard>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                <OffersSentPageContent />
            </Suspense>
        </AuthGuard>
    )
}
