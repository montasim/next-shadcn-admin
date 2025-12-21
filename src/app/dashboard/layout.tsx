'use client'

import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { SearchProvider } from '@/context/search-context'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AuthGuard } from '@/components/auth-guard'
import { cn } from '@/lib/utils'
import {Header} from "@/components/layout/header";
import {Search} from "@/components/search";
import {ThemeSwitch} from "@/components/theme-switch";
import {ProfileDropdown} from "@/components/profile-dropdown";
import {Main} from "@/components/ui/main";
import { MDXViewerProvider } from 'mdx-craft';

const inter = Inter({ subsets: ['latin'] })

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={inter.className}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
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
                    <Header fixed>
                        <Search />
                        <div className='ml-auto flex items-center space-x-4'>
                            <ThemeSwitch />
                            <ProfileDropdown />
                        </div>
                    </Header>
                    <Main fixed>
                      <MDXViewerProvider>
                        {children}
                      </MDXViewerProvider>
                    </Main>
                </div>
              </SearchProvider>
            </SidebarProvider>
          </div>
        </AuthGuard>
      </ThemeProvider>
    </div>
  )
}
