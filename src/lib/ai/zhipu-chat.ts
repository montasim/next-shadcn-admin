import { generateZhipuToken } from './zhipu';
import { extractRelevantContent, formatContentForAI } from './pdf-extractor';
import { downloadAndExtractPdf, getPdfExcerpt } from './pdf-downloader';
import { config } from '@/config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  bookId: string;
  bookName: string;
  bookType: string;
  pdfUrl: string;
  pdfDirectUrl?: string | null; // Direct download URL (optional)
  pdfContent?: string; // Pre-extracted content (optional)
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

/**
 * Trigger async content extraction (fire and forget)
 */
function triggerContentExtraction(bookId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'http://localhost:3000';

  fetch(`${baseUrl}/api/books/${bookId}/extract-content`, {
    method: 'POST',
  }).catch(err => {
    console.error('[Zhipu AI] Failed to trigger extraction:', err);
  });
}

/**
 * Main chat function using Zhipu AI (GLM-4)
 * Processes user questions about books with PDF content as context
 */
export async function chatWithZhipuAI(request: ChatRequest): Promise<ChatResponse> {
  const apiKey = process.env.ZHIPU_AI_API_KEY;

  // Better error logging
  if (!apiKey) {
    console.error('[Zhipu AI] ZHIPU_AI_API_KEY is not set in environment variables');
    throw new Error("ZHIPU_AI_API_KEY is not set in environment variables");
  }

  console.log('[Zhipu AI] API Key found, length:', apiKey.length);

  let token: string;
  try {
    token = await generateZhipuToken(apiKey);

    // Decode token to check expiration (for debugging)
    try {
      const tokenParts = token.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      const expirationTime = new Date(payload.exp);
      const currentTime = new Date();
      const timeUntilExpiry = expirationTime.getTime() - currentTime.getTime();

      console.log('[Zhipu AI] Token generated successfully');
      console.log('[Zhipu AI] Token expires at:', expirationTime.toISOString());
      console.log('[Zhipu AI] Time until expiry:', Math.round(timeUntilExpiry / 1000 / 60), 'minutes');

      if (timeUntilExpiry <= 0) {
        console.error('[Zhipu AI] Token has already expired!');
      }
    } catch (decodeError) {
      console.log('[Zhipu AI] Could not decode token for expiration check');
    }
  } catch (error) {
    console.error('[Zhipu AI] Token generation failed:', error);
    throw new Error('Failed to generate authentication token');
  }

  // Extract relevant content from PDF for context
  let bookContent = '';

  if (request.pdfContent) {
    // Pre-extracted content passed directly (highest priority)
    bookContent = extractRelevantContent(
      request.pdfContent,
      request.messages[request.messages.length - 1]?.content || '',
      15
    );
  } else if (request.bookId) {
    // Try to get cached content from database
    console.log('[Zhipu AI] Checking database for cached content...');

    try {
      const { getBookWithExtractedContent } = await import('@/lib/lms/repositories/book.repository');
      const bookWithContent = await getBookWithExtractedContent(request.bookId);

      if (bookWithContent?.extractedContent) {
        bookContent = extractRelevantContent(
          bookWithContent.extractedContent,
          request.messages[request.messages.length - 1]?.content || '',
          15
        );
        console.log('[Zhipu AI] Using cached content from DB, version:', bookWithContent.contentVersion);
        console.log('[Zhipu AI] Content extracted at:', bookWithContent.contentExtractedAt);

        // Trigger async re-extraction if content is old (> 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (bookWithContent.contentExtractedAt && bookWithContent.contentExtractedAt < sevenDaysAgo) {
          console.log('[Zhipu AI] Content is old (>7 days), triggering refresh...');
          triggerContentExtraction(request.bookId);
        }
      } else {
        console.log('[Zhipu AI] No cached content found, downloading PDF...');
        // Fallback to download
        const pdfData = await downloadAndExtractPdf(request.pdfUrl, request.pdfDirectUrl);
        bookContent = getPdfExcerpt(pdfData.text, 20000);
        console.log('[Zhipu AI] PDF content extracted, length:', bookContent.length);
        console.log('[Zhipu AI] PDF pages:', pdfData.numPages);

        // Trigger async extraction for next time
        console.log('[Zhipu AI] Triggering async content extraction...');
        triggerContentExtraction(request.bookId);
      }
    } catch (error) {
      console.error('[Zhipu AI] Error fetching cached content:', error);
      // Fallback to direct download
      const pdfData = await downloadAndExtractPdf(request.pdfUrl, request.pdfDirectUrl);
      bookContent = getPdfExcerpt(pdfData.text, 20000);
    }
  } else if (request.pdfUrl) {
    // No book ID, download directly
    console.log('[Zhipu AI] No book ID provided, downloading PDF directly...');
    const pdfData = await downloadAndExtractPdf(request.pdfUrl, request.pdfDirectUrl);
    bookContent = getPdfExcerpt(pdfData.text, 20000);
    console.log('[Zhipu AI] PDF content extracted, length:', bookContent.length);
    console.log('[Zhipu AI] PDF pages:', pdfData.numPages);
  }

  // Build system prompt
  const authors = request.authors.join(', ');
  const categories = request.categories.join(', ');

  const systemPrompt = `You are a knowledgeable AI assistant for a library application called Book Heaven.

Your task is to answer questions about the book "${request.bookName}" by ${authors} (${categories}).

**LANGUAGE DETECTION AND RESPONSE:**
1. Detect the language of the user's message (Bengali or English)
2. Respond in the SAME language as the user's message
3. If the user writes in Bengali (বাংলা), respond in Bengali
4. If the user writes in English, respond in English
5. The book content may be in Bengali or English - handle both languages appropriately

**CRITICAL RULES:**
1. Base ALL answers ONLY on the book content provided below
2. If information is not found in the book content, explicitly say so
3. Provide specific examples and quotes from the book when possible
4. Reference page numbers when citing specific content
5. Be concise yet comprehensive
6. Maintain a conversational, helpful tone
7. If asked about topics not covered in the book, politely redirect to what IS available
8. Match your response language to the user's question language

${bookContent ? `**BOOK CONTENT TO USE:**
${formatContentForAI(bookContent, request.bookName, request.authors)}` : '**BOOK CONTENT:** [No content available]'}

**BOOK METADATA:**
- Title: ${request.bookName}
- Authors: ${authors}
- Categories: ${categories}
- Type: ${request.bookType}

Provide accurate, helpful responses based strictly on this book's content, ALWAYS matching the user's language (Bengali or English).`;

  // Prepare messages for API (exclude system message from history)
  const apiMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...request.messages
  ];

  // Call Zhipu AI API
  const model = config.zhipuAiModel;
  console.log('[Zhipu AI] Calling API with', apiMessages.length, 'messages', 'using model:', model);

  const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      model,
      messages: apiMessages,
      temperature: 0.3, // Lower temperature for more focused responses
      top_p: 0.7,
      max_tokens: 8000,
      stream: false
    })
  });

  console.log('[Zhipu AI] API Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Zhipu AI] API Error Response:', errorText);

    // Parse error to provide better error messages
    try {
      const errorData = JSON.parse(errorText);
      const errorCode = errorData.error?.code;
      const errorMessage = errorData.error?.message;

      if (errorCode === '1211') {
        throw new Error(`Model "${model}" does not exist or is not accessible with your API key. Try using: glm-4-flash, glm-4.5-flash, or glm-4-plus`);
      } else if (errorCode === '4011' || errorMessage?.includes('token')) {
        throw new Error(`Token error: ${errorMessage}. Your token may have expired (tokens are valid for 1 hour)`);
      } else if (errorCode === '4006' || errorMessage?.includes('quota')) {
        throw new Error(`API quota exceeded: ${errorMessage}. Please check your Zhipu AI account`);
      }

      throw new Error(`Zhipu AI API error (${errorCode || response.status}): ${errorMessage || errorText}`);
    } catch (parseError) {
      throw new Error(`Zhipu AI API error (${response.status}): ${errorText}`);
    }
  }

  const data = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from Zhipu AI');
  }

  const choice = data.choices[0];
  const message = choice.message;

  // Some GLM models return the response in reasoning_content instead of content
  const responseContent = message?.content || message?.reasoning_content || '';

  console.log('[Zhipu AI] Response content length:', responseContent.length);

  return {
    response: responseContent,
    model: data.model,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens
    }
  };
}

