import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/context/auth-context'
import { WebSocketProvider } from '@/context/websocket-context'
import { ThemeProvider } from 'next-themes'
import { AppQueryClientProvider } from '@/components/providers/query-client-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Book Heaven - AI-Powered Digital Library',
    template: '%s | Book Heaven'
  },
  description: 'Discover, read, and interact with books using advanced AI. Chat with books, get mood-based recommendations, take quizzes, and join a community of passionate readers.',
  keywords: ['digital library', 'AI chat', 'ebooks', 'audiobooks', 'reading', 'book recommendations', 'online library'],
  authors: [{ name: 'Book Heaven' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    title: 'Book Heaven - AI-Powered Digital Library',
    description: 'Discover, read, and interact with books using advanced AI technology.',
    siteName: 'Book Heaven',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Book Heaven - AI-Powered Digital Library',
    description: 'Discover, read, and interact with books using advanced AI technology.',
  },
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
              {children}
            </WebSocketProvider>
          </AuthProvider>
        </AppQueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
