'use client'

import { Inter } from 'next/font/google'
import { SearchProvider } from '@/context/search-context'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AuthGuard } from '@/components/auth-guard'
import { cn } from '@/lib/utils'
import { UserTopbar } from "@/components/layout/user-topbar";
import { Main } from "@/components/ui/main";
import { MDXViewerProvider } from 'mdx-craft';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';

const inter = Inter({ subsets: ['latin'] })

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
                  />
                  <Main fixed>
                    <MDXViewerProvider>
                      {children}
                    </MDXViewerProvider>
                  </Main>

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
