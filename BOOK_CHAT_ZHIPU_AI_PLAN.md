# Book Chat with AI - Zhipu AI Implementation Plan

## Overview
Add "Chat with AI" feature to book detail pages using **Zhipu AI (GLM-4)** model. Users can ask questions about ebooks and audiobooks, and the AI answers based on the book's content using RAG.

---

## AI Provider: Zhipu AI (GLM-4)

### Why Zhipu AI?
- Already configured in your project
- GLM-4 supports large context windows (up to 128K tokens)
- Cost-effective alternative to OpenAI
- Chinese-optimized (great for mixed content)

### Existing Infrastructure
Your project already has:
- Zhipu AI API key configuration
- JWT token generation for authentication
- Fetch-based API integration pattern

---

## Implementation Architecture

### System Components
```
┌─────────────────────────────────────────────────────┐
│  Book Detail Page (/books/[id])                      │
│  - "Chat with AI" button (EBOOK/AUDIO only)          │
└───────────────────┬─────────────────────────────────┘
                    │ User clicks
                    ↓
┌─────────────────────────────────────────────────────┐
│  Chat Modal                                          │
│  - Pre-filled query about the book                  │
│  - Message history                                  │
│  - Input field                                      │
└───────────────────┬─────────────────────────────────┘
                    │ User sends message
                    ↓
┌─────────────────────────────────────────────────────┐
│  API: POST /api/books/[id]/chat                     │
│  - Receives message + book ID                        │
│  - Fetches book PDF                                  │
│  - Extracts relevant content                         │
│  - Calls Zhipu AI                                    │
└───────────────────┬─────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────┐
│  Zhipu AI (GLM-4)                                   │
│  - Processes question + book content                │
│  - Generates answer                                  │
│  - Returns response                                  │
└─────────────────────────────────────────────────────┘
```

---

## Phase 1: Zhipu AI Service Layer

### 1.1 Token Generation (Based on Your Existing Code)

**File:** `src/lib/ai/zhipu.ts`

```typescript
import * as jose from "jose";

export async function generateZhipuToken(apiKey: string) {
  const [id, secret] = apiKey.split(".");
  const timestamp = Date.now();
  const payload = {
    api_key: id,
    exp: timestamp + 3600000, // 1 hour
    timestamp: timestamp,
  };
  const secretKey = new TextEncoder().encode(secret);
  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", sign_type: "SIGN" })
    .sign(secretKey);
  return token;
}
```

### 1.2 PDF Content Extraction

**File:** `src/lib/ai/pdf-extractor.ts`

```typescript
import pdf from 'pdf-parse';

export async function extractPdfContent(pdfUrl: string, maxPages?: number): Promise<{
  fullText: string;
  pages: Array<{ pageNumber: number; content: string }>;
}> {
  // Fetch PDF from URL (use proxy if needed)
  const response = await fetch(pdfUrl);
  const buffer = Buffer.from(await response.arrayBuffer());

  // Extract text from PDF
  const data = await pdf(buffer);
  const fullText = data.text;

  // Split by pages (if page info available)
  const pages = data.text
    .split(/\f/) // Form feed character separates pages
    .map((content, index) => ({
      pageNumber: index + 1,
      content: content.trim()
    }))
    .filter(p => p.content.length > 0)
    .slice(0, maxPages); // Limit pages for context

  return { fullText, pages };
}

/**
 * Extract relevant content based on query
 * Uses simple keyword matching to find relevant pages
 */
export async function extractRelevantContent(
  pdfUrl: string,
  query: string,
  maxPages: number = 10
): Promise<string> {
  const { pages } = await extractPdfContent(pdfUrl);

  // Extract keywords from query
  const keywords = query
    .toLowerCase()
    .replace(/[?.,!]/g, '')
    .split(' ')
    .filter(w => w.length > 3);

  // Score pages by keyword matches
  const scoredPages = pages.map(page => {
    const pageLower = page.content.toLowerCase();
    let score = 0;

    keywords.forEach(keyword => {
      const matches = (pageLower.match(new RegExp(keyword, 'g')) || []).length;
      score += matches;
    });

    return { ...page, score };
  })
  .sort((a, b) => b.score - a.score)
  .slice(0, maxPages);

  // Combine relevant page content
  return scoredPages
    .map((p, i) => `[Page ${p.pageNumber}]\n${p.content}`)
    .join('\n\n---\n\n');
}
```

### 1.3 Pre-filled Query Generator

**File:** `src/lib/ai/query-generator.ts`

