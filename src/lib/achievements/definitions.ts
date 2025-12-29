/**
 * Achievement Definitions
 *
 * All available achievements with their requirements and rewards
 */

import type { AchievementCategory, AchievementTier } from '@prisma/client'

export interface AchievementDefinition {
  code: string
  name: string
  description: string
  icon: string
  category: AchievementCategory
  tier: AchievementTier
  xp: number
  requirements: {
    type: string
    count?: number
    field?: string
    comparison?: 'eq' | 'gte' | 'lte' | 'gt'
  }
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ============================================================================
  // READING ACHIEVEMENTS
  // ============================================================================

  {
    code: 'FIRST_BOOK',
    name: 'Bookworm Beginnings',
    description: 'Complete your first book',
    icon: '📖',
    category: 'READING',
    tier: 'BRONZE',
    xp: 10,
    requirements: { type: 'BOOKS_READ', count: 1, comparison: 'gte' }
  },
  {
    code: 'READER_5',
    name: 'Avid Reader',
    description: 'Complete 5 books',
    icon: '📚',
    category: 'READING',
    tier: 'BRONZE',
    xp: 25,
    requirements: { type: 'BOOKS_READ', count: 5, comparison: 'gte' }
  },
  {
    code: 'READER_10',
    name: 'Page Turner',
    description: 'Complete 10 books',
    icon: '📚',
    category: 'READING',
    tier: 'SILVER',
    xp: 50,
    requirements: { type: 'BOOKS_READ', count: 10, comparison: 'gte' }
  },
  {
    code: 'READER_25',
    name: 'Book Enthusiast',
    description: 'Complete 25 books',
    icon: '📚',
    category: 'READING',
    tier: 'GOLD',
    xp: 100,
    requirements: { type: 'BOOKS_READ', count: 25, comparison: 'gte' }
  },
  {
    code: 'READER_50',
    name: 'Literary Master',
    description: 'Complete 50 books',
    icon: '📚',
    category: 'READING',
    tier: 'PLATINUM',
    xp: 250,
    requirements: { type: 'BOOKS_READ', count: 50, comparison: 'gte' }
  },
  {
    code: 'READER_100',
    name: 'Bibliophile Supreme',
    description: 'Complete 100 books',
    icon: '📚',
    category: 'READING',
    tier: 'DIAMOND',
    xp: 500,
    requirements: { type: 'BOOKS_READ', count: 100, comparison: 'gte' }
  },
  {
    code: 'PAGES_1000',
    name: 'Thousand Pages',
    description: 'Read 1,000 pages total',
    icon: '📄',
    category: 'READING',
    tier: 'BRONZE',
    xp: 20,
    requirements: { type: 'PAGES_READ', count: 1000, comparison: 'gte' }
  },
  {
    code: 'PAGES_10000',
    name: 'Ten Thousand Pages',
    description: 'Read 10,000 pages total',
    icon: '📄',
    category: 'READING',
    tier: 'SILVER',
    xp: 50,
    requirements: { type: 'PAGES_READ', count: 10000, comparison: 'gte' }
  },
  {
    code: 'PAGES_50000',
    name: 'Fifty Thousand Pages',
    description: 'Read 50,000 pages total',
    icon: '📄',
    category: 'READING',
    tier: 'GOLD',
    xp: 150,
    requirements: { type: 'PAGES_READ', count: 50000, comparison: 'gte' }
  },

  // ============================================================================
  // COLLECTION ACHIEVEMENTS
  // ============================================================================

