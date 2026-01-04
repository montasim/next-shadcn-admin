'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export interface SidebarNavItem {
  title: string
  icon?: React.ReactNode
  href: string
}

export interface SidebarNavProps {
  items: SidebarNavItem[]
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
            pathname === item.href
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground'
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
    </nav>
  )
}