```typescript
import { Book } from '@/hooks/use-book';

export async function generatePreFilledQuery(book: Book): Promise<string> {
  const authors = book.authors.map(a => a.name).join(' & ');
  const categories = book.categories.map(c => c.name).join(', ');

  // Generate intelligent query based on book metadata
  const queryTemplates = [
    `Can you give me an overview of "${book.name}" by ${authors}? What are the main themes and key concepts?`,
    `What are the most important takeaways from "${book.name}" by ${authors}?`,
    `Summarize the core ideas in "${book.name}" by ${authors}. What makes this ${categories.join(' / ')} book unique?`,
    `I'd like to understand "${book.name}" better. Can you explain the main arguments and concepts presented by ${authors}?`
  ];

  // Select template based on book type and categories
  const index = (book.name.length + authors.length) % queryTemplates.length;

  return queryTemplates[index];
}
```

### 1.4 Zhipu AI Chat Service

**File:** `src/lib/ai/zhipu-chat.ts`

```typescript
import { generateZhipuToken } from './zhipu';
import { extractRelevantContent } from './pdf-extractor';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  bookId: string;
  bookName: string;
  bookType: string;
  pdfUrl: string;
  authors: string[];
  categories: string[];
  messages: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export async function chatWithZhipuAI(request: ChatRequest): Promise<ChatResponse> {
  const apiKey = process.env.ZHIPU_AI_API_KEY;
  if (!apiKey) throw new Error("ZHIPU_AI_API_KEY is not set");

  const token = await generateZhipuToken(apiKey);

  // Extract relevant content from PDF for context
  const lastUserMessage = request.messages.filter(m => m.role === 'user').pop();
  let bookContent = '';

  if (lastUserMessage) {
    try {
      bookContent = await extractRelevantContent(
        request.pdfUrl,
        lastUserMessage.content,
        15 // Max 15 pages for context
      );
    } catch (error) {
      console.error('Error extracting PDF content:', error);
      // Fallback to summary if PDF extraction fails
      bookContent = '[Book content unavailable. Please try again.]';
    }
  }

  // Build system prompt
  const authors = request.authors.join(', ');
  const categories = request.categories.join(', ');

  const systemPrompt = `You are a knowledgeable AI assistant specializing in book analysis for a library application called Haseeb.

Your task is to answer questions about the book "${request.bookName}" by ${authors} (${categories}).

**IMPORTANT RULES:**
1. Base ALL answers ONLY on the book content provided below
2. If the answer cannot be found in the book content, say so clearly
3. Provide specific examples and quotes from the book when possible
4. Mention page numbers when referencing specific content
5. Be concise but thorough in your explanations
6. If the user asks for information not in the book, politely redirect to what IS covered

**BOOK CONTENT:**
${bookContent}

**BOOK METADATA:**
- Title: ${request.bookName}
- Authors: ${authors}
- Categories: ${categories}
- Type: ${request.bookType}

Respond in a helpful, conversational manner.`;

  // Prepare messages for API
  const apiMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...request.messages
  ];

  // Call Zhipu AI API
  const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      model: "glm-4", // or "glm-4-plus" for better quality
      messages: apiMessages,
      temperature: 0.3, // Lower for more factual responses
      top_p: 0.7,
      max_tokens: 2000,
      stream: false
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zhipu AI API error: ${error}`);
  }

  const data = await response.json();

  return {
    response: data.choices[0].message.content,
    model: data.model,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens
    }
  };
}

/**
 * Streaming version for real-time responses (optional enhancement)
 */
export async function* chatWithZhipuAIStream(request: ChatRequest): AsyncGenerator<string> {
  const apiKey = process.env.ZHIPU_AI_API_KEY;
  if (!apiKey) throw new Error("ZHIPU_AI_API_KEY is not set");

  const token = await generateZhipuToken(apiKey);

  // Extract relevant content from PDF for context
  const lastUserMessage = request.messages.filter(m => m.role === 'user').pop();
  let bookContent = '';

  if (lastUserMessage) {
    try {
      bookContent = await extractRelevantContent(request.pdfUrl, lastUserMessage.content, 15);
    } catch (error) {
      console.error('Error extracting PDF content:', error);
      bookContent = '[Book content unavailable. Please try again.]';
    }
  }

  const authors = request.authors.join(', ');
  const categories = request.categories.join(', ');

  const systemPrompt = `You are a knowledgeable AI assistant specializing in book analysis for a library application called Haseeb.

Your task is to answer questions about the book "${request.bookName}" by ${authors} (${categories}).

**IMPORTANT RULES:**
1. Base ALL answers ONLY on the book content provided below
2. If the answer cannot be found in the book content, say so clearly
3. Provide specific examples and quotes from the book when possible
4. Mention page numbers when referencing specific content
5. Be concise but thorough in your explanations

