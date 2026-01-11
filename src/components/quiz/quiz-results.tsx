'use client'

import { useEffect, useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Trophy, Flame, Target, TrendingUp, CheckCircle, XCircle } from 'lucide-react'
import useSWR from 'swr'

interface QuizConfig {
  category: string
  categoryName: string
  difficulty: 'any' | 'easy' | 'medium' | 'hard'
  questionCount: number
}

interface QuizResultsProps {
  config: QuizConfig
  onPlayAgain: () => void
}

interface QuizStats {
  currentDailyStreak: number
  bestDailyStreak: number
  bestQuizStreak: number
  totalQuizzes: number
  totalWins: number
  totalCorrect: number
  totalQuestions: number
  bestScore: number
  avgAccuracy: number
  recentAttempts: any[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function QuizResults({ config, onPlayAgain }: QuizResultsProps) {
  const [lastAttempt, setLastAttempt] = useState<any>(null)
  const [isPending, startTransition] = useTransition()

  // Fetch user stats to get latest attempt info
  const { data: statsData } = useSWR('/api/user/quiz/stats', fetcher, {
    revalidateOnFocus: false,
  })

  const stats = statsData?.data?.stats as QuizStats | undefined

  useEffect(() => {
    // Get the last attempt from stats
    if (stats?.recentAttempts && stats.recentAttempts.length > 0) {
      startTransition(() => {
        setLastAttempt(stats.recentAttempts[0])
      })
    }
  }, [stats])

  if (!lastAttempt) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    )
  }

  const accuracy = Math.round(lastAttempt.accuracy || 0)
  const isWin = accuracy >= 50

  return (
    <div className="space-y-6">
      {/* Congratulations message */}
      <div className="text-center">
        {isWin ? (
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900 mb-4">
              <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-xl font-bold">Congratulations!</h2>
            <p className="text-muted-foreground">
              You completed the {config.difficulty} quiz with flying colors!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-xl font-bold">Quiz Complete!</h2>
            <p className="text-muted-foreground">
              Good effort! Keep practicing to improve your score.
            </p>
          </div>
        )}
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Accuracy */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{accuracy}%</div>
            <Progress value={accuracy} className="mt-2 h-2" />
          </CardContent>
        </Card>

        {/* Score */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {lastAttempt.score}/{lastAttempt.totalQuestions}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {lastAttempt.score} correct answers
            </p>
          </CardContent>
        </Card>

        {/* Quiz Streak */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Quiz Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{lastAttempt.quizStreak}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Best: {stats?.bestQuizStreak || 0}
            </p>
          </CardContent>
        </Card>

        {/* Combined Score */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Combined Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{lastAttempt.combinedScore}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Best: {stats?.bestScore || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Streak Info */}
      {stats && stats.currentDailyStreak > 0 && (
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Flame className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                <div>
                  <p className="font-semibold">
                    {stats.currentDailyStreak} Day Streak!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Keep playing to maintain your streak
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                🔥 {stats.currentDailyStreak}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Stats */}
      {stats && stats.totalQuizzes > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xl font-bold">{stats.totalQuizzes}</p>
                <p className="text-xs text-muted-foreground">Total Quizzes</p>
              </div>
              <div>
                <p className="text-xl font-bold">{stats.totalWins}</p>
                <p className="text-xs text-muted-foreground">Total Wins</p>
              </div>
              <div>
                <p className="text-xl font-bold">{Math.round(stats.avgAccuracy)}%</p>
                <p className="text-xs text-muted-foreground">Avg Accuracy</p>
              </div>
              <div>
                <p className="text-xl font-bold">{stats.bestDailyStreak}</p>
                <p className="text-xs text-muted-foreground">Best Daily Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button onClick={onPlayAgain} size="lg">
          Play Again
        </Button>
      </div>
    </div>
  )
}
