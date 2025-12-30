'use client'

/**
 * WebSocket Context Provider
 *
 * Connects to external Socket.io server on Render
 * Provides real-time messaging functionality to all components
 */

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './auth-context'

// ============================================================================
// TYPES
// ============================================================================

interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: Date
  readAt: Date | null
}

interface TypingUser {
  userId: string
  conversationId: string
  isTyping: boolean
  timestamp: Date
}

interface UserOnlineStatus {
  [userId: string]: {
    status: 'ONLINE' | 'AWAY' | 'OFFLINE'
    lastSeenAt: Date
  }
}

interface Offer {
  id: string
  sellPostId: string
  buyerId: string
  price: number
  message?: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'WITHDRAWN'
  createdAt: Date
  updatedAt: Date
}

interface TicketResponse {
  id: string
  ticketId: string
  message: string
  isFromAdmin: boolean
  createdAt: Date
  sender: {
    id: string
    name: string
    email: string
  }
}

interface TicketUpdate {
  ticketId: string
  status: string
  updatedAt: Date
}

interface WebSocketContextType {
  socket: Socket | null
  isConnected: boolean
  onlineStatus: UserOnlineStatus
  typingUsers: TypingUser[]

  // Methods
  // Note: sendMessage is now handled via HTTP API to ensure persistence
  // The HTTP API triggers a webhook broadcast to this Socket.io server
  markAsRead: (conversationId: string, messageIds?: string[]) => void
  joinConversation: (conversationId: string) => void
  leaveConversation: (conversationId: string) => void
  sendTypingStart: (conversationId: string) => void
  sendTypingStop: (conversationId: string) => void

  // Event listeners
  onNewMessage: (callback: (message: Message) => void) => () => void
  onMessageRead: (callback: (data: { conversationId: string; messageIds: string[]; readBy: string }) => void) => () => void
  onUserTyping: (callback: (data: { conversationId: string; userId: string; isTyping: boolean }) => void) => () => void
  onUserStatusChange: (callback: (data: { userId: string; status: 'ONLINE' | 'AWAY' | 'OFFLINE'; lastSeenAt: Date }) => void) => () => void
  onNewOffer: (callback: (data: { sellPostId: string; offer: Offer; sellerId: string }) => void) => () => void
  onOfferUpdated: (callback: (data: { offerId: string; status: string; sellPostId: string; offer: Offer }) => void) => () => void

