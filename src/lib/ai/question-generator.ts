import { generateZhipuToken } from './zhipu';

export interface QuestionGenerationOptions {
  bookName: string;
  authors: string[];
  categories: string[];
  bookContent: string;
  questionCount?: number; // Default: 20
}

export interface QuestionAnswer {
  question: string;
  answer: string;
}

export interface GeneratedQuestions {
  questions: QuestionAnswer[];
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Parse numbered list format Q&A
 * Format: "1. **Q:** Question text **A:** Answer text"
 */
function parseNumberedListFormat(content: string): QuestionAnswer[] {
  const questions: QuestionAnswer[] = [];

  // Split by numbered pattern (1., 2., etc.)
  const items = content.split(/\n\s*\d+\.\s*\*\*Q:\*\*/);

  for (const item of items) {
    if (!item.trim()) continue;

    // Extract question and answer
    // Format: "**Q:** Question **A:** Answer"
    const answerMatch = item.split(/\*\*A:\*\*/);

    if (answerMatch.length >= 2) {
      const question = answerMatch[0].trim().replace(/^\*\*Q:\*\*/, '').trim();
      const answer = answerMatch[1].trim();

      // Clean up markdown formatting
      const cleanQuestion = question.replace(/\*\*/g, '').trim();
      const cleanAnswer = answer.replace(/\*\*/g, '').trim();

      if (cleanQuestion && cleanAnswer) {
        questions.push({
          question: cleanQuestion,
          answer: cleanAnswer,
        });
      }
    }
  }

  // Also try alternative format: "1. Q: ... A: ..." (without bold)
  if (questions.length === 0) {
    const altItems = content.split(/\n\s*\d+\.\s+Q:\s*/);
    for (const item of altItems) {
      if (!item.trim()) continue;

      const parts = item.split(/\s+A:\s*/);
      if (parts.length >= 2) {
        const question = parts[0].trim();
        let answer = parts.slice(1).join(' ').trim();

        // Remove trailing content that's not part of the answer
        answer = answer.split(/\n\s*\d+\./)[0].trim();

        if (question && answer) {
          questions.push({ question, answer });
        }
      }
    }
  }

  return questions;
}

/**
 * Generate book questions and answers using Zhipu AI
 *
 * @param options - Question generation options
 * @returns Generated questions with metadata
 */
export async function generateBookQuestions(
  options: QuestionGenerationOptions
): Promise<GeneratedQuestions> {
  const apiKey = process.env.ZHIPU_AI_API_KEY;

  if (!apiKey) {
    console.error('[Question Generator] ZHIPU_AI_API_KEY is not set');
    throw new Error('ZHIPU_AI_API_KEY is not set');
  }

  // Validate book content
  if (!options.bookContent || options.bookContent.trim().length === 0) {
    console.error('[Question Generator] Book content is empty');
    throw new Error('Book content is empty. Cannot generate questions without content.');
  }

  console.log('[Question Generator] Book content length:', options.bookContent.length);
  console.log('[Question Generator] Book name:', options.bookName);

  const token = await generateZhipuToken(apiKey);
  const questionCount = options.questionCount || 20;

  // Build categories text for context
  const categoriesText = options.categories.length > 0
    ? `CONTEXT: This book is categorized as: ${options.categories.join(', ')}`
    : '';

  // Build authors text
  const authorsText = options.authors.length > 0
    ? options.authors.join(', ')
    : 'Unknown Author';

  // Multi-language aware system prompt
  const systemPrompt = `You are an educational content creator for a digital library platform.

TASK: Generate ${questionCount} thoughtful questions and answers about the book "${options.bookName}" by ${authorsText}.

REQUIREMENTS:
1. Generate exactly ${questionCount} question-answer pairs
2. Language: Match the language of the book content (Bengali or English)
3. Questions should:
   - Test understanding of key concepts
   - Cover different topics from the book
   - Vary in difficulty (basic, intermediate, advanced)
   - Be answerable from the book content
4. Answers should:
   - Be comprehensive but concise (2-3 sentences)
   - Directly address the question
   - Be based ONLY on the provided book content

${categoriesText}

BOOK CONTENT (first 12000 characters for context):
${options.bookContent.substring(0, 12000)}

OUTPUT FORMAT: Return a JSON array with this exact structure:
[
  {
    "question": "Your question text here?",
    "answer": "Your answer text here."
  }
]

Generate the ${questionCount} questions and answers now. Return ONLY the JSON array, no other text:`;

  try {
    console.log('[Question Generator] Sending request to Zhipu AI...');

    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        model: process.env.ZHIPU_AI_MODEL || 'glm-4.7',
        messages: [{ role: 'user', content: systemPrompt }],
        temperature: 0.7,
        max_tokens: 8000,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Question Generator] API error:', response.status, errorText);
      throw new Error(`Question generation failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const choice = data.choices[0];
    let content = choice?.message?.content || '';

    // Check if content is in reasoning_content (happens when max_tokens is reached)
    if ((!content || content.trim().length === 0) && choice?.message?.reasoning_content) {
      console.log('[Question Generator] Using reasoning_content as content (max_tokens reached)');
      content = choice.message.reasoning_content;
    }

    // Validate we have content
    if (!content || content.trim().length === 0) {
      console.error('[Question Generator] AI returned empty response');
      console.error('[Question Generator] API response:', JSON.stringify(data, null, 2));
      throw new Error('AI returned empty response. Please try again.');
    }

    // Log finish reason for debugging
    if (choice?.finish_reason) {
      console.log('[Question Generator] Finish reason:', choice.finish_reason);
      if (choice.finish_reason === 'length') {
        console.warn('[Question Generator] Response was truncated due to max_tokens limit');
      }
    }

    // Parse JSON response
    let questions: QuestionAnswer[];
    let cleanedContent = content.trim();

    try {
      // Clean up any markdown code blocks
      cleanedContent = content.trim();

      console.log('[Question Generator] Raw content length:', content.length);
      console.log('[Question Generator] Cleaned content preview:', cleanedContent.substring(0, 200));

      // If content is not starting with '[', it might have reasoning text before JSON
      // Try to find the JSON array start
      if (!cleanedContent.startsWith('[')) {
        const jsonStartIndex = cleanedContent.indexOf('[');
        if (jsonStartIndex !== -1) {
          // Find the matching closing bracket
          let bracketCount = 0;
          let jsonEndIndex = jsonStartIndex;
          for (let i = jsonStartIndex; i < cleanedContent.length; i++) {
            if (cleanedContent[i] === '[') bracketCount++;
            if (cleanedContent[i] === ']') bracketCount--;
            if (bracketCount === 0) {
              jsonEndIndex = i + 1;
              break;
            }
          }
          if (bracketCount === 0) {
            cleanedContent = cleanedContent.substring(jsonStartIndex, jsonEndIndex);
            console.log('[Question Generator] Extracted JSON from mixed content');
          }
        }
      }

      // Remove markdown code blocks if present
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.slice(7);
      }
      if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.slice(3);
      }
      if (cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.slice(0, -3);
      }
      cleanedContent = cleanedContent.trim();

      questions = JSON.parse(cleanedContent);

      // Validate we got an array
      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }

      // Validate we have the expected number of questions
      if (questions.length !== questionCount) {
        console.warn(`[Question Generator] Expected ${questionCount} questions, got ${questions.length}`);
      }

      // Validate structure of each question
      questions = questions.filter((q: any) => {
        return q && typeof q.question === 'string' && typeof q.answer === 'string';
      });

      if (questions.length === 0) {
        throw new Error('No valid questions found in response');
      }

      console.log(`[Question Generator] Successfully parsed ${questions.length} questions`);
    } catch (parseError) {
      console.error('[Question Generator] JSON parse failed, trying numbered list format...');
      console.error('[Question Generator] Parse error:', parseError);

      // Try parsing numbered format: "1. **Q:** ... **A:** ..."
      questions = parseNumberedListFormat(cleanedContent);

      if (questions.length === 0) {
        console.error('[Question Generator] Failed to parse AI response:', content.substring(0, 1000));
        throw new Error('Failed to parse generated questions. AI returned invalid format.');
      }

      console.log(`[Question Generator] Successfully parsed ${questions.length} questions from numbered format`);
    }

    console.log('[Question Generator] Usage:', data.usage);

    return {
      questions,
      model: data.model,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      }
    };
  } catch (error: any) {
    console.error('[Question Generator] Error:', error);
    throw error;
  }
}

/**
 * Generate book questions with retry logic
 *
 * @param options - Question generation options
 * @param maxRetries - Maximum number of retries (default: 3)
 * @returns Generated questions with metadata
 */
export async function generateBookQuestionsWithRetry(
  options: QuestionGenerationOptions,
  maxRetries: number = 3
): Promise<GeneratedQuestions> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Question Generator] Attempt ${attempt}/${maxRetries}`);
      return await generateBookQuestions(options);
    } catch (error: any) {
      lastError = error;
      console.error(`[Question Generator] Attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        // Exponential backoff: 2^attempt seconds
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[Question Generator] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`[Question Generator] All ${maxRetries} attempts failed`);
  throw lastError || new Error('Failed to generate questions after all retries');
}
