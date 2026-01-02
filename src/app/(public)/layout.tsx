import React from "react";
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import '../globals.css'
import { Toaster } from '@/components/ui/toaster'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { PublicHeader } from '@/components/layout/public-header'
import { PublicFooter } from '@/components/layout/public-footer'
import { UnderConstructionBanner } from '@/components/layout/under-construction-banner'
import { MDXViewerProvider } from 'mdx-craft'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Book Heaven - Discover, Read, and Share Books',
  description: 'Discover amazing books, track your reading progress, and share your favorite reads with our comprehensive book management platform.',
  keywords: ['books', 'reading', 'library', 'ebooks', 'audiobooks', 'book discovery', 'book heaven'],
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      <>
          <div className="min-h-screen bg-background">
              {/* Public Header/Navbar */}
              <PublicHeader />

              {/* Under Construction Banner */}
              <UnderConstructionBanner />

              <div className="relative flex min-h-screen flex-col">
                  <MDXViewerProvider>
                      {children}
                  </MDXViewerProvider>
              </div>

              {/* Public Footer */}
              <PublicFooter />

              {/* Mobile Bottom Navigation */}
              <MobileBottomNav />
          </div>
          <Toaster />
      </>
  )
}