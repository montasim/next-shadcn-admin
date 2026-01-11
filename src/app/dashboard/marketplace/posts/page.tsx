'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    ShoppingBag,
    Search,
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    Loader2,
    Filter,
} from 'lucide-react'
import Link from 'next/link'
import { formatPrice, formatDistanceToNow } from '@/lib/utils'
import { SellPostStatus, BookCondition } from '@prisma/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { MarketplaceListingSkeleton } from '@/components/data-table/table-skeleton'
import { ROUTES } from '@/lib/routes/client-routes'

// ============================================================================
// TYPES
// ============================================================================

interface AdminSellPost {
    id: string
    title: string
    description?: string | null
    price: number
    negotiable: boolean
    condition: BookCondition
    images: string[]
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
        avatar?: string | null
        directAvatarUrl?: any
    }
    _count?: {
        views?: number
        offers?: number
        conversations?: number
    }
}

interface PostsResponse {
    success: boolean
    data: {
        posts: AdminSellPost[]
        pagination: {
            currentPage: number
            totalPages: number
            totalItems: number
        }
    }
    message?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Status' },
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'SOLD', label: 'Sold' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'HIDDEN', label: 'Hidden' },
]

const CONDITION_LABELS: Record<BookCondition, string> = {
    NEW: 'New',
    LIKE_NEW: 'Like New',
    GOOD: 'Good',
    FAIR: 'Fair',
    POOR: 'Poor',
}

const STATUS_CONFIG: Record<SellPostStatus, { label: string; color: string }> = {
    AVAILABLE: { label: 'Available', color: 'bg-green-100 text-green-800' },
    PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    SOLD: { label: 'Sold', color: 'bg-blue-100 text-blue-800' },
    EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-800' },
    HIDDEN: { label: 'Hidden', color: 'bg-red-100 text-red-800' },
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function AdminMarketplacePostsPage() {
    const { user } = useAuth()
    const [posts, setPosts] = useState<AdminSellPost[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

    useEffect(() => {
        const fetchPosts = async () => {
            if (!isAdmin) return

            setIsLoading(true)
            setError(null)

            try {
                const params = new URLSearchParams()
                params.set('page', currentPage.toString())
                params.set('limit', '20')
                if (statusFilter !== 'all') params.set('status', statusFilter)
                if (searchQuery) params.set('search', searchQuery)

                const response = await fetch(`/api/admin/marketplace/posts?${params.toString()}`)
                const result: PostsResponse = await response.json()

                if (result.success) {
                    setPosts(result.data.posts)
                    setTotalPages(result.data.pagination.totalPages)
                    setTotalItems(result.data.pagination.totalItems)
                } else {
                    setError(result.message || 'Failed to fetch posts')
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch posts')
            } finally {
                setIsLoading(false)
            }
        }

        fetchPosts()
    }, [isAdmin, currentPage, statusFilter, searchQuery])

    const handleDelete = async (postId: string) => {
        if (!confirm('Are you sure you want to delete this listing?')) return

        try {
            const response = await fetch(`/api/admin/marketplace/posts/${postId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setPosts(posts.filter(p => p.id !== postId))
                setTotalItems(prev => prev - 1)
            }
        } catch (err) {
            console.error('Failed to delete post:', err)
        }
    }

    const handleStatusChange = async (postId: string, newStatus: SellPostStatus) => {
        try {
            const response = await fetch(`/api/admin/marketplace/posts/${postId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })

            if (response.ok) {
                setPosts(posts.map(p =>
                    p.id === postId ? { ...p, status: newStatus } : p
                ))
            }
        } catch (err) {
            console.error('Failed to update status:', err)
        }
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
                    <h1 className="text-xl font-bold">Sell Posts</h1>
                    <p className="text-muted-foreground">
                        Manage all marketplace listings
                    </p>
                </div>
                <Link href={ROUTES.marketplace.href}>
                    <Button variant="outline">
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        View Marketplace
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            {isLoading ? (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <Skeleton className="h-10 flex-1" />
                            <Skeleton className="h-10 w-full md:w-[200px]" />
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search by title, seller..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={(value) => {
                                setStatusFilter(value)
                                setCurrentPage(1)
                            }}>
                                <SelectTrigger className="w-full md:w-[200px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Loading */}
            {isLoading && <MarketplaceListingSkeleton count={10} />}

            {/* Error */}
            {error && (
                <Card className="border-destructive">
                    <CardContent className="p-4 text-destructive">
                        {error}
                    </CardContent>
                </Card>
            )}

            {/* Posts Table */}
            {!isLoading && (
                <>
                    <div className="text-sm text-muted-foreground mb-4">
                        {totalItems} listing{totalItems !== 1 ? 's' : ''} found
                    </div>

                    <div className="border rounded-lg divide-y">
                        {posts.map((post) => {
                            const statusConfig = STATUS_CONFIG[post.status]
                            const sellerName = post.seller?.firstName && post.seller?.lastName
                                ? `${post?.seller?.firstName} ${post?.seller?.lastName}`
                                : post.seller?.name || 'Unknown Seller'
                            const initials = getInitials(post.seller?.firstName, post.seller?.lastName, post.seller?.name)

                            return (
                                <div key={post.id} className="p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        {/* Thumbnail */}
                                        <Link
                                            href={`/marketplace/${post.id}`}
                                            className="flex-shrink-0"
                                        >
                                            <div className="relative w-16 h-20 bg-muted rounded overflow-hidden">
                                                {post.images[0] ? (
                                                    <img
                                                        src={post.images[0]}
                                                        alt={post.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
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
                                                            href={`/marketplace/${post.id}`}
                                                            className="font-semibold hover:text-primary truncate"
                                                        >
                                                            {post.title}
                                                        </Link>
                                                        <Badge className={statusConfig.color}>
                                                            {statusConfig.label}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {CONDITION_LABELS[post.condition]}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm mb-1">
                                                        <span className="font-semibold text-primary">
                                                            {formatPrice(post.price)}
                                                        </span>
                                                        {post.negotiable && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Negotiable
                                                            </Badge>
                                                        )}
                                                        <span className="text-muted-foreground">
                                                            {post._count?.offers || 0} offers
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {post._count?.views || 0} views
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        <span>Seller: {sellerName}</span>
                                                        {post?.seller?.email && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{post.seller.email}</span>
                                                            </>
                                                        )}
                                                        <span>•</span>
                                                        <span>{formatDistanceToNow(new Date(post.createdAt))}</span>
                                                    </div>
                                                    {(post.city || post.location) && (
                                                        <div className="text-xs text-muted-foreground">
                                                            📍 {post.city || post.location}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/marketplace/${post.id}`} target="_blank">
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View Listing
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleStatusChange(post.id, SellPostStatus.AVAILABLE)}
                                                            disabled={post.status === SellPostStatus.AVAILABLE}
                                                        >
                                                            Mark Available
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleStatusChange(post.id, SellPostStatus.SOLD)}
                                                            disabled={post.status === SellPostStatus.SOLD}
                                                        >
                                                            Mark Sold
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleStatusChange(post.id, SellPostStatus.HIDDEN)}
                                                            disabled={post.status === SellPostStatus.HIDDEN}
                                                        >
                                                            Hide Listing
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(post.id)}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
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
