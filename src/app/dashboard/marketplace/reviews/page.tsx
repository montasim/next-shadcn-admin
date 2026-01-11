'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Star,
    Search,
    MoreVertical,
    Eye,
    Trash2,
    Loader2,
    ShoppingBag,
    User,
    MessageSquare,
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow, getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// ============================================================================
// TYPES
// ============================================================================

interface AdminReview {
    id: string
    rating: number
    communicationRating: number
    descriptionAccuracyRating: number
    meetupRating: number
    comment: string | null
    createdAt: Date
    updatedAt: Date
    reviewer: {
        id: string
        name: string
        email: string | null
    }
    sellPost: {
        id: string
        title: string
    }
    conversation: {
        sellerId: string
    }
}

interface ReviewsResponse {
    success: boolean
    data: {
        reviews: AdminReview[]
        currentPage: number
        totalPages: number
        total: number
    }
    message?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function AdminMarketplaceReviewsPage() {
    const { user } = useAuth()
    const [reviews, setReviews] = useState<AdminReview[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

    useEffect(() => {
        const fetchReviews = async () => {
            if (!isAdmin) return

            setIsLoading(true)
            setError(null)

            try {
                const params = new URLSearchParams()
                params.set('page', currentPage.toString())
                params.set('limit', '20')

                const response = await fetch(`/api/admin/marketplace/reviews?${params.toString()}`)
                const result: ReviewsResponse = await response.json()

                if (result.success) {
                    setReviews(result.data.reviews)
                    setTotalPages(result.data.totalPages)
                    setTotalItems(result.data.total)
                } else {
                    setError(result.message || 'Failed to fetch reviews')
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch reviews')
            } finally {
                setIsLoading(false)
            }
        }

        fetchReviews()
    }, [isAdmin, currentPage])

    const handleDelete = async (reviewId: string) => {
        if (!confirm('Are you sure you want to delete this review?')) return

        try {
            const response = await fetch(`/api/admin/marketplace/reviews?id=${reviewId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setReviews(reviews.filter(r => r.id !== reviewId))
                setTotalItems(prev => prev - 1)
            }
        } catch (err) {
            console.error('Failed to delete review:', err)
        }
    }

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${
                            star <= rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                        }`}
                    />
                ))}
            </div>
        )
    }

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-96">
                <Card className="max-w-md">
                    <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">Admin access required</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold">Seller Reviews</h1>
                    <p className="text-muted-foreground">
                        Moderate all seller reviews
                    </p>
                </div>
            </div>

            {/* Filters */}
            {isLoading ? (
                <Card>
                    <CardContent className="p-4">
                        <Skeleton className="h-5 w-48" />
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">
                            Showing all {totalItems} review{totalItems !== 1 ? 's' : ''}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="border rounded-lg divide-y">
                    {Array.from({ length: 10 }).map((_, index) => (
                        <div key={index} className="p-4">
                            <div className="flex items-start gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1 min-w-0 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <Skeleton key={i} className="h-4 w-24" />
                                        ))}
                                    </div>
                                    <Skeleton className="h-16 w-full" />
                                </div>
                                <Skeleton className="h-8 w-8" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && (
                <Card className="border-destructive">
                    <CardContent className="p-4 text-destructive">
                        {error}
                    </CardContent>
                </Card>
            )}

            {/* Reviews List */}
            {!isLoading && (
                <>
                    <div className="border rounded-lg divide-y">
                        {reviews.map((review) => (
                            <div key={review.id} className="p-4 hover:bg-muted/50 transition-colors">
                                <div className="flex items-start gap-4">
                                    {/* Reviewer Avatar */}
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback>
                                            {getInitials(null, null, review.reviewer?.name || 'Unknown')}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold">{review.reviewer?.name || 'Unknown User'}</span>
                                                    {renderStars(review.rating)}
                                                    <span className="text-sm font-medium text-primary">
                                                        {review.rating}/5
                                                    </span>
                                                    {review.reviewer?.email && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {review.reviewer.email}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Category Ratings */}
                                                <div className="flex items-center gap-4 text-xs mb-2">
                                                    <span>Communication: {review.communicationRating}/5</span>
                                                    <span>Accuracy: {review.descriptionAccuracyRating}/5</span>
                                                    <span>Meetup: {review.meetupRating}/5</span>
                                                </div>

                                                {/* Comment */}
                                                {review.comment && (
                                                    <div className="text-sm mb-2 p-3 bg-muted/50 rounded-lg">
                                                        <p className="text-foreground italic">&quot;{review.comment}&quot;</p>
                                                    </div>
                                                )}

                                                {/* Links */}
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span>{formatDistanceToNow(new Date(review.createdAt))}</span>
                                                    <span>•</span>
                                                    <Link
                                                        href={`/marketplace/${review.sellPost.id}`}
                                                        className="hover:text-primary flex items-center gap-1"
                                                    >
                                                        <ShoppingBag className="h-3 w-3" />
                                                        {review.sellPost.title}
                                                    </Link>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(review.id)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete Review
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <div className="text-sm">
                                Page {currentPage} of {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
