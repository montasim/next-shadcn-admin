# Book Chat with AI - Implementation Plan

## Overview
Add an "Chat with AI" feature to the book detail page (`/books/[id]`) that allows users to ask questions about ebooks and audiobooks. The AI will only answer questions based on the specific book's content using RAG (Retrieval-Augmented Generation).

---

## Current State Analysis

### Existing Chat System
- Location: `src/app/dashboard/chats/`
- **Status**: Mock implementation only (no AI integration)
- Features: Sidebar, messages, input
- **Issue**: Not connected to any AI service

### Book Data Structure
```typescript
interface Book {
  id: string
  name: string
  summary?: string
  type: 'HARD_COPY' | 'EBOOK' | 'AUDIO'
  fileUrl?: string  // PDF for ebooks, audio file for audiobooks
  authors: Author[]
  categories: Category[]
  publications: Publication[]
}
```

### PDF Access
- PDFs stored on Google Drive
- Proxied via `/api/proxy/pdf` route
- PDF viewer component exists: `PDFReaderModal`

---

## Implementation Plan

### Phase 1: AI Provider Integration

#### Option A: OpenAI Assistant API (Recommended)
**Pros:**
- Built-in file upload and vector storage
- Automatic RAG implementation
- Thread-based conversation management
- No need for external vector database

**Cons:**
- Requires OpenAI API key
- Additional costs for assistants

**Implementation:**
```typescript
// 1. Create Assistant with file search
const assistant = await openai.beta.assistants.create({
  name: "Book Assistant",
  instructions: "You are a helpful assistant that answers questions about books...",
  tools: [{ type: "file_search" }],
  model: "gpt-4o"
})

// 2. Upload PDF
const file = await openai.files.create({
  file: fs.createReadStream(pdfPath),
  purpose: "assistants"
})

// 3. Create thread with file
const thread = await openai.beta.threads.create({
  messages: [{
    role: "user",
    content: preFilledQuery,
    attachments: [{ file_id: file.id, tools: [{ type: "file_search" }] }]
  }]
})
```

#### Option B: Custom RAG with Vector DB
**Stack:** LangChain + Pinecone/Weaviate + OpenAI/Anthropic

**Pros:**
- Full control over implementation
- Can use any AI provider
- Potentially cheaper at scale

**Cons:**
- More complex to implement
- Need to manage vector database
- PDF parsing required

---

### Phase 2: Backend API Routes

#### 2.1 Book Chat API Route
**File:** `src/app/api/books/[id]/chat/route.ts`

```typescript
// POST /api/books/[id]/chat
interface ChatRequest {
  message: string
  threadId?: string  // For continuing conversations
}

interface ChatResponse {
  response: string
  threadId: string
  sources?: {
    file: string
    page?: number
    content: string
  }[]
}
```

**Implementation Steps:**
1. Fetch book details (verify it's an ebook/audiobook)
2. Get or create assistant thread for this book
3. If first message, generate pre-filled query
4. Send message to OpenAI Assistant
5. Stream response back to client

#### 2.2 Pre-filled Query Generator
**File:** `src/lib/ai/query-generator.ts`

```typescript
async function generatePreFilledQuery(book: Book): Promise<string> {
  const analysis = {
    title: book.name,
    authors: book.authors.map(a => a.name).join(', '),
    categories: book.categories.map(c => c.name).join(', '),
    summary: book.summary?.substring(0, 500)
  }

  return `Can you help me understand "${book.name}" by ${analysis.authors}? ` +
         `I'd like to learn about the main themes and key concepts in this book. ` +
         `What are the most important takeaways?`
}
```

---

### Phase 3: PDF Content Analysis

#### 3.1 PDF Text Extraction
**Option A: Server-side (Recommended)**
```typescript
// Use pdf-parse or pdf2json
import pdf from 'pdf-parse'

async function extractTextFromPdf(pdfUrl: string): Promise<string> {
  const buffer = await fetch(pdfUrl).then(res => res.buffer())
  const data = await pdf(buffer)
  return data.text
}
```

**Option B: Client-side (Browser)**
- Use PDF.js
- Pro: No server processing
- Con: Limited by browser resources

#### 3.2 Content Chunking for RAG
```typescript
interface Chunk {
  id: string
  bookId: string
  content: string
  pageNumber?: number
  embedding?: number[]
}

