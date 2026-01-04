'use client'

import { ReactNode } from 'react'
import { CookieConsentBanner } from '@/components/cookie/cookie-consent-banner'

export function RootLayoutClient({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <CookieConsentBanner />
    </>
  )
}
