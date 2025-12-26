/**
 * Seed script for Mood data
 *
 * This script populates the Mood and MoodCategoryMapping tables
 * with the initial hardcoded mood data from the frontend.
 *
 * Run with: npx tsx prisma/seed-moods.ts [admin-email]
 */

import { prisma } from '../src/lib/prisma'

const INITIAL_MOODS = [
  {
    identifier: 'happy',
    name: 'Happy',
    emoji: '😊',
    description: 'Feel-good stories and uplifting content',
    color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 dark:border-yellow-700',
    order: 0,
    categoryNames: ['romance', 'self-help', 'comedy', 'fantasy'],
  },
  {
    identifier: 'adventurous',
    name: 'Adventurous',
    emoji: '🚀',
    description: 'Explore new worlds and exciting journeys',
    color: 'bg-blue-100 hover:bg-blue-200 border-blue-300 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-700',
    order: 1,
    categoryNames: ['science-fiction', 'fantasy', 'thriller', 'mystery'],
  },
  {
    identifier: 'romantic',
    name: 'Romantic',
    emoji: '💕',
    description: 'Love stories and heartwarming tales',
    color: 'bg-pink-100 hover:bg-pink-200 border-pink-300 dark:bg-pink-900/20 dark:hover:bg-pink-900/30 dark:border-pink-700',
    order: 2,
    categoryNames: ['romance'],
  },
  {
    identifier: 'mysterious',
    name: 'Mysterious',
    emoji: '🔍',
    description: 'Solve puzzles and uncover secrets',
    color: 'bg-purple-100 hover:bg-purple-200 border-purple-300 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:border-purple-700',
    order: 3,
    categoryNames: ['mystery', 'thriller'],
  },
  {
    identifier: 'inspired',
    name: 'Inspired',
    emoji: '✨',
    description: 'Motivational and empowering reads',
    color: 'bg-green-100 hover:bg-green-200 border-green-300 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-700',
    order: 4,
    categoryNames: ['self-help', 'business', 'biography'],
  },
  {
    identifier: 'nostalgic',
    name: 'Nostalgic',
    emoji: '📖',
    description: 'Classic tales and historical journeys',
    color: 'bg-amber-100 hover:bg-amber-200 border-amber-300 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 dark:border-amber-700',
    order: 5,
    categoryNames: ['history', 'classics', 'biography'],
  },
  {
    identifier: 'relaxed',
    name: 'Relaxed',
    emoji: '😌',
    description: 'Calm and peaceful reading material',
    color: 'bg-teal-100 hover:bg-teal-200 border-teal-300 dark:bg-teal-900/20 dark:hover:bg-teal-900/30 dark:border-teal-700',
    order: 6,
    categoryNames: ['poetry', 'art', 'self-help'],
  },
  {
    identifier: 'curious',
    name: 'Curious',
    emoji: '🤔',
    description: 'Learn something new and fascinating',
    color: 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 dark:border-indigo-700',
    order: 7,
    categoryNames: ['science', 'history', 'business', 'self-help'],
  },
]

async function seedMoods() {
  console.log('🌱 Starting mood seeding...')

  // Get the admin user (first admin found)
  let admin
  try {
    admin = await prisma.user.findFirst({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN'],
        },
      },
    })
  } catch (error) {
    console.error('❌ Database connection failed. Please check your DATABASE_URL.')
    console.error('Error details:', error)
    process.exit(1)
  }

  if (!admin) {
    console.error('❌ No admin user found. Please create an admin user first.')
    console.error('You can create an admin user through the app signup process.')
    process.exit(1)
  }

  console.log(`👤 Using admin user: ${admin.email}`)

  // Get all categories for mapping
  const allCategories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
    },
  })

  const categoryMap = new Map(allCategories.map((c) => [c.name.toLowerCase(), c.id]))

  console.log(`📚 Found ${allCategories.length} categories`)

  // Create or update moods
  for (const moodData of INITIAL_MOODS) {
    const { categoryNames, ...moodFields } = moodData

    // Find category IDs for this mood
    const categoryIds: string[] = []
    for (const categoryName of categoryNames) {
      const categoryId = categoryMap.get(categoryName.toLowerCase())
      if (categoryId) {
        categoryIds.push(categoryId)
      } else {
        console.warn(`⚠️  Category "${categoryName}" not found for mood "${moodData.name}"`)
      }
    }

    // Upsert mood
    const mood = await prisma.mood.upsert({
      where: { identifier: moodData.identifier },
      update: {
        name: moodFields.name,
        emoji: moodFields.emoji,
        description: moodFields.description,
        color: moodFields.color,
        order: moodFields.order,
      },
      create: {
        ...moodFields,
        entryById: admin.id,
      },
    })

    // Update category mappings
    // Delete existing mappings
    await prisma.moodCategoryMapping.deleteMany({
      where: { moodId: mood.id },
    })

    // Create new mappings
    if (categoryIds.length > 0) {
      await prisma.moodCategoryMapping.createMany({
        data: categoryIds.map((categoryId) => ({
          moodId: mood.id,
          categoryId,
        })),
      })
    }

    console.log(`✅ Seeded mood: ${mood.emoji} ${mood.name} (${categoryIds.length} categories)`)
  }

  console.log('🎉 Mood seeding completed!')
}

seedMoods()
  .catch((error) => {
    console.error('❌ Error seeding moods:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
