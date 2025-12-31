'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookRatingProps {
  rating: number
  readonly?: boolean
  onRatingChange?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function BookRating({
  rating,
  readonly = true,
  onRatingChange,
  size = 'md',
  className
}: BookRatingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value)
    }
  }

  const handleMouseEnter = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value)
    }
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => handleClick(value)}
          onMouseEnter={() => handleMouseEnter(value)}
          disabled={readonly}
          className={cn(
            'transition-transform hover:scale-110',
            readonly ? 'cursor-default' : 'cursor-pointer'
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              value <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-transparent text-gray-300'
            )}
          />
        </button>
      ))}
    </div>
  )
}