// Split text into chunks (e.g., 1000 tokens each)
async function chunkText(text: string): Promise<Chunk[]> {
  const chunks = []
  const chunkSize = 1000
  const overlap = 200

  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    chunks.push({
      id: `chunk-${i}`,
      bookId: bookId,
      content: text.substring(i, i + chunkSize),
      pageNumber: Math.floor(i / avgCharsPerPage) + 1
    })
  }

  return chunks
}
```

---

### Phase 4: Frontend Components

#### 4.1 Chat Button Component
**File:** `src/components/books/book-chat-button.tsx`

```typescript
interface BookChatButtonProps {
  book: Book
  onClick: () => void
}

export function BookChatButton({ book, onClick }: BookChatButtonProps) {
  const { user } = useAuth()

  // Only show for ebooks/audiobooks and authenticated users
  if (!user || (book.type !== 'EBOOK' && book.type !== 'AUDIO')) {
    return null
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="gap-2"
    >
      <MessageSquare className="h-4 w-4" />
      Chat with AI
    </Button>
  )
}
```

#### 4.2 Chat Modal/Sheet Component
**File:** `src/components/books/book-chat-modal.tsx`

```typescript
interface BookChatModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  book: Book
}

export function BookChatModal({ open, onOpenChange, book }: BookChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Generate pre-filled query on open
  useEffect(() => {
    if (open && messages.length === 0) {
      generateAndSendPrefilledQuery()
    }
  }, [open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full sm:max-w-2xl flex-col">
        <SheetHeader>
          <SheetTitle>Chat about "{book.name}"</SheetTitle>
          <SheetDescription>
            Ask questions about this book. AI answers based on the book's content only.
          </SheetDescription>
        </SheetHeader>

        <ChatMessages messages={messages} isLoading={isLoading} />

        <ChatInput
          onSend={(message) => handleSendMessage(message)}
          disabled={isLoading}
        />
      </SheetContent>
    </Sheet>
  )
}
```

#### 4.3 Chat Messages Component
**File:** `src/components/books/chat-messages.tsx`

```typescript
interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  timestamp: Date
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4">
      {messages.map((message, i) => (
        <div key={i} className={cn(
          "flex",
          message.role === 'user' ? 'justify-end' : 'justify-start'
        )}>
          <div className={cn(
            "rounded-lg px-4 py-2 max-w-[80%]",
            message.role === 'user'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          )}>
            <p>{message.content}</p>
            {message.sources && (
              <div className="mt-2 text-xs opacity-70">
                Sources: {message.sources.map(s => s.page).join(', ')}
              </div>
            )}
          </div>
        </div>
      ))}
      {isLoading && <TypingIndicator />}
    </div>
  )
}
```

---

### Phase 5: Integration with Book Detail Page

#### 5.1 Add Chat Button to Book Actions
**File:** `src/app/(public)/books/[id]/page.tsx`

```typescript
// Add to existing action buttons area
<div className="flex gap-2">
  {book.canAccess && book.fileUrl && (
    <Button onClick={() => setIsReaderModalOpen(true)}>
      {isEbook ? 'Read Now' : 'Listen Now'}
    </Button>
  )}
  <AddToBookshelf book={book} />
  <ShareButton book={book} />

  {/* NEW: Chat with AI Button */}
  <BookChatButton
    book={book}
    onClick={() => setIsChatModalOpen(true)}
  />
</div>
```

#### 5.2 Add Chat Modal to Page
```typescript
const [isChatModalOpen, setIsChatModalOpen] = useState(false)

// Add at bottom of page
<BookChatModal
  open={isChatModalOpen}
  onOpenChange={setIsChatModalOpen}
  book={book}
/>
```

---

## Data Flow

### User Flow:
```
1. User opens book detail page
2. User clicks "Chat with AI" button
3. Modal opens with pre-filled query
4. AI responds with initial overview
5. User asks follow-up questions
6. AI answers based on book content only
```

### Technical Flow:
```
1. Frontend: Book detail page
   ↓
2. API: POST /api/books/[id]/chat
   ↓
3. Server: Fetch book + PDF
   ↓
