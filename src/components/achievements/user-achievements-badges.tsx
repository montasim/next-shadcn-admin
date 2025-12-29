/**
 * User Achievements Badges Component
 *
 * Displays a user's unlocked achievements as badges
 */

'use client'

import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy } from 'lucide-react'
import { AchievementBadge } from './achievement-badge'
import type { AchievementWithProgress } from '@/lib/achievements/types'

interface UserAchievementsBadgesProps {
  userId: string
  limit?: number
}

export function UserAchievementsBadges({ userId, limit = 6 }: UserAchievementsBadgesProps) {
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAchievements() {
      try {
        const response = await fetch(`/api/user/${userId}/achievements`)
        const result = await response.json()

        if (result.success) {
          setAchievements(result.data.slice(0, limit))
        }
      } catch (error) {
        console.error('Error fetching achievements:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAchievements()
  }, [userId, limit])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="aspect-square">
            <Skeleton className="h-full w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (achievements.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No achievements yet</h3>
          <p className="text-sm text-muted-foreground">
            Start reading, taking quizzes, and exploring to unlock achievements!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {achievements.map(achievement => (
        <AchievementBadge
          key={achievement.id}
          achievement={achievement}
        />
      ))}
    </div>
  )
}
