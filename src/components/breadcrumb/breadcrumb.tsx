'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getBreadcrumbTrail,
  getRouteDisplayName,
  type BreadcrumbRoute,
} from '@/lib/breadcrumb/routes.config'

export interface BreadcrumbProps {
  className?: string
  separator?: React.ReactNode
  homeIcon?: React.ReactNode
  includeHome?: boolean
}

export function Breadcrumb({
  className,
  separator = <ChevronRight className="h-4 w-4" />,
  homeIcon = <Home className="h-4 w-4" />,
  includeHome = true,
}: BreadcrumbProps) {
  const pathname = usePathname()
  const trail = getBreadcrumbTrail(pathname)

  // Don't render breadcrumbs if there's only one item (current page)
  if (trail.length <= 1 && (!includeHome || trail.length === 0)) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center space-x-1 text-sm', className)}>
      {trail.map((route, index) => {
        const isLast = index === trail.length - 1
        const displayName = getRouteDisplayName(route, pathname)

        return (
          <React.Fragment key={route.path}>
            {index > 0 && (
              <span className="text-muted-foreground/50 mx-2">{separator}</span>
            )}

            {!isLast ? (
              <Link
                href={getActualPath(route.path, pathname)}
                className="flex items-center hover:text-foreground text-muted-foreground transition-colors"
              >
                {route.icon && (
                  <span className="mr-1.5 inline-flex">
                    {index === 0 && route.path === '/' ? homeIcon : <route.icon className="h-4 w-4" />}
                  </span>
                )}
                <span>{displayName}</span>
              </Link>
            ) : (
              <span className="flex items-center font-medium text-foreground">
                {route.icon && index === 0 && route.path === '/' && (
                  <span className="mr-1.5 inline-flex">{homeIcon}</span>
                )}
                <span>{displayName}</span>
              </span>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

/**
 * Get the actual path for a route (converts dynamic routes to actual URLs)
 */
function getActualPath(routePath: string, currentPathname: string): string {
  // If the route path is not dynamic, return it as is
  if (!routePath.includes('[')) {
    return routePath
  }

  // If this is the current route, return the actual pathname
  const routeSegments = routePath.split('/')
  const pathnameSegments = currentPathname.split('/')

  if (routeSegments.length !== pathnameSegments.length) {
    return routePath
  }

  // Replace dynamic segments with actual values
  const actualSegments = routeSegments.map((segment, index) => {
    if (segment.startsWith('[') && segment.endsWith(']')) {
      return pathnameSegments[index] || segment
    }
    return segment
  })

  return actualSegments.join('/')
}

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

export interface BreadcrumbListProps {
  items: BreadcrumbItem[]
  className?: string
  separator?: React.ReactNode
}

/**
 * Alternative breadcrumb component that accepts items directly
 * Useful for manual control or custom breadcrumbs
 */
export function BreadcrumbList({
  items,
  className,
  separator = <ChevronRight className="h-4 w-4" />,
}: BreadcrumbListProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center space-x-1 text-sm', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <span className="text-muted-foreground/50 mx-2">{separator}</span>
            )}

            {!isLast && item.href ? (
              <Link
                href={item.href}
                className="flex items-center hover:text-foreground text-muted-foreground transition-colors"
              >
                {item.icon && <span className="mr-1.5 inline-flex">{item.icon}</span>}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span className="flex items-center font-medium text-foreground">
                {item.icon && <span className="mr-1.5 inline-flex">{item.icon}</span>}
                <span>{item.label}</span>
              </span>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

export interface BreadcrumbPageProps {
  children: React.ReactNode
  className?: string
}

/**
 * Breadcrumb page item (current page)
 */
export function BreadcrumbPage({ children, className }: BreadcrumbPageProps) {
  return (
    <span className={cn('font-medium text-foreground', className)}>
      {children}
    </span>
  )
}

export interface BreadcrumbItemProps {
  children: React.ReactNode
  href?: string
  className?: string
}

/**
 * Individual breadcrumb item
 */
export function BreadcrumbItemComponent({ children, href, className }: BreadcrumbItemProps) {
  if (!href) {
    return <span className={cn('text-muted-foreground', className)}>{children}</span>
  }

  return (
    <Link
      href={href}
      className={cn('hover:text-foreground text-muted-foreground transition-colors', className)}
    >
      {children}
    </Link>
  )
}
