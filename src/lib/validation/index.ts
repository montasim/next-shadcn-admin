/**
 * Comprehensive Validation Schemas
 *
 * Centralized Zod validation schemas for all user inputs
 * Provides security, type safety, and consistent validation across the application
 */

import { z } from 'zod'

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

/**
 * Valid MongoDB/PostgreSQL ObjectId format (24 hex characters)
 */
export const objectIdSchema = z.string().regex(/^[0-9a-f]{24}$/i, {
  message: 'Invalid ID format'
})

/**
 * Email validation with RFC 5322 compliance
 */
export const emailSchema = z.string()
  .min(1, 'Email is required')
  .max(254, 'Email is too long')
  .email('Invalid email format')
  .toLowerCase()
  .trim()

/**
 * Username validation - alphanumeric with underscores and hyphens
 */
export const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username cannot exceed 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .trim()

/**
 * Password strength validation
 */
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

/**
 * URL validation with protocol enforcement
 */
export const urlSchema = z.string()
  .url('Invalid URL format')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url)
        return ['http:', 'https:'].includes(parsed.protocol)
      } catch {
        return false
      }
    },
    'URL must use HTTP or HTTPS protocol'
  )

/**
 * Sanitized text - removes HTML tags and dangerous characters
 */
export const sanitizedTextSchema = z.string()
  .transform((val) => val.trim())
  .transform((val) => val.replace(/<[^>]*>/g, '')) // Remove HTML tags
  .transform((val) => val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')) // Remove script tags
  .transform((val) => val.replace(/javascript:/gi, '')) // Remove javascript: protocol
  .transform((val) => val.replace(/on\w+\s*=/gi, '')) // Remove event handlers

/**
 * Generic pagination params
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional().default(false)
})

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema.optional(),
  firstName: z.string().min(1, 'First name is required').max(100).trim(),
  lastName: z.string().min(1, 'Last name is required').max(100).trim(),
  name: z.string().optional(),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the terms and conditions' })
  })
})

export const passwordResetSendSchema = z.object({
  email: emailSchema
})

export const passwordResetVerifyOTPSchema = z.object({
  email: emailSchema,
  otp: z.string().regex(/^\d{7}$/, 'OTP must be 7 digits')
})

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema
})

// ============================================================================
// USER PROFILE SCHEMAS
// ============================================================================

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).trim().optional(),
  lastName: z.string().min(1).max(100).trim().optional(),
  username: usernameSchema.optional(),
  name: z.string().max(200).trim().optional(),
  bio: z.string().max(500).trim().optional(),
  avatar: urlSchema.or(z.literal('')).optional(),
  phoneNumber: z.string()
    .regex(/^[+]?[\d\s-()]+$/, 'Invalid phone number format')
    .optional()
})

// ============================================================================
// BOOK SCHEMAS
// ============================================================================

export const createBookSchema = z.object({
  name: z.string().min(1, 'Book name is required').max(500).trim(),
  summary: z.string().max(5000).trim().optional(),
  description: z.string().max(10000).optional(),
  isbn: z.string().regex(/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/i, 'Invalid ISBN format').optional(),
  pageNumber: z.coerce.number().int().positive().optional(),
  type: z.enum(['EBOOK', 'AUDIO', 'HARD_COPY'], {
    errorMap: () => ({ message: 'Invalid book type' })
  }),
  fileUrl: urlSchema.optional(),
  directFileUrl: urlSchema.optional(),
  image: urlSchema.optional(),
  language: z.string().min(2).max(10).optional(),
  price: z.number().positive().optional(),
  buyingPrice: z.number().positive().optional(),
  sellingPrice: z.number().positive().optional(),
  numberOfCopies: z.number().int().positive().optional(),
  requiresPremium: z.boolean().default(false),
  publicationId: objectIdSchema.optional(),
  categories: z.array(objectIdSchema).optional(),
  authors: z.array(objectIdSchema).optional(),
  moods: z.array(objectIdSchema).optional()
})

export const updateBookSchema = createBookSchema.partial()

export const bookQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  page: z.coerce.number().int().positive().default(1),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'pageNumber']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(200).trim().optional(),
  type: z.enum(['EBOOK', 'AUDIO', 'HARD_COPY']).optional(),
  category: z.string().optional(),
  author: z.string().optional(),
  publication: z.string().optional(),
  mood: z.string().optional(),
  premiumOnly: z.boolean().optional()
})

// ============================================================================
// AUTHOR, CATEGORY, PUBLICATION SCHEMAS
// ============================================================================

export const createAuthorSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(5000).optional(),
  image: urlSchema.optional()
})

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(2000).optional(),
  image: urlSchema.optional()
})

export const createPublicationSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(5000).optional(),
  image: urlSchema.optional()
})

// ============================================================================
// MARKETPLACE SCHEMAS
// ============================================================================

export const createListingSchema = z.object({
  bookId: objectIdSchema,
  title: z.string().min(5).max(200).trim(),
  description: z.string().max(2000).trim().optional(),
  price: z.number().positive('Price must be positive'),
  negotiable: z.boolean().default(false),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']),
  location: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  images: z.array(z.string().url()).max(10).optional()
})

export const createOfferSchema = z.object({
  sellPostId: objectIdSchema,
  offeredPrice: z.number().positive('Offered price must be positive'),
  message: z.string().max(500).trim().optional()
})

export const updateOfferStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'COUNTERED', 'WITHDRAWN'])
})

// ============================================================================
// MESSAGING & CHAT SCHEMAS
// ============================================================================

/**
 * CRITICAL: Chat message validation to prevent XSS
 */
export const chatMessageSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message is too long')
    .transform((val) => {
      // Remove any HTML tags
      return val.replace(/<[^>]*>/g, '')
    })
    .transform((val) => {
      // Remove script content even without tags
      return val.replace(/javascript:/gi, '')
    })
    .transform((val) => {
      // Remove event handlers
      return val.replace(/on\w+\s*=/gi, '')
    })
    .trim(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().max(2000)
  })).max(50, 'Too much conversation history').optional(),
  sessionId: z.string().optional()
})

