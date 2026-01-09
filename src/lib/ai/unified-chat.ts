import { generateEmbedding } from './gemini-embeddings'
import { searchSimilarChunks, hasBookEmbeddings, getBookChunkCount } from '@/lib/lms/repositories/book-embedding.repository'
import { getBookWithExtractedContent } from '@/lib/lms/repositories/book.repository'
import { getUserChatSessions, getChatSessionMessages } from '@/lib/lms/repositories/book-chat.repository'
import { prisma } from '@/lib/prisma'
import { config } from '@/config'

export interface StreamingChatOptions {
  onChunk?: (chunk: string) => void
  onDone?: (fullResponse: string) => void
  onError?: (error: Error) => void
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  bookId: string
  bookName: string
  bookType: string
  pdfUrl: string
  pdfDirectUrl?: string | null
  authors: string[]
  categories: string[]
  messages: ChatMessage[]
  userId?: string
}

export interface ChatResponse {
  response: string
  model: string
  provider: 'zhipu' | 'gemini'
  method: 'ai-resources' | 'embedding' | 'full-content' | 'fallback'
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Filter chunks by similarity threshold
 * Only includes chunks that meet minimum relevance criteria
 */
function filterChunksByRelevance(
  chunks: Array<{ chunkText: string; pageNumber: number | null; similarity: number }>,
  minSimilarity: number = 0.3
): Array<{ chunkText: string; pageNumber: number | null; similarity: number }> {
  return chunks.filter(chunk => chunk.similarity >= minSimilarity)
}

/**
 * Calculate optimal chunk limit based on available chunks
 * Uses adaptive strategy to avoid always using 10 chunks
 */
function calculateOptimalChunkLimit(availableChunks: number, chunksLength: number): number {
  // Get total number of chunks available for this book
  const totalChunks = chunksLength

  // Adaptive strategy:
  // - For books with few chunks: use most relevant ones
  // - For books with many chunks: use percentage but cap at reasonable number
  let optimalLimit: number

  if (totalChunks <= 10) {
    // Small books: use most chunks (all if very relevant)
    optimalLimit = Math.min(availableChunks, totalChunks)
  } else if (totalChunks <= 30) {
    // Medium-small books: use up to 40% of chunks, max 8
    optimalLimit = Math.min(availableChunks, Math.max(5, Math.ceil(totalChunks * 0.4)), 8)
  } else if (totalChunks <= 100) {
    // Medium books: use up to 25% of chunks, max 10
    optimalLimit = Math.min(availableChunks, Math.max(6, Math.ceil(totalChunks * 0.25)), 10)
  } else {
    // Large books: use up to 15% of chunks, max 15
    optimalLimit = Math.min(availableChunks, Math.max(8, Math.ceil(totalChunks * 0.15)), 15)
  }

  console.log(`[Unified Chat] Book has ${totalChunks} total chunks, using optimal limit: ${optimalLimit}`)

  return optimalLimit
}

/**
 * Format retrieved chunks for AI context
 */
function formatChunksForAI(chunks: Array<{ chunkText: string; pageNumber: number | null; similarity: number }>, maxChunks = 10): string {
  return chunks
    .slice(0, maxChunks)
    .map((chunk, index) => {
      const pageRef = chunk.pageNumber !== null ? ` (Page ${chunk.pageNumber})` : ''
      const similarityPct = Math.round(chunk.similarity * 100)
      return `[Excerpt ${index + 1}${pageRef} - Relevance: ${similarityPct}%]\n${chunk.chunkText}`
    })
    .join('\n\n---\n\n')
}

/**
 * Generate chat response using Zhipu AI (GLM-4.7)
 */
async function generateZhipuResponse(messages: ChatMessage[]): Promise<{ content: string; usage: any }> {
  const { generateZhipuToken } = await import('./zhipu')
  const apiKey = config.zhipuAiApiKey

  if (!apiKey) {
    throw new Error('ZHIPU_AI_API_KEY is not configured')
  }

  const token = await generateZhipuToken(apiKey)
  const model = config.zhipuAiModel

  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: 0.3,
      top_p: 0.7,
      max_tokens: 8000,
      stream: false
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Zhipu Chat] API Error Response:', errorText)

