/**
 * Achievements Page
 *
 * View all achievements and user progress
 */

'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { AchievementsList } from '@/components/achievements/achievements-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DashboardSummary } from '@/components/dashboard/dashboard-summary'
import { DashboardSummarySkeleton } from '@/components/dashboard/dashboard-summary-skeleton'
import {
  AchievementsPageHeaderSkeleton,
  AchievementsGuidanceSkeleton,
  AchievementsListSkeleton
} from '@/components/achievements/achievements-page-skeleton'
import { Trophy, Sparkles, Target, BookOpen, TrendingUp, Award, ChevronRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import type { AchievementWithProgress } from '@/lib/achievements/types'

interface AchievementAction {
  label: string
  link: string
}

interface AchievementGuidance {
  achievement: AchievementWithProgress
  action: AchievementAction
}

export default function AchievementsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [isGuidanceExpanded, setIsGuidanceExpanded] = useState(false)

  useEffect(() => {
    if (!user) return

    async function fetchAchievements() {
      try {
        const response = await fetch('/api/user/achievements')
        const result = await response.json()

        if (result.success) {
          setAchievements(result.data)
        }
      } catch (error) {
        console.error('Error fetching achievements:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAchievements()
  }, [user])

  const handleCheckAchievements = async () => {
    setIsChecking(true)
    try {
      const response = await fetch('/api/user/achievements', {
        method: 'POST'
      })
      const result = await response.json()

      if (result.success && result.data.unlocked.length > 0) {
        // Show notification for new achievements
        result.data.unlocked.forEach((code: string) => {
          const achievement = achievements.find(a => a.code === code)
          if (achievement) {
            // Could trigger toast notification here
            console.log(`Unlocked: ${achievement.name}`)
          }
        })

        // Refresh achievements
        const response2 = await fetch('/api/user/achievements')
        const result2 = await response2.json()
        if (result2.success) {
          setAchievements(result2.data)
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const unlockedCount = achievements.filter(a => a.userUnlocked).length
  const totalXP = achievements.reduce((sum, a) => a.userUnlocked ? sum + a.xp : sum, 0)
  const completionPercentage = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0

  // Find next achievable achievements (closest to unlocking)
  const nextAchievements = achievements
    .filter(a => !a.userUnlocked && (a.userProgress || 0) > 0)
    .sort((a, b) => {
      const aReq = (a.requirements as any)?.count || 1
      const bReq = (b.requirements as any)?.count || 1
      const aProgress = aReq > 0 ? (a.userProgress || 0) / aReq : 0
      const bProgress = bReq > 0 ? (b.userProgress || 0) / bReq : 0
      return bProgress - aProgress
    })
    .slice(0, 3)

  // Generate achievement guidance with actions
  const getAchievementGuidance = (achievement: AchievementWithProgress): AchievementAction => {
    const req = achievement.requirements as any

    switch (req?.type) {
      case 'BOOKS_READ':
      case 'PAGES_READ':
        return { label: 'Start Reading', link: '/books' }

      case 'BOOKS_ADDED':
      case 'UNIQUE_AUTHORS':
      case 'UNIQUE_CATEGORIES':
        return { label: 'Add to Library', link: '/dashboard/books' }

      case 'BOOKSHELVES_CREATED':
        return { label: 'Create Bookshelf', link: '/library?tab=bookshelves' }

      case 'QUIZZES_COMPLETED':
      case 'PERFECT_QUIZ':
      case 'HIGH_SCORE':
      case 'QUIZ_STREAK':
      case 'DAILY_STREAK':
        return { label: 'Take Quiz', link: '/quiz' }

      case 'SELL_POSTS_CREATED':
        return { label: 'Browse Marketplace', link: '/marketplace' }

      case 'OFFERS_MADE':
        return { label: 'Browse Marketplace', link: '/marketplace' }

      case 'REVIEWS_LEFT':
        return { label: 'View Conversations', link: '/messages' }

      case 'PROFILE_COMPLETENESS':
        return { label: 'Update Profile', link: '/settings' }

      case 'EARLY_ADOPTER':
      case 'ALL_CATEGORIES':
        return { label: 'Explore Books', link: '/books' }

      default:
        return { label: 'Explore Platform', link: '/books' }
    }
  }

  // Group achievements by category for guidance
  const achievementsByCategory = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = []
    }
    acc[achievement.category].push({
      achievement,
      action: getAchievementGuidance(achievement)
    })
    return acc
  }, {} as Record<string, AchievementGuidance[]>)

  // Prepare dashboard summary items
  const summaryItems = [
    {
      title: 'Achievements Unlocked',
      value: `${unlockedCount}/${achievements.length}`,
      description: `${completionPercentage}% complete`,
      icon: Trophy,
      additionalContent: (
        <Progress value={completionPercentage} className="mt-2" />
      )
    },
    {
      title: 'Total XP',
      value: totalXP.toLocaleString(),
      description: 'Experience points earned',
      icon: Award,
    },
    {
      title: 'Next to Unlock',
      value: nextAchievements.length > 0 ? nextAchievements.length.toString() : '0',
      description: 'achievements in progress',
      icon: Target,
      additionalContent: nextAchievements.length > 0 ? (
        <div className="mt-2 space-y-1">
          {nextAchievements.slice(0, 2).map(a => {
            const maxProgress = (a.requirements as any)?.count || 1
            return (
              <div key={a.id} className="flex items-center justify-between text-xs">
                <span className="truncate">{a.icon} {a.name}</span>
                <span className="text-muted-foreground">{a.userProgress || 0}/{maxProgress}</span>
              </div>
            )
          })}
        </div>
      ) : undefined
    },
    {
      title: 'Your Rank',
      value: completionPercentage >= 75 ? 'Gold' : completionPercentage >= 50 ? 'Silver' : completionPercentage >= 25 ? 'Bronze' : 'Novice',
      description: 'Keep going to level up!',
      icon: TrendingUp,
    },
  ]

  if (!user) {
    return null // Will be handled by layout
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Header */}
      {isLoading ? (
        <AchievementsPageHeaderSkeleton />
      ) : (
        <div className='flex-none mb-2 flex flex-col md:flex-row md:justify-between gap-4'>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              Achievements
            </h1>
            <p className="text-muted-foreground">
              Unlock achievements by reading, taking quizzes, and exploring the platform
            </p>
          </div>
          <Button
            onClick={handleCheckAchievements}
            disabled={isChecking}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isChecking ? 'Checking...' : 'Check for New'}
          </Button>
        </div>
      )}

      <ScrollArea className='faded-bottom -mx-4 flex-1 scroll-smooth px-4 md:pb-16 h-full'>
        <div className='space-y-6'>
          {/* Dashboard Summary */}
          {isLoading ? (
            <DashboardSummarySkeleton count={4} />
          ) : (
            <DashboardSummary summaries={summaryItems} />
          )}

      {/* All Achievements Guidance Section */}
      {isLoading ? (
        <AchievementsGuidanceSkeleton />
      ) : (
      <div className="rounded-lg border bg-card">
        <button
          onClick={() => setIsGuidanceExpanded(!isGuidanceExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <h2 className="text-lg font-semibold flex items-center gap-2 text-left">
            <Target className="h-5 w-5" />
            How to Achieve More
          </h2>
          {isGuidanceExpanded ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform" />
          )}
        </button>

        {isGuidanceExpanded && (
          <div className="px-6 pb-6">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading achievements...
              </div>
            ) : achievements.length === 0 ? null : (
              <div className="space-y-6">
            {Object.entries(achievementsByCategory).map(([category, items]) => {
            const categoryConfig: Record<string, { label: string; icon: any }> = {
              READING: { label: 'Reading', icon: BookOpen },
              COLLECTION: { label: 'Collection', icon: Trophy },
              QUIZ: { label: 'Quiz', icon: Award },
              MARKETPLACE: { label: 'Marketplace', icon: TrendingUp },
              ENGAGEMENT: { label: 'Engagement', icon: Target },
              SOCIAL: { label: 'Social', icon: Target },
              SPECIAL: { label: 'Special', icon: Sparkles },
            }

            const config = categoryConfig[category] || { label: category, icon: Trophy }
            const Icon = config.icon

            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{config.label}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map(({ achievement, action }) => {
                    const maxProgress = (achievement.requirements as any)?.count || 1
                    const progress = achievement.userProgress || 0
                    const isUnlocked = achievement.userUnlocked

                    return (
                      <div
                        key={achievement.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          isUnlocked
                            ? 'bg-primary/5 border-primary/20'
                            : progress > 0
                              ? 'bg-muted/50 border-border'
                              : 'bg-background border-border'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <span className="text-xl">{achievement.icon}</span>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{achievement.name}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {achievement.description}
                              </p>
                            </div>
                          </div>
                          {isUnlocked && (
                            <span className="text-xs font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10 flex-shrink-0">
                              Unlocked
                            </span>
                          )}
                        </div>

                        {!isUnlocked && (
                          <>
                            <div className="mb-2">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">
                                  {progress}/{maxProgress}
                                </span>
                              </div>
                              <Progress
                                value={Math.min((progress / maxProgress) * 100, 100)}
                                className="h-1.5"
                              />
                            </div>

                            <Link href={action.link}>
                              <Button
                                variant={progress > 0 ? 'default' : 'outline'}
                                size="sm"
                                className="w-full h-7 text-xs"
                              >
                                {action.label}
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            </Link>
                          </>
                        )}

                        {isUnlocked && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">XP Earned</span>
                            <span className="font-semibold text-primary">+{achievement.xp}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
          </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Achievements List */}
      {achievements.length === 0 && !isLoading ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No achievements available yet</h3>
              <p className="text-muted-foreground mb-4">
                Start exploring the platform to unlock achievements.
              </p>
              <p className="text-sm text-muted-foreground">
                Read books, take quizzes, and engage with the community to earn rewards.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <AchievementsListSkeleton />
      ) : (
        <AchievementsList achievements={achievements} isLoading={isLoading} />
      )}
        </div>
      </ScrollArea>
    </div>
  )
}
