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
    // Use pre-extracted content
    bookContent = extractRelevantContent(
      request.pdfContent,
      request.messages[request.messages.length - 1]?.content || '',
      15
    );
  } else if (request.pdfUrl) {
    // Download and extract PDF content
    console.log('[Zhipu AI] Downloading PDF from:', request.pdfUrl);

    try {
      const pdfData = await downloadAndExtractPdf(
        request.pdfUrl,
        request.pdfDirectUrl // Pass direct URL for better performance
      );

      // Get a reasonable excerpt (first 20k chars) to avoid exceeding token limits
      bookContent = getPdfExcerpt(pdfData.text, 20000);

      console.log('[Zhipu AI] PDF content extracted, length:', bookContent.length);
      console.log('[Zhipu AI] PDF pages:', pdfData.numPages);
    } catch (error: any) {
      console.error('[Zhipu AI] PDF extraction failed:', error);
      // Continue without PDF content - AI will answer based on metadata only
      bookContent = `[Could not extract PDF content: ${error.message}]`;
    }
  }

  // Build system prompt
  const authors = request.authors.join(', ');
  const categories = request.categories.join(', ');

  const systemPrompt = `You are a knowledgeable AI assistant for a library application called Haseeb.

Your task is to answer questions about the book "${request.bookName}" by ${authors} (${categories}).

**CRITICAL RULES:**
1. Base ALL answers ONLY on the book content provided below
2. If information is not found in the book content, explicitly say so
3. Provide specific examples and quotes from the book when possible
4. Reference page numbers when citing specific content
5. Be concise yet comprehensive
6. Maintain a conversational, helpful tone
7. If asked about topics not covered in the book, politely redirect to what IS available

${bookContent ? `**BOOK CONTENT TO USE:**
${formatContentForAI(bookContent, request.bookName, request.authors)}` : '**BOOK CONTENT:** [No content available]'}

**BOOK METADATA:**
- Title: ${request.bookName}
- Authors: ${authors}
- Categories: ${categories}
- Type: ${request.bookType}

Provide accurate, helpful responses based strictly on this book's content.`;

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
//     const systemPrompt = `You are a financial assistant for an app called Haseeb. Your goal is to extract transaction details from user voice transcripts.
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
