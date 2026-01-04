'use client'

import { useEffect, useState } from 'react'
import { getCookieConsent, setCookieConsent as saveCookieConsent, type CookieConsent } from '@/components/cookie/cookie-consent-banner'

export function useCookieConsent() {
  const [consent, setConsentState] = useState<CookieConsent>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load consent from localStorage on mount
    const savedConsent = getCookieConsent()
    setConsentState(savedConsent)
    setIsLoading(false)
  }, [])

  const accept = () => {
    saveCookieConsent('accepted')
    setConsentState('accepted')
  }

  const reject = () => {
    saveCookieConsent('rejected')
    setConsentState('rejected')
  }

  const reset = () => {
    saveCookieConsent(null)
    setConsentState(null)
  }

  return {
    consent,
    hasConsented: consent === 'accepted',
    hasRejected: consent === 'rejected',
    isLoading,
    accept,
    reject,
    reset,
  }
}
