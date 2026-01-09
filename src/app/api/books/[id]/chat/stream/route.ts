import { NextRequest } from 'next/server';
import { chatWithUnifiedProviderStream } from '@/lib/ai/unified-chat';
import { saveChatMessage, getNextMessageIndex } from '@/lib/lms/repositories/book-chat.repository';
import { getSession } from '@/lib/auth/session';
import { findUserById } from '@/lib/user/repositories/user.repository';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/books/[id]/chat/stream
 * Streaming chat endpoint for real-time AI responses
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id: bookId } = await params;

  // Create a streaming response
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        const { message, conversationHistory = [], sessionId } = body;

        // Get user from session (required for chat)
        const session = await getSession();
        if (!session?.userId) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Authentication required' })}\n\n`));
          controller.close();
          return;
        }

        const user = await findUserById(session.userId);
        if (!user) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'User not found' })}\n\n`));
          controller.close();
          return;
        }

        // Fetch book details and check access
        const book = await prisma.book.findUnique({
          where: { id: bookId },
          select: {
            id: true,
            name: true,
            type: true,
            fileUrl: true,
            directFileUrl: true,
            isPublic: true,
            requiresPremium: true,
            authors: {
              select: {
                author: {
                  select: { name: true }
                }
              }
            },
            categories: {
              select: {
                category: {
                  select: { name: true }
                }
              }
            }
          }
        });

        if (!book) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Book not found' })}\n\n`));
          controller.close();
          return;
        }

        if (book.type !== 'EBOOK' && book.type !== 'AUDIO') {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Chat is only available for ebooks and audiobooks' })}\n\n`));
          controller.close();
          return;
        }

        // Check user access
        const isPremium = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
        const hasAccess = book.isPublic || (book.requiresPremium && isPremium);

        if (!hasAccess) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'You do not have access to this book' })}\n\n`));
          controller.close();
          return;
        }

        // Generate or retrieve session ID
        let finalSessionId = sessionId || randomBytes(16).toString('hex');

        // Prepare messages
        const history = conversationHistory as any[];
        const messages = history.map((m: any) => ({
          role: m.role,
          content: m.content
        }));

        if (message) {
          messages.push({ role: 'user', content: message });
        }

        // Save user message to database
        try {
          const messageIndex = await getNextMessageIndex(bookId, finalSessionId);
          await saveChatMessage({
            bookId,
            userId: user.id,
            sessionId: finalSessionId,
            role: 'user',
            content: message,
            messageIndex,
          });
        } catch (error) {
          console.error('[Chat Stream API] Failed to save user message:', error);
        }

        // Safely extract authors and categories
        const authorNames = book.authors && Array.isArray(book.authors)
          ? book.authors.map((a) => a.author.name)
          : [];

        const categoryNames = book.categories && Array.isArray(book.categories)
          ? book.categories.map((c) => c.category.name)
          : [];

        // Start the streaming chat
        let fullResponse = '';

        const chatStream = chatWithUnifiedProviderStream({
          bookId: book.id,
          bookName: book.name,
          bookType: book.type,
          pdfUrl: book.fileUrl || book.directFileUrl || '',
          pdfDirectUrl: book.directFileUrl || book.fileUrl || '',
          authors: authorNames,
          categories: categoryNames,
          messages,
          userId: user.id
        });

        // Send start event
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start', sessionId: finalSessionId })}\n\n`));

        // Stream chunks
        for await (const { chunk, provider } of chatStream) {
          fullResponse += chunk;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk, provider })}\n\n`));
        }

        // Get the final result
        const result = await chatStream.next();

        // Save assistant response to database
        try {
          const messageIndex = await getNextMessageIndex(bookId, finalSessionId);
          await saveChatMessage({
            bookId,
            userId: user.id,
            sessionId: finalSessionId,
            role: 'assistant',
            content: fullResponse,
            messageIndex,
          });
        } catch (error) {
          console.error('[Chat Stream API] Failed to save assistant message:', error);
        }

        // Send done event with final metadata
        const metadata = result.value || { usage: {}, provider: 'zhipu', model: '', method: 'full-content' };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'done',
          response: fullResponse,
          usage: (metadata as any).usage,
          provider: (metadata as any).provider,
          model: (metadata as any).model,
          method: (metadata as any).method
        })}\n\n`));

        controller.close();
      } catch (error: any) {
        console.error('[Chat Stream API] Error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: error.message || 'Failed to process chat request' })}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
