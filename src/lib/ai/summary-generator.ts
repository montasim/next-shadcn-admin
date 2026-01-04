import { generateZhipuToken } from './zhipu';

export interface SummaryGenerationOptions {
  bookName: string;
  authors: string[];
  categories: string[];
  bookContent: string;
  targetWords?: number; // Default: 200
}

export interface GeneratedSummary {
  summary: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Generate a book summary using Zhipu AI
 *
 * @param options - Summary generation options
 * @returns Generated summary with metadata
 */
export async function generateBookSummary(
  options: SummaryGenerationOptions
): Promise<GeneratedSummary> {
  const apiKey = process.env.ZHIPU_AI_API_KEY;

  if (!apiKey) {
    console.error('[Summary Generator] ZHIPU_AI_API_KEY is not set');
    throw new Error('ZHIPU_AI_API_KEY is not set');
  }

  const token = await generateZhipuToken(apiKey);
  const targetWords = options.targetWords || 200;

  // Build categories text for context
  const categoriesText = options.categories.length > 0
    ? `CONTEXT: This book is categorized as: ${options.categories.join(', ')}`
    : '';

  // Build authors text
  const authorsText = options.authors.length > 0
    ? options.authors.join(', ')
    : 'Unknown Author';

  // Multi-language aware system prompt
  const systemPrompt = `You are an expert book summarizer for a digital library platform.

TASK: Create a concise summary of the book "${options.bookName}" by ${authorsText}.

REQUIREMENTS:
1. Length: Approximately ${targetWords} words (150-250 words acceptable)
2. Language: Match the language of the book content (Bengali or English)
3. Content: Focus on main themes, key concepts, and significant insights
4. Style: Clear, engaging, and informative
5. No spoilers: Don't reveal plot twists or endings (for fiction)

${categoriesText}

BOOK CONTENT (first 8000 characters for context):
${options.bookContent.substring(0, 8000)}

Generate the summary now:`;

  try {
    console.log('[Summary Generator] Sending request to Zhipu AI...');

    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        model: process.env.ZHIPU_AI_MODEL || 'glm-4.7',
        messages: [{ role: 'user', content: systemPrompt }],
        temperature: 0.5,
        max_tokens: 1000,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Summary Generator] API error:', response.status, errorText);
      throw new Error(`Summary generation failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content || '';

    console.log('[Summary Generator] Summary generated successfully');
    console.log('[Summary Generator] Usage:', data.usage);

    return {
      summary: summary.trim(),
      model: data.model,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      }
    };
  } catch (error: any) {
    console.error('[Summary Generator] Error:', error);
    throw error;
  }
}

/**
 * Generate book summary with retry logic
 *
 * @param options - Summary generation options
 * @param maxRetries - Maximum number of retries (default: 3)
 * @returns Generated summary with metadata
 */
export async function generateBookSummaryWithRetry(
  options: SummaryGenerationOptions,
  maxRetries: number = 3
): Promise<GeneratedSummary> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Summary Generator] Attempt ${attempt}/${maxRetries}`);
      return await generateBookSummary(options);
    } catch (error: any) {
      lastError = error;
      console.error(`[Summary Generator] Attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        // Exponential backoff: 2^attempt seconds
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[Summary Generator] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`[Summary Generator] All ${maxRetries} attempts failed`);
  throw lastError || new Error('Failed to generate summary after all retries');
}