export interface BookRequestParseResult {
  bookName: string
  authorName: string
  type: 'HARD_COPY' | 'EBOOK' | 'AUDIO'
  edition?: string
  publisher?: string
  isbn?: string
  description?: string
}

/**
 * Parse voice input for book request using AI
 * Extracts book details from natural language voice transcript
 */
export async function parseVoiceBookRequest(voiceText: string): Promise<BookRequestParseResult> {
  const apiKey = process.env.ZHIPU_AI_API_KEY

  if (!apiKey) {
    console.error('[Zhipu AI] ZHIPU_AI_API_KEY is not set')
    throw new Error('ZHIPU_AI_API_KEY is not set in environment variables')
  }

  const token = await generateZhipuToken(apiKey)

  const systemPrompt = `You are a library assistant for an app called Book Heaven. Your goal is to extract book request details from user voice transcripts.

Extract the following fields in JSON format:
- bookName: (string, required) The title of the book
- authorName: (string, required) The author's name. If not mentioned, use "Unknown Author" or try to infer from context.
- type: (string, required) Either "HARD_COPY", "EBOOK", or "AUDIO". Default to "HARD_COPY" if not specified
- edition: (string, optional) e.g., "2nd Edition", "3rd Edition"
- publisher: (string, optional) The publisher name
- isbn: (string, optional) ISBN number (can be ISBN-10 or ISBN-13)
- description: (string, optional) Any additional details about the book

Rules:
1. The user may not provide information in a specific order - identify fields contextually
2. If user says "ebook", "e-book", "electronic book", use "EBOOK"
3. If user says "audio book", "audiobook", "audio", use "AUDIO"
4. If user says "hard copy", "physical book", "hardcover", or doesn't specify, use "HARD_COPY"
5. Extract edition numbers (e.g., "2nd", "third", "2024 edition")
6. Clean up ISBN formatting (remove dashes, spaces)
7. Include any descriptive information in the description field
8. If author name is not mentioned, use "Unknown Author" instead of empty string
9. Output ONLY the raw JSON object. Do not include markdown code blocks or any other text.`

  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      model: config.zhipuAiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: voiceText }
      ],
      temperature: 0.1
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Zhipu AI] Book Request Parse Error:', errorText)
    throw new Error(`AI Service Error (${response.status}): ${errorText}`)
  }

  // Parse response with error handling for empty/malformed responses
  let data
  try {
    data = await response.json()
  } catch (jsonError) {
    console.error('[Zhipu AI] Failed to parse JSON response:', jsonError)
    throw new Error('AI service returned invalid response. Please try again.')
  }

  if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
    console.error('[Zhipu AI] Invalid response structure:', data)
    throw new Error('AI service returned invalid response format. Please try again.')
  }

  const content = data.choices[0].message.content

  console.log('[Zhipu AI] Book Request Parse Response:', content)
  console.log('[Zhipu AI] Raw response type:', typeof content)
  console.log('[Zhipu AI] Response length:', content?.length)

  try {
    // Strip markdown code blocks if present
    let cleanedJSON = content.replace(/```json/g, '').replace(/```/g, '').trim()
    console.log('[Zhipu AI] Cleaned JSON:', cleanedJSON)

    const parsed = JSON.parse(cleanedJSON)
    console.log('[Zhipu AI] Parsed successfully:', parsed)

    // Validate required fields - book name must be present and non-empty
    if (!parsed.bookName || parsed.bookName.trim() === '') {
      throw new Error('AI did not extract required field: book name')
    }

    // Author name can be empty or "Unknown Author" - user will fill it manually
    if (!parsed.authorName || parsed.authorName.trim() === '') {
      console.log('[Zhipu AI] Author name not provided, leaving empty for user to fill')
      parsed.authorName = ''
    }

    // Validate type field
    if (!parsed.type || !['HARD_COPY', 'EBOOK', 'AUDIO'].includes(parsed.type)) {
      parsed.type = 'HARD_COPY'
    }

    return parsed as BookRequestParseResult
  } catch (err) {
    console.error('[Zhipu AI] Book Request Parse Error:', content)
    throw new Error('AI returned invalid data format. Please try again.')
  }
}

