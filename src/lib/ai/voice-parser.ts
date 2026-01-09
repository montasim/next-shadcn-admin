import { generateZhipuToken } from './zhipu';
import { config } from '@/config';

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
    console.error('[Voice Parser] ZHIPU_AI_API_KEY is not set')
    throw new Error('ZHIPU_AI_API_KEY is not set in environment variables')
  }

  const token = await generateZhipuToken(apiKey)

  const systemPrompt = `You are a library assistant for a digital library platform. Your goal is to extract book request details from user voice transcripts.

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
    console.error('[Voice Parser] API Error:', errorText)
    throw new Error(`AI Service Error (${response.status}): ${errorText}`)
  }

  // Parse response with error handling for empty/malformed responses
  let data
  try {
    data = await response.json()
  } catch (jsonError) {
    console.error('[Voice Parser] Failed to parse JSON response:', jsonError)
    throw new Error('AI service returned invalid response. Please try again.')
  }

  if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
    console.error('[Voice Parser] Invalid response structure:', data)
    throw new Error('AI service returned invalid response format. Please try again.')
  }

  const content = data.choices[0].message.content

  console.log('[Voice Parser] Parse Response:', content)
  console.log('[Voice Parser] Response type:', typeof content)
  console.log('[Voice Parser] Response length:', content?.length)

  try {
    // Strip markdown code blocks if present
    let cleanedJSON = content.replace(/```json/g, '').replace(/```/g, '').trim()
    console.log('[Voice Parser] Cleaned JSON:', cleanedJSON)

    const parsed = JSON.parse(cleanedJSON)
    console.log('[Voice Parser] Parsed successfully:', parsed)

    // Validate required fields - book name must be present and non-empty
    if (!parsed.bookName || parsed.bookName.trim() === '') {
      throw new Error('AI did not extract required field: book name')
    }

    // Author name can be empty or "Unknown Author" - user will fill it manually
    if (!parsed.authorName || parsed.authorName.trim() === '') {
      console.log('[Voice Parser] Author name not provided, leaving empty for user to fill')
      parsed.authorName = ''
    }

    // Validate type field
    if (!parsed.type || !['HARD_COPY', 'EBOOK', 'AUDIO'].includes(parsed.type)) {
      parsed.type = 'HARD_COPY'
    }

    return parsed as BookRequestParseResult
  } catch (err) {
    console.error('[Voice Parser] Parse Error:', content)
    throw new Error('AI returned invalid data format. Please try again.')
  }
}