    // Parse error to identify quota/rate limit errors
    try {
      const errorData = JSON.parse(errorText)
      const errorCode = errorData.error?.code
      const errorMessage = errorData.error?.message

      // Error codes that indicate we should fall back to another provider
      if (errorCode === '4006' ||
          errorMessage?.includes('quota') ||
          errorMessage?.includes('limit') ||
          errorMessage?.includes('rate limit') ||
          response.status === 429) {
        const fallbackError = new Error(`Zhipu AI quota/limit exceeded: ${errorMessage}`)
        ;(fallbackError as any).code = 'PROVIDER_LIMIT_EXCEEDED'
        throw fallbackError
      }

      throw new Error(`Zhipu AI API error (${errorCode || response.status}): ${errorMessage || errorText}`)
    } catch (parseError) {
      if ((parseError as any).code === 'PROVIDER_LIMIT_EXCEEDED') {
        throw parseError
      }
      throw new Error(`Zhipu AI API error (${response.status}): ${errorText}`)
    }
  }

  const data = await response.json()

  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from Zhipu AI')
  }

  const message = data.choices[0].message
  const content = message?.content || message?.reasoning_content || ''

  return {
    content,
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    }
  }
}

/**
 * Generate chat response using Gemini AI
 */
async function generateGeminiResponse(messages: ChatMessage[]): Promise<{ content: string; usage: any }> {
  const apiKey = config.geminiApiKey

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const model = config.geminiChatModel

  // Convert messages to Gemini format
  // Gemini doesn't use system message, so we prepend it to the first user message
  const systemMessage = messages.find(m => m.role === 'system')
  const chatMessages = messages.filter(m => m.role !== 'system')

  let contents: any[] = []

  if (systemMessage) {
    contents.push({
      role: 'user',
      parts: [{ text: `${systemMessage.content}\n\n${chatMessages[0]?.content || ''}` }]
    })
    contents = contents.concat(
      chatMessages.slice(1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    )
  } else {
    contents = chatMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          maxOutputTokens: 8000,
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Gemini Chat] API Error Response:', errorText)

    // Parse error to identify quota/rate limit errors
    try {
      const errorData = JSON.parse(errorText)
      if (errorData.error?.code === 429 ||
          errorData.error?.message?.includes('quota') ||
          errorData.error?.message?.includes('limit')) {
        const fallbackError = new Error(`Gemini quota/limit exceeded: ${errorData.error.message}`)
        ;(fallbackError as any).code = 'PROVIDER_LIMIT_EXCEEDED'
        throw fallbackError
      }
    } catch {}

    throw new Error(`Gemini API error (${response.status}): ${errorText}`)
  }

  const data = await response.json()

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('No response from Gemini')
  }

  const candidate = data.candidates[0]
  const content = candidate.content?.parts?.[0]?.text || ''

  return {
    content,
    usage: {
      promptTokens: data.usageMetadata?.totalTokenCount || 0,
      completionTokens: 0,
      totalTokens: data.usageMetadata?.totalTokenCount || 0,
    }
  }
}

/**
 * Main unified chat function with automatic provider fallback
 * 1. Try pre-computed AI resources first (fastest)
 * 2. Then try embeddings search
 * 3. Fall back to full content if needed
 * 4. Try Zhipu AI first, then Gemini on quota/limit error
 */
