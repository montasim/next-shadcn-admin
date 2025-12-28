'use client'

import type { LucideIcon, Icon } from 'lucide-react'
import {
  Home,
  BookOpen,
  Users,
  Settings,
  Library,
  PenTool,
  MessageSquare,
  Brain,
  Bell,
  Palette,
  Monitor,
  User,
  CreditCard,
  LayoutDashboard,
  FolderTree,
  ShoppingBag,
  Sparkles,
  FileText,
  Hash,
  List,
  Trophy,
  Target,
  ShieldCheck,
  Globe,
  BarChart3,
  RefreshCw,
  FolderOpen,
  Inbox,
  Upload,
  BookMarked,
} from 'lucide-react'

export interface BreadcrumbRoute {
  path: string
  name: string
  icon?: LucideIcon
  hidden?: boolean
  parent?: string
}

export const breadcrumbRoutes: BreadcrumbRoute[] = [
  // Public Routes
  {
    path: '/',
    name: 'Home',
    icon: Home,
  },

  // Books
  {
    path: '/books',
    name: 'Browse Books',
    icon: BookOpen,
    parent: '/',
  },
  {
    path: '/books/[id]',
    name: 'Book Details',
    icon: BookOpen,
    parent: '/books',
  },

  // Authors
  {
    path: '/authors/[id]',
    name: 'Author',
    icon: Users,
    parent: '/',
  },

  // Categories
  {
    path: '/categories/[id]',
    name: 'Category',
    icon: FolderTree,
    parent: '/',
  },

  // Publications
  {
    path: '/publications/[id]',
    name: 'Publication',
    icon: FileText,
    parent: '/',
  },

  // Quiz
  {
    path: '/quiz/leaderboard',
    name: 'Leaderboard',
    icon: Trophy,
    parent: '/',
  },

  // Premium
  {
    path: '/premium',
    name: 'Premium',
    icon: Sparkles,
    parent: '/',
  },

  // User Routes
  {
    path: '/library',
    name: 'My Library',
    icon: Library,
    parent: '/',
  },
  {
    path: '/library/my-uploads',
    name: 'My Uploads',
    icon: Upload,
    parent: '/library',
  },
  {
    path: '/library/my-requests',
    name: 'My Requests',
    icon: Inbox,
    parent: '/library',
  },
  {
    path: '/library/bookshelves',
    name: 'My Bookshelves',
    icon: BookMarked,
    parent: '/library',
  },
  {
    path: '/user-reader/[id]',
    name: 'Read Book',
    icon: BookOpen,
    parent: '/library',
  },
  {
    path: '/quiz',
    name: 'Quiz',
    icon: Brain,
    parent: '/',
  },
  {
    path: '/user-dashboard',
    name: 'Dashboard',
    icon: LayoutDashboard,
    parent: '/',
  },

  // Dashboard Routes
  {
    path: '/dashboard',
    name: 'Dashboard',
    icon: LayoutDashboard,
    hidden: true, // Hidden as it's the dashboard home
  },
  {
    path: '/dashboard/books',
    name: 'Books',
    icon: BookOpen,
    parent: '/dashboard',
  },
  {
    path: '/dashboard/books/[id]',
    name: 'Book Details',
    icon: BookOpen,
    parent: '/dashboard/books',
  },
  {
    path: '/dashboard/authors',
    name: 'Authors',
    icon: Users,
    parent: '/dashboard',
  },
  {
    path: '/dashboard/authors/[id]',
    name: 'Author Details',
    icon: Users,
    parent: '/dashboard/authors',
  },
  {
    path: '/dashboard/categories',
    name: 'Categories',
    icon: FolderTree,
    parent: '/dashboard',
  },
  {
    path: '/dashboard/categories/[id]',
    name: 'Category Details',
    icon: FolderTree,
    parent: '/dashboard/categories',
  },
  {
    path: '/dashboard/publications',
    name: 'Publications',
    icon: FileText,
    parent: '/dashboard',
  },
  {
    path: '/dashboard/publications/[id]',
    name: 'Publication Details',
    icon: FileText,
    parent: '/dashboard/publications',
  },
  {
    path: '/dashboard/book-requests',
    name: 'Book Requests',
    icon: Inbox,
    parent: '/dashboard',
  },
  {
    path: '/dashboard/users',
    name: 'Users',
    icon: Users,
    parent: '/dashboard',
  },
  {
    path: '/dashboard/users/[id]',
    name: 'User Details',
    icon: User,
    parent: '/dashboard/users',
  },
  {
    path: '/dashboard/moods',
    name: 'Moods',
    icon: Sparkles,
    parent: '/dashboard',
  },
  {
    path: '/dashboard/notices',
    name: 'Notices',
    icon: Bell,
    parent: '/dashboard',
  },
  {
    path: '/dashboard/site-settings',
    name: 'Site Settings',
    icon: ShieldCheck,
    parent: '/dashboard',
  },
  {
    path: '/dashboard/chats',
    name: 'Chat History',
    icon: MessageSquare,
    parent: '/dashboard',
  },
  {
    path: '/dashboard/tasks',
    name: 'Tasks',
    icon: BarChart3,
    parent: '/dashboard',
  },
  {
    path: '/dashboard/seed-moods',
    name: 'Seed Moods',
    icon: RefreshCw,
    parent: '/dashboard',
  },

  // Settings Routes
  {
    path: '/settings',
    name: 'Settings',
    icon: Settings,
    parent: '/',
  },
  {
    path: '/settings/profile',
    name: 'Profile',
    icon: User,
    parent: '/settings',
  },
  {
    path: '/settings/account',
    name: 'Account',
    icon: CreditCard,
    parent: '/settings',
  },
  {
    path: '/settings/appearance',
    name: 'Appearance',
    icon: Palette,
    parent: '/settings',
  },
  {
    path: '/settings/notifications',
    name: 'Notifications',
    icon: Bell,
    parent: '/settings',
  },
  {
    path: '/settings/display',
    name: 'Display',
    icon: Monitor,
    parent: '/settings',
  },

  // Auth Routes (hidden from breadcrumbs)
  {
    path: '/auth/sign-in',
    name: 'Sign In',
    hidden: true,
  },
  {
    path: '/auth/sign-up',
    name: 'Sign Up',
    hidden: true,
  },
  {
    path: '/auth/forgot-password',
    name: 'Forgot Password',
    hidden: true,
  },
  {
    path: '/auth/otp',
    name: 'OTP',
    hidden: true,
  },
]

