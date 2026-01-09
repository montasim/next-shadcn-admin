'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MDXViewer } from '@/components/ui/mdx-viewer'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Send, Bot, Sparkles, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { Book } from '@/hooks/use-book'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

type ExtractionStatus = 'checking' | 'ready' | 'processing' | 'failed'

interface BookChatModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  book: Book
}

/**
 * Chat modal for asking AI questions about a book
 * Displays conversation history and allows follow-up questions
 * Shows user guide when no messages are present
 */
export function BookChatModal({ open, onOpenChange, book }: BookChatModalProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<any[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus>('checking')
  const [extractionProgress, setExtractionProgress] = useState<string>('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const streamingContentRef = useRef<string>('')
  const streamingMessageIndexRef = useRef<number>(-1)

  // Helper functions defined first to avoid "before initialization" errors
  const scrollToBottom = useCallback(() => {
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    })
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Check extraction status when modal opens and fetch chat history
  useEffect(() => {
    if (!open) {
      // Reset state when closing
      setExtractionStatus('checking')
      setExtractionProgress('')
      setMessages([])
      setConversationHistory([])
      setSessionId(null)
      return
    }

    // Only proceed for EBOOK and AUDIO types
    if (book.type !== 'EBOOK' && book.type !== 'AUDIO') {
      setExtractionStatus('failed')
      setExtractionProgress('Chat is only available for ebooks and audiobooks.')
      return
    }

    // Fetch chat history and check extraction status
    const initializeChat = async () => {
      try {
        // Fetch chat history in parallel with extraction status check
        const [chatResponse, extractResponse] = await Promise.all([
          fetch(`/api/books/${book.id}/chat`),
          fetch(`/api/books/${book.id}/extract-content`)
        ])

        const chatData = await chatResponse.json()
        const extractData = await extractResponse.json()

        // Load chat history if available
        if (chatData.sessionId && chatData.conversationHistory && chatData.conversationHistory.length > 0) {
          setSessionId(chatData.sessionId)
          setConversationHistory(chatData.conversationHistory)
          setMessages(chatData.conversationHistory.map((m: any) => ({
            role: m.role,
            content: m.content,
            timestamp: new Date(m.timestamp)
          })))
          // Scroll to bottom after loading history
          setTimeout(() => scrollToBottom(), 50)
        }

        // Check extraction status
        if (extractData.hasContent) {
          setExtractionStatus('ready')
          setExtractionProgress(`Book content ready (${extractData.wordCount?.toLocaleString()} words, ${extractData.pageCount} pages)`)
        } else {
          setExtractionStatus('processing')
          setExtractionProgress('Preparing book content for AI chat...')

          // Poll every 2 seconds until ready
          const pollInterval = setInterval(async () => {
            try {
              const pollResponse = await fetch(`/api/books/${book.id}/extract-content`)
              const pollData = await pollResponse.json()

              if (pollData.hasContent) {
                setExtractionStatus('ready')
                setExtractionProgress(`Book content ready! (${pollData.wordCount?.toLocaleString()} words, ${pollData.pageCount} pages)`)
                clearInterval(pollInterval)
              }
            } catch (error) {
              console.error('Error polling extraction status:', error)
              clearInterval(pollInterval)
              setExtractionStatus('failed')
              setExtractionProgress('Failed to check content status.')
            }
          }, 2000)

          // Cleanup interval on unmount
          return () => clearInterval(pollInterval)
        }
      } catch (error) {
        console.error('Error initializing chat:', error)
        setExtractionStatus('failed')
        setExtractionProgress('Unable to initialize chat.')
      }
    }

    initializeChat()
  }, [open, book.id, book.type])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    const previousMessages = [...messages]
    streamingContentRef.current = ''
    streamingMessageIndexRef.current = messages.length + 1

    setMessages(prev => [...prev, userMessage])
    setInputValue('')

    // Immediately add assistant message with streaming flag
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }])
    setIsLoading(true)

    try {
      // Use streaming endpoint
      const response = await fetch(`/api/books/${book.id}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory,
          sessionId
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to send message')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''
      let fullResponse = ''
      let currentSessionId = sessionId

      // Parse SSE stream
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue

          const data = trimmed.slice(5).trim()

          if (!data) continue

          try {
            const parsed = JSON.parse(data)

            if (parsed.type === 'start') {
              // Update sessionId from stream
              if (parsed.sessionId) {
                currentSessionId = parsed.sessionId
                setSessionId(parsed.sessionId)
              }
            } else if (parsed.type === 'chunk') {
              // Append chunk to current message and update immediately
              fullResponse += parsed.content
              streamingContentRef.current = fullResponse

              // Update UI immediately for each chunk
              setMessages(prev => {
                const updated = [...prev]
                const idx = streamingMessageIndexRef.current
                if (idx >= 0 && idx < updated.length && updated[idx]?.role === 'assistant') {
                  updated[idx] = {
                    ...updated[idx],
                    content: fullResponse
                  }
                }
                return updated
              })
              scrollToBottom()
            } else if (parsed.type === 'done') {
              // Stream complete, update with final metadata
              setSessionId(currentSessionId)
              setConversationHistory([
                ...conversationHistory,
                { role: 'user', content: userMessage.content },
                { role: 'assistant', content: fullResponse }
              ])

              // Final update to ensure all content is displayed
              setMessages(prev => {
                const updated = [...prev]
                const idx = streamingMessageIndexRef.current
                if (idx >= 0 && idx < updated.length && updated[idx]?.role === 'assistant') {
                  updated[idx] = {
                    ...updated[idx],
                    content: fullResponse,
                    isStreaming: false
                  }
                }
                return updated
              })
            } else if (parsed.type === 'error') {
              throw new Error(parsed.error || 'Stream error')
            }
          } catch (e) {
            // Skip invalid JSON
            console.debug('Failed to parse SSE data:', data)
          }
        }
      }

      scrollToBottom()
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message. Please try again.',
        variant: 'destructive'
      })
      // Restore previous messages on error
      setMessages(previousMessages)
    } finally {
      setIsLoading(false)
      streamingContentRef.current = ''
      streamingMessageIndexRef.current = -1
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!user) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full sm:max-w-2xl flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b text-left">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Chat about &quot;{book.name}&quot;
          </SheetTitle>
          <SheetDescription>
            Ask questions about this book. AI answers based on the book&apos;s content.
          </SheetDescription>
        </SheetHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          <div className="space-y-6">
            {/* Extraction Status Indicator */}
            {extractionStatus !== 'ready' && (
              <div className={cn(
                "flex items-start gap-3 p-4 rounded-lg border",
                extractionStatus === 'processing' && "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
                extractionStatus === 'failed' && "bg-destructive/10 border-destructive/20",
                extractionStatus === 'checking' && "bg-muted/50"
              )}>
                {extractionStatus === 'processing' && (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                )}
                {extractionStatus === 'failed' && (
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                )}
                {extractionStatus === 'checking' && (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 space-y-1">
                  <p className={cn(
                    "text-sm font-medium",
                    extractionStatus === 'processing' && "text-blue-900 dark:text-blue-100",
                    extractionStatus === 'failed' && "text-destructive"
                  )}>
                    {extractionStatus === 'processing' && "Preparing Book Content"}
                    {extractionStatus === 'failed' && "Content Preparation Failed"}
                    {extractionStatus === 'checking' && "Checking..."}
                  </p>
                  {extractionProgress && (
                    <p className={cn(
                      "text-xs",
                      extractionStatus === 'processing' && "text-blue-700 dark:text-blue-300",
                      extractionStatus === 'failed' && "text-destructive/80"
                    )}>
                      {extractionProgress}
                    </p>
                  )}
                  {extractionStatus === 'processing' && (
                    <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-2">
                      This one-time process may take 30-60 seconds. The book content will be cached for all users.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* User Guide */}
            {messages.length === 0 && extractionStatus === 'ready' && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">How to use AI Chat</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Ask me anything about this book! Here are some examples:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>What are the main themes of this book?</li>
                    <li>Explain the key concepts from chapter 3</li>
                    <li>Who are the main characters and their relationships?</li>
                    <li>What did the author say about [topic]?</li>
                    <li>Summarize the book's conclusion</li>
                  </ul>
                  <p className="text-xs mt-3">AI answers based on this book&apos;s content only. Responses may not be 100% accurate.</p>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message, index) => {
              return (
                <div
                  key={index}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-lg px-4 py-3 max-w-[80%]",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {message.role === 'assistant' ? (
                      !message.content ? (
                        // Show typing indicator while waiting for first chunk
                        <div className="flex items-center gap-1 h-5">
                          <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
                        </div>
                      ) : message.isStreaming ? (
                        // Show plain text during streaming to avoid markdown re-parsing flicker
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        // Show full markdown rendering when complete
                        <MDXViewer
                          content={message.content}
                          className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none
                            prose-headings:font-bold prose-headings:mb-2 prose-headings:mt-4
                            prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
                            prose-p:mb-2 prose-p:last:mb-0
                            prose-ul:mb-3 prose-ml-6 prose-list-disc prose-ul:list-outside
                            prose-ol:mb-3 prose-ml-6 prose-list-decimal prose-ol:list-outside
                            prose-li:my-1 prose-li:marker:text-muted-foreground
                            prose-strong:font-semibold
                            prose-em:italic
                            prose-code:bg-muted-foreground/20 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                            prose-pre:bg-muted-foreground/10 prose-pre:p-2 prose-pre:rounded prose-pre:text-sm prose-pre:overflow-x-auto
                            prose-blockquote:border-l-4 prose-blockquote:border-muted-foreground/30 prose-blockquote:pl-3 prose-blockquote:italic
                            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                          "
                        />
                      )
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    )}
                    <p className={cn(
                      "text-xs mt-1 opacity-70",
                      message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}>
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary-foreground">
                        {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                extractionStatus === 'processing'
                  ? "Please wait while book content is being prepared..."
                  : extractionStatus === 'failed'
                  ? "Content preparation failed. Please try again later."
                  : extractionStatus === 'checking'
                  ? "Checking book content..."
                  : "Ask a question about this book..."
              }
              disabled={isLoading || extractionStatus !== 'ready'}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim() || extractionStatus !== 'ready'}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            AI only answers from this book&apos;s content. Responses may not be 100% accurate.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
