'use client'

import React from 'react'
import { IconBrowserCheck, IconNotification, IconPalette, IconTool, IconUser, IconCreditCard, IconReceipt } from '@tabler/icons-react'
import { Separator } from '@/components/ui/separator'
import SidebarNav from './components/sidebar-nav'

const sidebarNavItems = [
  {
    title: 'Profile',
    icon: <IconUser size={18} />,
    href: '/dashboard/settings',
  },
  {
    title: 'Account',
    icon: <IconTool size={18} />,
    href: '/dashboard/settings/account',
  },
  {
    title: 'Subscription',
    icon: <IconCreditCard size={18} />,
    href: '/dashboard/settings/subscription',
  },
  {
    title: 'Billing',
    icon: <IconReceipt size={18} />,
    href: '/dashboard/settings/billing',
  },
  {
    title: 'Appearance',
    icon: <IconPalette size={18} />,
    href: '/dashboard/settings/appearance',
  },
  {
    title: 'Notifications',
    icon: <IconNotification size={18} />,
    href: '/dashboard/settings/notifications',
  },
  {
    title: 'Display',
    icon: <IconBrowserCheck size={18} />,
    href: '/dashboard/settings/display',
  },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
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
    </>
  )
}
