'use client'

import React from 'react'
import { IconBrowserCheck, IconNotification, IconPalette, IconTool, IconUser, IconCreditCard, IconReceipt } from '@tabler/icons-react'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { SidebarNav } from './components/sidebar-nav'
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
    title: 'Subscription',
    icon: <IconCreditCard size={18} />,
    href: '/settings/subscription',
  },
  {
    title: 'Billing',
    icon: <IconReceipt size={18} />,
    href: '/settings/billing',
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

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <SidebarProvider>
      <SearchProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1 min-h-screen">
            <Header>
              <div className="flex items-center gap-2">
                <Search />
                <ThemeSwitch />
                <ProfileDropdown />
              </div>
            </Header>
            <main className="flex-1 p-4 pt-6 md:p-8">
              <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="-mx-4 lg:w-1/5">
                  <SidebarNav items={sidebarNavItems} />
                </aside>
                <div className="flex-1 lg:max-w-2xl">
                  {children}
                </div>
              </div>
            </main>
            <MobileBottomNav />
          </div>
        </div>
      </SearchProvider>
    </SidebarProvider>
  )
}