export async function chatWithUnifiedProvider(request: ChatRequest): Promise<ChatResponse> {
  console.log('[Unified Chat] Starting chat for book:', request.bookId)

  // Get the last user message for embedding generation
  const lastUserMessage = request.messages
    .filter(m => m.role === 'user')
    .pop()

  if (!lastUserMessage) {
    throw new Error('No user message found in conversation history')
  }

  // Extract userId from request if available
  const userId = request.userId

  // STEP 1: Try to use pre-computed AI resources first (FASTEST)
  console.log('[Unified Chat] Step 1: Checking pre-computed AI resources...')
  const preComputedResources = await getPreComputedAIResources(request.bookId, userId)

  // STEP 2: Check if we can answer using pre-computed resources (FAST)
  let bookContent = ''
  let method: 'ai-resources' | 'embedding' | 'full-content' | 'fallback' = 'ai-resources'

  // Build enhanced content from pre-computed resources
  const enhancedContentParts: string[] = []

  if (preComputedResources.aiSummary) {
    enhancedContentParts.push(`**AI Summary:**\n${preComputedResources.aiSummary}`)
  }

  if (preComputedResources.aiOverview) {
    enhancedContentParts.push(`**AI Overview:**\n${preComputedResources.aiOverview}`)
  }

  if (preComputedResources.summary) {
    enhancedContentParts.push(`**Summary:**\n${preComputedResources.summary}`)
  }

  if (preComputedResources.keyQuestionsAnswers && preComputedResources.keyQuestionsAnswers.length > 0) {
    enhancedContentParts.push(`**Key Questions & Answers:**\n${preComputedResources.keyQuestionsAnswers.map((qa, i) =>
      `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`
    ).join('\n\n')}`)
  }

  // Check if user has chat history that might be relevant
  if (preComputedResources.userChatHistory && preComputedResources.userChatHistory.length > 0) {
    enhancedContentParts.push(`**Your Previous Chat History:**\n${preComputedResources.userChatHistory.map(m =>
      `${m.role === 'user' ? 'You' : 'AI'}: ${m.content}`
    ).join('\n\n')}`)
  }

  // If we have substantial pre-computed content, use it directly
  if (enhancedContentParts.length >= 2 || (enhancedContentParts.length > 0 && preComputedResources.userChatHistory && preComputedResources.userChatHistory.length > 5)) {
    bookContent = enhancedContentParts.join('\n\n---\n\n')
    console.log('[Unified Chat] Using pre-computed AI resources (FAST PATH)')
    console.log('[Unified Chat] Resources used:', {
      aiSummary: !!preComputedResources.aiSummary,
      aiOverview: !!preComputedResources.aiOverview,
      summary: !!preComputedResources.summary,
      keyQuestions: preComputedResources.keyQuestionsAnswers?.length || 0,
      chatHistoryMessages: preComputedResources.userChatHistory?.length || 0
    })
  } else {
    // STEP 3: Fall back to embedding search if pre-computed resources are insufficient
    console.log('[Unified Chat] Step 2: Pre-computed resources insufficient, checking embeddings...')

    // Check if embeddings exist for this book
    const hasEmbeddings = await hasBookEmbeddings(request.bookId)

    if (hasEmbeddings) {
      console.log('[Unified Chat] Embeddings found, using RAG approach')
      try {
        // Generate embedding for the user's query
        const queryEmbedding = await generateEmbedding(lastUserMessage.content)
        console.log('[Unified Chat] Generated query embedding, dimension:', queryEmbedding.length)

        // Get total chunk count for this book to calculate optimal limit
        const totalChunks = await getBookChunkCount(request.bookId)
        console.log('[Unified Chat] Total chunks available for book:', totalChunks)

        // Calculate optimal chunk limit based on book size
        const optimalLimit = calculateOptimalChunkLimit(totalChunks, totalChunks)

        // Minimum similarity threshold to filter out irrelevant chunks
        const minSimilarity = 0.25

        // Search for similar chunks with adaptive limit and similarity threshold
        const similarChunks = await searchSimilarChunks(request.bookId, queryEmbedding, optimalLimit, minSimilarity)
        console.log('[Unified Chat] Found', similarChunks.length, 'relevant chunks (limit:', optimalLimit, ', minSimilarity:', minSimilarity + ')')
        console.log('[Unified Chat] Similarity scores:', similarChunks.map(c => c.similarity.toFixed(3)).join(', '))

        if (similarChunks.length > 0) {
          // Check if chunks have actual content
          const totalContentLength = similarChunks.reduce((sum, c) => sum + (c.chunkText?.length || 0), 0)
          console.log('[Unified Chat] Total content length across all chunks:', totalContentLength)

          if (totalContentLength === 0) {
            console.log('[Unified Chat] Chunks are empty, falling back to full content')
            const bookWithContent = await getBookWithExtractedContent(request.bookId)
            if (bookWithContent?.extractedContent) {
              bookContent = bookWithContent.extractedContent.slice(0, 50000)
              method = 'full-content'
            }
          } else {
            // Format chunks for AI context
            bookContent = formatChunksForAI(similarChunks)
            method = 'embedding'
            console.log('[Unified Chat] Using', similarChunks.length, 'chunks as context (avg similarity:', (similarChunks.reduce((sum, c) => sum + c.similarity, 0) / similarChunks.length).toFixed(3) + ')')
          }
        } else {
          console.log('[Unified Chat] No chunks found, falling back to full content')
          const bookWithContent = await getBookWithExtractedContent(request.bookId)
          if (bookWithContent?.extractedContent) {
            bookContent = bookWithContent.extractedContent.slice(0, 50000)
            method = 'full-content'
          }
        }
      } catch (error) {
        console.error('[Unified Chat] Embedding search failed:', error)
        const bookWithContent = await getBookWithExtractedContent(request.bookId)
        if (bookWithContent?.extractedContent) {
          bookContent = bookWithContent.extractedContent.slice(0, 50000)
          method = 'full-content'
        }
      }
    } else {
      console.log('[Unified Chat] No embeddings found, using full content')
      const bookWithContent = await getBookWithExtractedContent(request.bookId)
      if (bookWithContent?.extractedContent) {
        bookContent = bookWithContent.extractedContent.slice(0, 50000)
        method = 'full-content'
      }
    }
  }

  // Build system prompt
  const authors = request.authors.join(', ')
  const categories = request.categories.join(', ')

  const systemPrompt = `You are a knowledgeable AI assistant for a digital library platform.

Your task is to answer questions about the book "${request.bookName}" by ${authors} (${categories}).

**CRITICAL LANGUAGE RULE - MANDATORY:**
**YOU MUST RESPOND IN THE EXACT SAME LANGUAGE AS THE USER'S QUESTION!**

- If user asks in Bengali (বাংলা) → Respond ONLY in Bengali (বাংলা)
- If user asks in English → Respond ONLY in English
- Check the LAST user message language FIRST before writing your response
- This is NOT optional - it is a mandatory requirement

**EXAMPLE:**
- User asks: "সানজু কোন রাজ্যের অধিবাসী ছিলেন?" → You MUST answer in Bengali
- User asks: "Which state was Sanju from?" → You MUST answer in English

**CRITICAL RULES:**
1. Base ALL answers ONLY on the book content provided below
2. If information is not found in the book content, explicitly say so IN THE USER'S LANGUAGE
3. Provide specific examples and quotes from the book when possible
4. Reference page numbers when citing specific content
5. Be concise yet comprehensive
6. Maintain a conversational, helpful tone
7. If asked about topics not covered in the book, politely redirect to what IS available (IN USER'S LANGUAGE)
8. **Always match your response language to the user's question language - THIS IS MANDATORY**

${bookContent ? `**BOOK CONTENT TO USE:**
${bookContent}` : '**BOOK CONTENT:** [No content available]'}

**BOOK METADATA:**
- Title: ${request.bookName}
- Authors: ${authors}
- Categories: ${categories}
- Type: ${request.bookType}

**IMPORTANT:** Before responding, identify the user's question language and respond in that same language. This is your most important instruction.`

  // Prepare messages for API
  const apiMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...request.messages
  ]

  // Try Zhipu AI first (premium model, you have API key)
  console.log('[Unified Chat] Trying Zhipu AI first (provider: zhipu, model:', config.zhipuAiModel + ')')

  try {
    const { content, usage } = await generateZhipuResponse(apiMessages)
    console.log('[Unified Chat] Zhipu AI response successful')

    return {
      response: content,
      model: config.zhipuAiModel,
      provider: 'zhipu',
      method,
      usage,
    }
  } catch (error: any) {
    // Check if this is a quota/limit error that requires fallback
    if (error.code === 'PROVIDER_LIMIT_EXCEEDED' || error.message.includes('quota') || error.message.includes('limit')) {
      console.log('[Unified Chat] Zhipu AI quota/limit exceeded, falling back to Gemini')

      try {
        const { content, usage } = await generateGeminiResponse(apiMessages)
        console.log('[Unified Chat] Gemini fallback successful')

        return {
          response: content,
          model: config.geminiChatModel,
          provider: 'gemini',
          method,
          usage,
        }
      } catch (geminiError: any) {
        console.error('[Unified Chat] Both providers failed:', geminiError)
        throw new Error(`Both AI providers are unavailable. Zhipu: ${error.message}, Gemini: ${geminiError.message}`)
      }
    }

    // If not a quota error, just throw the original error
    throw error
  }
}