4. AI: Upload PDF to OpenAI Assistant
   ↓
5. AI: Create/Retrieve thread
   ↓
6. AI: Run assistant with message
   ↓
7. API: Stream response to client
   ↓
8. Frontend: Display response with sources
```

---

## Configuration Required

### Environment Variables
```env
# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_ASSISTANT_ID=asst_...

# Vector DB (if using custom RAG)
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...
```

### Config Updates
**File:** `src/config/index.ts`

```typescript
const serverConfig = {
  // ... existing config

  // AI Configuration
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    assistantId: process.env.OPENAI_ASSISTANT_ID,
    model: 'gpt-4o',
    maxTokens: 2000,
  }
}
```

---

## Implementation Steps

### Step 1: Setup AI Provider
- [ ] Sign up for OpenAI API
- [ ] Create Assistant with file_search tool
- [ ] Add API key to environment variables
- [ ] Update config file

### Step 2: Backend Implementation
- [ ] Create chat API route (`/api/books/[id]/chat`)
- [ ] Implement PDF download handler
- [ ] Create OpenAI service wrapper
- [ ] Implement thread management
- [ ] Add streaming response support

### Step 3: Frontend Components
- [ ] Create BookChatButton component
- [ ] Create BookChatModal component
- [ ] Create ChatMessages component
- [ ] Create ChatInput component
- [ ] Add loading/typing states

### Step 4: Integration
- [ ] Add chat button to book detail page
- [ ] Add state management for chat modal
- [ ] Implement pre-filled query generation
- [ ] Add error handling
- [ ] Add loading states

### Step 5: Polish & Test
- [ ] Test with various books
- [ ] Verify PDF content is being used
- [ ] Test streaming responses
- [ ] Add source citations
- [ ] Mobile responsiveness
- [ ] Error handling (no PDF, API failures, etc.)

---

## Technical Considerations

### PDF Access
- **Challenge**: PDFs stored on Google Drive
- **Solution**: Use existing proxy route to fetch PDF
- **Fallback**: Extract and cache text on book upload

### Performance
- **Large PDFs**: Use streaming, don't load entire PDF
- **Caching**: Cache assistant threads per book
- **Rate Limiting**: Implement user-based rate limiting

### Security
- **Access Control**: Only users with `canAccess: true` can chat
- **Premium Books**: Verify premium access for restricted books
- **API Key Security**: Never expose API keys on client

### Cost Management
- **OpenAI Costs**:
  - Assistant API: $0.15/GB storage for files
  - GPT-4o: ~$2.50/1M input tokens, ~$10/1M output tokens
  - **Estimated**: ~$0.01-0.05 per chat session
- **Mitigation**:
  - Limit max messages per session
  - Use cheaper model for simple queries
  - Cache common questions

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/app/api/books/[id]/chat/route.ts` | Chat API endpoint |
| `src/lib/ai/openai.ts` | OpenAI service wrapper |
| `src/lib/ai/query-generator.ts` | Pre-filled query generator |
| `src/lib/ai/pdf-processor.ts` | PDF text extraction |
| `src/components/books/book-chat-button.tsx` | Chat trigger button |
| `src/components/books/book-chat-modal.tsx` | Chat modal component |
| `src/components/books/chat-messages.tsx` | Message display |
| `src/components/books/chat-input.tsx` | Message input |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/(public)/books/[id]/page.tsx` | Add chat button and modal |
| `src/config/index.ts` | Add AI configuration |
| `.env` | Add OpenAI API key |
| `src/hooks/use-book.ts` | Add chat-related types (optional) |

---

## Success Metrics

- **Usage**: X% of ebook/audiobook viewers use chat feature
- **Engagement**: Average Y messages per session
- **Satisfaction**: User feedback ratings
- **Performance**: Response time < 3 seconds
- **Cost**: Average cost per user per month

---

## Future Enhancements

1. **Multi-book Chat**: Chat across multiple books in library
2. **Voice Mode**: Ask questions via voice
3. **Citation Links**: Click citations to jump to page
4. **Study Mode**: Generate quizzes and flashcards
5. **Summaries**: AI-generated chapter summaries
6. **Related Concepts**: Link to related books
7. **Chat History**: Save and review past conversations
8. **Export**: Export chat as notes
