'use client'

import { Inter } from 'next/font/google'
import { SearchProvider } from '@/context/search-context'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AuthGuard } from '@/components/auth-guard'
import { cn } from '@/lib/utils'
import { UserTopbar } from "@/components/layout/user-topbar";
import { MDXViewerProvider } from 'mdx-craft';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';

const inter = Inter({ subsets: ['latin'] })

const adminTopNav = [
    {
        title: 'Overview',
        href: 'dashboard',
        isActive: true,
        disabled: false,
    },
    {
        title: 'Customers',
        href: 'dashboard/users',
        isActive: false,
        disabled: true,
    },
    {
        title: 'Books',
        href: 'dashboard/books',
        isActive: false,
        disabled: true,
    },
    {
        title: 'Settings',
        href: 'dashboard/settings',
        isActive: false,
        disabled: true,
    },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={inter.className}>
      <AuthGuard>
        <div>
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
                  <UserTopbar
                    showSidebarToggle={true}
                    className="border-b shadow"
                    topNavLinks={adminTopNav}
                  />

                  <div className="flex-1 overflow-auto bg-background">
                    <MDXViewerProvider>
                      {children}
                    </MDXViewerProvider>
                  </div>

                  {/* Mobile Bottom Navigation */}
                  <MobileBottomNav />
              </div>
            </SearchProvider>
          </SidebarProvider>
        </div>
      </AuthGuard>
    </div>
  )
}
