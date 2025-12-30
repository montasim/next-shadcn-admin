import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { LegalContentType } from '@prisma/client'

// GET /api/legal?type=TERMS_OF_SERVICE or /api/legal?type=PRIVACY_POLICY
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') as LegalContentType | null

    if (!type || !Object.values(LegalContentType).includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing type parameter' },
        { status: 400 }
      )
    }

    const content = await prisma.legalContent.findUnique({
      where: { type },
      include: {
        lastUpdatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!content) {
      return NextResponse.json(
        {
          success: true,
          data: null,
          message: `No ${type.replace(/_/g, ' ').toLowerCase()} content found. Please contact support.`,
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: content,
    })
  } catch (error) {
    console.error('Error fetching legal content:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch legal content' },
      { status: 500 }
    )
  }
}

// POST /api/legal - Create or update legal content (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (
      session.role !== 'ADMIN' &&
      session.role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { type, title, content } = body

    if (!type || !title || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, title, or content' },
        { status: 400 }
      )
    }

    if (!Object.values(LegalContentType).includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid legal content type' },
        { status: 400 }
      )
    }

    const existing = await prisma.legalContent.findUnique({
      where: { type },
    })

    let legalContent

    if (existing) {
      // Update existing content
      legalContent = await prisma.legalContent.update({
        where: { type },
        data: {
          title,
          content,
          lastUpdatedById: session.userId,
          updatedAt: new Date(),
        },
        include: {
          lastUpdatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      })
    } else {
      // Create new content
      legalContent = await prisma.legalContent.create({
        data: {
          type,
          title,
          content,
          lastUpdatedById: session.userId,
          effectiveDate: new Date(),
        },
        include: {
          lastUpdatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: legalContent,
      message: existing
        ? 'Legal content updated successfully'
        : 'Legal content created successfully',
    })
  } catch (error) {
    console.error('Error saving legal content:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save legal content' },
      { status: 500 }
    )
  }
}
