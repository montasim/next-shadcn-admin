import { QuizLeaderboard } from '@/components/quiz/quiz-leaderboard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Trophy, ArrowLeft, Sparkles } from 'lucide-react'

export default function QuizLeaderboardPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/quiz">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quiz
            </Link>
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Quiz Leaderboard</h1>
              <p className="text-muted-foreground text-lg">
                Top players from around the world competing for the highest scores
              </p>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <QuizLeaderboard />

        {/* CTA */}
        <div className="mt-8 text-center">
          <div className="bg-muted/50 rounded-lg p-8 border-2">
            <h2 className="text-2xl font-bold mb-3">Think You Can Do Better?</h2>
            <p className="text-muted-foreground mb-6">
              Join the competition and see your name on the leaderboard!
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link href="/login">
                <Sparkles className="h-5 w-5" />
                Start Playing Now
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
