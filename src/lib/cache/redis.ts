/**
 * Redis caching utility for API responses
 * Provides simple get/set operations with TTL support
 */

import { Redis } from 'ioredis'

// Redis connection options
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
}

// Singleton Redis client
let redisClient: Redis | null = null

/**
 * Get or create Redis client instance
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(redisOptions)

    redisClient.on('error', (error) => {
      console.error('[Redis Cache] Connection error:', error)
    })

    redisClient.on('connect', () => {
      console.log('[Redis Cache] Connected successfully')
    })
  }

  return redisClient
}

/**
 * Cache data in Redis with TTL
 */
export async function setCache(
  key: string,
  value: any,
  ttlSeconds: number = 60
): Promise<void> {
  try {
    const redis = getRedisClient()
    const serialized = JSON.stringify(value)
    await redis.setex(key, ttlSeconds, serialized)
    console.log(`[Redis Cache] Set cache for key: ${key}, TTL: ${ttlSeconds}s`)
  } catch (error) {
    console.error('[Redis Cache] Failed to set cache:', error)
  }
}

/**
 * Get cached data from Redis
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient()
    const data = await redis.get(key)

    if (data) {
      console.log(`[Redis Cache] Cache hit for key: ${key}`)
      return JSON.parse(data) as T
    }

    console.log(`[Redis Cache] Cache miss for key: ${key}`)
    return null
  } catch (error) {
    console.error('[Redis Cache] Failed to get cache:', error)
    return null
  }
}

/**
 * Delete cache by key pattern
 */
export async function deleteCache(pattern: string): Promise<void> {
  try {
    const redis = getRedisClient()
    const keys = await redis.keys(pattern)

    if (keys.length > 0) {
      await redis.del(...keys)
      console.log(`[Redis Cache] Deleted ${keys.length} keys matching pattern: ${pattern}`)
    }
  } catch (error) {
    console.error('[Redis Cache] Failed to delete cache:', error)
  }
}

/**
 * Invalidate all books cache
 */
export async function invalidateBooksCache(): Promise<void> {
  await deleteCache('books:*')
}

/**
 * Generate cache key for books query
 */
export function generateBooksCacheKey(params: {
  page: number
  limit: number
  search?: string
  types?: string[]
  categories?: string[]
  premium?: string
  sortBy?: string
  sortOrder?: string
}): string {
  const parts = [
    'books',
    `page:${params.page}`,
    `limit:${params.limit}`,
  ]

  if (params.search) parts.push(`search:${params.search}`)
  if (params.types?.length) parts.push(`types:${params.types.join(',')}`)
  if (params.categories?.length) parts.push(`categories:${params.categories.join(',')}`)
  if (params.premium && params.premium !== 'all') parts.push(`premium:${params.premium}`)
  if (params.sortBy) parts.push(`sort:${params.sortBy}`)
  if (params.sortOrder) parts.push(`order:${params.sortOrder}`)

  return parts.join(':')
}
