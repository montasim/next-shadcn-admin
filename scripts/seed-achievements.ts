/**
 * Seed Achievements Script
 *
 * Run this script to seed achievements into the database
 * Usage: pnpm run seed-achievements
 */

import { config } from 'dotenv'
import { prisma } from '../src/lib/prisma'
import { ACHIEVEMENTS } from '../src/lib/achievements/definitions'

// Load environment variables
config()

async function seedAchievements() {
  console.log('Seeding achievements...')

  let created = 0
  let skipped = 0

  for (const achievement of ACHIEVEMENTS) {
    const existing = await prisma.achievement.findUnique({
      where: { code: achievement.code }
    })

    if (!existing) {
      await prisma.achievement.create({
        data: {
          code: achievement.code,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category,
          tier: achievement.tier,
          xp: achievement.xp,
          requirements: achievement.requirements as any,
        }
      })
      created++
      console.log(`✓ Created: ${achievement.name}`)
    } else {
      skipped++
      console.log(`⊘ Skipped: ${achievement.name} (already exists)`)
    }
  }

  console.log(`\nSeeding complete!`)
  console.log(`Created: ${created} achievements`)
  console.log(`Skipped: ${skipped} achievements`)
}

seedAchievements()
  .then(() => {
    console.log('\n✓ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n✗ Error:', error)
    process.exit(1)
  })
