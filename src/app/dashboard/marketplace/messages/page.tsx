'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { formatDistanceToNow, getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// ============================================================================
// TYPES
// ============================================================================

interface AdminMessage {
    id: string
    content: string
    readAt: Date | null
    createdAt: Date
    sender: {
        id: string
        name: string
        firstName?: string | null
        lastName?: string | null
        email?: string | null
        avatar?: string | null
        directAvatarUrl?: any
    }
    conversation: {
        id: string
        sellPost: {
            id: string
            title: string
        }
        seller: {
            id: string
            name: string
        }
        buyer: {
            id: string
            name: string
        }
    }
}

interface MessagesResponse {
    success: boolean
    data: {
        messages: AdminMessage[]
        pagination: {
            currentPage: number
            totalPages: number
            totalItems: number
        }
    }
    message?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function AdminMarketplaceMessagesPage() {
    const { user } = useAuth()
    const [messages, setMessages] = useState<AdminMessage[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

    useEffect(() => {
        const fetchMessages = async () => {
            if (!isAdmin) return

            setIsLoading(true)
            setError(null)

            try {
                const params = new URLSearchParams()
                params.set('page', currentPage.toString())
                params.set('limit', '20')
                if (searchQuery) params.set('search', searchQuery)

                const response = await fetch(`/api/admin/marketplace/messages?${params.toString()}`)
                const result: MessagesResponse = await response.json()

                if (result.success) {
                    setMessages(result.data.messages)
                    setTotalPages(result.data.pagination.totalPages)
                    setTotalItems(result.data.pagination.totalItems)
                } else {
                    setError(result.message || 'Failed to fetch messages')
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch messages')
            } finally {
                setIsLoading(false)
            }
        }

        fetchMessages()
    }, [isAdmin, currentPage, searchQuery])

    const handleDelete = async (messageId: string) => {
        if (!confirm('Are you sure you want to delete this message?')) return

        try {
            const response = await fetch(`/api/admin/marketplace/messages?id=${messageId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setMessages(messages.filter(m => m.id !== messageId))
                setTotalItems(prev => prev - 1)
            }
        } catch (err) {
            console.error('Failed to delete message:', err)
        }
    }

    const getSenderName = (sender: AdminMessage['sender']) => {
        return sender.firstName && sender.lastName
            ? `${sender.firstName} ${sender.lastName}`
            : sender.name
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
                    <h1 className="text-xl font-bold">Messages</h1>
                    <p className="text-muted-foreground">
                        Monitor all marketplace messages
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by content, user, email..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Loading */}
            {isLoading && (
                <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading messages...</p>
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

            {/* Messages List */}
            {!isLoading && (
                <>
                    <div className="text-sm text-muted-foreground mb-4">
                        {totalItems} message{totalItems !== 1 ? 's' : ''} found
                    </div>

                    <div className="border rounded-lg divide-y">
                        {messages.map((message) => {
                            const senderName = getSenderName(message.sender)

                            return (
                                <div key={message.id} className="p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        {/* Sender Avatar */}
                                        <Avatar className="h-10 w-10">
                                            {message.sender.avatar ? (
                                                <AvatarImage src={message.sender.directAvatarUrl || message.sender.avatar} />
                                            ) : null}
                                            <AvatarFallback>
                                                {getInitials(message.sender.firstName, message.sender.lastName, message.sender.name)}
                                            </AvatarFallback>
                                        </Avatar>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold">{senderName}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {message.sender.email}
                                                        </span>
                                                        {!message.readAt && (
                                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                                                Unread
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm mb-2">
                                                        <p className="text-foreground break-words">{message.content}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        <span>{formatDistanceToNow(new Date(message.createdAt))}</span>
                                                        <span>•</span>
                                                        <Link
                                                            href={`/marketplace/${message.conversation.sellPost.id}`}
                                                            className="hover:text-primary flex items-center gap-1"
                                                        >
                                                            <ShoppingBag className="h-3 w-3" />
                                                            {message.conversation.sellPost.title}
                                                        </Link>
                                                        <span>•</span>
                                                        <Link
                                                            href={`/messages/${message.conversation.id}`}
                                                            className="hover:text-primary"
                                                        >
                                                            View Conversation
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
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/messages/${message.conversation.id}`} target="_blank">
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View Conversation
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(message.id)}
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
