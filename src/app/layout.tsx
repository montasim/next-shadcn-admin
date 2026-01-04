import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/context/auth-context'
import { WebSocketProvider } from '@/context/websocket-context'
import { ThemeProvider } from 'next-themes'
import { AppQueryClientProvider } from '@/components/providers/query-client-provider'
import { RootLayoutClient } from '@/components/layout/root-layout-client'
import { getSiteName, getSEOMetadata, getOGImage } from '@/lib/utils/site-settings'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSiteName()
  const seo = await getSEOMetadata()
  const ogImage = await getOGImage()

  return {
    title: {
      default: seo.title,
      template: `%s | ${siteName}`
    },
    description: seo.description,
    keywords: seo.keywords.split(','),
    authors: [{ name: siteName }],
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      title: seo.title,
      description: seo.description,
      siteName: siteName,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
        <AppQueryClientProvider>
          <AuthProvider>
            <WebSocketProvider>
              <RootLayoutClient>
                {children}
              </RootLayoutClient>
            </WebSocketProvider>
          </AuthProvider>
        </AppQueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
