'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import {
  getBreadcrumbTrail,
  getRouteDisplayName,
  getBreadcrumbRoute,
  matchDynamicRoute,
} from '@/lib/breadcrumb/routes.config'
import type { BreadcrumbRoute } from '@/lib/breadcrumb/routes.config'

export interface BreadcrumbItem {
  name: string
  path: string
  icon?: React.ComponentType<{ className?: string }>
  isCurrent: boolean
}

/**
 * Hook to get the breadcrumb trail for the current pathname
 */
export function useBreadcrumb() {
  const pathname = usePathname()

  const breadcrumbTrail = useMemo(() => {
    const trail = getBreadcrumbTrail(pathname)

    return trail.map((route, index) => {
      const isCurrent = index === trail.length - 1

      // Convert dynamic route path to actual path
      const actualPath = convertDynamicPath(route.path, pathname)

      return {
        name: getRouteDisplayName(route, pathname),
        path: actualPath,
        icon: route.icon,
        isCurrent,
      } as BreadcrumbItem
    })
  }, [pathname])

  return {
    breadcrumbTrail,
    currentRoute: getBreadcrumbRoute(pathname),
    pathname,
  }
}

/**
 * Convert a dynamic route path to actual path using current pathname
 * e.g., "/books/[id]" with pathname "/books/123" -> "/books/123"
 */
function convertDynamicPath(routePath: string, pathname: string): string {
  if (!routePath.includes('[')) {
    return routePath
  }

  const routeSegments = routePath.split('/')
  const pathnameSegments = pathname.split('/')

  if (routeSegments.length !== pathnameSegments.length) {
    return routePath
  }

  const actualSegments = routeSegments.map((segment, index) => {
    if (segment.startsWith('[') && segment.endsWith(']')) {
      return pathnameSegments[index] || segment
    }
    return segment
  })

  return actualSegments.join('/')
}

/**
 * Hook to check if a specific route matches the current pathname
 */
export function useRouteMatch(routePath: string): boolean {
  const pathname = usePathname()

  return useMemo(() => {
    return matchDynamicRoute(routePath, pathname) || routePath === pathname
  }, [routePath, pathname])
}

/**
 * Hook to get the current route info
 */
export function useCurrentRoute(): BreadcrumbRoute | undefined {
  const pathname = usePathname()

  return useMemo(() => {
    return getBreadcrumbRoute(pathname)
  }, [pathname])
}
