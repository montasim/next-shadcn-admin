/**
 * Subscription Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the Subscription model
 *
 * Benefits:
 * - Separation of concerns (business logic from data access)
 * - Easy to test and mock
 * - Centralized database queries
 */

import { prisma } from '../../prisma'
import { SubscriptionPlan } from '@prisma/client'

// ============================================================================
// SUBSCRIPTION QUERIES
// ============================================================================

/**
 * Find subscription by user ID
 *
 * @param {string} userId - User ID
 * @returns {Promise<Subscription | null>} Subscription or null if not found
 */
export async function findSubscriptionByUserId(userId: string) {
  return prisma.subscription.findUnique({
    where: { userId },
  })
}

/**
 * Find subscription by Stripe subscription ID
 *
 * @param {string} stripeSubscriptionId - Stripe subscription ID
 * @returns {Promise<Subscription | null>} Subscription or null if not found
 */
export async function findSubscriptionByStripeId(stripeSubscriptionId: string) {
  return prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  })
}

/**
 * Get user's subscription plan
 *
 * @param {string} userId - User ID
 * @returns {Promise<SubscriptionPlan>} User's subscription plan
 */
export async function getUserSubscriptionPlan(userId: string): Promise<SubscriptionPlan> {
  const subscription = await findSubscriptionByUserId(userId)
  return subscription?.plan || SubscriptionPlan.FREE
}

/**
 * Check if user has active premium subscription
 *
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if user has active premium subscription
 */
export async function hasActivePremiumSubscription(userId: string): Promise<boolean> {
  const subscription = await findSubscriptionByUserId(userId)
  if (!subscription) return false

  return (
    subscription.isActive &&
    subscription.plan !== SubscriptionPlan.FREE &&
    (!subscription.endDate || subscription.endDate > new Date())
  )
}

// ============================================================================
// SUBSCRIPTION MUTATIONS
// ============================================================================

/**
 * Create a new subscription
 *
 * @param {Object} data - Subscription data
 * @returns {Promise<Subscription>} Created subscription
 */
export async function createSubscription(data: {
  userId: string
  plan: SubscriptionPlan
  stripeSubscriptionId?: string
  stripePriceId?: string
  startDate?: Date
  endDate?: Date
  cancelAtPeriodEnd?: boolean
}) {
  return prisma.subscription.create({
    data,
  })
}

/**
 * Update subscription
 *
 * @param {string} userId - User ID
 * @param {Object} data - Subscription data to update
 * @returns {Promise<Subscription>} Updated subscription
 */
export async function updateSubscription(
  userId: string,
  data: {
    plan?: SubscriptionPlan
    isActive?: boolean
    endDate?: Date | null
    stripeSubscriptionId?: string
    stripePriceId?: string
    cancelAtPeriodEnd?: boolean
  }
) {
  return prisma.subscription.update({
    where: { userId },
    data,
  })
}

/**
 * Update subscription by Stripe subscription ID
 *
 * @param {string} stripeSubscriptionId - Stripe subscription ID
 * @param {Object} data - Subscription data to update
 * @returns {Promise<Subscription>} Updated subscription
 */
export async function updateSubscriptionByStripeId(
  stripeSubscriptionId: string,
  data: {
    plan?: SubscriptionPlan
    isActive?: boolean
    endDate?: Date | null
    cancelAtPeriodEnd?: boolean
  }
) {
  return prisma.subscription.update({
    where: { stripeSubscriptionId },
    data,
  })
}

/**
 * Cancel subscription
 *
 * @param {string} userId - User ID
 * @param {boolean} immediate - Cancel immediately or at period end
 * @returns {Promise<Subscription>} Updated subscription
 */
export async function cancelSubscription(userId: string, immediate: boolean = false) {
  return prisma.subscription.update({
    where: { userId },
    data: {
      isActive: !immediate,
      plan: immediate ? SubscriptionPlan.FREE : undefined,
      endDate: immediate ? new Date() : undefined,
      cancelAtPeriodEnd: !immediate,
    },
  })
}

/**
 * Delete subscription by user ID
 *
 * @param {string} userId - User ID
 * @returns {Promise<Subscription>} Deleted subscription
 */
export async function deleteSubscription(userId: string) {
  return prisma.subscription.delete({
    where: { userId },
  })
}

/**
 * Upsert subscription (create or update)
 *
 * @param {string} userId - User ID
 * @param {Object} data - Subscription data
 * @returns {Promise<Subscription>} Created or updated subscription
 */
export async function upsertSubscription(
  userId: string,
  data: {
    plan: SubscriptionPlan
    startDate: Date
    endDate?: Date | null
    isActive: boolean
    stripeSubscriptionId?: string
    stripePriceId?: string
    cancelAtPeriodEnd?: boolean
  }
) {
  return prisma.subscription.upsert({
    where: { userId },
    create: {
      ...data,
      user: {
        connect: { id: userId },
      },
    },
    update: data,
  })
}
