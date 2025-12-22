'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Search,
  Plus,
  BookOpen,
  Clock,
  CheckCircle,
  Filter
} from 'lucide-react'

export default function UserLibrary() {
  // Mock books-old data - in a real app, this would come from your API
  const books = [
    {
      id: '1',
      title: 'The Great Adventure',
      author: 'John Doe',
      progress: 75,
      currentPage: 150,
      totalPages: 200,
      readingTime: 5, // hours
      type: 'EBOOK',
      cover: null
    },
    {
      id: '2',
      title: 'Mystery of the Lost City',
      author: 'Jane Smith',
      progress: 100,
      currentPage: 350,
      totalPages: 350,
      readingTime: 12,
      type: 'AUDIO',
      cover: null
    },
    {
      id: '3',
      title: 'The Science of Everything',
      author: 'Dr. Robert Johnson',
      progress: 25,
      currentPage: 80,
      totalPages: 320,
      readingTime: 2,
      type: 'EBOOK',
      cover: null
    }
  ]

  const stats = {
    total: books.length,
    completed: books.filter(b => b.progress === 100).length,
    reading: books.filter(b => b.progress > 0 && b.progress < 100).length,
    unread: books.filter(b => b.progress === 0).length
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Library</h1>
          <p className="text-muted-foreground">
            Manage your personal book collection and track your reading progress.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Link href="/books">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Books
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Books</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.reading}</div>
            <p className="text-xs text-muted-foreground">Currently Reading</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.unread}</div>
            <p className="text-xs text-muted-foreground">Unread</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search books or authors..."
              className="pl-10"
            />
          </div>
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Books Grid */}
      {books.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Your library is empty</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding some books to your library from the book store.
              </p>
              <Link href="/books">
                <Button>Browse Books</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <Card key={book.id} className="group cursor-pointer transition-all hover:shadow-lg">
              <CardContent className="p-4">
                {/* Book Cover */}
                <div className="w-full h-48 bg-muted rounded-lg mb-4 flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground" />
                </div>

                {/* Book Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    by {book.author}
                  </p>

                  {/* Progress */}
                  {book.progress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span>{book.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${book.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Page {book.currentPage}</span>
                        <span>{book.readingTime}h read</span>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-4">
                    {book.progress === 0 ? (
                      <Link href={`/src/app/(user)/user-reader/${book.id}`}>
                        <Button className="w-full" size="sm">
                          Start Reading
                        </Button>
                      </Link>
                    ) : book.progress === 100 ? (
                      <Link href={`/books-old/${book.id}`}>
                        <Button variant="outline" className="w-full" size="sm">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Read Again
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/src/app/(user)/user-reader/${book.id}`}>
                        <Button className="w-full" size="sm">
                          <Clock className="h-4 w-4 mr-2" />
                          Continue
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
