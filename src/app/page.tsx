import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookGrid } from '@/components/books/book-grid'
import { BookCardSkeleton } from '@/components/books/book-card-skeleton'
import {
  BookOpen,
  Sparkles,
  Brain,
  Target,
  Headphones,
  FileText,
  Users,
  ArrowRight,
  Check,
  Zap,
  Trophy,
} from 'lucide-react'

async function getFeaturedBooks() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/public/books?limit=6&sortBy=createdAt&sortOrder=desc`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return { books: [] }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch featured books:', error)
    return { books: [] }
  }
}

export default async function HomePage() {
  const data = await getFeaturedBooks()
  const featuredBooks = data?.books || []

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Book Chat',
      description: 'Interact with books using advanced AI. Ask questions, get summaries, and explore content like never before.',
      color: 'text-purple-500',
    },
    {
      icon: Sparkles,
      title: 'Mood-Based Recommendations',
      description: 'Discover books that match your current mood and preferences with our intelligent recommendation engine.',
      color: 'text-pink-500',
    },
    {
      icon: Trophy,
      title: 'Interactive Quizzes',
      description: 'Test your knowledge with book quizzes, compete on leaderboards, and track your reading streak.',
      color: 'text-amber-500',
    },
    {
      icon: BookOpen,
      title: 'Multiple Formats',
      description: 'Access eBooks, audiobooks, and hard copy references all in one unified platform.',
      color: 'text-blue-500',
    },
  ]

  const bookTypes = [
    {
      icon: FileText,
      title: 'eBooks',
      description: 'Digital books with built-in reader',
      count: '1000+',
    },
    {
      icon: Headphones,
      title: 'Audiobooks',
      description: 'Listen on the go',
      count: '500+',
    },
    {
      icon: BookOpen,
      title: 'Hard Copies',
      description: 'Physical library references',
      count: '2000+',
    },
  ]

  const benefits = [
    'Track your reading progress automatically',
    'Create and organize personal bookshelves',
    'Join a community of avid readers',
    'Access premium content and features',
    'Compete in quizzes and earn achievements',
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI-Powered Digital Library</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Your Reading Journey,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                Reimagined with AI
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover, read, and interact with books like never before. Chat with AI, get mood-based recommendations,
              and join a community of passionate readers.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button asChild size="lg" className="w-full sm:w-auto text-base h-12 px-8">
                <Link href="/sign-up">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-base h-12 px-8">
                <Link href="/books">Browse Books</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-border/50">
              <div className="text-center">
                <div className="text-3xl font-bold">10K+</div>
                <div className="text-sm text-muted-foreground">Books Available</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">5K+</div>
                <div className="text-sm text-muted-foreground">Active Readers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">50+</div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Everything You Need for the Perfect Reading Experience
            </h2>
            <p className="text-lg text-muted-foreground">
              Our platform combines cutting-edge AI technology with a vast library to deliver an unmatched reading experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20"
              >
                <CardContent className="p-6 lg:p-8">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br from-background to-muted ${feature.color}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Book Types Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              All Formats, One Platform
            </h2>
            <p className="text-lg text-muted-foreground">
              Access books in any format you prefer, all seamlessly integrated.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {bookTypes.map((type, index) => (
              <Card
                key={index}
                className="text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-8 space-y-4">
                  <div className="inline-flex p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <type.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-3xl font-bold">{type.count}</div>
                  <h3 className="text-xl font-semibold">{type.title}</h3>
                  <p className="text-muted-foreground">{type.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Books Section */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12 max-w-7xl mx-auto">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Featured Books</h2>
              <p className="text-muted-foreground">Check out our latest additions</p>
            </div>
            <Button asChild variant="outline" className="hidden sm:flex">
              <Link href="/books">
                View All Books
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="max-w-7xl mx-auto">
            {featuredBooks.length > 0 ? (
              <BookGrid
                books={featuredBooks}
                viewMode="grid"
                viewMoreHref={(book) => `/books/${book.id}`}
                showTypeBadge={true}
                showPremiumBadge={true}
                showCategories={true}
                showReaderCount={true}
                showAddToBookshelf={true}
                showUploader={true}
                showLockOverlay={true}
                coverHeight="tall"
                showProgressActions={false}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <BookCardSkeleton key={i} viewMode="grid" />
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/books">
                View All Books
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-purple-500/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Why Choose Our Platform?
                </h2>
                <p className="text-lg text-muted-foreground">
                  Experience the future of digital reading with a platform designed for modern book lovers.
                </p>

                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-muted-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Button asChild size="lg" className="group">
                    <Link href="/sign-up">
                      Start Your Journey
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="relative">
                <Card className="shadow-2xl border-2">
                  <CardContent className="p-8 space-y-6">
                    <div className="text-center space-y-2">
                      <div className="inline-flex items-center justify-center p-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white mb-4">
                        <Zap className="h-8 w-8" />
                      </div>
                      <h3 className="text-2xl font-bold">Join For Free Today</h3>
                      <p className="text-muted-foreground">
                        Get instant access to thousands of books and start your reading adventure
                      </p>
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Free Books</span>
                        <span className="font-semibold">Unlimited Access</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">AI Chat</span>
                        <span className="font-semibold">1000 messages/mo</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Quizzes</span>
                        <span className="font-semibold">Unlimited</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Reading Tracking</span>
                        <span className="font-semibold">Full Features</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto bg-gradient-to-br from-primary to-purple-600 text-white border-0 shadow-2xl">
            <CardContent className="p-12 md:p-16 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Transform Your Reading Experience?
              </h2>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                Join thousands of readers who are already enjoying the future of digital libraries.
                Sign up now and get started for free.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto text-base h-12 px-8"
                >
                  <Link href="/sign-up">
                    Create Free Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-base h-12 px-8 bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white"
                >
                  <Link href="/auth/sign-in">Sign In</Link>
                </Button>
              </div>

              <div className="flex items-center justify-center gap-6 pt-6 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>Free forever plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">Book Heaven</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered digital library for modern readers.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Explore</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/books" className="hover:text-foreground transition-colors">Books</Link></li>
                <li><Link href="/categories" className="hover:text-foreground transition-colors">Categories</Link></li>
                <li><Link href="/authors" className="hover:text-foreground transition-colors">Authors</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/quiz" className="hover:text-foreground transition-colors">Quizzes</Link></li>
                <li><Link href="/library" className="hover:text-foreground transition-colors">Library</Link></li>
                <li><Link href="/premium" className="hover:text-foreground transition-colors">Premium</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Account</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/auth/sign-in" className="hover:text-foreground transition-colors">Sign In</Link></li>
                <li><Link href="/auth/sign-up" className="hover:text-foreground transition-colors">Sign Up</Link></li>
                <li><Link href="/settings" className="hover:text-foreground transition-colors">Settings</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Book Heaven. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
