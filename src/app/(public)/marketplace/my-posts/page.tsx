'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { AuthGuard } from '@/components/auth-guard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SellPostCard } from '@/components/marketplace'
import {
    ShoppingBag,
    Plus,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    MessageSquare,
    CheckCircle,
    XCircle,
    Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { SellPostStatus, BookCondition } from '@prisma/client'
import { formatPrice, formatDistanceToNow, getInitials } from '@/lib/utils'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// ============================================================================
// TYPES
// ============================================================================

interface UserSellPost {
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
    book?: {
        id: string
        name: string
        image?: string | null
        directImageUrl?: any
    } | null
    _count?: {
        views?: number
        offers?: number
        conversations?: number
    } | null
}

interface MyPostsResponse {
    success: boolean
    data: {
        posts: UserSellPost[]
        pagination: {
            currentPage: number
            totalPages: number
            totalItems: number
            limit: number
        }
    }
    message?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG: Record<SellPostStatus, { label: string; color: string }> = {
    AVAILABLE: { label: 'Available', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    SOLD: { label: 'Sold', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
    HIDDEN: { label: 'Hidden', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
}

// ============================================================================
// COMPONENT
// ============================================================================

function MySellPostsPageContent() {
    const router = useRouter()
    const { user } = useAuth()
    const [posts, setPosts] = useState<UserSellPost[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [postToDelete, setPostToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [filterStatus, setFilterStatus] = useState<SellPostStatus | 'all'>('all')

    useEffect(() => {
        const fetchPosts = async () => {
            if (!user?.id) return

            setIsLoading(true)
            setError(null)

            try {
                const params = new URLSearchParams()
                params.set('limit', '50')

                const response = await fetch(`/api/user/sell-posts?${params.toString()}`)
                const result: MyPostsResponse = await response.json()

                if (result.success) {
                    setPosts(result.data.posts)
                } else {
                    setError(result.message || 'Failed to fetch your listings')
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch your listings')
            } finally {
                setIsLoading(false)
            }
        }

        fetchPosts()
    }, [user?.id])

    const handleDelete = async () => {
        if (!postToDelete) return

        setIsDeleting(true)
        setError(null)

        try {
            const response = await fetch(`/api/user/sell-posts/${postToDelete}`, {
                method: 'DELETE',
            })

            const result = await response.json()

            if (result.success) {
                // Remove from local state
                setPosts(posts.filter(p => p.id !== postToDelete))
                setDeleteDialogOpen(false)
                setPostToDelete(null)
            } else {
                setError(result.message || 'Failed to delete listing')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to delete listing')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleMarkSold = async (postId: string) => {
        try {
            const response = await fetch(`/api/user/sell-posts/${postId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'mark_sold' }),
            })

            const result = await response.json()

            if (result.success) {
                // Update local state
                setPosts(posts.map(p =>
                    p.id === postId ? { ...p, status: SellPostStatus.SOLD, soldAt: new Date() } : p
                ))
            } else {
                setError(result.message || 'Failed to update listing')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to update listing')
        }
    }

    const filteredPosts = filterStatus === 'all'
        ? posts
        : posts.filter(p => p.status === filterStatus)

    const stats = {
        total: posts.length,
        available: posts.filter(p => p.status === SellPostStatus.AVAILABLE).length,
        pending: posts.filter(p => p.status === SellPostStatus.PENDING).length,
        sold: posts.filter(p => p.status === SellPostStatus.SOLD).length,
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto p-4 pb-24 lg:pb-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <ShoppingBag className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">My Listings</h1>
                            <p className="text-muted-foreground text-sm">
                                Manage your marketplace listings
                            </p>
                        </div>
                    </div>
                    <Link href="/marketplace/create">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Listing
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <div className="text-sm text-muted-foreground">Total</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
                            <div className="text-sm text-muted-foreground">Available</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                            <div className="text-sm text-muted-foreground">Pending</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-blue-600">{stats.sold}</div>
                            <div className="text-sm text-muted-foreground">Sold</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {(['all', 'AVAILABLE', 'PENDING', 'SOLD'] as const).map((status) => (
                        <Button
                            key={status}
                            variant={filterStatus === status ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterStatus(status)}
                        >
                            {status === 'all' ? 'All' : STATUS_CONFIG[status as SellPostStatus].label}
                        </Button>
                    ))}
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading your listings...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <Card className="border-destructive mb-6">
                        <CardContent className="p-4 text-destructive">
                            {error}
                        </CardContent>
                    </Card>
                )}

                {/* Listings List */}
                {!isLoading && filteredPosts.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h2 className="text-lg font-semibold mb-2">
                                {filterStatus === 'all' ? 'No listings yet' : `No ${filterStatus.toLowerCase()} listings`}
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                {filterStatus === 'all'
                                    ? 'Create your first listing to start selling on the marketplace.'
                                    : `You don't have any ${STATUS_CONFIG[filterStatus as SellPostStatus]?.label.toLowerCase()} listings.`}
                            </p>
                            {filterStatus === 'all' && (
                                <Link href="/marketplace/create">
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Your First Listing
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredPosts.map((post) => (
                            <Card key={post.id}>
                                <CardContent className="p-4">
                                    <div className="flex gap-4">
                                        {/* Thumbnail */}
                                        <Link
                                            href={`/marketplace/${post.id}`}
                                            className="flex-shrink-0"
                                        >
                                            <div className="relative w-24 h-24 bg-muted rounded-lg overflow-hidden">
                                                {post.images[0] ? (
                                                    <img
                                                        src={post.images[0]}
                                                        alt={post.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                        <ShoppingBag className="h-8 w-8" />
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
                                                        <Badge className={STATUS_CONFIG[post.status].color}>
                                                            {STATUS_CONFIG[post.status].label}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-lg font-bold text-primary">
                                                        {formatPrice(post.price)}
                                                        {post.negotiable && (
                                                            <span className="text-sm font-normal text-muted-foreground ml-2">
                                                                (Negotiable)
                                                            </span>
                                                        )}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Eye className="h-3 w-3" />
                                                            {post._count?.views || 0} views
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MessageSquare className="h-3 w-3" />
                                                            {post._count?.conversations || 0} conversations
                                                        </span>
                                                        <span>
                                                            Listed {formatDistanceToNow(new Date(post.createdAt))}
                                                        </span>
                                                        {(post.city || post.location) && (
                                                            <span className="truncate">
                                                                📍 {post.city || post.location}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2">
                                                    {post.status === SellPostStatus.AVAILABLE && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleMarkSold(post.id)}
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-1" />
                                                            Mark Sold
                                                        </Button>
                                                    )}

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/marketplace/${post.id}`}>
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    View
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            {post.status !== SellPostStatus.SOLD && (
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/marketplace/my-posts/${post.id}/edit`}>
                                                                        <Edit className="h-4 w-4 mr-2" />
                                                                        Edit
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => {
                                                                    setPostToDelete(post.id)
                                                                    setDeleteDialogOpen(true)
                                                                }}
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
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete this listing? This action cannot be undone.
                                You can create a new listing at any time.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete'
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </main>
        </div>
    )
}

export default function MySellPostsPage() {
    return (
        <AuthGuard>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                <MySellPostsPageContent />
            </Suspense>
        </AuthGuard>
    )
}