  {
    code: 'FIRST_ADDITION',
    name: 'Starting Collection',
    description: 'Add your first book to the library',
    icon: '📕',
    category: 'COLLECTION',
    tier: 'BRONZE',
    xp: 10,
    requirements: { type: 'BOOKS_ADDED', count: 1, comparison: 'gte' }
  },
  {
    code: 'COLLECTOR_10',
    name: 'Growing Collection',
    description: 'Add 10 books to your library',
    icon: '📚',
    category: 'COLLECTION',
    tier: 'BRONZE',
    xp: 25,
    requirements: { type: 'BOOKS_ADDED', count: 10, comparison: 'gte' }
  },
  {
    code: 'COLLECTOR_50',
    name: 'Collector',
    description: 'Add 50 books to your library',
    icon: '📚',
    category: 'COLLECTION',
    tier: 'SILVER',
    xp: 75,
    requirements: { type: 'BOOKS_ADDED', count: 50, comparison: 'gte' }
  },
  {
    code: 'COLLECTOR_100',
    name: 'Book Collector',
    description: 'Add 100 books to your library',
    icon: '📚',
    category: 'COLLECTION',
    tier: 'GOLD',
    xp: 150,
    requirements: { type: 'BOOKS_ADDED', count: 100, comparison: 'gte' }
  },
  {
    code: 'FIRST_BOOKSHELF',
    name: 'Organized Reader',
    description: 'Create your first bookshelf',
    icon: '📖',
    category: 'COLLECTION',
    tier: 'BRONZE',
    xp: 15,
    requirements: { type: 'BOOKSHELVES_CREATED', count: 1, comparison: 'gte' }
  },
  {
    code: 'BOOKSHELVES_5',
    name: 'Shelf Master',
    description: 'Create 5 bookshelves',
    icon: '🗄️',
    category: 'COLLECTION',
    tier: 'SILVER',
    xp: 50,
    requirements: { type: 'BOOKSHELVES_CREATED', count: 5, comparison: 'gte' }
  },
  {
    code: 'AUTHOR_5',
    name: 'Author Explorer',
    description: 'Add books from 5 different authors',
    icon: '✍️',
    category: 'COLLECTION',
    tier: 'BRONZE',
    xp: 20,
    requirements: { type: 'UNIQUE_AUTHORS', count: 5, comparison: 'gte' }
  },
  {
    code: 'AUTHOR_20',
    name: 'Literary Explorer',
    description: 'Add books from 20 different authors',
    icon: '✍️',
    category: 'COLLECTION',
    tier: 'SILVER',
    xp: 50,
    requirements: { type: 'UNIQUE_AUTHORS', count: 20, comparison: 'gte' }
  },
  {
    code: 'CATEGORY_5',
    name: 'Genre Explorer',
    description: 'Add books from 5 different categories',
    icon: '🏷️',
    category: 'COLLECTION',
    tier: 'BRONZE',
    xp: 20,
    requirements: { type: 'UNIQUE_CATEGORIES', count: 5, comparison: 'gte' }
  },

  // ============================================================================
  // QUIZ ACHIEVEMENTS
  // ============================================================================

  {
    code: 'FIRST_QUIZ',
    name: 'Quiz Novice',
    description: 'Complete your first quiz',
    icon: '🧠',
    category: 'QUIZ',
    tier: 'BRONZE',
    xp: 10,
    requirements: { type: 'QUIZZES_COMPLETED', count: 1, comparison: 'gte' }
  },
  {
    code: 'QUIZ_10',
    name: 'Quiz Regular',
    description: 'Complete 10 quizzes',
    icon: '🧠',
    category: 'QUIZ',
    tier: 'BRONZE',
    xp: 30,
    requirements: { type: 'QUIZZES_COMPLETED', count: 10, comparison: 'gte' }
  },
  {
    code: 'PERFECT_SCORE',
    name: 'Perfect Score',
    description: 'Get 100% on a quiz',
    icon: '💯',
    category: 'QUIZ',
    tier: 'SILVER',
    xp: 50,
    requirements: { type: 'PERFECT_QUIZ', count: 1, comparison: 'gte' }
  },
  {
    code: 'HIGH_SCORER',
    name: 'High Achiever',
    description: 'Score 90% or higher on a quiz',
    icon: '🎯',
    category: 'QUIZ',
    tier: 'BRONZE',
    xp: 30,
    requirements: { type: 'HIGH_SCORE', count: 1, comparison: 'gte' }
  },
  {
    code: 'STREAK_5',
    name: 'Streak Master',
    description: 'Answer 5 questions correctly in a row',
    icon: '🔥',
    category: 'QUIZ',
    tier: 'BRONZE',
    xp: 25,
    requirements: { type: 'QUIZ_STREAK', count: 5, comparison: 'gte' }
  },
  {
    code: 'STREAK_10',
    name: 'Streak Champion',
    description: 'Answer 10 questions correctly in a row',
    icon: '🔥',
    category: 'QUIZ',
    tier: 'SILVER',
    xp: 50,
    requirements: { type: 'QUIZ_STREAK', count: 10, comparison: 'gte' }
  },
  {
    code: 'DAILY_STREAK_3',
    name: 'Dedicated Learner',
    description: 'Maintain a 3-day quiz streak',
    icon: '📅',
    category: 'QUIZ',
    tier: 'BRONZE',
    xp: 30,
    requirements: { type: 'DAILY_STREAK', count: 3, comparison: 'gte' }
  },
  {
    code: 'DAILY_STREAK_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day quiz streak',
    icon: '📅',
    category: 'QUIZ',
    tier: 'SILVER',
    xp: 75,
    requirements: { type: 'DAILY_STREAK', count: 7, comparison: 'gte' }
  },
  {
    code: 'DAILY_STREAK_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day quiz streak',
    icon: '📅',
    category: 'QUIZ',
    tier: 'GOLD',
    xp: 300,
    requirements: { type: 'DAILY_STREAK', count: 30, comparison: 'gte' }
  },

  // ============================================================================
  // MARKETPLACE ACHIEVEMENTS
  // ============================================================================

