/**
 * Achievement Badge Component
 *
 * Displays a single achievement with tier styling
 */

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Lock } from 'lucide-react'
import type { AchievementWithProgress } from '@/lib/achievements/types'

interface AchievementBadgeProps {
  achievement: AchievementWithProgress
  showProgress?: boolean
}

const tierColors = {
  BRONZE: 'from-amber-600 to-amber-800 border-amber-500',
  SILVER: 'from-gray-300 to-gray-500 border-gray-400',
  GOLD: 'from-yellow-400 to-yellow-600 border-yellow-500',
  PLATINUM: 'from-slate-200 to-slate-400 border-slate-300',
  DIAMOND: 'from-cyan-300 to-cyan-500 border-cyan-400',
  LEGENDARY: 'from-purple-400 to-pink-500 border-purple-500',
}

const tierBadgeColors = {
  BRONZE: 'bg-amber-600 text-amber-950',
  SILVER: 'bg-gray-400 text-gray-950',
  GOLD: 'bg-yellow-500 text-yellow-950',
  PLATINUM: 'bg-slate-300 text-slate-950',
  DIAMOND: 'bg-cyan-400 text-cyan-950',
  LEGENDARY: 'bg-purple-500 text-purple-950',
}

export function AchievementBadge({ achievement, showProgress = false }: AchievementBadgeProps) {
  const progressPercent = achievement.userUnlocked
    ? 100
    : Math.min(100, (achievement.userProgress || 0) / (achievement.requirements as any).count * 100)

  return (
    <Card className={`relative overflow-hidden transition-all hover:shadow-lg ${
      achievement.userUnlocked
        ? `bg-gradient-to-br ${tierColors[achievement.tier]} border-2`
        : 'bg-muted/50 border-muted-foreground/20'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`text-3xl ${achievement.userUnlocked ? '' : 'grayscale opacity-30'}`}>
            {achievement.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold text-sm ${
                achievement.userUnlocked ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {achievement.name}
              </h3>
              {!achievement.userUnlocked && (
                <Lock className="h-3 w-3 text-muted-foreground" />
              )}
            </div>

            <p className={`text-xs mb-2 ${
              achievement.userUnlocked ? 'text-foreground/80' : 'text-muted-foreground'
            }`}>
              {achievement.description}
            </p>

            {/* Tier Badge */}
            <Badge className={`text-xs ${tierBadgeColors[achievement.tier]}`}>
              {achievement.tier}
            </Badge>

            {/* XP */}
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <span>⭐</span>
              <span>{achievement.xp} XP</span>
            </div>

            {/* Progress Bar */}
            {showProgress && !achievement.userUnlocked && (
              <div className="mt-3">
                <Progress value={progressPercent} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {achievement.userProgress || 0} / {(achievement.requirements as any).count}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
