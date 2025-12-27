'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
 * Shows progress indicator while book content is being extracted
 */
export function BookChatModal({ open, onOpenChange, book }: BookChatModalProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<any[]>([])
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus>('checking')
  const [extractionProgress, setExtractionProgress] = useState<string>('')
  const [suggestedQuestions, setSuggestedQuestions] = useState<Array<{id: string, question: string}>>([])
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Helper functions defined first to avoid "before initialization" errors
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }, [])

  const handleInitialChat = useCallback(async () => {
    if (!user) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/books/${book.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generatePrefilled: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start chat')
      }

      const data = await response.json()

      // Get the actual user query that was generated
      const userQuery = data.conversationHistory[0]?.content || 'Tell me about this book...'

      setMessages([
        {
          role: 'user',
          content: userQuery,
          timestamp: new Date()
        },
        {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }
      ])

      setConversationHistory(data.conversationHistory)
      scrollToBottom()
    } catch (error: any) {
      console.error('Error starting chat:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to start chat. Please try again.',
        variant: 'destructive'
      })
      setMessages([
        {
          role: 'assistant',
          content: 'Sorry, I couldn\'t start the chat. Please make sure you have access to this book and try again.',
          timestamp: new Date()
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }, [user, book.id, scrollToBottom])

  const fetchSuggestedQuestions = useCallback(async () => {
    try {
      const response = await fetch(`/api/books/${book.id}/suggested-questions`)
      const data = await response.json()

      if (data.questions && data.questions.length > 0) {
        setSuggestedQuestions(data.questions)
      }
    } catch (error) {
      console.error('Failed to fetch suggested questions:', error)
    }
  }, [book.id])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Check extraction status when modal opens
  useEffect(() => {
    if (!open) {
      // Reset state when closing
      setExtractionStatus('checking')
      setExtractionProgress('')
      return
    }

    // Only proceed for EBOOK and AUDIO types
    if (book.type !== 'EBOOK' && book.type !== 'AUDIO') {
      setExtractionStatus('failed')
      setExtractionProgress('Chat is only available for ebooks and audiobooks.')
      return
    }

    // Check extraction status
    const checkExtractionStatus = async () => {
      try {
        const response = await fetch(`/api/books/${book.id}/extract-content`)
        const data = await response.json()

        if (data.hasContent) {
          setExtractionStatus('ready')
          setExtractionProgress(`Book content ready (${data.wordCount?.toLocaleString()} words, ${data.pageCount} pages)`)
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

                // Auto-start chat when ready
                if (messages.length === 0 && user) {
                  handleInitialChat()
                }
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
        console.error('Error checking extraction status:', error)
        setExtractionStatus('failed')
        setExtractionProgress('Unable to check book content status.')
      }
    }

    checkExtractionStatus()
  }, [open, book.id, book.type, handleInitialChat, messages.length, user])

  // Generate pre-filled query on first open (only when content is ready)
  useEffect(() => {
    if (open && messages.length === 0 && user && extractionStatus === 'ready') {
      handleInitialChat()
    }
  }, [open, extractionStatus, user, messages.length, handleInitialChat])

  // Fetch suggested questions when extraction is ready
  useEffect(() => {
    if (open && extractionStatus === 'ready') {
      fetchSuggestedQuestions()
    }
  }, [open, extractionStatus, fetchSuggestedQuestions])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const previousMessages = [...messages, userMessage]
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch(`/api/books/${book.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      const data = await response.json()

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }])

      setConversationHistory(data.conversationHistory)
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
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleQuestionClick = (question: string) => {
    setInputValue(question)
    // Focus the input after setting the value
    setTimeout(() => {
      const input = document.querySelector('input[type="text"]') as HTMLInputElement
      input?.focus()
    }, 100)
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

            {/* Suggested Questions */}
            {extractionStatus === 'ready' && suggestedQuestions.length > 0 && messages.length === 0 && !isLoading && (
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Suggested questions
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.slice(0, 6).map((sq) => (
                    <Button
                      key={sq.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuestionClick(sq.question)}
                      className="text-left justify-start h-auto py-2 px-3 text-xs"
                    >
                      {sq.question}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.length === 0 && isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <Bot className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                    </div>
                  </div>
                  <p className="text-muted-foreground">AI is analyzing the book...</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
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
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
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
              ))
            )}
            {isLoading && messages.length > 0 && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
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
