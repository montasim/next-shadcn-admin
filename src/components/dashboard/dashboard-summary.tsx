'use client'

import { StatCard } from '@/components/analytics/stat-card'
import { LucideIcon, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ReactNode, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export interface SummaryItem {
  title: string
  value: string | number
  description: string
  icon?: LucideIcon | ((props: { className?: string }) => ReactNode)
  /** Optional additional content to render below the description (e.g., progress bars, charts) */
  additionalContent?: ReactNode
}

interface DashboardSummaryProps {
  summaries: SummaryItem[]
  className?: string
}

/**
 * Get responsive grid classes based on the number of summary items
 * Automatically adjusts columns for mobile, tablet, and desktop
 */
function getGridClass(count: number): string {
  // Mobile-first approach - show 2 columns on mobile for better space utilization
  const mobile = 'grid-cols-2'
  const sm = 'sm:grid-cols-2' // 2 columns on small screens

  // Larger screens based on count
  let lg = 'lg:grid-cols-2'
  let xl = ''

  switch (count) {
    case 1:
      return 'grid-cols-1'
    case 2:
      lg = 'lg:grid-cols-2'
      break
    case 3:
      lg = 'lg:grid-cols-3'
      break
    case 4:
      lg = 'lg:grid-cols-4'
      break
    case 5:
      // 5 items: 2 cols mobile -> 3 cols tablet -> 5 cols desktop
      lg = 'lg:grid-cols-3 xl:grid-cols-5'
      break
    case 6:
      lg = 'lg:grid-cols-3'
      xl = 'xl:grid-cols-6'
      break
    default:
      // For 7+ items, use auto-fit with minmax
      lg = 'lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
  }

  return cn(mobile, sm, lg, xl)
}

/**
 * Special grid class for items that want 2 columns on mobile
 * Use this when you want compact display on mobile
 */
function getCompactGridClass(count: number): string {
  const mobile = 'grid-cols-2' // 2 columns on mobile
  const sm = 'sm:grid-cols-2'

  let lg = 'lg:grid-cols-2'
  let xl = ''

  switch (count) {
    case 1:
      return 'grid-cols-1'
    case 2:
      lg = 'lg:grid-cols-2'
      break
    case 3:
      lg = 'lg:grid-cols-3'
      break
    case 4:
      lg = 'lg:grid-cols-4'
      break
    case 5:
      lg = 'lg:grid-cols-3'
      xl = 'xl:grid-cols-5'
      break
    case 6:
      lg = 'lg:grid-cols-3'
      xl = 'xl:grid-cols-6'
      break
    default:
      lg = 'lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
  }

  return cn(mobile, sm, lg, xl)
}

interface DashboardSummaryGridProps {
  summaries: SummaryItem[]
  compactMobile?: boolean
  className?: string
}

function DashboardSummaryGrid({
  summaries,
  compactMobile = false,
  className
}: DashboardSummaryGridProps) {
  const gridClass = compactMobile
    ? getCompactGridClass(summaries.length)
    : getGridClass(summaries.length)

  return (
    <div className={cn('grid gap-4 mb-4', gridClass, className)}>
      {summaries.map((item, index) => {
        const Icon = item.icon
        return (
          <StatCard
            key={index}
            title={item.title}
            value={item.value}
            description={item.description}
            icon={Icon}
            additionalContent={item.additionalContent}
          />
        )
      })}
    </div>
  )
}

export function DashboardSummary({
  summaries,
  className
}: DashboardSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

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

  // On mobile, default to collapsed; on desktop, always show expanded
  const showContent = !isMobile || isExpanded

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header - always visible */}
      <div className="flex items-center justify-between md:hidden">
        <h2 className="text-lg font-semibold">Summary</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 w-8 p-0"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Content - show based on state */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out overflow-hidden',
          !showContent && 'hidden'
        )}
      >
        <DashboardSummaryGrid
          summaries={summaries}
          compactMobile={false}
          className={className}
        />
      </div>
    </div>
  )
}

export { DashboardSummaryGrid }
