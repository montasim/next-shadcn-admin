'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { AuthGuard } from '@/components/auth-guard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
    MessageSquare,
    Search,
    Loader2,
    ShoppingBag,
    MoreVertical,
    Check,
    Archive,
    XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow, getInitials } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface Conversation {
    id: string
    status: string
    transactionCompleted: boolean
    updatedAt: Date
    unreadCount: number
    isSeller: boolean
    sellPost: {
        id: string
        title: string
        price: number
        condition: string
        images: string[]
        book?: {
            name: string
            image?: string
            directImageUrl?: any
        }
    }
    messages: Array<{
        id: string
        content: string
        createdAt: Date
        senderId: string
    }>
}

interface ConversationsResponse {
    success: boolean
    data: Conversation[]
    message?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

function MessagesInboxPageContent() {
    const router = useRouter()
    const { user } = useAuth()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const fetchConversations = async () => {
            if (!user?.id) return

            setIsLoading(true)
            setError(null)

            try {
                const response = await fetch('/api/user/conversations')
                const result: ConversationsResponse = await response.json()

                if (result.success) {
                    setConversations(result.data)
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
    }, [user?.id])

    const filteredConversations = conversations.filter(conv =>
        conv.sellPost.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.messages[conv.messages.length - 1]?.content.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto p-4 pb-24 lg:pb-8 max-w-5xl">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">Messages</h1>
                        <p className="text-muted-foreground text-sm">
                            Communicate with buyers and sellers
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading conversations...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <Card className="border-destructive">
                        <CardContent className="p-4 text-destructive">
                            {error}
                        </CardContent>
                    </Card>
                )}

                {/* Conversations List */}
                {!isLoading && filteredConversations.length === 0 && (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h2 className="text-lg font-semibold mb-2">
                                {searchQuery ? 'No messages found' : 'No messages yet'}
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                {searchQuery
                                    ? 'Try a different search term'
                                    : 'Your conversations with buyers and sellers will appear here.'}
                            </p>
                            {!searchQuery && (
                                <Link href="/marketplace">
                                    <Button>Browse Marketplace</Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                )}

                {!isLoading && filteredConversations.length > 0 && (
                    <div className="space-y-2">
                        {filteredConversations.map((conversation) => {
                            const lastMessage = conversation.messages[conversation.messages.length - 1]
                            const otherPersonName = conversation.isSeller
                                ? `Buyer` // Would be buyer's name from API
                                : `Seller` // Would be seller's name from API

                            // Count total unread
                            const unreadCount = conversation.unreadCount

                            return (
                                <Link
                                    key={conversation.id}
                                    href={`/messages/${conversation.id}`}
                                    className="block"
                                >
                                    <Card className="transition-all hover:shadow-md hover:border-primary/50">
                                        <CardContent className="p-4">
                                            <div className="flex gap-4">
                                                {/* Thumbnail */}
                                                <div className="flex-shrink-0">
                                                    <div className="relative w-16 h-16 bg-muted rounded-lg overflow-hidden">
                                                        {conversation.sellPost.images[0] ? (
                                                            <img
                                                                src={conversation.sellPost.images[0]}
                                                                alt={conversation.sellPost.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : conversation.sellPost.book?.image ? (
                                                            <img
                                                                src={conversation.sellPost.book.image}
                                                                alt={conversation.sellPost.book.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="font-semibold truncate">
                                                                    {conversation.sellPost.title}
                                                                </h3>
                                                                {unreadCount > 0 && (
                                                                    <Badge variant="default" className="ml-auto">
                                                                        {unreadCount}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {lastMessage && (
                                                                <p className="text-sm text-muted-foreground truncate">
                                                                    {lastMessage.senderId === user?.id ? 'You: ' : ''}
                                                                    {lastMessage.content}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                                <span>{formatDistanceToNow(new Date(conversation.updatedAt))}</span>
                                                                <span>•</span>
                                                                <span>${conversation.sellPost.price}</span>
                                                                {conversation.transactionCompleted && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span className="flex items-center gap-1 text-green-600">
                                                                            <Check className="h-3 w-3" />
                                                                            Complete
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}

export default function MessagesInboxPage() {
    return (
        <AuthGuard>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                <MessagesInboxPageContent />
            </Suspense>
        </AuthGuard>
    )
}
