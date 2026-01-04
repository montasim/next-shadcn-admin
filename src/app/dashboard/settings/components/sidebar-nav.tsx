"use client"

import { type JSX } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
    icon: JSX.Element
  }[]
}

export default function SidebarNav({
  className,
  items,
  ...props
}: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile tabs */}
      <div className='md:hidden'>
        <Tabs value={pathname} className='w-full'>
          <TabsList className='w-full justify-start overflow-x-auto'>
            {items.map((item) => (
              <Link key={item.href} href={item.href}>
                <TabsTrigger value={item.href} className='gap-2 whitespace-nowrap'>
                  <span className='scale-100'>{item.icon}</span>
                  <span>{item.title}</span>
                </TabsTrigger>
              </Link>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea
        orientation='horizontal'
        type='always'
        className='hidden w-full bg-background px-1 py-2 md:block min-w-40'
      >
        <nav
          className={cn(
            'flex py-1 space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1',
            className
          )}
          {...props}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                pathname === item.href
                  ? 'bg-muted hover:bg-muted'
                  : 'hover:bg-transparent hover:underline',
                'justify-start'
              )}
            >
              <span className='mr-2'>{item.icon}</span>
              {item.title}
            </Link>
          ))}
        </nav>
      </ScrollArea>
    </>
  )
}
