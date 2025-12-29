'use client'

/**
 * useConversationSocket Hook
 *
 * Connects to external Socket.io server on Render
 * Manages real-time messaging for a specific conversation
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { useWebSocket } from '@/context/websocket-context'
import { useAuth } from '@/context/auth-context'

interface UseConversationSocketOptions {
  conversationId: string
  onNewMessage?: (message: any) => void
  onMessageRead?: (data: { messageIds: string[]; readBy: string }) => void
  onTypingChange?: (isTyping: boolean) => void
}

export function useConversationSocket({
  conversationId,
  onNewMessage,
  onMessageRead,
  onTypingChange
}: UseConversationSocketOptions) {
  const { user } = useAuth()
  const ws = useWebSocket()

  const [isTyping, setIsTyping] = useState(false)
  const [otherUserId, setOtherUserId] = useState<string | null>(null)
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false)

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const cleanupNewMessage = useRef<(() => void) | null>(null)
  const cleanupMessageRead = useRef<(() => void) | null>(null)
  const cleanupTyping = useRef<(() => void) | null>(null)
  const cleanupStatus = useRef<(() => void) | null>(null)

  // Join conversation when mounted
  useEffect(() => {
    if (!ws.isConnected || !conversationId) return

    ws.joinConversation(conversationId)

    return () => {
      ws.leaveConversation(conversationId)
    }
  }, [ws.isConnected, conversationId, ws.joinConversation, ws.leaveConversation])

  // Setup event listeners
  useEffect(() => {
    if (!ws.socket || !conversationId) return

    // New message listener
    cleanupNewMessage.current = ws.onNewMessage((message) => {
      if (message.conversationId === conversationId) {
        onNewMessage?.(message)
      }
    })

    // Message read listener
    cleanupMessageRead.current = ws.onMessageRead((data) => {
      if (data.conversationId === conversationId) {
        onMessageRead?.(data)
      }
    })

    // Typing listener
    cleanupTyping.current = ws.onUserTyping((data) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        setIsTyping(data.isTyping)
        onTypingChange?.(data.isTyping)
      }
    })

    // Status change listener
    cleanupStatus.current = ws.onUserStatusChange((data) => {
      if (data.userId === otherUserId) {
        setIsOtherUserOnline(data.status === 'ONLINE')
      }
    })

    return () => {
      cleanupNewMessage.current?.()
      cleanupMessageRead.current?.()
      cleanupTyping.current?.()
      cleanupStatus.current?.()
    }
  }, [ws.socket, conversationId, otherUserId, user?.id, ws, onNewMessage, onMessageRead, onTypingChange])

  // Send typing indicator with debouncing
  const sendTypingStart = useCallback(() => {
    if (!ws.isConnected) return

    ws.sendTypingStart(conversationId)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      ws.sendTypingStop(conversationId)
    }, 3000)
  }, [ws, conversationId, ws.sendTypingStart, ws.sendTypingStop])

  const sendTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    ws.sendTypingStop(conversationId)
  }, [ws, conversationId, ws.sendTypingStop])

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    await ws.sendMessage(conversationId, content)
    sendTypingStop()
  }, [ws.sendMessage, conversationId, sendTypingStop])

  // Mark as read
  const markAsRead = useCallback(() => {
    ws.markAsRead(conversationId)
  }, [ws.markAsRead, conversationId])

  return {
    isConnected: ws.isConnected,
    isTyping,
    isOtherUserOnline,
    sendMessage,
    markAsRead,
    sendTypingStart,
    sendTypingStop
  }
}