/**
 * Convert a dynamic route path to match a specific URL
 * e.g., "/books/[id]" -> "/books/123"
 */
export function matchDynamicRoute(routePath: string, url: string): boolean {
  const routeSegments = routePath.split('/')
  const urlSegments = url.split('/')

  if (routeSegments.length !== urlSegments.length) {
    return false
  }

  for (let i = 0; i < routeSegments.length; i++) {
    const routeSegment = routeSegments[i]
    const urlSegment = urlSegments[i]

    // If route segment is a dynamic parameter (e.g., [id])
    if (routeSegment.startsWith('[') && routeSegment.endsWith(']')) {
      continue // Skip, this is a match
    }

    if (routeSegment !== urlSegment) {
      return false
    }
  }

  return true
}

/**
 * Get breadcrumb route for a specific URL
 */
export function getBreadcrumbRoute(url: string): BreadcrumbRoute | undefined {
  return breadcrumbRoutes.find((route) => route.path === url || matchDynamicRoute(route.path, url))
}

/**
 * Get the complete breadcrumb trail for a URL
 */
export function getBreadcrumbTrail(url: string): BreadcrumbRoute[] {
  const trail: BreadcrumbRoute[] = []
  let currentRoute = getBreadcrumbRoute(url)
  let currentUrl = url

  while (currentRoute) {
    if (!currentRoute.hidden) {
      trail.unshift(currentRoute)
    }

    // Find parent route
    if (currentRoute.parent) {
      currentRoute = getBreadcrumbRoute(currentRoute.parent)
      currentUrl = currentRoute?.path || currentUrl
    } else if (currentRoute.path !== '/') {
      // Try to find parent by removing the last segment
      const segments = currentUrl.split('/').filter(Boolean)
      segments.pop()
      const parentUrl = '/' + segments.join('/')
      currentRoute = getBreadcrumbRoute(parentUrl)
      currentUrl = parentUrl
    } else {
      break
    }
  }

  return trail
}

/**
 * Get route name with dynamic parameter values
 * e.g., "Book Details" with ID "123" -> "Book Details #123"
 */
export function getRouteDisplayName(route: BreadcrumbRoute, url: string): string {
  // Extract dynamic parameters from URL
  const routeSegments = route.path.split('/')
  const urlSegments = url.split('/')

  let displayName = route.name

  for (let i = 0; i < routeSegments.length; i++) {
    const routeSegment = routeSegments[i]
    if (routeSegment.startsWith('[') && routeSegment.endsWith(']')) {
      const paramName = routeSegment.slice(1, -1)
      const paramValue = urlSegments[i]

      // Add parameter value to display name if it's an ID
      if (paramName === 'id' && paramValue) {
        displayName = `${displayName} #${paramValue.slice(0, 8)}`
      }
    }
  }

  return displayName
}