  // Support ticket events
  onTicketUpdated: (callback: (data: TicketUpdate) => void) => () => void
  onNewTicketResponse: (callback: (data: { ticketId: string; response: TicketResponse }) => void) => () => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

// ============================================================================
// PROVIDER
// ============================================================================

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineStatus, setOnlineStatus] = useState<UserOnlineStatus>({})
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])

  // Cleanup typing indicators after 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      setTypingUsers(prev =>
        prev.filter(t => now.getTime() - t.timestamp.getTime() < 3000)
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Initialize socket connection to external Render server
  useEffect(() => {
    // Only connect if user is authenticated
    if (!user?.id) return

    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || ''
      console.log('NEXT_PUBLIC_WS_URL', process.env.NEXT_PUBLIC_WS_URL)

    // If no WebSocket URL is configured, don't connect (HTTP-only mode)
    if (!socketUrl) {
      console.log('[WebSocket] No NEXT_PUBLIC_WS_URL configured, using HTTP-only mode')
      return
    }

    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10, // More attempts for Render cold starts
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000, // Longer max delay
      timeout: 20000, // Longer timeout for Render cold starts
      auth: {
        userId: user.id
      }
    })

    socketInstance.on('connect', () => {
      console.log('[WebSocket] Connected to Render server:', socketInstance.id)
      setIsConnected(true)
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason)
      setIsConnected(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error)
      setIsConnected(false)
    })

    // Listen for online status changes
    socketInstance.on('user_status_change', (data: { userId: string; status: 'ONLINE' | 'AWAY' | 'OFFLINE'; lastSeenAt: Date }) => {
      setOnlineStatus(prev => ({
        ...prev,
        [data.userId]: {
          status: data.status,
          lastSeenAt: data.lastSeenAt
        }
      }))
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [user?.id]) // Reconnect when user changes

  // Mark messages as read
  const markAsRead = useCallback((conversationId: string, messageIds?: string[]) => {
    if (!socket?.connected) return

    socket.emit('mark_read', { conversationId, messageIds })
  }, [socket])

  // Join conversation room
  const joinConversation = useCallback((conversationId: string) => {
    if (!socket?.connected) return
    socket.emit('join_conversation', conversationId)
  }, [socket])

  // Leave conversation room
  const leaveConversation = useCallback((conversationId: string) => {
    if (!socket?.connected) return
    socket.emit('leave_conversation', conversationId)
  }, [socket])

  // Send typing start
  const sendTypingStart = useCallback((conversationId: string) => {
    if (!socket?.connected) return
    socket.emit('typing_start', { conversationId })
  }, [socket])

  // Send typing stop
  const sendTypingStop = useCallback((conversationId: string) => {
    if (!socket?.connected) return
    socket.emit('typing_stop', { conversationId })
  }, [socket])

  // Register event listeners
  const onNewMessage = useCallback((callback: (message: Message) => void) => {
    if (!socket) return () => {}

    const handler = (data: { conversationId: string; message: Message; senderId: string }) => {
      callback(data.message)
    }

    socket.on('new_message', handler)
    return () => socket.off('new_message', handler)
  }, [socket])

  const onMessageRead = useCallback((callback: (data: { conversationId: string; messageIds: string[]; readBy: string }) => void) => {
    if (!socket) return () => {}

    const handler = callback
    socket.on('message_read', handler)
    return () => socket.off('message_read', handler)
  }, [socket])

  const onUserTyping = useCallback((callback: (data: { conversationId: string; userId: string; isTyping: boolean }) => void) => {
    if (!socket) return () => {}

    const handler = (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      callback(data)

      // Update local typing state
      if (data.isTyping) {
        setTypingUsers(prev => {
          const filtered = prev.filter(t => t.userId !== data.userId)
          return [...filtered, {
            userId: data.userId,
            conversationId: data.conversationId,
            isTyping: true,
            timestamp: new Date()
          }]
        })
      } else {
        setTypingUsers(prev => prev.filter(t => t.userId !== data.userId))
      }
    }

    socket.on('user_typing', handler)
    return () => socket.off('user_typing', handler)
  }, [socket])

  const onUserStatusChange = useCallback((callback: (data: { userId: string; status: 'ONLINE' | 'AWAY' | 'OFFLINE'; lastSeenAt: Date }) => void) => {
    if (!socket) return () => {}

    const handler = callback
    socket.on('user_status_change', handler)
    return () => socket.off('user_status_change', handler)
  }, [socket])

  const onNewOffer = useCallback((callback: (data: { sellPostId: string; offer: Offer; sellerId: string }) => void) => {
    if (!socket) return () => {}

    const handler = callback
    socket.on('new_offer', handler)
    return () => socket.off('new_offer', handler)
  }, [socket])

  const onOfferUpdated = useCallback((callback: (data: { offerId: string; status: string; sellPostId: string; offer: Offer }) => void) => {
    if (!socket) return () => {}

    const handler = callback
    socket.on('offer_updated', handler)
    return () => socket.off('offer_updated', handler)
  }, [socket])

  // Support ticket event listeners
  const onTicketUpdated = useCallback((callback: (data: TicketUpdate) => void) => {
    if (!socket) return () => {}

    const handler = (data: TicketUpdate) => callback(data)
    socket.on('ticket_updated', handler)
    return () => socket.off('ticket_updated', handler)
  }, [socket])

  const onNewTicketResponse = useCallback((callback: (data: { ticketId: string; response: TicketResponse }) => void) => {
    if (!socket) return () => {}

    const handler = (data: { ticketId: string; response: TicketResponse }) => callback(data)
    socket.on('new_ticket_response', handler)
    return () => socket.off('new_ticket_response', handler)
  }, [socket])

  const value: WebSocketContextType = {
    socket,
    isConnected,
    onlineStatus,
    typingUsers,
    markAsRead,
    joinConversation,
    leaveConversation,
    sendTypingStart,
    sendTypingStop,
    onNewMessage,
    onMessageRead,
    onUserTyping,
    onUserStatusChange,
    onNewOffer,
    onOfferUpdated,
    onTicketUpdated,
    onNewTicketResponse
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

// ============================================================================
// HOOK
// ============================================================================

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider')
  }
  return context
}
