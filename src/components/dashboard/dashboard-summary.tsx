'use client'

import { StatCard } from '@/components/analytics/stat-card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'

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
  // Use CollapsibleSection for mobile-responsive behavior
  // On desktop (md+), show directly without border/card styling
  return (
    <>
      {/* Mobile: Use CollapsibleSection */}
      <div className="md:hidden">
        <CollapsibleSection title="Summary">
          <DashboardSummaryGrid
            summaries={summaries}
            compactMobile={false}
            className={className}
          />
        </CollapsibleSection>
      </div>

      {/* Desktop: Show directly */}
      <div className={cn('hidden md:block', className)}>
        <DashboardSummaryGrid
          summaries={summaries}
          compactMobile={false}
        />
      </div>
    </>
  )
}

export { DashboardSummaryGrid }
