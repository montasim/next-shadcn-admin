import React from "react";
import { Inter } from 'next/font/google'
import '../globals.css'
import { AppQueryClientProvider } from '@/components/providers/query-client-provider'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { PublicHeader } from '@/components/layout/public-header'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Your Book Library - Discover, Read, and Share Books',
  description: 'Discover amazing books-old, track your reading progress, and share your favorite reads with our comprehensive book management platform.',
  keywords: ['books', 'reading', 'library', 'ebooks', 'audiobooks', 'book discovery'],
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppQueryClientProvider>
            <div className="min-h-screen bg-background">
              {/* Public Header/Navbar */}
              <PublicHeader />

              <div className="relative flex min-h-screen flex-col">
                {children}
              </div>

              {/* Mobile Bottom Navigation */}
              <MobileBottomNav />
            </div>
            <Toaster />
          </AppQueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}