import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { googleDriveUrlSchema } from '@/lib/validation'

// Map of file extensions to MIME types
const CONTENT_TYPE_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  if (!url) {
    return new NextResponse('URL parameter is missing', { status: 400 })
  }

  // Validate the Google Drive URL
  const validationResult = googleDriveUrlSchema.safeParse(url)
  if (!validationResult.success) {
    return new NextResponse('Invalid Google Drive URL', { status: 400 })
  }

  try {
    // Extract file ID from Google Drive URL
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (!fileIdMatch) {
      throw new Error('Could not extract file ID from Google Drive URL.')
    }
    const fileId = fileIdMatch[1]

    // Try to detect content type from URL or default to jpeg
    let contentType = 'image/jpeg'
    const urlLower = url.toLowerCase()
    for (const [ext, type] of Object.entries(CONTENT_TYPE_MAP)) {
      if (urlLower.includes(`.${ext}`)) {
        contentType = type
        break
      }
    }

    const directDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`

    const response = await fetch(directDownloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
      },
    })

    if (!response.ok) {
      // If the first attempt fails, it might be a large file that requires confirmation
      const text = await response.text()
      const confirmationCodeMatch = text.match(/confirm=([a-zA-Z0-9_-]+)/)
      if (confirmationCodeMatch) {
        const confirmationCode = confirmationCodeMatch[1]
        const confirmedUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirmationCode}`
        const confirmedResponse = await fetch(confirmedUrl)

        if (!confirmedResponse.ok) {
          throw new Error(`Failed to fetch confirmed download: ${confirmedResponse.statusText}`)
        }

        // Try to detect content type from response headers
        const responseContentType = confirmedResponse.headers.get('content-type')
        if (responseContentType && responseContentType.startsWith('image/')) {
          contentType = responseContentType
        }

        const fileBuffer = await confirmedResponse.arrayBuffer()
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
          },
        })
      }

      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    // Try to detect content type from response headers
    const responseContentType = response.headers.get('content-type')
    if (responseContentType && responseContentType.startsWith('image/')) {
      contentType = responseContentType
    }

    const fileBuffer = await response.arrayBuffer()

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      },
    })

  } catch (error: any) {
    console.error('Image Proxy Error:', error)
    return new NextResponse(error.message, { status: 500 })
  }
}