**BOOK CONTENT:**
${bookContent}

Respond in a helpful, conversational manner.`;

  const apiMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...request.messages
  ];

  const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      model: "glm-4",
      messages: apiMessages,
      temperature: 0.3,
      top_p: 0.7,
      max_tokens: 2000,
      stream: true
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zhipu AI API error: ${error}`);
  }

  // Process streaming response
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No reader available');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content;
          if (content) yield content;
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}
```

---

## Phase 2: API Routes

### 2.1 Chat API Route

**File:** `src/app/api/books/[id]/chat/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { chatWithZhipuAI } from '@/lib/ai/zhipu-chat';
import { generatePreFilledQuery } from '@/lib/ai/query-generator';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const bookId = params.id;
    const body = await request.json();

    const {
      message,
      conversationHistory = [],
      generatePrefilled = false
    } = body;

    // Fetch book details
    const bookResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/public/books/${bookId}`);
    if (!bookResponse.ok) {
      throw new Error('Book not found');
    }

    const bookData = await bookResponse.json();
    const book = bookData.data.book;

    // Verify it's an ebook or audiobook
    if (book.type !== 'EBOOK' && book.type !== 'AUDIO') {
      return NextResponse.json(
        { error: 'Chat is only available for ebooks and audiobooks' },
        { status: 400 }
      );
    }

    // Check if user has access
    const userAccess = bookData.data.userAccess;
    if (!userAccess?.canAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this book' },
        { status: 403 }
      );
    }

    // Prepare messages
    let messages = conversationHistory;

    // Generate pre-filled query for first message
    if (generatePrefilled || messages.length === 0) {
      const preFilledQuery = await generatePreFilledQuery(book);
      messages = [
        { role: 'user', content: preFilledQuery }
      ];
    } else if (message) {
      messages.push({ role: 'user', content: message });
    }

    // Call Zhipu AI
    const result = await chatWithZhipuAI({
      bookId: book.id,
      bookName: book.name,
      bookType: book.type,
      pdfUrl: book.fileUrl,
      authors: book.authors.map((a: any) => a.name),
      categories: book.categories.map((c: any) => c.name),
      messages
    });

    // Add assistant response to history
    messages.push({ role: 'assistant', content: result.response });

    return NextResponse.json({
      response: result.response,
      conversationHistory: messages,
      usage: result.usage
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

// Optional: Streaming endpoint
export async function GET(request: NextRequest, { params }: RouteContext) {
  // Can implement SSE or other streaming protocol here
  return NextResponse.json({ message: 'Use POST for chat' });
}
```

---

## Phase 3: Frontend Components

### 3.1 Chat Button Component

**File:** `src/components/books/book-chat-button.tsx`

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { Book } from '@/hooks/use-book'

interface BookChatButtonProps {
  book: Book
  onClick: () => void
}

export function BookChatButton({ book, onClick }: BookChatButtonProps) {
  const { user } = useAuth()

  // Only show for ebooks/audiobooks and authenticated users with access
  const shouldShow = user &&
    (book.type === 'EBOOK' || book.type === 'AUDIO') &&
    book.fileUrl &&
    book.canAccess

  if (!shouldShow) {
    return null
  }

  return (
    <Button
      variant="outline"
      size="default"
      onClick={onClick}
      className="gap-2"
    >
      <MessageSquare className="h-4 w-4" />
      Chat with AI
    </Button>
  )
}
```

### 3.2 Chat Modal Component

**File:** `src/components/books/book-chat-modal.tsx`

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Send, MessageSquare, Bot } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { Book } from '@/hooks/use-book'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface BookChatModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  book: Book
}

export function BookChatModal({ open, onOpenChange, book }: BookChatModalProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<any[]>([])
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Generate pre-filled query on first open
  useEffect(() => {
    if (open && messages.length === 0 && user) {
      handleInitialChat()
    }
  }, [open])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleInitialChat = async () => {
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
        throw new Error('Failed to start chat')
      }

      const data = await response.json()

      setMessages([
        {
          role: 'user',
          content: conversationHistory[0]?.content || 'Tell me about this book...',
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
    } catch (error) {
      console.error('Error starting chat:', error)
      setMessages([
        {
          role: 'assistant',
          content: 'Sorry, I couldn\'t start the chat. Please try again.',
          timestamp: new Date()
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
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
        throw new Error('Failed to send message')
      }

      const data = await response.json()

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }])

      setConversationHistory(data.conversationHistory)
      scrollToBottom()
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I couldn\'t process your message. Please try again.',
        timestamp: new Date()
      }])
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

  if (!user) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full sm:max-w-2xl flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat about "{book.name}"
          </SheetTitle>
          <SheetDescription>
            Ask questions about this book. AI answers based on the book's content.
          </SheetDescription>
        </SheetHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.length === 0 && isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <Bot className="h-12 w-12 text-muted-foreground mx-auto animate-pulse" />
                  <p className="text-muted-foreground">AI is reading the book...</p>
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
                  </div>
                  {message.role === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold">
                        {user.firstName?.charAt(0) || user.email?.charAt(0)}
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
              placeholder="Ask a question about this book..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            AI only answers from this book's content. Responses may not be 100% accurate.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

---

## Phase 4: Integration

### 4.1 Update Book Detail Page

**File:** `src/app/(public)/books/[id]/page.tsx`

Add state and import:

```typescript
import { BookChatButton } from '@/components/books/book-chat-button'
import { BookChatModal } from '@/components/books/book-chat-modal'

