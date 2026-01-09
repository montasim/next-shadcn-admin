import { NextRequest, NextResponse } from 'next/server';
import {
  getBookWithExtractedContent,
  clearBookExtractedContent,
} from '@/lib/lms/repositories/book.repository';
import { notifyPdfProcessor } from '@/lib/pdf-processor/notifier';
import { getBookById } from '@/lib/lms/repositories/book.repository';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/books/[id]/extract-content
 * Trigger content extraction for a book
 * Notifies the external PDF processor service to handle the extraction
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    console.log('[Content Extraction API] Triggering PDF processing for book:', id);

    // Get full book details
    const book = await getBookById(id);

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

    // Clear any existing content to force re-processing
    await clearBookExtractedContent(id);

    // Get author names for the processor
    const authorNames = book.authors?.map(a => a.author?.name).filter(Boolean) || [];

    // Notify the external PDF processor service
    console.log('[Content Extraction API] Notifying external PDF processor service...');

    await notifyPdfProcessor({
      bookId: id,
      pdfUrl: book.fileUrl,
      directPdfUrl: book.directFileUrl,
      bookName: book.name,
      authorNames,
    });

    console.log('[Content Extraction API] PDF processor notification sent successfully');

    return NextResponse.json({
      message: 'PDF processing triggered',
      note: 'The PDF is being processed by the external service. This may take 30-60 seconds.',
      triggered: true
    });

  } catch (error: any) {
    console.error('[Content Extraction API] Error:', error);
    console.error('[Content Extraction API] Stack:', error.stack);

    return NextResponse.json(
      {
        error: error.message || 'Failed to trigger PDF processing',
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