/**
 * Generate streaming chat response using Zhipu AI (GLM-4.7)
 */
async function* generateZhipuResponseStream(
  messages: ChatMessage[],
  options: StreamingChatOptions = {}
): AsyncGenerator<string, { usage: any; model: string }, unknown> {
  const { generateZhipuToken } = await import('./zhipu')
  const apiKey = config.zhipuAiApiKey

  if (!apiKey) {
    throw new Error('ZHIPU_AI_API_KEY is not configured')
  }

  const token = await generateZhipuToken(apiKey)
  const model = config.zhipuAiModel

  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: 0.3,
      top_p: 0.7,
      max_tokens: 8000,
      stream: true
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Zhipu Chat Stream] API Error Response:', errorText)

    try {
      const errorData = JSON.parse(errorText)
      const errorCode = errorData.error?.code
      const errorMessage = errorData.error?.message

      if (errorCode === '4006' ||
          errorMessage?.includes('quota') ||
          errorMessage?.includes('limit') ||
          errorMessage?.includes('rate limit') ||
          response.status === 429) {
        const fallbackError = new Error(`Zhipu AI quota/limit exceeded: ${errorMessage}`)
        ;(fallbackError as any).code = 'PROVIDER_LIMIT_EXCEEDED'
        throw fallbackError
      }

      throw new Error(`Zhipu AI API error (${errorCode || response.status}): ${errorMessage || errorText}`)
    } catch (parseError: any) {
      if ((parseError as any).code === 'PROVIDER_LIMIT_EXCEEDED') {
        throw parseError
      }
      throw new Error(`Zhipu AI API error (${response.status}): ${errorText}`)
    }
  }

  // Parse the streaming response
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) {
    throw new Error('No response body')
  }

  let buffer = ''
  let usage: any = { promptTokens: 0, completionTokens: 0, totalTokens: 0 }

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue

        const data = trimmed.slice(5).trim()

        if (data === '[DONE]') {
          return { usage, model }
        }

        try {
          const parsed = JSON.parse(data)
          const chunk = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.reasoning_content || ''

          if (chunk) {
            options.onChunk?.(chunk)
            yield chunk
          }

          // Update usage from streaming chunks
          if (parsed.usage) {
            usage = {
              promptTokens: parsed.usage.prompt_tokens || usage.promptTokens,
              completionTokens: parsed.usage.completion_tokens || usage.completionTokens,
              totalTokens: parsed.usage.total_tokens || usage.totalTokens,
            }
          }
        } catch (e) {
          // Skip invalid JSON
          console.debug('[Zhipu Chat Stream] Failed to parse chunk:', data)
        }
      }
    }
  } catch (error) {
    options.onError?.(error as Error)
    throw error
  }

  return { usage, model }
}

