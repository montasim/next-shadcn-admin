'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Cookie } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

export type CookieConsent = 'accepted' | 'rejected' | null

const CONSENT_STORAGE_KEY = 'cookie-consent'

export function getCookieConsent(): CookieConsent {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(CONSENT_STORAGE_KEY)
  return (stored as CookieConsent) || null
}

export function setCookieConsent(consent: CookieConsent) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CONSENT_STORAGE_KEY, consent || '')
}

export function CookieConsentBanner() {
  const pathname = usePathname()
  const [consent, setConsent] = useState<CookieConsent>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false)
  const [cookiePolicyContent, setCookiePolicyContent] = useState<{ title: string; content: string } | null>(null)

  // Hide banner on root page and dashboard pages
  const shouldHideBanner = pathname === '/' || pathname?.startsWith('/dashboard')

  useEffect(() => {
    // Check if user has already consented
    const savedConsent = getCookieConsent()
    setConsent(savedConsent)

    // Show banner if no consent has been given and not on excluded pages
    if (!savedConsent && !shouldHideBanner) {
      // Small delay to prevent flash on page load
      const timer = setTimeout(() => setIsOpen(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [shouldHideBanner])

  const handleAccept = () => {
    setConsent('accepted')
    setCookieConsent('accepted')
    setIsOpen(false)
  }

  const handleReject = () => {
    setConsent('rejected')
    setCookieConsent('rejected')
    setIsOpen(false)
  }

  const handleDismiss = () => {
    setIsOpen(false)
  }

  const handleShowPolicy = async () => {
    try {
      const response = await fetch('/api/legal/COOKIE_POLICY')
      const result = await response.json()
      if (result.success && result.data) {
        setCookiePolicyContent(result.data)
        setPolicyDialogOpen(true)
      }
    } catch (error) {
      console.error('Failed to fetch cookie policy:', error)
    }
  }

  const formatMarkdown = (text: string) => {
    return text
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-6 mb-4">$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n\n/gim, '</p><p class="mt-4">')
      .replace(/\n/gim, '<br />')
      .replace(/^(?!$)/gim, '<p>$&</p>')
  }

  // Don't render if user has already consented/rejected, banner is closed, or on excluded pages
  if (!isOpen || consent || shouldHideBanner) return null

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-in slide-in-from-bottom duration-500">
        <Card className="max-w-4xl shadow-lg border-2">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                  <Cookie className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-3">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">
                    We use cookies
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    We use cookies to enhance your experience, analyze usage, and assist in our marketing efforts.
                    By using our website, you agree to our use of cookies.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <button
                    onClick={handleShowPolicy}
                    className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <span>Learn more</span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:self-start">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReject}
                  className="sm:flex-1"
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={handleAccept}
                  className="sm:flex-1"
                >
                  Accept
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Cookie Policy Dialog */}
      <AlertDialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
        <AlertDialogContent className="w-[95%] sm:w-[80%] md:w-[70%] lg:w-[50%] !max-w-2xl max-h-[80vh] text-left">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>Cookie Policy</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:text-sm prose-p:leading-relaxed prose-a:text-primary prose-a:underline-offset-4 hover:prose-a:text-primary/80 prose-strong:text-foreground prose-code:text-sm prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 text-left">
                  {cookiePolicyContent?.content ? (
                    <div dangerouslySetInnerHTML={{ __html: formatMarkdown(cookiePolicyContent.content) }} />
                  ) : (
                    <p>Loading cookie policy...</p>
                  )}
                </div>
              </ScrollArea>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
