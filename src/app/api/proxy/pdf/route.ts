import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('URL parameter is missing', { status: 400 });
  }

  try {
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

    const response = await fetch(directDownloadUrl, {
      headers: {
        // It's good practice to set a user-agent
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
      },
    });

    if (!response.ok) {
      // If the first attempt fails, it might be a large file that requires a confirmation click.
      // We can try to follow the redirect pattern Google uses.
      const text = await response.text();
      const confirmationCodeMatch = text.match(/confirm=([a-zA-Z0-9_-]+)/);
      if (confirmationCodeMatch) {
        const confirmationCode = confirmationCodeMatch[1];
        const confirmedUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirmationCode}`;
        const confirmedResponse = await fetch(confirmedUrl);

        if (!confirmedResponse.ok) {
          throw new Error(`Failed to fetch confirmed download: ${confirmedResponse.statusText}`);
        }
        
        const fileBuffer = await confirmedResponse.arrayBuffer();
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
          },
        });
      }
      
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }

    const fileBuffer = await response.arrayBuffer();

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
      },
    });

  } catch (error: any) {
    console.error('PDF Proxy Error:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}
