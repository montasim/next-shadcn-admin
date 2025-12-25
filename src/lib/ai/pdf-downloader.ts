import { PDFParse } from 'pdf-parse';

export interface ParsedPdf {
  text: string;
  numPages: number;
  info: any;
}

/**
 * Downloads and extracts text content from a PDF URL
 * Uses the existing PDF proxy endpoint for Google Drive files
 */
export async function downloadAndExtractPdf(
  pdfUrl: string,
  directUrl?: string | null
): Promise<ParsedPdf> {
  console.log('[PDF Downloader] Starting download from:', pdfUrl);

  // Use direct URL if available for better performance, otherwise use proxy
  let downloadUrl = pdfUrl;

  if (directUrl) {
    // Use direct URL without proxy
    downloadUrl = directUrl;
    console.log('[PDF Downloader] Using direct URL');
  } else if (pdfUrl.includes('drive.google.com')) {
    // Fall back to proxy for Google Drive files
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'http://localhost:3000';
    downloadUrl = `${baseUrl}/api/proxy/pdf?url=${encodeURIComponent(pdfUrl)}`;
    console.log('[PDF Downloader] Using proxy endpoint:', downloadUrl);
  }

  // Download PDF buffer once
  try {
    console.log('[PDF Downloader] Downloading PDF...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(downloadUrl, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    console.log('[PDF Downloader] PDF downloaded, size:', buffer.byteLength, 'bytes');

    // Parse the buffer - use getText to extract content
    console.log('[PDF Downloader] Extracting text from PDF...');

    const dataBuffer = Buffer.from(buffer);
    const parser = new PDFParse({ data: dataBuffer });

    // Get text and metadata in one operation
    const result = await parser.getText();
    const info = await parser.getInfo({ parsePageInfo: true });

    await parser.destroy();

    console.log('[PDF Downloader] Text extracted successfully');
    console.log('[PDF Downloader] Text length:', result.text?.length || 0, 'characters');
    console.log('[PDF Downloader] Pages:', info.total);

    return {
      text: result.text || '',
      numPages: info.total,
      info: info.info
    };
  } catch (error: any) {
    console.error('[PDF Downloader] PDF parsing failed:', error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

/**
 * Gets a reasonable excerpt from PDF text for AI context
 * Returns first N characters worth of content
 */
export function getPdfExcerpt(
  text: string,
  maxChars: number = 20000
): string {
  if (text.length <= maxChars) {
    return text;
  }

  // Get first portion and add a note
  return text.substring(0, maxChars) + '\n\n[... Content truncated for length. The full book contains more content ...]';
}

/**
 * Get page count from a PDF File
 * Faster than full extraction - only gets metadata
 * @param file - The PDF file
 * @returns Number of pages in the PDF
 */
export async function getPdfPageCount(file: File): Promise<number> {
  console.log('[PDF Downloader] Getting page count for:', file.name);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });

    // Only get info, not full text (much faster)
    const info = await parser.getInfo({ parsePageInfo: true });

    await parser.destroy();

    const pageCount = info.total || 0;
    console.log('[PDF Downloader] Page count:', pageCount);

    return pageCount;
  } catch (error: any) {
    console.error('[PDF Downloader] Failed to get page count:', error);
    throw new Error(`Failed to get PDF page count: ${error.message}`);
  }
}
