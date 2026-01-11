'use client'

import { type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { Slot } from '@radix-ui/react-slot'

export interface ActionConfig {
  /** Button label (hidden on mobile by default) */
  label: string
  /** Icon to display */
  icon?: LucideIcon | ReactNode
  /** Click handler */
  onClick?: () => void
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary'
  /** Disable the button */
  disabled?: boolean
  /** Loading state */
  loading?: boolean
  /** Show as icon-only button (always true on mobile) */
  iconOnly?: boolean
  /** Custom className */
  className?: string
  /** Render as custom component (for drawers, dialogs, etc.) */
  asChild?: boolean
  /** Child elements when asChild is true */
  children?: ReactNode
}

interface DashboardPageHeaderActionsProps {
  /** Array of action configurations */
  actions: ActionConfig[]
  /** Container className */
  className?: string
}

export function DashboardPageHeaderActions({
  actions,
  className
}: DashboardPageHeaderActionsProps) {
  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {actions.map((action, index) => {
        const {
          label,
          icon: Icon,
          onClick,
          variant = 'default',
          disabled = false,
          loading = false,
          iconOnly = false,
          className: actionClassName,
          asChild = false,
          children,
        } = action

        const buttonContent = (
          <>
            {Icon && !asChild && (
              <Icon className="h-4 w-4 mr-2" />
            )}
            {loading && (
              <span className="hidden sm:inline ml-2">
                Loading...
              </span>
            )}
            <span className={iconOnly ? 'hidden' : 'hidden sm:inline'}>
              {loading ? `${label}...` : label}
            </span>
            {children}
          </>
        )

        // Icon-only version for mobile
        const mobileButton = (
          <Button
            key={`mobile-${index}`}
            onClick={onClick}
            variant={variant}
            disabled={disabled || loading}
            size="icon"
            className={cn('sm:hidden', actionClassName)}
          >
            {Icon && !asChild && <Icon className="h-4 w-4" />}
            {children}
          </Button>
        )

        // Full button for desktop
        const desktopButton = asChild ? (
          <Slot
            key={`desktop-${index}`}
            className={cn('hidden sm:flex', actionClassName)}
            onClick={onClick}
          >
            {children}
          </Slot>
        ) : (
          <Button
            key={`desktop-${index}`}
            onClick={onClick}
            variant={variant}
            disabled={disabled || loading}
            size="sm"
            className={cn('hidden sm:flex', actionClassName)}
          >
            {buttonContent}
          </Button>
        )

        // If iconOnly is true, only show icon button on all screens
        if (iconOnly) {
          return asChild ? (
            <Slot
              key={index}
              className={actionClassName}
              onClick={onClick}
            >
              {children}
            </Slot>
          ) : (
            <Button
              key={index}
              onClick={onClick}
              variant={variant}
              disabled={disabled || loading}
              size="icon"
              className={actionClassName}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {children}
            </Button>
          )
        }

        return (
          <>
            {mobileButton}
            {desktopButton}
          </>
        )
      })}
    </div>
  )
}
