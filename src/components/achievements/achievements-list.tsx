/**
 * Achievements List Component
 *
 * Displays all achievements grouped by category
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Award, BookOpen, Trophy, ShoppingBag, Users, Target, Sparkles } from 'lucide-react'
import { AchievementBadge } from './achievement-badge'
import type { AchievementWithProgress } from '@/lib/achievements/types'

interface AchievementsListProps {
  achievements: AchievementWithProgress[]
  isLoading?: boolean
}

const categoryConfig = {
  READING: { label: 'Reading', icon: BookOpen },
  COLLECTION: { label: 'Collection', icon: Trophy },
  QUIZ: { label: 'Quiz', icon: Award },
  MARKETPLACE: { label: 'Marketplace', icon: ShoppingBag },
  ENGAGEMENT: { label: 'Engagement', icon: Users },
  SOCIAL: { label: 'Social', icon: Target },
  SPECIAL: { label: 'Special', icon: Sparkles },
}

export function AchievementsList({ achievements, isLoading }: AchievementsListProps) {
  if (isLoading) {
    return <AchievementsListSkeleton />
  }

  const groupedAchievements = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = []
    }
    acc[achievement.category].push(achievement)
    return acc
  }, {} as Record<string, AchievementWithProgress[]>)

  const unlockedCount = achievements.filter(a => a.userUnlocked).length
  const totalCount = achievements.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Achievements</h2>
          <p className="text-sm text-muted-foreground">
            {unlockedCount} of {totalCount} unlocked
          </p>
        </div>
      </div>

      {/* Achievements by Category */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto lg:grid lg:grid-cols-8">
          <TabsTrigger value="all">All</TabsTrigger>
          {Object.entries(categoryConfig).map(([key, { label, icon: Icon }]) => (
            <TabsTrigger key={key} value={key.toLowerCase()} className="gap-1 whitespace-nowrap">
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map(achievement => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                showProgress
              />
            ))}
          </div>
        </TabsContent>

        {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => {
          const Icon = categoryConfig[category as keyof typeof categoryConfig]?.icon || Trophy
          const label = categoryConfig[category as keyof typeof categoryConfig]?.label || category
          const categoryUnlocked = categoryAchievements.filter(a => a.userUnlocked).length

          return (
            <TabsContent key={category} value={category.toLowerCase()}>
              <div className="mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {label} ({categoryUnlocked}/{categoryAchievements.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryAchievements.map(achievement => (
                  <AchievementBadge
                    key={achievement.id}
                    achievement={achievement}
                    showProgress
                  />
                ))}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}

function AchievementsListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
