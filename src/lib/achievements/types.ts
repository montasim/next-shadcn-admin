/**
 * Achievement Types
 */

import type { Achievement, AchievementCategory, AchievementTier, UserAchievement } from '@prisma/client'

export type AchievementWithProgress = Achievement & {
  userProgress?: number
  userUnlocked?: boolean
  unlockedAt?: Date
}

export type UserStats = {
  // Reading stats
  booksRead: number
  pagesRead: number
  booksAdded: number
  uniqueAuthors: number
  uniqueCategories: number

  // Quiz stats
  quizzesCompleted: number
  perfectQuizzes: number
  highScores: number
  bestQuizStreak: number
  currentDailyStreak: number

  // Collection stats
  bookshelvesCreated: number

  // Marketplace stats
  sellPostsCreated: number
  offersMade: number
  reviewsLeft: number

  // Engagement stats
  loginCount: number
  loginStreak: number
  profileCompleteness: number
}

export type AchievementCheckResult = {
  unlocked: string[]  // Achievement codes that were unlocked
  progress: Record<string, number>  // Achievement codes and their new progress
}