// Add state
const [isChatModalOpen, setIsChatModalOpen] = useState(false)
```

Add button to action buttons area (around line 400-450):

```typescript
<div className="flex flex-wrap gap-2">
  {/* Existing buttons... */}
  {book.canAccess && book.fileUrl && (
    <Button onClick={() => setIsReaderModalOpen(true)}>
      {isEbook ? 'Read Now' : 'Listen Now'}
    </Button>
  )}
  <AddToBookshelf book={book} />

  {/* NEW: Chat with AI Button */}
  <BookChatButton
    book={book}
    onClick={() => setIsChatModalOpen(true)}
  />
</div>
```

Add modal at bottom (before PDF Reader Modal):

```typescript
{/* Chat with AI Modal */}
{book && (
  <BookChatModal
    open={isChatModalOpen}
    onOpenChange={setIsChatModalOpen}
    book={book}
  />
)}
```

---

## Phase 5: Configuration

### 5.1 Environment Variables

Add to `.env`:

```env
# Zhipu AI Configuration
ZHIPU_AI_API_KEY=your.id.your_secret
```

Format: `{api_id}.{api_secret}`

### 5.2 Install Dependencies

```bash
npm install jose pdf-parse
npm install --save-dev @types/pdf-parse
```

---

## Cost Comparison

### Zhipu AI (GLM-4)
- **Input**: ¥0.50 / 1M tokens (~$0.07 USD)
- **Output**: ¥2.00 / 1M tokens (~$0.28 USD)
- **Estimated per chat session**: $0.005-0.02 (much cheaper than OpenAI!)

### PDF Processing
- One-time extraction per session
- ~10 pages of context = ~5000 tokens
- Total cost per session: ~$0.01

---

## Implementation Steps

### Step 1: Setup & Configuration
- [ ] Add ZHIPU_AI_API_KEY to .env
- [ ] Install dependencies (jose, pdf-parse)
- [ ] Test API connection

### Step 2: Backend Implementation
- [ ] Create Zhipu AI service wrapper
- [ ] Create PDF extractor
- [ ] Create query generator
- [ ] Create chat API route

### Step 3: Frontend Components
- [ ] Create BookChatButton component
- [ ] Create BookChatModal component
- [ ] Test UI components

### Step 4: Integration
- [ ] Add to book detail page
- [ ] Test with real book
- [ ] Verify PDF content is being used

### Step 5: Polish
- [ ] Add error handling
- [ ] Add loading states
- [ ] Add source citations
- [ ] Mobile responsiveness
- [ ] Accessibility

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/ai/zhipu.ts` | JWT token generation |
| `src/lib/ai/zhipu-chat.ts` | Zhipu AI chat service |
| `src/lib/ai/pdf-extractor.ts` | PDF content extraction |
| `src/lib/ai/query-generator.ts` | Pre-filled query generator |
| `src/app/api/books/[id]/chat/route.ts` | Chat API endpoint |
| `src/components/books/book-chat-button.tsx` | Chat trigger button |
| `src/components/books/book-chat-modal.tsx` | Chat modal interface |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/(public)/books/[id]/page.tsx` | Add chat button & modal |
| `.env` | Add ZHIPU_AI_API_KEY |
| `package.json` | Add dependencies |

---

## Testing Checklist

- [ ] Chat button only shows for ebooks/audiobooks
- [ ] Pre-filled query generates on open
- [ ] AI responds based on book content
- [ ] Follow-up questions work
- [ ] Conversation history maintained
- [ ] Error handling for no PDF access
- [ ] Loading states display correctly
- [ ] Mobile responsive
- [ ] Works for premium books with access
- [ ] Denies access without proper permissions