// import * as jose from "jose";
//
// export async function generateZhipuToken(apiKey: string) {
//     const [id, secret] = apiKey.split(".");
//     const timestamp = Date.now();
//     const payload = {
//         api_key: id,
//         exp: timestamp + 3600000, // 1 hour
//         timestamp: timestamp,
//     };
//     const secretKey = new TextEncoder().encode(secret);
//     const token = await new jose.SignJWT(payload)
//         .setProtectedHeader({ alg: "HS256", sign_type: "SIGN" })
//         .sign(secretKey);
//     return token;
// }
//
// export async function parseTransactionWithAI(text: string, categories: any[], accounts: any[]) {
//     const apiKey = process.env.ZHIPU_AI_API_KEY;
//     if (!apiKey) throw new Error("ZHIPU_AI_API_KEY is not set");
//
//     const token = await generateZhipuToken(apiKey);
//
//     const categoryNames = categories.map(c => c.name).join(", ");
//     const accountNames = accounts.map(a => a.name).join(", ");
//
//     const systemPrompt = `You are a financial assistant for an app called Book Heaven. Your goal is to extract transaction details from user voice transcripts.
// Extract the following fields in JSON format:
// - amount: (number)
// - category: (string, match one of these if possible: ${categoryNames})
// - account: (string, match one of these if possible: ${accountNames})
// - type: (string, either 'expense' or 'income')
// - description: (string, brief summary)
// - date: (string, YYYY-MM-DD, defaults to today ${new Date().toISOString().split('T')[0]} if not mentioned)
//
// IMPORTANT: Output ONLY the raw JSON object. Do not include markdown code blocks or any other text.`;
//
//     const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//             "Authorization": `Bearer ${token}`
//         },
//         body: JSON.stringify({
//             model: "glm-4.7",
//             messages: [
//                 { role: "system", content: systemPrompt },
//                 { role: "user", content: text }
//             ],
//             temperature: 0.1
//         })
//     });
//
//     if (!response.ok) {
//         const errorText = await response.text();
//         console.error("Zhipu AI Error Details:", errorText);
//         throw new Error(`AI Service Error (${response.status}): ${errorText}`);
//     }
//
//     const data = await response.json();
//     const content = data.choices[0].message.content;
//
//     try {
//         // Strip markdown code blocks if present
//         const cleanedJSON = content.replace(/```json|```/g, "").trim();
//         return JSON.parse(cleanedJSON);
//     } catch (err) {
//         console.error("AI Response Parsing Error:", content);
//         throw new Error("AI returned invalid data format. Please try again.");
//     }
// }
