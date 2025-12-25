'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Trophy, Users, BookOpen, ArrowRight, TrendingUp, Sparkles } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-bold tracking-tight">
              Your Digital{' '}
              <span className="text-primary">Book Library</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover amazing books, track your reading progress, and challenge your knowledge with interactive quizzes.
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button asChild size="lg">
                <Link href="/books">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Browse Books
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/quiz">
                  <Brain className="h-5 w-5 mr-2" />
                  Play Quiz
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground text-lg">
              Books, quizzes, and community features all in one place
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2">
              <CardHeader>
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Extensive Library</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Access thousands of ebooks and audiobooks across multiple categories.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <Brain className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Interactive Quizzes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Test your knowledge with 30+ trivia categories and compete globally.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Community</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Connect with readers, share bookshelves, and see what others are reading.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quiz Challenge Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-2 bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="p-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="p-6 bg-primary rounded-2xl">
                    <Brain className="h-16 w-16 text-primary-foreground" />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-bold mb-4">Daily Quiz Challenge</h2>
                  <p className="text-muted-foreground text-lg mb-6">
                    Test your knowledge across 30+ categories. Compete on the global leaderboard,
                    build daily streaks, and track your progress!
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                    <Button asChild size="lg" className="gap-2">
                      <Link href="/quiz">
                        <Sparkles className="h-5 w-5" />
                        Start Quiz
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="gap-2">
                      <Link href="/quiz/leaderboard">
                        <Trophy className="h-5 w-5" />
                        View Rankings
                      </Link>
                    </Button>
                  </div>
                  <div className="flex items-center gap-6 mt-6 text-sm text-muted-foreground justify-center md:justify-start">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Global Competition</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>Track Progress</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join our community of readers and quiz enthusiasts today.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/login">Sign Up</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/books">Browse Books</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
