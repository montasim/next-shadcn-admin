'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, Flame, Target } from 'lucide-react'

interface Question {
  category: string
  type: string
  difficulty: string
  question: string
  correct_answer: string
  incorrect_answers: string[]
  allAnswers: string[]
}

interface QuizConfig {
  category: string
  categoryName: string
  difficulty: 'easy' | 'medium' | 'hard'
  questionCount: number
}

interface QuizGameProps {
  questions: Question[]
  config: QuizConfig
  onComplete: () => void
}

export function QuizGame({ questions, config, onComplete }: QuizGameProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [quizStreak, setQuizStreak] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [answers, setAnswers] = useState<Array<{
    question: string
    correctAnswer: string
    selectedAnswer: string | null
    isCorrect: boolean
  }>>([])
  const [startTime] = useState(() => Date.now())

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return
    setSelectedAnswer(answer)
  }

  const handleConfirm = () => {
    if (!selectedAnswer || showResult) return

    const isCorrect = selectedAnswer === currentQuestion.correct_answer
    const newCorrectAnswers = isCorrect ? correctAnswers + 1 : correctAnswers
    const newCurrentStreak = isCorrect ? currentStreak + 1 : 0
    const newQuizStreak = Math.max(quizStreak, newCurrentStreak)

    setCorrectAnswers(newCorrectAnswers)
    setCurrentStreak(newCurrentStreak)
    setQuizStreak(newQuizStreak)
    setAnswers([
      ...answers,
      {
        question: currentQuestion.question,
        correctAnswer: currentQuestion.correct_answer,
        selectedAnswer,
        isCorrect,
      },
    ])
    setShowResult(true)
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      // Quiz completed - save results
      saveResults()
    }
  }

  const saveResults = async () => {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000)

    try {
      await fetch('/api/user/quiz/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: config.category,
          difficulty: config.difficulty,
          questionCount: config.questionCount,
          totalQuestions: questions.length,
          score: correctAnswers,
          quizStreak,
          timeTaken,
        }),
      })
    } catch (error) {
      console.error('Failed to save quiz results:', error)
    }

    onComplete()
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'hard': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            {currentQuestionIndex + 1} / {questions.length}
          </Badge>
          <Badge className={`${getDifficultyColor(config.difficulty)} text-white`}>
            {config.difficulty.toUpperCase()}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{correctAnswers} correct</span>
          </div>
          {currentStreak > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="font-medium">{currentStreak} streak</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.allAnswers.map((answer, index) => {
            const isSelected = selectedAnswer === answer
            const isCorrectAnswer = answer === currentQuestion.correct_answer

            let buttonVariant: 'default' | 'outline' | 'destructive' | 'secondary' = 'outline'
            let extraClasses = ''

            if (showResult) {
              if (isCorrectAnswer) {
                buttonVariant = 'default'
                extraClasses = 'bg-green-600 hover:bg-green-700 text-white border-green-600'
              } else if (isSelected && !isCorrectAnswer) {
                buttonVariant = 'destructive'
              }
            } else if (isSelected) {
              buttonVariant = 'default'
            }

            return (
              <Button
              key={index}
              variant={buttonVariant}
              className={`w-full justify-start text-left h-auto py-4 px-4 ${extraClasses}`}
              onClick={() => handleAnswerSelect(answer)}
              disabled={showResult}
            >
                <div className="flex items-center gap-3 w-full">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">{answer}</span>
                  {showResult && isCorrectAnswer && (
                    <CheckCircle className="h-5 w-5" />
                  )}
                  {showResult && isSelected && !isCorrectAnswer && (
                    <XCircle className="h-5 w-5" />
                  )}
                </div>
              </Button>
            )
          })}
        </CardContent>
      </Card>

      {/* Confirm/Next button */}
      <div className="flex justify-center">
        {!showResult ? (
          <Button
            onClick={handleConfirm}
            disabled={!selectedAnswer}
            size="lg"
            className="min-w-40"
          >
            Confirm Answer
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            size="lg"
            className="min-w-40"
          >
            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
          </Button>
        )}
      </div>
    </div>
  )
}
