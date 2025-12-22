'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Clock, CheckCircle } from 'lucide-react'

export function BookCard({ book }: { book: any }) {
  const progress = book.readingProgress?.[0]?.progress || 0
  const currentPage = book.readingProgress?.[0]?.currentPage || 0
  const readingTime = book.readingProgress?.[0]?.readingTime || 0

  return (
    <Card className="group cursor-pointer transition-all hover:shadow-lg">
      <CardContent className="p-4">
        {/* Book Cover */}
        <div className="w-full h-48 bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden">
          {book.image ? (
            <img src={book.image} alt={book.name} className="h-full w-full object-cover" />
          ) : (
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          )}
        </div>

        {/* Book Info */}
        <div className="space-y-2">
          <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {book.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            by {book.authors.map((a: any) => a.author.name).join(', ')}
          </p>

          {/* Progress */}
          {progress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Page {currentPage}</span>
                {readingTime > 0 && <span>{readingTime}h read</span>}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-4">
            {progress === 0 ? (
              <Link href={`/user-reader/${book.id}`}>
                <Button className="w-full" size="sm">
                  Start Reading
                </Button>
              </Link>
            ) : progress === 100 ? (
              <Link href={`/user-reader/${book.id}`}>
                <Button variant="outline" className="w-full" size="sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Read Again
                </Button>
              </Link>
            ) : (
              <Link href={`/user-reader/${book.id}`}>
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
  )
}