export const sendMessageSchema = z.object({
  conversationId: objectIdSchema.optional(),
  recipientId: objectIdSchema,
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message is too long')
    .transform((val) => val.replace(/<[^>]*>/g, '').trim()) // Strip HTML
})

// ============================================================================
// QUIZ SCHEMAS
// ============================================================================

export const submitQuizAnswerSchema = z.object({
  questionId: objectIdSchema,
  selectedOption: z.number().int().min(0),
  timeTaken: z.number().int().positive().optional()
})

export const createQuizSchema = z.object({
  question: z.string().min(5).max(500).trim(),
  category: z.string().min(1).max(100),
  options: z.array(z.object({
    text: z.string().min(1).max(200).trim(),
    isCorrect: z.boolean()
  })).min(2).max(6),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  explanation: z.string().max(1000).optional()
})

// ============================================================================
// REVIEW & RATING SCHEMAS
// ============================================================================

export const createReviewSchema = z.object({
  targetId: objectIdSchema,
  targetType: z.enum(['USER', 'LISTING', 'BOOK']),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000).trim()
    .transform((val) => val.replace(/<[^>]*>/g, '').trim()) // Strip HTML
})

// ============================================================================
// SEARCH & FILTER SCHEMAS
// ============================================================================

export const searchSchema = z.object({
  query: z.string().min(1).max(200).trim(),
  type: z.enum(['ALL', 'BOOKS', 'AUTHORS', 'CATEGORIES']).optional(),
  limit: z.coerce.number().int().positive().max(50).default(20)
})

// ============================================================================
// FILE UPLOAD SCHEMAS
// ============================================================================

