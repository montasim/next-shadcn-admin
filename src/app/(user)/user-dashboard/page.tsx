'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { StatCard } from '@/components/analytics/stat-card'
import {
  BookOpen,
  Clock,
  TrendingUp,
  Target,
  Award,
  Library,
  ArrowRight,
  Star
} from 'lucide-react'

export default function UserDashboard() {
  // Mock data - in a real app, this would come from your API
  const stats = {
    totalBooks: 12,
    completedBooks: 8,
    currentlyReading: 3,
    readingTime: 45, // hours
    averageProgress: 75
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome to Your Library</h1>
            <p className="text-muted-foreground">
              Track your reading journey and discover your next great read.
            </p>
          </div>
          <Link href="/books">
            <Button>
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Books
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Books Read"
            value={stats.completedBooks}
            icon={BookOpen}
            description="2 this month"
          />

          <StatCard
            title="Reading Time"
            value={`${stats.readingTime}h`}
            icon={Clock}
            description="Total time invested"
          />

          <StatCard
            title="Currently Reading"
            value={stats.currentlyReading}
            icon={TrendingUp}
            description="Active books"
          />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reading Goal</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">67%</div>
              <p className="text-xs text-muted-foreground">
                8 of 12 books
              </p>
              <Progress value={67} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Reading Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Continue Reading */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Continue Reading</h2>
              <Link href="/library">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold line-clamp-1">The Great Adventure</h3>
                      <p className="text-sm text-muted-foreground mb-2">by John Doe</p>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Progress</span>
                        <span className="text-xs">75%</span>
                      </div>
                      <Progress value={75} className="h-1" />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Page 150 of 200</span>
                    <Link href="/src/app/(user)/user-reader/book-1">
                      <Button size="sm">Continue Reading</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/books" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Library className="h-4 w-4 mr-2" />
                  Browse Library
                </Button>
              </Link>
              <Link href="/library" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Award className="h-4 w-4 mr-2" />
                  Library
                </Button>
              </Link>
              <Link href="/premium" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Star className="h-4 w-4 mr-2" />
                  Upgrade to Premium
                </Button>
              </Link>
            </div>

            {/* Recent Achievement */}
            <div className="mt-6">
              <h3 className="font-medium mb-3">Recent Achievement</h3>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Award className="h-6 w-6 text-yellow-600" />
                    </div>
                    <h4 className="font-semibold mb-1">Book Worm</h4>
                    <p className="text-sm text-muted-foreground">
                      Read 5 books this month
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}