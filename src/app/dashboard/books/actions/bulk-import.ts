'use server'

import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { BookType, BindingType } from '@prisma/client'
import { invalidateBooksCache } from '@/lib/cache/redis'

export interface BulkImportResult {
  success: boolean
  imported: number
  failed: number
  errors: Array<{ row: number; book: string; error: string }>
  created: {
    authors: number
    publications: number
    categories: number
    series: number
  }
}

export interface BookImportRow {
  name: string
  type: string
  authors: string
  publication: string
  categories?: string
  series?: string
  seriesOrder?: string
  summary?: string
  buyingPrice?: string
  sellingPrice?: string
  numberOfCopies?: string
  bindingType?: string
  pageNumber?: string
  isPublic?: string
  requiresPremium?: string
}

/**
 * Get or create an author by name
 */
async function getOrCreateAuthor(name: string, userId: string): Promise<string> {
  const normalizedName = name.trim()

  // Try to find existing author
  const existing = await prisma.author.findFirst({
    where: { name: normalizedName },
    select: { id: true },
  })

  if (existing) {
    return existing.id
  }

  // Create new author
  const newAuthor = await prisma.author.create({
    data: {
      name: normalizedName,
      entryById: userId,
    },
    select: { id: true },
  })

  return newAuthor.id
}

/**
 * Get or create a publication by name
 */
async function getOrCreatePublication(name: string, userId: string): Promise<string> {
  const normalizedName = name.trim()

  // Try to find existing publication
  const existing = await prisma.publication.findFirst({
    where: { name: normalizedName },
    select: { id: true },
  })

  if (existing) {
    return existing.id
  }

  // Create new publication
  const newPublication = await prisma.publication.create({
    data: {
      name: normalizedName,
      entryById: userId,
    },
    select: { id: true },
  })

  return newPublication.id
}

/**
 * Get or create a category by name
 */
async function getOrCreateCategory(name: string, userId: string): Promise<string> {
  const normalizedName = name.trim()

  // Try to find existing category
  const existing = await prisma.category.findFirst({
    where: { name: normalizedName },
    select: { id: true },
  })

  if (existing) {
    return existing.id
  }

  // Create new category
  const newCategory = await prisma.category.create({
    data: {
      name: normalizedName,
      entryById: userId,
    },
    select: { id: true },
  })

  return newCategory.id
}

/**
 * Get or create a series by name
 */
async function getOrCreateSeries(name: string, userId: string): Promise<string> {
  const normalizedName = name.trim()

  // Try to find existing series
  const existing = await prisma.series.findFirst({
    where: { name: normalizedName },
    select: { id: true },
  })

  if (existing) {
    return existing.id
  }

  // Create new series
  const newSeries = await prisma.series.create({
    data: {
      name: normalizedName,
      entryById: userId,
    },
    select: { id: true },
  })

  return newSeries.id
}

/**
 * Bulk import books from CSV data
 */