export const fileUploadSchema = z.object({
  fileName: z.string()
    .max(255)
    .refine((name) => {
      const ext = name.split('.').pop()?.toLowerCase()
      const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf']
      return ext ? allowed.includes(ext) : false
    }, 'Invalid file type'),
  fileSize: z.number()
    .max(10 * 1024 * 1024, 'File size cannot exceed 10MB') // 10MB limit
})

// ============================================================================
// SETTINGS SCHEMAS
// ============================================================================

export const updateDisplaySettingsSchema = z.object({
  itemsPerPage: z.coerce.number().int().min(5).max(100).optional(),
  showMoodRecommendations: z.boolean().optional(),
  defaultViewMode: z.enum(['grid', 'list']).optional()
})

export const updateNotificationSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional()
})

// ============================================================================
// BOOKSHELF SCHEMAS
// ============================================================================

export const createBookshelfSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  image: urlSchema.optional(),
  isPublic: z.boolean().default(false)
})

export const updateBookshelfSchema = createBookshelfSchema.partial()

// ============================================================================
// BOOK REQUEST SCHEMAS
// ============================================================================

export const createBookRequestSchema = z.object({
  bookName: z.string().min(1).max(500).trim(),
  author: z.string().min(1).max(200).trim().optional(),
  isbn: z.string().optional(),
  reason: z.string().min(10).max(1000).trim(),
  type: z.enum(['EBOOK', 'AUDIO', 'HARD_COPY', 'ANY']).optional()
})

// ============================================================================
// SERIES SCHEMAS
// ============================================================================

export const createSeriesSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).optional(),
  image: urlSchema.optional()
})

export const updateSeriesSchema = createSeriesSchema.partial()

// ============================================================================
// MOOD SCHEMAS
// ============================================================================

export const createMoodSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  icon: z.string().max(50).trim().optional(), // Emoji or icon name
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (use hex format #RRGGBB)')
    .optional()
})

export const updateMoodSchema = createMoodSchema.partial()

// ============================================================================
// NOTICE SCHEMAS
// ============================================================================

export const createNoticeSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(5000, 'Content is too long')
    .transform((val) => sanitizeUserContent(val, 5000)),
  type: z.enum(['INFO', 'WARNING', 'SUCCESS', 'ERROR']).default('INFO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime().optional(),
  targetRole: z.enum(['USER', 'ADMIN', 'SUPERADMIN', 'ALL']).optional()
})

export const updateNoticeSchema = createNoticeSchema.partial()

// ============================================================================
// MESSAGE & CONVERSATION SCHEMAS
// ============================================================================

export const createConversationSchema = z.object({
  recipientId: objectIdSchema,
  initialMessage: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message is too long')
    .transform((val) => sanitizeUserContent(val, 2000))
})

export const sendConversationMessageSchema = z.object({
  conversationId: objectIdSchema.optional(),
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message is too long')
    .transform((val) => sanitizeUserContent(val, 2000))
    .refine((val) => val.trim().length > 0, 'Message cannot be empty or whitespace only'),
  listingId: objectIdSchema.optional(), // For marketplace conversations
  offerId: objectIdSchema.optional() // For offer-related messages
})

export const markConversationAsReadSchema = z.object({
  conversationId: objectIdSchema,
  lastReadAt: z.string().datetime().optional()
})

// ============================================================================
// LIBRARY/BOOKSHELF ENHANCEMENTS
// ============================================================================

export const addBookToBookshelfSchema = z.object({
  bookshelfId: objectIdSchema,
  bookId: objectIdSchema,
  notes: z.string().max(500).trim().optional()
})

export const removeBookFromBookshelfSchema = z.object({
  bookshelfId: objectIdSchema,
  bookId: objectIdSchema
})

export const updateBookshelfBookSchema = z.object({
  bookshelfId: objectIdSchema,
  bookId: objectIdSchema,
  notes: z.string().max(500).trim().optional(),
  readingStatus: z.enum(['NOT_STARTED', 'READING', 'COMPLETED', 'ABANDONED']).optional(),
  rating: z.number().int().min(1).max(5).optional()
})

