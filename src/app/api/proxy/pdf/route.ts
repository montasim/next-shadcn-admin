import { NextRequest, NextResponse } from 'next/server';
import { pdfCache, generateCacheKey } from '@/lib/cache/pdf-cache';
import { googleDriveUrlSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('URL parameter is missing', { status: 400 });
  }

  // Validate the Google Drive URL
  const validationResult = googleDriveUrlSchema.safeParse(url)
  if (!validationResult.success) {
    return new NextResponse('Invalid Google Drive URL', { status: 400 });
  }

  console.log('[PDF Proxy] Starting download for URL:', url);

  try {
    // Generate cache key
    const cacheKey = generateCacheKey(url);

    // Check cache first
    const cachedBuffer = pdfCache.get(cacheKey);
    if (cachedBuffer) {
      console.log('[PDF Proxy] Serving from cache');
      return new NextResponse(cachedBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'X-Cache': 'HIT',
        },
      });
    }

    // Cache miss - fetch from Google Drive
    console.log('[PDF Proxy] Cache miss, fetching from Google Drive...');

    // Google Drive preview URLs are not direct file links.
    // A common workaround is to modify the URL to get a direct download link.
    // e.g., from /preview to /export?format=pdf or by getting the direct download link.
    // However, since we have the file ID, we can construct a more reliable direct download link.
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!fileIdMatch) {
      throw new Error('Could not extract file ID from Google Drive URL.');
    }
    const fileId = fileIdMatch[1];
    const directDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    console.log('[PDF Proxy] File ID:', fileId);
    console.log('[PDF Proxy] Fetching from Google Drive...');

    // Add AbortController for timeout (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(directDownloadUrl, {
      headers: {
        // It's good practice to set a user-agent
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[PDF Proxy] Response status:', response.status);

    if (!response.ok) {
      // If the first attempt fails, it might be a large file that requires a confirmation click.
      // We can try to follow the redirect pattern Google uses.
      const text = await response.text();
      const confirmationCodeMatch = text.match(/confirm=([a-zA-Z0-9_-]+)/);
      if (confirmationCodeMatch) {
        const confirmationCode = confirmationCodeMatch[1];
        console.log('[PDF Proxy] Confirmation code found:', confirmationCode);

        const confirmedUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirmationCode}`;

        // Add timeout for confirmed fetch too
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 30000);

        const confirmedResponse = await fetch(confirmedUrl, {
          signal: controller2.signal,
        });

        clearTimeout(timeoutId2);

        if (!confirmedResponse.ok) {
          throw new Error(`Failed to fetch confirmed download: ${confirmedResponse.statusText}`);
        }

        const fileBuffer = await confirmedResponse.arrayBuffer();
        console.log('[PDF Proxy] Download complete, size:', fileBuffer.byteLength, 'bytes');

        // Cache the buffer
        pdfCache.set(cacheKey, fileBuffer);

        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'X-Cache': 'MISS',
          },
        });
      }

      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }

    const fileBuffer = await response.arrayBuffer();
    console.log('[PDF Proxy] Download complete, size:', fileBuffer.byteLength, 'bytes');

    // Cache the buffer
    pdfCache.set(cacheKey, fileBuffer);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'X-Cache': 'MISS',
      },
    });

  } catch (error: any) {
    console.error('[PDF Proxy] Error:', error);
    if (error.name === 'AbortError') {
      return new NextResponse('Download timeout - PDF file is too large or server is slow', { status: 408 });
    }
    return new NextResponse(error.message, { status: 500 });
  }
}
