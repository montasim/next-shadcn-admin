'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { FileText, Headphones, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BookType } from '@prisma/client'

interface BookTypeBadgeProps {
  type: BookType
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  variant?: 'colored' | 'outline'
  className?: string
}

const bookTypeConfig = {
  EBOOK: {
    label: 'Ebook',
    icon: FileText,
    coloredClass: 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200',
  },
  AUDIO: {
    label: 'Audiobook',
    icon: Headphones,
    coloredClass: 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200',
  },
  HARD_COPY: {
    label: 'Hard Copy',
    icon: BookOpen,
    coloredClass: 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200',
  },
} as const satisfies Record<BookType, { label: string; icon: React.ComponentType<{ className?: string }>; coloredClass: string }>

const sizeClasses = {
  sm: 'text-[10px] px-1 py-0',
  md: 'text-xs',
  lg: 'text-sm',
} as const

export const BookTypeBadge: React.FC<BookTypeBadgeProps> = ({
  type,
  size = 'md',
  showIcon = true,
  variant = 'colored',
  className,
}) => {
  const config = bookTypeConfig[type]
  const Icon = config.icon

  return (
    <Badge
      variant={variant === 'colored' ? 'secondary' : 'outline'}
      className={cn(
        'flex items-center gap-1',
        variant === 'colored' && config.coloredClass,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  )
}

BookTypeBadge.displayName = 'BookTypeBadge'
