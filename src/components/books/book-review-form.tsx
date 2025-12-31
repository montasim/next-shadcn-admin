'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookRating } from './book-rating'
import { Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookReviewFormProps {
  bookId: string
  existingReview?: {
    id: string
    rating: number
    comment: string | null
  } | null
  onSuccess?: () => void
  onCancel?: () => void
  className?: string
}

export function BookReviewForm({
  bookId,
  existingReview,
  onSuccess,
  onCancel,
  className
}: BookReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [comment, setComment] = useState(existingReview?.comment || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate rating
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setIsSubmitting(true)

    try {
      const method = existingReview ? 'PUT' : 'POST'
      const response = await fetch(`/api/books/${bookId}/reviews`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating, comment }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit review')
      }

      // Call success callback
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isEditing = !!existingReview

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Your Review' : 'Write a Review'}</CardTitle>
        <CardDescription>
          Share your thoughts about this book with other readers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/10 rounded-md border border-red-200 dark:border-red-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Your Rating <span className="text-red-500">*</span>
            </label>
            <BookRating
              rating={rating}
              onRatingChange={setRating}
              readonly={false}
              size="lg"
            />
            {rating === 0 && (
              <p className="text-sm text-muted-foreground">Click a star to rate</p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              Your Review (Optional)
            </label>
            <Textarea
              id="comment"
              placeholder="What did you think about this book? Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              maxLength={1000}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length} / 1000 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                isEditing ? 'Update Review' : 'Submit Review'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
