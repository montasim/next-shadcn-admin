import { NextRequest, NextResponse } from 'next/server';
import {
  getBookWithExtractedContent,
  updateBookExtractedContent
} from '@/lib/lms/repositories/book.repository';
import { extractBookContent } from '@/lib/ai/book-content-extractor';
import { queueBookExtraction } from '@/lib/queue/job-handler';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/books/[id]/extract-content
 * Trigger content extraction for a book
 * Uses job queue if available, otherwise processes synchronously
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    console.log('[Content Extraction API] Starting extraction for book:', id);

    // Get book
    const book = await getBookWithExtractedContent(id);

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (!book.fileUrl) {
      return NextResponse.json(
        { error: 'Book has no file URL' },
        { status: 400 }
      );
    }

    // Check if already extracted
    if (book.extractedContent && book.contentHash) {
      console.log('[Content Extraction API] Content already exists, version:', book.contentVersion);

      return NextResponse.json({
        message: 'Content already extracted',
        wordCount: book.contentWordCount,
        pageCount: book.contentPageCount,
        version: book.contentVersion,
        extractedAt: book.contentExtractedAt
      });
    }

    // Try to queue the job first (better for scalability)
    const queueResult = await queueBookExtraction(id, book.fileUrl, book.directFileUrl);

    if (queueResult.queued) {
      console.log('[Content Extraction API] Job queued successfully:', queueResult.jobId);

      return NextResponse.json({
        message: 'Content extraction queued',
        jobId: queueResult.jobId,
        queued: true
      });
    }

    // Fallback to synchronous processing if queue is not available
    console.log('[Content Extraction API] Processing extraction synchronously...');

    // Extract content
    const content = await extractBookContent(book);

    // Save to database
    await updateBookExtractedContent(id, {
      extractedContent: content.text,
      contentHash: content.hash,
      contentPageCount: content.numPages,
      contentWordCount: content.wordCount,
      contentSize: content.size,
      extractionStatus: 'completed'
    });

    console.log('[Content Extraction API] Extraction completed successfully');

    return NextResponse.json({
      message: 'Content extracted successfully',
      wordCount: content.wordCount,
      pageCount: content.numPages,
      size: content.size,
      version: (book.contentVersion || 0) + 1,
      queued: false
    });

  } catch (error: any) {
    console.error('[Content Extraction API] Error:', error);
    console.error('[Content Extraction API] Stack:', error.stack);

    return NextResponse.json(
      {
        error: error.message || 'Content extraction failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/books/[id]/extract-content
 * Get content extraction status for a book
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const book = await getBookWithExtractedContent(id);

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json({
      hasContent: !!book.extractedContent,
      status: book.extractionStatus || 'none',
      wordCount: book.contentWordCount,
      pageCount: book.contentPageCount,
      version: book.contentVersion,
      extractedAt: book.contentExtractedAt
    });

  } catch (error: any) {
    console.error('[Content Extraction API] GET Error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to get extraction status' },
      { status: 500 }
    );
  }
}
