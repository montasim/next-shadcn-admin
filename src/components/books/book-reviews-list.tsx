'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BookRating } from './book-rating'
import { Button } from '@/components/ui/button'
import { getUserDisplayName } from '@/lib/utils/user'
import { Loader2, MessageSquare, Trash2, Edit3 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { getProxiedImageUrl } from '@/lib/image-proxy'

interface ReviewUser {
  id: string
  firstName: string
  lastName: string | null
  username: string | null
  name: string
  avatar: string | null
}

interface BookReview {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  updatedAt: string
  user: ReviewUser
}

interface BookReviewsListProps {
  bookId: string
  currentUserId?: string | null
  onEdit?: (review: { id: string; rating: number; comment: string | null }) => void
  className?: string
}

export function BookReviewsList({
  bookId,
  currentUserId,
  onEdit,
  className
}: BookReviewsListProps) {
  const [reviews, setReviews] = useState<BookReview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchReviews = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/books/${bookId}/reviews`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch reviews')
      }

      setReviews(data.data.reviews)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (reviewId: string) => {
    setDeletingId(reviewId)

    try {
      const response = await fetch(`/api/books/${bookId}/reviews`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete review')
      }

      // Remove the deleted review from state
      setReviews((prev) => prev.filter((review) => review.id !== reviewId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [bookId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
            <p className="text-muted-foreground">
              Be the first to review this book!
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {reviews.map((review) => {
          const isOwner = currentUserId === review.user.id
          const displayName = getUserDisplayName({
            firstName: review.user.firstName,
            lastName: review.user.lastName,
            username: review.user.username,
            name: review.user.name,
            email: '',
          })

          return (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {/* Avatar */}
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage
                      src={review.user.avatar ? getProxiedImageUrl(review.user.avatar) || review.user.avatar : undefined}
                      alt={displayName}
                    />
                    <AvatarFallback className="text-sm bg-primary/10">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{displayName}</h4>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(review.createdAt)}
                          </span>
                          {review.updatedAt !== review.createdAt && (
                            <span className="text-xs text-muted-foreground">(edited)</span>
                          )}
                        </div>
                        <BookRating rating={review.rating} size="sm" />
                      </div>

                      {/* Actions for owner */}
                      {isOwner && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onEdit?.(review)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Review?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete your review? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(review.id)}
                                  disabled={deletingId === review.id}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {deletingId === review.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    'Delete'
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>

                    {/* Comment */}
                    {review.comment && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