// ============================================================================
// ADMIN OPERATIONS SCHEMAS
// ============================================================================

export const bulkActionSchema = z.object({
  ids: z.array(objectIdSchema).min(1).max(100),
  action: z.enum(['DELETE', 'ACTIVATE', 'DEACTIVATE', 'PUBLISH', 'UNPUBLISH']),
  reason: z.string().max(500).optional()
})

export const updateUserRoleSchema = z.object({
  userId: objectIdSchema,
  role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']),
  reason: z.string().min(10).max(500).trim()
})

// ============================================================================
// ANALYTICS & REPORTING SCHEMAS
// ============================================================================

export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  granularity: z.enum(['hour', 'day', 'week', 'month']).optional(),
  metrics: z.array(z.string()).optional()
})

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate request body against a schema and return typed data or error
 */
export async function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const result = await schema.parseAsync(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return {
        success: false,
        error: firstError?.message || 'Validation failed'
      }
    }
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<[^>]*>/g, '') // Remove all remaining tags
}

/**
 * Validate and sanitize user-generated content
 */
export function sanitizeUserContent(content: string, maxLength: number = 5000): string {
  return content
    .trim()
    .slice(0, maxLength)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}

// ============================================================================
// EXPORT ALL SCHEMAS
// ============================================================================

export const validation = {
  // Common
  objectId: objectIdSchema,
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  url: urlSchema,
  sanitizedText: sanitizedTextSchema,
  pagination: paginationSchema,

  // Auth
  login: loginSchema,
  register: registerSchema,
  passwordResetSend: passwordResetSendSchema,
  passwordResetVerifyOTP: passwordResetVerifyOTPSchema,
  passwordResetConfirm: passwordResetConfirmSchema,
  changePassword: changePasswordSchema,

  // User
  updateProfile: updateProfileSchema,

  // Books
  createBook: createBookSchema,
  updateBook: updateBookSchema,
  bookQuery: bookQuerySchema,

  // Content entities
  createAuthor: createAuthorSchema,
  createCategory: createCategorySchema,
  createPublication: createPublicationSchema,

  // Series
  createSeries: createSeriesSchema,
  updateSeries: updateSeriesSchema,

  // Moods
  createMood: createMoodSchema,
  updateMood: updateMoodSchema,

  // Notices
  createNotice: createNoticeSchema,
  updateNotice: updateNoticeSchema,

  // Marketplace
  createListing: createListingSchema,
  createOffer: createOfferSchema,
  updateOfferStatus: updateOfferStatusSchema,

  // Messaging & Chat
  chatMessage: chatMessageSchema,
  sendMessage: sendMessageSchema,
  createConversation: createConversationSchema,
  sendConversationMessage: sendConversationMessageSchema,
  markConversationAsRead: markConversationAsReadSchema,

  // Quiz
  submitQuizAnswer: submitQuizAnswerSchema,
  createQuiz: createQuizSchema,

  // Reviews
  createReview: createReviewSchema,

  // Search
  search: searchSchema,

  // File upload
  fileUpload: fileUploadSchema,

  // Settings
  updateDisplaySettings: updateDisplaySettingsSchema,
  updateNotificationSettings: updateNotificationSettingsSchema,

  // Bookshelves & Library
  createBookshelf: createBookshelfSchema,
  updateBookshelf: updateBookshelfSchema,
  addBookToBookshelf: addBookToBookshelfSchema,
  removeBookFromBookshelf: removeBookFromBookshelfSchema,
  updateBookshelfBook: updateBookshelfBookSchema,

  // Book requests
  createBookRequest: createBookRequestSchema,

  // Admin operations
  bulkAction: bulkActionSchema,
  updateUserRole: updateUserRoleSchema,

  // Analytics
  analyticsQuery: analyticsQuerySchema
}
