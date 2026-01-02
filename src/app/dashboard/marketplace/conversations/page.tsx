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
    MessageSquare,
    Search,
    MoreVertical,
    Eye,
    Trash2,
    Loader2,
    ShoppingBag,
    User,
} from 'lucide-react'
import Link from 'next/link'
import { formatPrice, formatDistanceToNow, getInitials } from '@/lib/utils'
import { ConversationStatus } from '@prisma/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ConversationListSkeleton } from '@/components/data-table/table-skeleton'

// ============================================================================
// TYPES
// ============================================================================

interface AdminConversation {
    id: string
    status: ConversationStatus
    transactionCompleted: boolean
    completedAt: Date | null
    createdAt: Date
    updatedAt: Date
    sellPost: {
        id: string
        title: string
        price: number
        images: string[]
        status: string
    }
    seller: {
        id: string
        name: string
        firstName?: string | null
        lastName?: string | null
        email?: string | null
        avatar?: string | null
        directAvatarUrl?: any
    }
    buyer: {
        id: string
        name: string
        firstName?: string | null
        lastName?: string | null
        email?: string | null
        avatar?: string | null
        directAvatarUrl?: any
    }
    messages: Array<{
        id: string
        content: string
        createdAt: Date
    }>
    _count: {
        messages: number
    }
}

interface ConversationsResponse {
    success: boolean
    data: {
        conversations: AdminConversation[]
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
    { value: 'ACTIVE', label: 'Active' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'ARCHIVED', label: 'Archived' },
    { value: 'BLOCKED', label: 'Blocked' },
]

const STATUS_CONFIG: Record<ConversationStatus, { label: string; color: string }> = {
    ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-800' },
    COMPLETED: { label: 'Completed', color: 'bg-blue-100 text-blue-800' },
    ARCHIVED: { label: 'Archived', color: 'bg-gray-100 text-gray-800' },
    BLOCKED: { label: 'Blocked', color: 'bg-red-100 text-red-800' },
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function AdminMarketplaceConversationsPage() {
    const { user } = useAuth()
    const [conversations, setConversations] = useState<AdminConversation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

    useEffect(() => {
        const fetchConversations = async () => {
            if (!isAdmin) return

            setIsLoading(true)
            setError(null)

            try {
                const params = new URLSearchParams()
                params.set('page', currentPage.toString())
                params.set('limit', '20')
                if (statusFilter !== 'all') params.set('status', statusFilter)
                if (searchQuery) params.set('search', searchQuery)

                const response = await fetch(`/api/admin/marketplace/conversations?${params.toString()}`)
                const result: ConversationsResponse = await response.json()

                if (result.success) {
                    setConversations(result.data.conversations)
                    setTotalPages(result.data.pagination.totalPages)
                    setTotalItems(result.data.pagination.totalItems)
                } else {
                    setError(result.message || 'Failed to fetch conversations')
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch conversations')
            } finally {
                setIsLoading(false)
            }
        }

        fetchConversations()
    }, [isAdmin, currentPage, statusFilter, searchQuery])

    const handleDelete = async (conversationId: string) => {
        if (!confirm('Are you sure you want to delete this conversation? This will delete all messages as well.')) return

        try {
            const response = await fetch(`/api/admin/marketplace/conversations?id=${conversationId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setConversations(conversations.filter(c => c.id !== conversationId))
                setTotalItems(prev => prev - 1)
            }
        } catch (err) {
            console.error('Failed to delete conversation:', err)
        }
    }

    const getSellerName = (seller: AdminConversation['seller'] | null) => {
        if (!seller) return 'Unknown Seller'
        return seller.firstName && seller.lastName
            ? `${seller.firstName} ${seller.lastName}`
            : seller.name || 'Unknown Seller'
    }

    const getBuyerName = (buyer: AdminConversation['buyer'] | null) => {
        if (!buyer) return 'Unknown Buyer'
        return buyer.firstName && buyer.lastName
            ? `${buyer.firstName} ${buyer.lastName}`
            : buyer.name || 'Unknown Buyer'
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
                    <h1 className="text-2xl font-bold">Conversations</h1>
                    <p className="text-muted-foreground">
                        Monitor all buyer-seller conversations
                    </p>
                </div>
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
                                    placeholder="Search by user, email, listing title..."
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
            {isLoading && <ConversationListSkeleton count={10} />}

            {/* Error */}
            {error && (
                <Card className="border-destructive">
                    <CardContent className="p-4 text-destructive">
                        {error}
                    </CardContent>
                </Card>
            )}

            {/* Conversations Table */}
            {!isLoading && (
                <>
                    <div className="text-sm text-muted-foreground mb-4">
                        {totalItems} conversation{totalItems !== 1 ? 's' : ''} found
                    </div>

                    <div className="border rounded-lg divide-y">
                        {conversations.map((conversation) => {
                            const statusConfig = STATUS_CONFIG[conversation.status]
                            const lastMessage = conversation.messages[0]
                            const sellerName = getSellerName(conversation.seller)
                            const buyerName = getBuyerName(conversation.buyer)

                            return (
                                <div key={conversation.id} className="p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        {/* Post Thumbnail */}
                                        <Link
                                            href={`/marketplace/${conversation.sellPost.id}`}
                                            className="flex-shrink-0"
                                        >
                                            <div className="relative w-16 h-20 bg-muted rounded overflow-hidden">
                                                {conversation.sellPost.images[0] ? (
                                                    <img
                                                        src={conversation.sellPost.images[0]}
                                                        alt={conversation.sellPost.title}
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
                                                            href={`/marketplace/${conversation.sellPost.id}`}
                                                            className="font-semibold hover:text-primary truncate"
                                                        >
                                                            {conversation.sellPost.title}
                                                        </Link>
                                                        <Badge className={statusConfig.color}>
                                                            {statusConfig.label}
                                                        </Badge>
                                                        {conversation.transactionCompleted && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Transaction Complete
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm mb-2">
                                                        <span className="font-semibold text-primary">
                                                            {formatPrice(conversation.sellPost.price)}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {conversation._count.messages} messages
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {formatDistanceToNow(new Date(conversation.updatedAt))}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                                                        <div className="flex items-center gap-1">
                                                            <User className="h-3 w-3" />
                                                            <span>Seller: {sellerName}</span>
                                                        </div>
                                                        <span>•</span>
                                                        <div className="flex items-center gap-1">
                                                            <User className="h-3 w-3" />
                                                            <span>Buyer: {buyerName}</span>
                                                        </div>
                                                    </div>
                                                    {lastMessage && (
                                                        <div className="text-sm text-muted-foreground truncate">
                                                            <span className="font-medium">Last: </span>
                                                            {lastMessage.content}
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
                                                            <Link href={`/messages/${conversation.id}`} target="_blank">
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View Conversation
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(conversation.id)}
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
