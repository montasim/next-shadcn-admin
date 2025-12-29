'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { AuthGuard } from '@/components/auth-guard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    MessageSquare,
    Loader2,
    ShoppingBag,
    Send,
    MoreVertical,
    Check,
    Star,
    Clock,
    Home,
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow, getInitials } from '@/lib/utils'
import { BookCondition } from '@prisma/client'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { NavigationBreadcrumb } from '@/components/ui/breadcrumb'
import { useConversationSocket } from '@/hooks/use-conversation-socket'

// ============================================================================
// TYPES
// ============================================================================

interface Message {
    id: string
    content: string
    createdAt: Date
    readAt: Date | null
    senderId: string
    sender: {
        id: string
        name: string
        firstName?: string | null
        lastName?: string | null
        avatar?: string | null
        directAvatarUrl?: any
    }
}

interface Conversation {
    id: string
    status: string
    transactionCompleted: boolean
    completedAt?: Date | null
    updatedAt: Date
    sellerId: string
    buyerId: string
    sellPost: {
        id: string
        title: string
        price: number
        negotiable: boolean
        condition: BookCondition
        images: string[]
        city?: string | null
        location?: string | null
        book?: {
            id: string
            name: string
            image?: string | null
            directImageUrl?: any
        }
    }
    messages: Message[]
    review?: {
        id: string
        rating: number
        comment?: string | null
        createdAt: Date
    }
}

interface ConversationResponse {
    success: boolean
    data: Conversation
    message?: string
}

const CONDITION_LABELS: Record<BookCondition, string> = {
    NEW: 'New',
    LIKE_NEW: 'Like New',
    GOOD: 'Good',
    FAIR: 'Fair',
    POOR: 'Poor',
}

// ============================================================================
// COMPONENT
// ============================================================================