export async function bulkImportBooks(rows: BookImportRow[]): Promise<BulkImportResult> {
  const session = await requireAuth()
  const userId = session.userId
  const errors: Array<{ row: number; book: string; error: string }> = []
  let imported = 0
  const created = {
    authors: 0,
    publications: 0,
    categories: 0,
    series: 0,
  }

  // Track created entities to avoid duplicates in same import
  const authorCache = new Map<string, string>()
  const publicationCache = new Map<string, string>()
  const categoryCache = new Map<string, string>()
  const seriesCache = new Map<string, string>()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // +2 because CSV rows are 1-indexed and header is row 1

    try {
      // Validate required fields
      if (!row.name || !row.type || !row.authors || !row.publication) {
        errors.push({
          row: rowNum,
          book: row.name || 'Unknown',
          error: 'Missing required fields (name, type, authors, publication)',
        })
        continue
      }

      // Validate book type
      if (!['HARD_COPY', 'EBOOK', 'AUDIO'].includes(row.type)) {
        errors.push({
          row: rowNum,
          book: row.name,
          error: `Invalid book type: ${row.type}. Must be HARD_COPY, EBOOK, or AUDIO`,
        })
        continue
      }

      // Get or create authors
      const authorNames = row.authors.split(',').map(a => a.trim()).filter(Boolean)
      if (authorNames.length === 0) {
        errors.push({
          row: rowNum,
          book: row.name,
          error: 'At least one author is required',
        })
        continue
      }

      const authorIds = await Promise.all(
        authorNames.map(async (name) => {
          if (authorCache.has(name)) {
            return authorCache.get(name)!
          }
          const id = await getOrCreateAuthor(name, userId)
          authorCache.set(name, id)
          if (!await prisma.author.findFirst({ where: { id }, select: { createdAt: true } })) {
            created.authors++
          }
          return id
        })
      )

      // Get or create publication
      let publicationId: string
      if (publicationCache.has(row.publication)) {
        publicationId = publicationCache.get(row.publication)!
      } else {
        publicationId = await getOrCreatePublication(row.publication, userId)
        publicationCache.set(row.publication, publicationId)
        const existing = await prisma.publication.findFirst({
          where: { id: publicationId },
          select: { createdAt: true },
        })
        if (existing && Math.abs(existing.createdAt.getTime() - Date.now()) < 10000) {
          created.publications++
        }
      }

      // Get or create categories (optional)
      const categoryIds: string[] = []
      if (row.categories) {
        const categoryNames = row.categories.split(',').map(c => c.trim()).filter(Boolean)
        for (const name of categoryNames) {
          if (categoryCache.has(name)) {
            categoryIds.push(categoryCache.get(name)!)
          } else {
            const id = await getOrCreateCategory(name, userId)
            categoryCache.set(name, id)
            const existing = await prisma.category.findFirst({
              where: { id },
              select: { createdAt: true },
            })
            if (existing && Math.abs(existing.createdAt.getTime() - Date.now()) < 10000) {
              created.categories++
            }
            categoryIds.push(id)
          }
        }
      }

      // Get or create series (optional)
      let seriesId: string | undefined
      let seriesOrder: number | undefined
      if (row.series && row.series.trim()) {
        const seriesName = row.series.trim()
        if (seriesCache.has(seriesName)) {
          seriesId = seriesCache.get(seriesName)!
        } else {
          seriesId = await getOrCreateSeries(seriesName, userId)
          seriesCache.set(seriesName, seriesId)
          const existing = await prisma.series.findFirst({
            where: { id: seriesId },
            select: { createdAt: true },
          })
          if (existing && Math.abs(existing.createdAt.getTime() - Date.now()) < 10000) {
            created.series++
          }
        }

        // Parse series order if provided, otherwise default to 0
        if (row.seriesOrder && row.seriesOrder.trim()) {
          seriesOrder = parseFloat(row.seriesOrder.trim())
        } else {
          seriesOrder = 0 // Default order if not specified
        }
      }

      // Prepare book data
      const bookData: any = {
        name: row.name.trim(),
        type: row.type as BookType,
        entryById: userId,
      }

      // Add optional fields
      if (row.summary) bookData.summary = row.summary.trim()
      if (row.buyingPrice) bookData.buyingPrice = parseFloat(row.buyingPrice)
      if (row.sellingPrice) bookData.sellingPrice = parseFloat(row.sellingPrice)
      if (row.isPublic) bookData.isPublic = row.isPublic.toLowerCase() === 'true'
      if (row.requiresPremium) bookData.requiresPremium = row.requiresPremium.toLowerCase() === 'true'

      // Type-specific fields
      if (row.type === 'HARD_COPY') {
        if (row.bindingType && ['HARDCOVER', 'PAPERBACK'].includes(row.bindingType)) {
          bookData.bindingType = row.bindingType as BindingType
        }
        if (row.numberOfCopies) bookData.numberOfCopies = parseInt(row.numberOfCopies)
        if (row.pageNumber) bookData.pageNumber = parseInt(row.pageNumber)
      } else if (row.type === 'EBOOK' || row.type === 'AUDIO') {
        if (row.pageNumber) bookData.pageNumber = parseInt(row.pageNumber)
      }

      // Create the book
      const book = await prisma.book.create({
        data: {
          ...bookData,
          authors: {
            create: authorIds.map(authorId => ({ authorId })),
          },
          publications: {
            create: [{ publicationId }],
          },
          ...(categoryIds.length > 0 && {
            categories: {
              create: categoryIds.map(categoryId => ({ categoryId })),
            },
          }),
          ...(seriesId && {
            series: {
              create: [{
                seriesId,
                order: seriesOrder!,
              }],
            },
          }),
        },
      })

      imported++

      // Log activity (non-blocking)
      prisma.activityLog.create({
        data: {
          action: 'CREATE',
          resourceType: 'BOOK',
          resourceId: book.id,
          userId,
          description: `Bulk imported book: ${book.name}`,
        },
      }).catch(console.error)

    } catch (error) {
      errors.push({
        row: rowNum,
        book: row.name || 'Unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Invalidate books cache after bulk import
  await invalidateBooksCache()

  return {
    success: errors.length === 0,
    imported,
    failed: errors.length,
    errors,
    created,
  }
}
