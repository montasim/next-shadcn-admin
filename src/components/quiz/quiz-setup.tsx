'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface QuizConfig {
  category: string
  categoryName: string
  difficulty: 'any' | 'easy' | 'medium' | 'hard'
  questionCount: 5 | 10 | 15
}

interface QuizData {
  questions: Array<any>
}

interface QuizSetupProps {
  onStartQuiz: (config: QuizConfig, data: QuizData) => void
}

export function QuizSetup({ onStartQuiz }: QuizSetupProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('any')
  const [selectedDifficulty, setSelectedDifficulty] = useState<'any' | 'easy' | 'medium' | 'hard'>('any')
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15>(10)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch categories
  const { data: categoriesData, error: categoriesError } = useSWR(
    '/api/user/quiz/categories',
    fetcher
  )

  const categories = categoriesData?.data?.categories || []

  const handleStartQuiz = async () => {
    setIsLoading(true)

    try {
      // Build query params
      const params = new URLSearchParams({
        amount: questionCount.toString(),
        type: 'multiple',
      })

      if (selectedCategory !== 'any') {
        params.set('category', selectedCategory)
      }
      if (selectedDifficulty !== 'any') {
        params.set('difficulty', selectedDifficulty)
      }

      // Fetch questions
      const response = await fetch(`/api/user/quiz/questions?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        const categoryName = selectedCategory === 'any'
          ? 'All Categories'
          : categories.find((c: any) => c.id === selectedCategory)?.name || 'Selected Category'

        onStartQuiz(
          {
            category: selectedCategory,
            categoryName,
            difficulty: selectedDifficulty,
            questionCount,
          },
          data.data
        )
      }
    } catch (error) {
      console.error('Failed to start quiz:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryName = (id: string) => {
    if (id === 'any') return 'All Categories'
    const cat = categories.find((c: any) => c.id === id)
    return cat?.name || 'Select Category'
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold mb-2">Ready to Play?</h2>
        <p className="text-muted-foreground">
          Choose your preferences and start the quiz!
        </p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        {/* Category Selection */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">All Categories</SelectItem>
              {categories.map((category: any) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Difficulty Selection */}
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select value={selectedDifficulty} onValueChange={(v) => setSelectedDifficulty(v as 'any' | 'easy' | 'medium' | 'hard')}>
            <SelectTrigger id="difficulty">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Difficulty</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Question Count */}
        <div className="space-y-2">
          <Label htmlFor="count">Number of Questions</Label>
          <Select value={questionCount.toString()} onValueChange={(v) => setQuestionCount(Number(v) as 5 | 10 | 15)}>
            <SelectTrigger id="count">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 Questions (Quick)</SelectItem>
              <SelectItem value="10">10 Questions (Standard)</SelectItem>
              <SelectItem value="15">15 Questions (Long)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Start Button */}
        <Button
          onClick={handleStartQuiz}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading Questions...
            </>
          ) : (
            'Start Quiz'
          )}
        </Button>
      </div>
    </div>
  )
}