/**
 * Generate streaming chat response using Gemini AI
 */
async function* generateGeminiResponseStream(
  messages: ChatMessage[],
  options: StreamingChatOptions = {}
): AsyncGenerator<string, { usage: any; model: string }, unknown> {
  const apiKey = config.geminiApiKey

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const model = config.geminiChatModel

  // Convert messages to Gemini format
  const systemMessage = messages.find(m => m.role === 'system')
  const chatMessages = messages.filter(m => m.role !== 'system')

  let contents: any[] = []

  if (systemMessage) {
    contents.push({
      role: 'user',
      parts: [{ text: `${systemMessage.content}\n\n${chatMessages[0]?.content || ''}` }]
    })
    contents = contents.concat(
      chatMessages.slice(1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    )
  } else {
    contents = chatMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          maxOutputTokens: 8000,
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Gemini Chat Stream] API Error Response:', errorText)

    try {
      const errorData = JSON.parse(errorText)
      if (errorData.error?.code === 429 ||
          errorData.error?.message?.includes('quota') ||
          errorData.error?.message?.includes('limit')) {
        const fallbackError = new Error(`Gemini quota/limit exceeded: ${errorData.error.message}`)
        ;(fallbackError as any).code = 'PROVIDER_LIMIT_EXCEEDED'
        throw fallbackError
      }
    } catch {}

    throw new Error(`Gemini API error (${response.status}): ${errorText}`)
  }

  // Parse the SSE response
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) {
    throw new Error('No response body')
  }

  let buffer = ''
  let usage: any = { promptTokens: 0, completionTokens: 0, totalTokens: 0 }

  try {
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

        try {
          const parsed = JSON.parse(data)
          const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text || ''

          if (chunk) {
            options.onChunk?.(chunk)
            yield chunk
          }

          // Update usage from streaming chunks
          if (parsed.usageMetadata) {
            usage = {
              promptTokens: parsed.usageMetadata.promptTokenCount || usage.promptTokens,
              completionTokens: parsed.usageMetadata.candidatesTokenCount || usage.completionTokens,
              totalTokens: parsed.usageMetadata.totalTokenCount || usage.totalTokens,
            }
          }
        } catch (e) {
          // Skip invalid JSON
          console.debug('[Gemini Chat Stream] Failed to parse chunk:', data)
        }
      }
    }
  } catch (error) {
    options.onError?.(error as Error)
    throw error
  }

  return { usage, model }
}