  {
    code: 'FIRST_LISTING',
    name: 'First Sale',
    description: 'Create your first marketplace listing',
    icon: '🏪',
    category: 'MARKETPLACE',
    tier: 'BRONZE',
    xp: 15,
    requirements: { type: 'SELL_POSTS_CREATED', count: 1, comparison: 'gte' }
  },
  {
    code: 'SELLER_5',
    name: 'Active Seller',
    description: 'Create 5 marketplace listings',
    icon: '🏪',
    category: 'MARKETPLACE',
    tier: 'BRONZE',
    xp: 30,
    requirements: { type: 'SELL_POSTS_CREATED', count: 5, comparison: 'gte' }
  },
  {
    code: 'FIRST_OFFER',
    name: 'First Offer',
    description: 'Make your first offer on a listing',
    icon: '💰',
    category: 'MARKETPLACE',
    tier: 'BRONZE',
    xp: 10,
    requirements: { type: 'OFFERS_MADE', count: 1, comparison: 'gte' }
  },
  {
    code: 'OFFERS_10',
    name: 'Negotiator',
    description: 'Make 10 offers on listings',
    icon: '💰',
    category: 'MARKETPLACE',
    tier: 'BRONZE',
    xp: 30,
    requirements: { type: 'OFFERS_MADE', count: 10, comparison: 'gte' }
  },
  {
    code: 'FIRST_REVIEW',
    name: 'First Review',
    description: 'Leave your first review',
    icon: '⭐',
    category: 'MARKETPLACE',
    tier: 'BRONZE',
    xp: 15,
    requirements: { type: 'REVIEWS_LEFT', count: 1, comparison: 'gte' }
  },
  {
    code: 'REVIEWS_10',
    name: 'Reviewer',
    description: 'Leave 10 reviews',
    icon: '⭐',
    category: 'MARKETPLACE',
    tier: 'SILVER',
    xp: 50,
    requirements: { type: 'REVIEWS_LEFT', count: 10, comparison: 'gte' }
  },

  // ============================================================================
  // ENGAGEMENT ACHIEVEMENTS
  // ============================================================================

  {
    code: 'FIRST_LOGIN',
    name: 'Welcome Aboard',
    description: 'Log in for the first time',
    icon: '👋',
    category: 'ENGAGEMENT',
    tier: 'BRONZE',
    xp: 5,
    requirements: { type: 'LOGINS', count: 1, comparison: 'gte' }
  },
  {
    code: 'LOGIN_STREAK_7',
    name: 'Week Warrior',
    description: 'Log in for 7 consecutive days',
    icon: '🔥',
    category: 'ENGAGEMENT',
    tier: 'BRONZE',
    xp: 50,
    requirements: { type: 'LOGIN_STREAK', count: 7, comparison: 'gte' }
  },
  {
    code: 'LOGIN_STREAK_30',
    name: 'Monthly Master',
    description: 'Log in for 30 consecutive days',
    icon: '🔥',
    category: 'ENGAGEMENT',
    tier: 'SILVER',
    xp: 150,
    requirements: { type: 'LOGIN_STREAK', count: 30, comparison: 'gte' }
  },
  {
    code: 'PROFILE_COMPLETE',
    name: 'All About You',
    description: 'Complete your profile (name, bio, avatar)',
    icon: '👤',
    category: 'ENGAGEMENT',
    tier: 'BRONZE',
    xp: 20,
    requirements: { type: 'PROFILE_COMPLETENESS', count: 100, comparison: 'eq' }
  },

  // ============================================================================
  // SPECIAL ACHIEVEMENTS
  // ============================================================================

  {
    code: 'EARLY_ADOPTER',
    name: 'Pioneer',
    description: 'Joined in the first month of platform launch',
    icon: '🌟',
    category: 'SPECIAL',
    tier: 'LEGENDARY',
    xp: 500,
    requirements: { type: 'EARLY_ADOPTER', count: 1, comparison: 'eq' }
  },
  {
    code: 'ALL_CATEGORIES',
    name: 'Completionist',
    description: 'Add books from all available categories',
    icon: '🏆',
    category: 'SPECIAL',
    tier: 'LEGENDARY',
    xp: 1000,
    requirements: { type: 'ALL_CATEGORIES', count: 1, comparison: 'eq' }
  },
]

/**
 * Get achievement by code
 */
export function getAchievementByCode(code: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find(a => a.code === code)
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(category: AchievementCategory): AchievementDefinition[] {
  return ACHIEVEMENTS.filter(a => a.category === category)
}

/**
 * Get achievements by tier
 */
export function getAchievementsByTier(tier: AchievementTier): AchievementDefinition[] {
  return ACHIEVEMENTS.filter(a => a.tier === tier)
}
