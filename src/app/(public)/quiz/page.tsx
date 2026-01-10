'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Brain, Trophy, BarChart3 } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { QuizSetup } from '@/components/quiz/quiz-setup'
import { QuizGame } from '@/components/quiz/quiz-game'
import { QuizResults } from '@/components/quiz/quiz-results'
import { QuizLeaderboard } from '@/components/quiz/quiz-leaderboard'
import { QuizStats } from '@/components/quiz/quiz-stats'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type QuizState = 'setup' | 'playing' | 'results'

interface QuizConfig {
  category: string
  categoryName: string
  difficulty: 'any' | 'easy' | 'medium' | 'hard'
  questionCount: 5 | 10 | 15
}

interface QuizData {
  questions: Array<{
    category: string
    type: string
    difficulty: string
    question: string
    correct_answer: string
    incorrect_answers: string[]
    allAnswers: string[]
  }>
}

export default function QuizPage() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [quizState, setQuizState] = useState<QuizState>('setup')
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null)
  const [quizData, setQuizData] = useState<QuizData | null>(null)

  // Get active tab from URL query param
  const activeTab = searchParams.get('tab') || 'play'

  const handleStartQuiz = (config: QuizConfig, data: QuizData) => {
    setQuizConfig(config)
    setQuizData(data)
    setQuizState('playing')
  }

  const handleQuizComplete = () => {
    setQuizState('results')
  }

  const handlePlayAgain = () => {
    setQuizState('setup')
    setQuizConfig(null)
    setQuizData(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-4 pb-24 lg:pb-8">
        {/* Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-xl font-bold">Quiz Game</h1>
            <p className="text-muted-foreground">
              Test your knowledge and climb the leaderboard!
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <Link href="/quiz?tab=play">
              <TabsTrigger value="play" className="gap-2">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">Play</span>
              </TabsTrigger>
            </Link>
            <Link href="/quiz?tab=leaderboard">
              <TabsTrigger value="leaderboard" className="gap-2">
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">Leaderboard</span>
              </TabsTrigger>
            </Link>
            <Link href="/quiz?tab=stats">
              <TabsTrigger value="stats" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Stats</span>
              </TabsTrigger>
            </Link>
          </TabsList>

          {/* Play Tab */}
          <TabsContent value="play">
            <Card>
              <CardContent className="p-6">
                {quizState === 'setup' && (
                  <QuizSetup onStartQuiz={handleStartQuiz} />
                )}

                {quizState === 'playing' && quizData && quizConfig && (
                  <QuizGame
                    questions={quizData.questions}
                    config={quizConfig}
                    onComplete={handleQuizComplete}
                  />
                )}

                {quizState === 'results' && quizConfig && (
                  <QuizResults
                    config={quizConfig}
                    onPlayAgain={handlePlayAgain}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <QuizLeaderboard />
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            {user ? (
              <QuizStats showUserProfile={false} />
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sign in required</h3>
                    <p className="text-muted-foreground">
                      Please sign in to view your quiz statistics.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