/**
 * Build system prompt for chat
 */
function buildSystemPrompt(request: ChatRequest, bookContent: string): string {
  const authors = request.authors.join(', ')
  const categories = request.categories.join(', ')

  return `You are a knowledgeable AI assistant for a digital library platform.

Your task is to answer questions about the book "${request.bookName}" by ${authors} (${categories}).

**CRITICAL LANGUAGE RULE - MANDATORY:**
**YOU MUST RESPOND IN THE EXACT SAME LANGUAGE AS THE USER'S QUESTION!**

- If user asks in Bengali (বাংলা) → Respond ONLY in Bengali (বাংলা)
- If user asks in English → Respond ONLY in English
- Check the LAST user message language FIRST before writing your response
- This is NOT optional - it is a mandatory requirement

**EXAMPLE:**
- User asks: "সানজু কোন রাজ্যের অধিবাসী ছিলেন?" → You MUST answer in Bengali
- User asks: "Which state was Sanju from?" → You MUST answer in English

**CRITICAL RULES:**
1. Base ALL answers ONLY on the book content provided below
2. If information is not found in the book content, explicitly say so IN THE USER'S LANGUAGE
3. Provide specific examples and quotes from the book when possible
4. Reference page numbers when citing specific content
5. Be concise yet comprehensive
6. Maintain a conversational, helpful tone
7. If asked about topics not covered in the book, politely redirect to what IS available (IN USER'S LANGUAGE)
8. **Always match your response language to the user's question language - THIS IS MANDATORY**

${bookContent ? `**BOOK CONTENT TO USE:**
${bookContent}` : '**BOOK CONTENT:** [No content available]'}

**BOOK METADATA:**
- Title: ${request.bookName}
- Authors: ${authors}
- Categories: ${categories}
- Type: ${request.bookType}

**IMPORTANT:** Before responding, identify the user's question language and respond in that same language. This is your most important instruction.`
}

/**
 * Gather pre-computed AI resources for a book (faster than embedding search)
 */
async function getPreComputedAIResources(bookId: string, userId?: string): Promise<{
  aiSummary?: string
  aiOverview?: string
  summary?: string
  keyQuestionsAnswers?: Array<{ question: string; answer: string }>
  userChatHistory?: Array<{ role: string; content: string }>
}> {
  const resources: any = {}

  try {
    // Get book with AI-generated fields
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: {
        aiSummary: true,
        aiOverview: true,
        summary: true,
      }
    })

    if (book?.aiSummary) resources.aiSummary = book.aiSummary
    if (book?.aiOverview) resources.aiOverview = book.aiOverview
    if (book?.summary) resources.summary = book.summary

    // Get key questions and answers
    const questions = await prisma.bookQuestion.findMany({
      where: { bookId },
      orderBy: { order: 'asc' },
      take: 20,
      select: {
        question: true,
        answer: true,
      }
    })

    if (questions.length > 0) {
      resources.keyQuestionsAnswers = questions.map(q => ({
        question: q.question,
        answer: q.answer
      }))
    }

    // Get user's chat history for this book (most recent session)
    if (userId) {
      try {
        const sessions = await getUserChatSessions(bookId, userId)
        if (sessions.length > 0) {
          const recentSessionId = sessions[0].sessionId
          const messages = await getChatSessionMessages(bookId, recentSessionId)
          resources.userChatHistory = messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      } catch (error) {
        console.debug('[Chat] Failed to fetch user chat history:', error)
      }
    }

    console.log('[Unified Chat] Pre-computed resources:', {
      hasAiSummary: !!resources.aiSummary,
      hasAiOverview: !!resources.aiOverview,
      hasSummary: !!resources.summary,
      keyQuestionsCount: resources.keyQuestionsAnswers?.length || 0,
      userChatHistoryMessages: resources.userChatHistory?.length || 0
    })
  } catch (error) {
    console.error('[Unified Chat] Error fetching pre-computed resources:', error)
  }

  return resources
}

/**
 * Main streaming chat function with automatic provider fallback
 * Returns an async generator that yields chunks of the response
 */
