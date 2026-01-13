'use client'

import { useState, useEffect } from 'react'
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface CollapsibleSectionProps {
  /** Section title */
  title: string
  /** Icon to display in the header */
  icon?: LucideIcon
  /** Section content */
  children: React.ReactNode
  /** Container className */
  className?: string
  /** Loading state - shows skeleton when true */
  loading?: boolean
  /** Custom loading skeleton */
  loadingSkeleton?: React.ReactNode
  /** Additional header actions (buttons, badges, etc.) */
  headerActions?: React.ReactNode
  /** Whether the section is currently expanded (for controlled mode) */
  defaultExpanded?: boolean
}

export function CollapsibleSection({
  title,
  icon: Icon,
  children,
  className,
  loading = false,
  loadingSkeleton,
  headerActions,
  defaultExpanded = false,
}: CollapsibleSectionProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [expanded, setExpanded] = useState(defaultExpanded)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // 768px is md breakpoint
    }

    // Initial check
    checkMobile()

    // Add event listener for resize
    window.addEventListener('resize', checkMobile)

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Show loading skeleton if provided and loading
  if (loading && loadingSkeleton) {
    return <>{loadingSkeleton}</>
  }

  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      {/* Header - always visible */}
      <div className='flex items-center justify-between p-4'>
        <h3 className="font-semibold flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          {title}
        </h3>
        <div className='flex items-center gap-2'>
          {headerActions}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 p-0 md:hidden"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Content - collapsible on mobile */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out overflow-hidden',
          !isMobile || expanded ? 'block' : 'hidden'
        )}
      >
        <div className='px-4 pb-4'>
          {children}
        </div>
      </div>
    </div>
  )
}
