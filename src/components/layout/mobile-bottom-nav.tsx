'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Bookmark,
  Settings,
  Plus,
  BookOpen,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  {
    label: 'Home',
    href: '/books',
    icon: BookOpen,
  },
  {
    label: 'Library',
    href: '/library',
    icon: Bookmark,
  },
  {
    label: 'Request',
    href: '/dashboard/book-requests',
    icon: Plus,
  },
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex items-center justify-around h-16 [padding-bottom:env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
                          (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full',
                'transition-colors duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 mb-1 transition-all duration-200',
                  isActive && 'scale-110'
                )}
              />
              <span className="text-xs font-medium">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
