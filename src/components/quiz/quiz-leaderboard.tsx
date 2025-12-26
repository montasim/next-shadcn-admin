'use client'

import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Medal, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getUserDisplayName } from '@/lib/utils/user'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function QuizLeaderboard() {
  const { data, isLoading, error } = useSWR('/api/user/quiz/leaderboard?limit=50', fetcher, {
    revalidateOnFocus: false,
  })

  const leaderboard = data?.data?.leaderboard || []

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <div className="text-2xl">🥇</div>
      case 2:
        return <div className="text-2xl">🥈</div>
      case 3:
        return <div className="text-2xl">🥉</div>
      default:
        return <div className="w-8 h-8 flex items-center justify-center text-sm font-bold text-muted-foreground">
          #{rank}
        </div>
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500'
    if (rank === 2) return 'bg-gray-400'
    if (rank === 3) return 'bg-orange-600'
    return ''
  }

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
          <p className="text-muted-foreground">Failed to load leaderboard</p>
        </CardContent>
      </Card>
    )
  }

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Scores Yet</h3>
            <p className="text-muted-foreground">
              Be the first to play and set a high score!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Global Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {leaderboard.map((entry: any) => (
            <div
              key={entry.id}
              className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                entry.rank <= 3 ? 'bg-muted/50' : 'hover:bg-muted/30'
              }`}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-12 flex justify-center">
                {getRankIcon(entry.rank)}
              </div>

              {/* User Avatar */}
              <Avatar className="h-10 w-10">
                {entry.user.avatar ? (
                  <AvatarImage src={entry.user.avatar} alt={entry.user.username || entry.user.email || 'User'} />
                ) : (
                  <AvatarFallback>
                    {(entry.user.firstName || entry.user.username || entry.user.name || entry.user.email || 'U')?.[0]?.toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {getUserDisplayName({
                    firstName: entry.user.firstName,
                    lastName: entry.user.lastName,
                    username: entry.user.username,
                    name: entry.user.name,
                    email: entry.user.email || '',
                  })}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{entry.category}</span>
                  <span>•</span>
                  <span>{entry.difficulty}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="text-right">
                <p className="font-bold text-lg">{entry.combinedScore}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{entry.score}/{entry.totalQuestions}</span>
                  <span>•</span>
                  <span>{Math.round(entry.accuracy)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
