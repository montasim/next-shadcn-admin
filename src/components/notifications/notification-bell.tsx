'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bell, Loader2, Check, Trash2, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from '@/lib/utils'
import Link from 'next/link'

// ============================================================================
// TYPES
// ============================================================================

interface Notification {
    id: string
    type: string
    title: string
    message: string
    linkUrl?: string | null
    isRead: boolean
    readAt: Date | null
    createdAt: Date
}

interface NotificationsResponse {
    success: boolean
    data: {
        notifications: Notification[]
        unreadCount: number
    }
}

// ============================================================================
// CONSTANTS
// ============================================================================

const NOTIFICATION_ICONS: Record<string, string> = {
    NEW_MESSAGE: '💬',
    NEW_OFFER: '💰',
    OFFER_ACCEPTED: '✅',
    OFFER_REJECTED: '❌',
    OFFER_COUNTERED: '🔄',
    TRANSACTION_COMPLETE: '🤝',
    NEW_REVIEW: '⭐',
    POST_APPROVED: '✅',
    POST_REJECTED: '❌',
    MARKETPLACE_UPDATE: '📢',
}

// ============================================================================
// COMPONENT
// ============================================================================

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications()
        }
    }, [isOpen])

    // Poll for unread count every 30 seconds
    useEffect(() => {
        const pollUnreadCount = async () => {
            try {
                const response = await fetch('/api/user/notifications?unreadOnly=true&limit=1')
                const result: NotificationsResponse = await response.json()
                if (result.success) {
                    setUnreadCount(result.data.unreadCount)
                }
            } catch (error) {
                console.error('Failed to fetch unread count:', error)
            }
        }

        // Initial fetch
        pollUnreadCount()

        // Poll every 30 seconds
        const interval = setInterval(pollUnreadCount, 30000)

        return () => clearInterval(interval)
    }, [])

    const fetchNotifications = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/user/notifications?limit=10')
            const result: NotificationsResponse = await response.json()

            if (result.success) {
                setNotifications(result.data.notifications)
                setUnreadCount(result.data.unreadCount)
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const markAsRead = async (notificationId: string) => {
        try {
            await fetch(`/api/user/notifications/${notificationId}`, {
                method: 'PATCH',
            })

            setNotifications(notifications.map(n =>
                n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
            ))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error('Failed to mark as read:', error)
        }
    }

    const markAllAsRead = async () => {
        try {
            await fetch('/api/user/notifications', {
                method: 'PATCH',
            })

            setNotifications(notifications.map(n => ({ ...n, isRead: true, readAt: new Date() })))
            setUnreadCount(0)
        } catch (error) {
            console.error('Failed to mark all as read:', error)
        }
    }

    const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()

        try {
            await fetch(`/api/user/notifications/${notificationId}`, {
                method: 'DELETE',
            })

            setNotifications(notifications.filter(n => n.id !== notificationId))
            if (notifications.find(n => n.id === notificationId)?.isRead === false) {
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
        } catch (error) {
            console.error('Failed to delete notification:', error)
        }
    }

    const clearAll = async () => {
        try {
            await fetch('/api/user/notifications', {
                method: 'DELETE',
            })

            setNotifications([])
            setUnreadCount(0)
        } catch (error) {
            console.error('Failed to clear notifications:', error)
        }
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {notifications.length > 0 && (
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-1 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        markAllAsRead()
                                    }}
                                >
                                    <CheckCheck className="h-4 w-4 mr-1" />
                                    Mark all read
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-1 text-xs text-destructive"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    clearAll()
                                }}
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Clear
                            </Button>
                        </div>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-20">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-8 px-4">
                            <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">No notifications yet</p>
                        </div>
                    ) : (
                        <DropdownMenuGroup>
                            {notifications.map((notification) => {
                                const icon = NOTIFICATION_ICONS[notification.type] || '🔔'

                                const content = (
                                    <div
                                        key={notification.id}
                                        className={`flex flex-col items-start p-3 ${
                                            !notification.isRead ? 'bg-muted/50' : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-2 w-full">
                                            <span className="text-lg">{icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <p className="font-medium text-sm">{notification.title}</p>
                                                    {!notification.isRead && (
                                                        <span className="h-2 w-2 rounded-full bg-primary" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatDistanceToNow(new Date(notification.createdAt))}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {!notification.isRead && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            markAsRead(notification.id)
                                                        }}
                                                    >
                                                        <Check className="h-3 w-3" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-destructive"
                                                    onClick={(e) => deleteNotification(notification.id, e)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )

                                if (notification.linkUrl) {
                                    return (
                                        <Link
                                            key={notification.id}
                                            href={notification.linkUrl}
                                            onClick={() => {
                                                if (!notification.isRead) {
                                                    markAsRead(notification.id)
                                                }
                                                setIsOpen(false)
                                            }}
                                        >
                                            <DropdownMenuItem
                                                className={`flex flex-col items-start p-0 ${
                                                    !notification.isRead ? 'bg-muted/50' : ''
                                                }`}
                                                asChild={false}
                                                onSelect={(e) => e.preventDefault()}
                                            >
                                                {content}
                                            </DropdownMenuItem>
                                        </Link>
                                    )
                                }

                                return (
                                    <DropdownMenuItem
                                        key={notification.id}
                                        className={`flex flex-col items-start p-0 ${
                                            !notification.isRead ? 'bg-muted/50' : ''
                                        }`}
                                        asChild={false}
                                        onSelect={(e) => e.preventDefault()}
                                    >
                                        {content}
                                    </DropdownMenuItem>
                                )
                            })}
                        </DropdownMenuGroup>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