export async function* chatWithUnifiedProviderStream(
  request: ChatRequest,
  options: StreamingChatOptions = {}
): AsyncGenerator<
  { chunk: string; provider: 'zhipu' | 'gemini' },
  { response: string; model: string; provider: 'zhipu' | 'gemini'; method: 'ai-resources' | 'embedding' | 'full-content' | 'fallback'; usage: any },
  unknown
> {
  console.log('[Unified Chat Stream] Starting chat for book:', request.bookId)

  // Get the last user message for embedding generation
  const lastUserMessage = request.messages
    .filter(m => m.role === 'user')
    .pop()

  if (!lastUserMessage) {
    throw new Error('No user message found in conversation history')
  }

  // Extract userId from request if available
  const userId = (request as any).userId

  // STEP 1: Try to use pre-computed AI resources first (FASTEST)
  console.log('[Unified Chat Stream] Step 1: Checking pre-computed AI resources...')
  const preComputedResources = await getPreComputedAIResources(request.bookId, userId)

  // STEP 2: Check if we can answer using pre-computed resources (FAST)
  let bookContent = ''
  let method: 'ai-resources' | 'embedding' | 'full-content' | 'fallback' = 'ai-resources'

  // Build enhanced content from pre-computed resources
  const enhancedContentParts: string[] = []

  if (preComputedResources.aiSummary) {
    enhancedContentParts.push(`**AI Summary:**\n${preComputedResources.aiSummary}`)
  }

  if (preComputedResources.aiOverview) {
    enhancedContentParts.push(`**AI Overview:**\n${preComputedResources.aiOverview}`)
  }

  if (preComputedResources.summary) {
    enhancedContentParts.push(`**Summary:**\n${preComputedResources.summary}`)
  }

  if (preComputedResources.keyQuestionsAnswers && preComputedResources.keyQuestionsAnswers.length > 0) {
    enhancedContentParts.push(`**Key Questions & Answers:**\n${preComputedResources.keyQuestionsAnswers.map((qa, i) =>
      `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`
    ).join('\n\n')}`)
  }

  // Check if user has chat history that might be relevant
  if (preComputedResources.userChatHistory && preComputedResources.userChatHistory.length > 0) {
    enhancedContentParts.push(`**Your Previous Chat History:**\n${preComputedResources.userChatHistory.map(m =>
      `${m.role === 'user' ? 'You' : 'AI'}: ${m.content}`
    ).join('\n\n')}`)
  }

  // If we have substantial pre-computed content, use it directly
  if (enhancedContentParts.length >= 2 || (enhancedContentParts.length > 0 && preComputedResources.userChatHistory && preComputedResources.userChatHistory.length > 5)) {
    bookContent = enhancedContentParts.join('\n\n---\n\n')
    console.log('[Unified Chat Stream] Using pre-computed AI resources (FAST PATH)')
    console.log('[Unified Chat Stream] Resources used:', {
      aiSummary: !!preComputedResources.aiSummary,
      aiOverview: !!preComputedResources.aiOverview,
      summary: !!preComputedResources.summary,
      keyQuestions: preComputedResources.keyQuestionsAnswers?.length || 0,
      chatHistoryMessages: preComputedResources.userChatHistory?.length || 0
    })
  } else {
    // STEP 3: Fall back to embedding search if pre-computed resources are insufficient
    console.log('[Unified Chat Stream] Step 2: Pre-computed resources insufficient, checking embeddings...')

    const hasEmbeddings = await hasBookEmbeddings(request.bookId)

    if (hasEmbeddings) {
      console.log('[Unified Chat Stream] Embeddings found, using RAG approach')
      try {
        // Generate embedding for the user's query
        const queryEmbedding = await generateEmbedding(lastUserMessage.content)
        console.log('[Unified Chat Stream] Generated query embedding, dimension:', queryEmbedding.length)

        // Get total chunk count for this book to calculate optimal limit
        const totalChunks = await getBookChunkCount(request.bookId)
        console.log('[Unified Chat Stream] Total chunks available for book:', totalChunks)

        // Calculate optimal chunk limit based on book size
        const optimalLimit = calculateOptimalChunkLimit(totalChunks, totalChunks)

        // Minimum similarity threshold to filter out irrelevant chunks
        const minSimilarity = 0.25

        // Search for similar chunks with adaptive limit and similarity threshold
        const similarChunks = await searchSimilarChunks(request.bookId, queryEmbedding, optimalLimit, minSimilarity)
        console.log('[Unified Chat Stream] Found', similarChunks.length, 'relevant chunks')
        console.log('[Unified Chat Stream] Similarity scores:', similarChunks.map(c => c.similarity.toFixed(3)).join(', '))

        if (similarChunks.length > 0) {
          const totalContentLength = similarChunks.reduce((sum, c) => sum + (c.chunkText?.length || 0), 0)
          console.log('[Unified Chat Stream] Total content length across all chunks:', totalContentLength)

          if (totalContentLength === 0) {
            console.log('[Unified Chat Stream] Chunks are empty, falling back to full content')
            const bookWithContent = await getBookWithExtractedContent(request.bookId)
            if (bookWithContent?.extractedContent) {
              bookContent = bookWithContent.extractedContent.slice(0, 50000)
              method = 'full-content'
            }
          } else {
            // Format chunks for AI context
            bookContent = formatChunksForAI(similarChunks)
            method = 'embedding'
            console.log('[Unified Chat Stream] Using', similarChunks.length, 'chunks as context (avg similarity:', (similarChunks.reduce((sum, c) => sum + c.similarity, 0) / similarChunks.length).toFixed(3) + ')')
          }
        } else {
          console.log('[Unified Chat Stream] No chunks found, falling back to full content')
          const bookWithContent = await getBookWithExtractedContent(request.bookId)
          if (bookWithContent?.extractedContent) {
            bookContent = bookWithContent.extractedContent.slice(0, 50000)
            method = 'full-content'
          }
        }
      } catch (error) {
        console.error('[Unified Chat Stream] Embedding search failed:', error)
        const bookWithContent = await getBookWithExtractedContent(request.bookId)
        if (bookWithContent?.extractedContent) {
          bookContent = bookWithContent.extractedContent.slice(0, 50000)
          method = 'full-content'
        }
      }
    } else {
      console.log('[Unified Chat Stream] No embeddings found, using full content')
      const bookWithContent = await getBookWithExtractedContent(request.bookId)
      if (bookWithContent?.extractedContent) {
        bookContent = bookWithContent.extractedContent.slice(0, 50000)
        method = 'full-content'
      }
    }
  }

  // Build system prompt
  const systemPrompt = buildSystemPrompt(request, bookContent)

  // Prepare messages for API
  const apiMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...request.messages
  ]

  // Try Zhipu AI first (premium model, you have API key)
  console.log('[Unified Chat Stream] Trying Zhipu AI first (provider: zhipu, model:', config.zhipuAiModel + ')')

  try {
    let fullResponse = ''
    const stream = generateZhipuResponseStream(apiMessages, options)

    for await (const chunk of stream) {
      fullResponse += chunk
      yield { chunk, provider: 'zhipu' }
    }

    const result = await stream.next()
    const finalValue = result.value
    const { usage, model } = typeof finalValue === 'object' ? finalValue : { usage: {}, model: config.zhipuAiModel }

    console.log('[Unified Chat Stream] Zhipu AI response successful')

    return {
      response: fullResponse,
      model,
      provider: 'zhipu',
      method,
      usage,
    }
  } catch (error: any) {
    // Check if this is a quota/limit error that requires fallback
    if (error.code === 'PROVIDER_LIMIT_EXCEEDED' || error.message.includes('quota') || error.message.includes('limit')) {
      console.log('[Unified Chat Stream] Zhipu AI quota/limit exceeded, falling back to Gemini')

      try {
        let fullResponse = ''
        const stream = generateGeminiResponseStream(apiMessages, options)

        for await (const chunk of stream) {
          fullResponse += chunk
          yield { chunk, provider: 'gemini' }
        }

        const result = await stream.next()
        const finalValue = result.value
        const { usage, model } = typeof finalValue === 'object' ? finalValue : { usage: {}, model: config.geminiChatModel }

        console.log('[Unified Chat Stream] Gemini fallback successful')

        return {
          response: fullResponse,
          model,
          provider: 'gemini',
          method,
          usage,
        }
      } catch (geminiError: any) {
        console.error('[Unified Chat Stream] Both providers failed:', geminiError)
        throw new Error(`Both AI providers are unavailable. Zhipu: ${error.message}, Gemini: ${geminiError.message}`)
      }
    }

    // If not a quota error, just throw the original error
    throw error
  }
}

