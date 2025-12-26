'use client'

import React from 'react'
import { IconBrowserCheck, IconNotification, IconPalette, IconTool, IconUser } from '@tabler/icons-react'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import SidebarNav from './components/sidebar-nav'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SearchProvider } from '@/context/search-context'
import { cn } from '@/lib/utils'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'

const sidebarNavItems = [
  {
    title: 'Profile',
    icon: <IconUser size={18} />,
    href: '/settings',
  },
  {
    title: 'Account',
    icon: <IconTool size={18} />,
    href: '/settings/account',
  },
  {
    title: 'Appearance',
    icon: <IconPalette size={18} />,
    href: '/settings/appearance',
  },
  {
    title: 'Notifications',
    icon: <IconNotification size={18} />,
    href: '/settings/notifications',
  },
  {
    title: 'Display',
    icon: <IconBrowserCheck size={18} />,
    href: '/settings/display',
  },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <SearchProvider>
        <AppSidebar />
        <div
          id='content'
          className={cn(
            'max-w-full w-full ml-auto',
            'peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]',
            'peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]',
            'transition-[width] ease-linear duration-200',
            'h-svh flex flex-col',
            'group-data-[scroll-locked=1]/body:h-full',
            'group-data-[scroll-locked=1]/body:has-[main.fixed-main]:h-svh'
          )}
        >
          <Header fixed>
            <Search />
            <div className='ml-auto flex items-center space-x-4'>
              <ThemeSwitch />
              <ProfileDropdown />
            </div>
          </Header>

          <main className="px-4 flex flex-col flex-grow overflow-y-auto pt-16 pb-20">
            <div className='space-y-0.5'>
              <h1 className='text-xl font-bold tracking-tight md:text-3xl'>
                Settings
              </h1>
              <p className='text-muted-foreground'>
                Manage your account settings and set e-mail preferences.
              </p>
            </div>

            <Separator className='my-4 lg:my-6' />

            <div className='flex flex-1 flex-col space-y-2 md:space-y-2 overflow-hidden lg:flex-row lg:space-x-12 lg:space-y-0'>
              <aside className='top-0 lg:sticky lg:w-1/5'>
                <SidebarNav items={sidebarNavItems} />
              </aside>
              <div className='flex w-full p-1 pr-4 overflow-y-hidden'>
                {children}
              </div>
            </div>
          </main>

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav />
        </div>
      </SearchProvider>
    </SidebarProvider>
  )
}
