/**
 * Book Question Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the BookQuestion model
 */

import { prisma } from '../../prisma'

// ============================================================================
// QUESTION QUERIES
// ============================================================================

/**
 * Get all questions for a book
 */
export async function getBookQuestions(bookId: string) {
  return prisma.bookQuestion.findMany({
    where: { bookId },
    orderBy: { order: 'asc' },
  })
}

/**
 * Get a single question by ID
 */
export async function getQuestionById(id: string) {
  return prisma.bookQuestion.findUnique({
    where: { id },
  })
}

// ============================================================================
// QUESTION MUTATIONS
// ============================================================================

/**
 * Create multiple questions for a book
 * Deletes existing AI-generated questions first
 */
export async function createBookQuestions(
  bookId: string,
  questions: Array<{ question: string; answer: string }>
) {
  // Use transaction to delete old questions and create new ones
  return await prisma.$transaction(async (tx) => {
    // Delete existing AI-generated questions
    await tx.bookQuestion.deleteMany({
      where: {
        bookId,
        isAIGenerated: true,
      }
    })

    // Create new questions
    const questionsToCreate = questions.map((q, index) => ({
      bookId,
      question: q.question,
      answer: q.answer,
      order: index + 1,
      isAIGenerated: true,
    }))

    await tx.bookQuestion.createMany({
      data: questionsToCreate,
    })

    // Return created questions
    return tx.bookQuestion.findMany({
      where: { bookId },
      orderBy: { order: 'asc' },
    })
  })
}

/**
 * Create a single manual question
 */
export async function createBookQuestion(
  bookId: string,
  data: {
    question: string
    answer: string
    order?: number
  }
) {
  // Get next order if not provided
  let order: number
  if (data.order !== undefined) {
    order = data.order
  } else {
    const maxOrder = await prisma.bookQuestion.findFirst({
      where: { bookId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    order = (maxOrder?.order || 0) + 1
  }

  return prisma.bookQuestion.create({
    data: {
      question: data.question,
      answer: data.answer,
      order,
      bookId,
      isAIGenerated: false,
    }
  })
}

/**
 * Update a question
 */
export async function updateBookQuestion(
  id: string,
  data: {
    question?: string
    answer?: string
    order?: number
  }
) {
  return prisma.bookQuestion.update({
    where: { id },
    data,
  })
}

/**
 * Delete a question
 */
export async function deleteBookQuestion(id: string) {
  return prisma.bookQuestion.delete({
    where: { id },
  })
}

/**
 * Delete all questions for a book
 */
export async function deleteBookQuestions(bookId: string) {
  return prisma.bookQuestion.deleteMany({
    where: { bookId },
  })
}

/**
 * Delete all AI-generated questions for a book
 */
export async function deleteAIGeneratedQuestions(bookId: string) {
  return prisma.bookQuestion.deleteMany({
    where: {
      bookId,
      isAIGenerated: true,
    }
  })
}
