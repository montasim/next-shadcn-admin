'use client'

import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Flame, Target, Trophy, TrendingUp, Calendar, CheckCircle, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/context/auth-context'
import { getUserDisplayName } from '@/lib/utils/user'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function QuizStats() {
  const { user } = useAuth()
  const { data, isLoading, error } = useSWR('/api/user/quiz/stats', fetcher, {
    revalidateOnFocus: false,
  })

  const stats = data?.data?.stats

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Failed to load statistics</p>
        </CardContent>
      </Card>
    )
  }

  // If user hasn't played any quizzes
  if (!stats || stats.totalQuizzes === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Quizzes Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start playing to track your statistics and achievements!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const winRate = stats.totalQuizzes > 0
    ? Math.round((stats.totalWins / stats.totalQuizzes) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* User Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl">
                {(user?.name || user?.email || 'U')?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-bold">
                {getUserDisplayName({
                  name: user?.name,
                  email: user?.email || '',
                })}
              </h3>
              <p className="text-sm text-muted-foreground">
                {stats.totalQuizzes} quiz{stats.totalQuizzes !== 1 ? 'zes' : ''} played
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streak Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Streak */}
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              Daily Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
              {stats.currentDailyStreak} days
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Best: {stats.bestDailyStreak} days
            </p>
            {stats.currentDailyStreak > 0 && (
              <Progress value={(stats.currentDailyStreak / stats.bestDailyStreak) * 100} className="mt-3 h-2" />
            )}
          </CardContent>
        </Card>

        {/* Quiz Streak */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Best Quiz Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {stats.bestQuizStreak}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Consecutive correct answers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-xl font-bold">{stats.totalQuizzes}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Quizzes</p>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{stats.totalWins}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Wins</p>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{Math.round(stats.avgAccuracy)}%</div>
              <p className="text-sm text-muted-foreground mt-1">Avg Accuracy</p>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{stats.bestScore}</div>
              <p className="text-sm text-muted-foreground mt-1">Best Score</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Win Rate</span>
              <span className="font-medium">{winRate}%</span>
            </div>
            <Progress value={winRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Recent Attempts */}
      {stats.recentAttempts && stats.recentAttempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentAttempts.slice(0, 5).map((attempt: any) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{attempt.category}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground capitalize">{attempt.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{attempt.score}/{attempt.totalQuestions} correct</span>
                      <span>•</span>
                      <span>{Math.round(attempt.accuracy)}% accuracy</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{attempt.combinedScore}</div>
                    <p className="text-xs text-muted-foreground">score</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
