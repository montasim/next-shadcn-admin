import { NextRequest, NextResponse } from 'next/server';
import { chatWithZhipuAI } from '@/lib/ai/zhipu-chat';
import { generatePreFilledQuery } from '@/lib/ai/query-generator';
import { saveChatMessage, getNextMessageIndex } from '@/lib/lms/repositories/book-chat.repository';
import { getSession } from '@/lib/auth/session';
import { findUserById } from '@/lib/user/repositories/user.repository';
import { crypto } from 'node:crypto';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/books/[id]/chat
 * Chat with AI about a specific book
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: bookId } = await params;
    console.log('[Chat API] Received request for book:', bookId);

    const body = await request.json();

    const {
      message,
      conversationHistory = [],
      generatePrefilled = false
    } = body;

    console.log('[Chat API] Request body:', { message, generatePrefilled, historyLength: conversationHistory.length });

    // Get user from session (required for chat)
    const session = await getSession();
    const user = session ? await findUserById(session.userId) : null;
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required for chat' },
        { status: 401 }
      );
    }

    // Generate or retrieve session ID for grouping messages
    let sessionId = body.sessionId;
    if (!sessionId) {
      // Check if there's a recent session (within 30 minutes or today)
      const lastChat = conversationHistory.length > 0 ? conversationHistory[0] : null;
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // If no recent session, create new one
      sessionId = crypto.randomBytes(16).toString('hex');
    }

    // Fetch book details from public API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'http://localhost:3000';
    const bookResponse = await fetch(`${baseUrl}/api/public/books/${bookId}`);

    console.log('[Chat API] Book API response status:', bookResponse.status);

    if (!bookResponse.ok) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    const bookData = await bookResponse.json();
    const book = bookData.data?.book;

    if (!book) {
      console.error('[Chat API] Book data not found in response');
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    console.log('[Chat API] Book found:', book.name, 'Type:', book.type);

    // Verify it's an ebook or audiobook
    if (book.type !== 'EBOOK' && book.type !== 'AUDIO') {
      return NextResponse.json(
        { error: 'Chat is only available for ebooks and audiobooks' },
        { status: 400 }
      );
    }

    // Check if user has access
    const userAccess = bookData.data?.userAccess;
    if (!userAccess?.canAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this book. Premium access may be required.' },
        { status: 403 }
      );
    }

    // Check if file URL exists
    if (!book.fileUrl) {
      return NextResponse.json(
        { error: 'Book file is not available for chat' },
        { status: 400 }
      );
    }

    // Prepare messages
    let messages = conversationHistory.map((m: any) => ({
      role: m.role,
      content: m.content
    }));

    let userMessage = '';

    // Generate pre-filled query for first message
    if (generatePrefilled || messages.length === 0) {
      const preFilledQuery = await generatePreFilledQuery(book);
      userMessage = preFilledQuery;
      messages = [
        { role: 'user', content: userMessage }
      ];
    } else if (message) {
      userMessage = message;
      messages.push({ role: 'user', content: userMessage });
    }

    // Save user message to database
    try {
      const messageIndex = await getNextMessageIndex(bookId, sessionId);
      await saveChatMessage({
        bookId,
        userId: user.id,
        sessionId,
        role: 'user',
        content: userMessage,
        messageIndex,
      });
    } catch (error) {
      console.error('[Chat API] Failed to save user message:', error);
      // Continue anyway - don't block chat for logging errors
    }

    // Call Zhipu AI
    console.log('[Chat API] Calling Zhipu AI service...');

    // Safely extract authors and categories
    const authorNames = book.authors && Array.isArray(book.authors)
      ? book.authors.map((a: any) => a.name)
      : [];

    const categoryNames = book.categories && Array.isArray(book.categories)
      ? book.categories.map((c: any) => c.name)
      : [];

    const result = await chatWithZhipuAI({
      bookId: book.id,
      bookName: book.name,
      bookType: book.type,
      pdfUrl: book.fileUrl,
      pdfDirectUrl: book.directFileUrl,
      authors: authorNames,
      categories: categoryNames,
      messages
    });

    console.log('[Chat API] Zhipu AI response received, length:', result.response.length);

    // Add assistant response to history
    messages.push({ role: 'assistant', content: result.response });

    // Save assistant response to database
    try {
      const messageIndex = await getNextMessageIndex(bookId, sessionId);
      await saveChatMessage({
        bookId,
        userId: user.id,
        sessionId,
        role: 'assistant',
        content: result.response,
        messageIndex,
      });
    } catch (error) {
      console.error('[Chat API] Failed to save assistant message:', error);
      // Continue anyway - don't block chat for logging errors
    }

    return NextResponse.json({
      response: result.response,
      conversationHistory: messages,
      sessionId,
      usage: result.usage
    });

  } catch (error: any) {
    console.error('[Chat API] Error:', error);
    console.error('[Chat API] Error stack:', error.stack);
    return NextResponse.json(
      {
        error: error.message || 'Failed to process chat request',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/books/[id]/chat
 * Returns chat availability info
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: bookId } = await params;

    // Fetch book details
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'http://localhost:3000';
    const bookResponse = await fetch(`${baseUrl}/api/public/books/${bookId}`);

    if (!bookResponse.ok) {
      return NextResponse.json(
        { available: false, reason: 'Book not found' }
      );
    }

    const bookData = await bookResponse.json();
    const book = bookData.data?.book;

    if (!book) {
      return NextResponse.json(
        { available: false, reason: 'Book not found' }
      );
    }

    // Check availability
    const isEbookOrAudio = book.type === 'EBOOK' || book.type === 'AUDIO';
    const hasFile = !!book.fileUrl;
    const hasAccess = bookData.data?.userAccess?.canAccess;

    return NextResponse.json({
      available: isEbookOrAudio && hasFile && hasAccess,
      bookType: book.type,
      hasFile,
      hasAccess,
      reason: !isEbookOrAudio ? 'Chat is only available for ebooks and audiobooks' :
              !hasFile ? 'Book file is not available' :
              !hasAccess ? 'You do not have access to this book' :
              null
    });

  } catch (error: any) {
    console.error('Chat availability check error:', error);
    return NextResponse.json(
      { available: false, reason: 'Failed to check availability' },
      { status: 500 }
    );
  }
}