function ConversationViewPageContent() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const conversationId = params.id as string

    const [conversation, setConversation] = useState<Conversation | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [messageText, setMessageText] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [isCompleting, setIsCompleting] = useState(false)

    // Review form state
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
    const [rating, setRating] = useState(5)
    const [communicationRating, setCommunicationRating] = useState(0)
    const [descriptionRating, setDescriptionRating] = useState(0)
    const [meetupRating, setMeetupRating] = useState(0)
    const [reviewComment, setReviewComment] = useState('')
    const [isSubmittingReview, setIsSubmittingReview] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)

    const isSeller = user?.id === conversation?.sellerId
    const otherUserId = isSeller ? conversation?.buyerId : conversation?.sellerId
    const canLeaveReview = !isSeller && conversation?.transactionCompleted && !conversation?.review

    // WebSocket hook for real-time messaging with external Render server
    const {
        isConnected: wsConnected,
        isTyping: otherUserTyping,
        markAsRead: wsMarkAsRead,
        sendTypingStart: wsSendTypingStart,
        sendTypingStop: wsSendTypingStop
    } = useConversationSocket({
        conversationId,
        onNewMessage: (message) => {
            setConversation(prev => prev ? {
                ...prev,
                messages: [...prev.messages, message],
                updatedAt: new Date(),
            } : null)
        },
        onMessageRead: (data) => {
            setConversation(prev => {
                if (!prev) return null
                return {
                    ...prev,
                    messages: prev.messages.map(m =>
                        m.senderId === user?.id && !m.readAt
                            ? { ...m, readAt: new Date() as any }
                            : m
                    )
                }
            })
        },
        onTypingChange: (typing) => {
            // Could show typing indicator in UI
            console.log('User typing:', typing)
        }
    })

    // Initial conversation fetch with polling for new messages
    useEffect(() => {
        let isMounted = true
        let pollInterval: NodeJS.Timeout | null = null

        const fetchConversation = async (isPoll = false) => {
            if (!isMounted) return

            if (!isPoll) {
                setIsLoading(true)
            }
            setError(null)

            try {
                const response = await fetch(`/api/user/conversations/${conversationId}`)
                const result: ConversationResponse = await response.json()

                if (isMounted && result.success) {
                    // For initial fetch, always set. For polls, check if there are new messages
                    const shouldUpdate = isPoll
                        ? result.data.messages.length > (conversation?.messages?.length || 0)
                        : true

                    if (shouldUpdate) {
                        setConversation(result.data)
                    }

                    // Mark messages as read via WebSocket or fallback to HTTP
                    if (wsConnected) {
                        wsMarkAsRead()
                    } else {
                        await fetch(`/api/user/conversations/${conversationId}/read`, {
                            method: 'POST',
                        })
                    }

                    // Start polling only after successful initial load
                    if (!isPoll && !pollInterval) {
                        pollInterval = setInterval(() => fetchConversation(true), 3000) // Poll every 3 seconds
                    }
                } else if (isMounted && !isPoll) {
                    setError(result.message || 'Failed to load conversation')
                }
            } catch (err: any) {
                if (isMounted && !isPoll) {
                    setError(err.message || 'Failed to load conversation')
                }
            } finally {
                if (!isPoll) {
                    setIsLoading(false)
                }
            }
        }

        fetchConversation()

        return () => {
            isMounted = false
            if (pollInterval) {
                clearInterval(pollInterval)
            }
        }
    }, [conversationId, wsConnected, wsMarkAsRead])

    useEffect(() => {
        // Scroll to bottom when messages change
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [conversation?.messages])

    const handleSendMessage = async () => {
        if (!messageText.trim() || isSending) return

        setIsSending(true)
        setError(null)

        try {
            const content = messageText.trim()

            // Always use HTTP API to send messages (ensures database persistence)
            const response = await fetch(`/api/user/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            })

            const result = await response.json()

            if (!result.success) {
                throw new Error(result.message || 'Failed to send message')
            }

            // Optimistically update messages
            setConversation(prev => prev ? {
                ...prev,
                messages: [...prev.messages, result.data],
                updatedAt: new Date(),
            } : null)

            setMessageText('')
        } catch (err: any) {
            setError(err.message || 'Failed to send message')
        } finally {
            setIsSending(false)
        }
    }

    const handleMessageChange = (value: string) => {
        setMessageText(value)
        // Only send typing indicators via WebSocket when connected
        if (wsConnected) {
            if (value.trim()) {
                wsSendTypingStart()
            } else {
                wsSendTypingStop()
            }
        }
    }

    const handleMarkComplete = async () => {
        setIsCompleting(true)
        setError(null)

        try {
            const response = await fetch(`/api/user/conversations/${conversationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'complete' }),
            })

            const result = await response.json()

            if (result.success) {
                setConversation(prev => prev ? {
                    ...prev,
                    transactionCompleted: true,
                    completedAt: new Date(),
                    status: 'COMPLETED',
                } : null)
            } else {
                setError(result.message || 'Failed to mark transaction as complete')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to mark transaction as complete')
        } finally {
            setIsCompleting(false)
        }
    }

    const handleSubmitReview = async () => {
        setIsSubmittingReview(true)
        setError(null)

        try {
            const response = await fetch(`/api/user/conversations/${conversationId}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sellPostId: conversation?.sellPost.id,
                    sellerId: conversation?.sellerId,
                    rating,
                    communicationRating,
                    descriptionAccuracyRating: descriptionRating,
                    meetupRating,
                    comment: reviewComment,
                }),
            })

            const result = await response.json()

            if (result.success) {
                setReviewDialogOpen(false)
                // Update conversation with new review
                setConversation(prev => prev ? {
                    ...prev,
                    review: result.data,
                } : null)
            } else {
                setError(result.message || 'Failed to submit review')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to submit review')
        } finally {
            setIsSubmittingReview(false)
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
    if (error || !conversation) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="p-6 text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-lg font-semibold mb-2">Conversation Not Found</h2>
                        <p className="text-muted-foreground mb-4">
                            {error || 'This conversation may have been removed.'}
                        </p>
                        <Link href="/messages">
                            <Button>Back to Messages</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const otherPersonName = isSeller ? 'Buyer' : 'Seller'

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto p-4 pb-24 lg:pb-8 max-w-5xl">
                {/* Header with Breadcrumb */}
                <NavigationBreadcrumb
                    items={[
                        { label: 'Home', href: '/', icon: <Home className="h-4 w-4" /> },
                        { label: 'Messages', href: '/messages', icon: <MessageSquare className="h-4 w-4" /> },
                        { label: conversation.sellPost.title, icon: <ShoppingBag className="h-4 w-4" /> },
                    ]}
                    className="mb-6"
                />

                {/* Item Info Header */}
                <div className="flex items-center gap-3 mb-6 p-4 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-bold truncate">{conversation.sellPost.title}</h1>
                        <p className="text-sm text-muted-foreground">
                            ${conversation.sellPost.price} • {CONDITION_LABELS[conversation.sellPost.condition]}
                        </p>
                    </div>
                    {/* Connection Status Indicator */}
                    <div className="flex items-center gap-2 text-xs">
                        <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-amber-500'}`} />
                        <span className="text-muted-foreground">
                            {wsConnected ? 'Live' : 'Standard'}
                        </span>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Chat Area */}
                    <div className="lg:col-span-2">
                        <Card className="h-[calc(100vh-240px)] lg:h-[calc(100vh-200px)] flex flex-col">
                            {/* Messages */}
                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                                {conversation.messages.map((message) => {
                                    const isOwn = message.senderId === user?.id

                                    return (
                                        <div
                                            key={message.id}
                                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[80%] ${isOwn ? 'order-2' : 'order-1'}`}>
                                                {!isOwn && (
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage src={message.sender.avatar || message.sender.directAvatarUrl} />
                                                            <AvatarFallback className="text-xs">
                                                                {getInitials(message.sender.firstName, message.sender.lastName, message.sender.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-xs text-muted-foreground">
                                                            {message.sender.firstName && message.sender.lastName
                                                                ? `${message.sender.firstName} ${message.sender.lastName}`
                                                                : message.sender.name}
                                                        </span>
                                                    </div>
                                                )}
                                                <div
                                                    className={`rounded-lg p-3 ${
                                                        isOwn
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'bg-muted'
                                                    }`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                                </div>
                                                <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${isOwn ? 'justify-end' : ''}`}>
                                                    <span>{formatDistanceToNow(new Date(message.createdAt))}</span>
                                                    {isOwn && message.readAt && (
                                                        <span className="flex items-center gap-1">
                                                            <Check className="h-3 w-3" />
                                                            Read
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={messagesEndRef} />
                            </CardContent>

                            {/* Input */}
                            <div className="border-t p-4">
                                <div className="flex gap-2">
                                    <Textarea
                                        placeholder="Type a message..."
                                        value={messageText}
                                        onChange={(e) => handleMessageChange(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault()
                                                handleSendMessage()
                                            }
                                        }}
                                        rows={1}
                                        className="flex-1 resize-none"
                                        disabled={conversation.status === 'BLOCKED'}
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!messageText.trim() || isSending || conversation.status === 'BLOCKED'}
                                        size="icon"
                                    >
                                        {isSending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                {conversation.status === 'BLOCKED' && (
                                    <p className="text-xs text-destructive mt-2">
                                        This conversation has been blocked
                                    </p>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar - Item Info */}
                    <div className="space-y-4">
                        {/* Listing Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Item Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex gap-3">
                                    <div className="relative w-16 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
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
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/marketplace/${conversation.sellPost.id}`}
                                            className="font-medium hover:text-primary hover:underline line-clamp-2"
                                        >
                                            {conversation.sellPost.title}
                                        </Link>
                                        <p className="text-lg font-bold text-primary">
                                            ${conversation.sellPost.price}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Condition</span>
                                        <span>{CONDITION_LABELS[conversation.sellPost.condition]}</span>
                                    </div>
                                    {(conversation.sellPost.city || conversation.sellPost.location) && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Location</span>
                                            <span className="text-right truncate ml-2">
                                                {conversation.sellPost.city || conversation.sellPost.location}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <Link
                                    href={`/marketplace/${conversation.sellPost.id}`}
                                    className="block text-center w-full"
                                >
                                    <Button variant="outline" size="sm" className="w-full">
                                        View Full Listing
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {conversation.transactionCompleted ? (
                                    <>
                                        <div className="flex items-center gap-2 text-green-600 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                            <Check className="h-4 w-4" />
                                            <span className="text-sm font-medium">Transaction Complete</span>
                                        </div>

                                        {conversation.review ? (
                                            <div className="p-3 bg-muted rounded-lg">
                                                <div className="flex items-center gap-1 mb-2">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`h-4 w-4 ${
                                                                i < (conversation.review?.rating || 0)
                                                                    ? 'fill-yellow-400 text-yellow-400'
                                                                    : 'text-muted-foreground'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                                {conversation.review.comment && (
                                                    <p className="text-sm text-muted-foreground italic">
                                                        {conversation.review.comment}
                                                    </p>
                                                )}
                                            </div>
                                        ) : canLeaveReview ? (
                                            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button className="w-full" size="sm">
                                                        <Star className="h-4 w-4 mr-2" />
                                                        Leave Review
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Leave a Review</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <Label>Overall Rating *</Label>
                                                            <div className="flex gap-1 mt-1">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <button
                                                                        key={star}
                                                                        type="button"
                                                                        onClick={() => setRating(star)}
                                                                        className="focus:outline-none"
                                                                    >
                                                                        <Star
                                                                            className={`h-6 w-6 ${
                                                                                star <= rating
                                                                                    ? 'fill-yellow-400 text-yellow-400'
                                                                                    : 'text-muted-foreground'
                                                                            }`}
                                                                        />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <Label>Communication</Label>
                                                            <div className="flex gap-1 mt-1">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <button
                                                                        key={star}
                                                                        type="button"
                                                                        onClick={() => setCommunicationRating(star)}
                                                                        className="focus:outline-none"
                                                                    >
                                                                        <Star
                                                                            className={`h-4 w-4 ${
                                                                                star <= communicationRating
                                                                                    ? 'fill-yellow-400 text-yellow-400'
                                                                                    : 'text-muted-foreground'
                                                                            }`}
                                                                        />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <Label>Description Accuracy</Label>
                                                            <div className="flex gap-1 mt-1">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <button
                                                                        key={star}
                                                                        type="button"
                                                                        onClick={() => setDescriptionRating(star)}
                                                                        className="focus:outline-none"
                                                                    >
                                                                        <Star
                                                                            className={`h-4 w-4 ${
                                                                                star <= descriptionRating
                                                                                    ? 'fill-yellow-400 text-yellow-400'
                                                                                    : 'text-muted-foreground'
                                                                            }`}
                                                                        />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <Label>Meetup Experience</Label>
                                                            <div className="flex gap-1 mt-1">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <button
                                                                        key={star}
                                                                        type="button"
                                                                        onClick={() => setMeetupRating(star)}
                                                                        className="focus:outline-none"
                                                                    >
                                                                        <Star
                                                                            className={`h-4 w-4 ${
                                                                                star <= meetupRating
                                                                                    ? 'fill-yellow-400 text-yellow-400'
                                                                                    : 'text-muted-foreground'
                                                                            }`}
                                                                        />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <Label htmlFor="comment">Comment (optional)</Label>
                                                            <Textarea
                                                                id="comment"
                                                                placeholder="Share your experience..."
                                                                value={reviewComment}
                                                                onChange={(e) => setReviewComment(e.target.value)}
                                                                rows={3}
                                                            />
                                                        </div>

                                                        <Button
                                                            onClick={handleSubmitReview}
                                                            disabled={isSubmittingReview || rating < 1}
                                                            className="w-full"
                                                        >
                                                            {isSubmittingReview ? (
                                                                <>
                                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                    Submitting...
                                                                </>
                                                            ) : (
                                                                'Submit Review'
                                                            )}
                                                        </Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        ) : null}
                                    </>
                                ) : (
                                    <Button
                                        onClick={handleMarkComplete}
                                        disabled={isCompleting}
                                        className="w-full"
                                        size="sm"
                                    >
                                        {isCompleting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-4 w-4 mr-2" />
                                                Mark Complete
                                            </>
                                        )}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Safety Tips */}
                        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                            <CardContent className="p-4">
                                <h3 className="font-semibold text-sm mb-2">Safety Tips</h3>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                    <li>• Meet in a safe, public location</li>
                                    <li>• Check the item before payment</li>
                                    <li>• Cash is recommended</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default function ConversationViewPage() {
    return (
        <AuthGuard>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                <ConversationViewPageContent />
            </Suspense>
        </AuthGuard>
    )
}
