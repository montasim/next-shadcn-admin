'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PublicHeader } from '@/components/layout/public-header'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  return (
    <>
      <PublicHeader />
      <div className='min-h-screen'>
        <div className='m-auto flex h-svh w-full flex-col items-center justify-center gap-2'>
          <h1 className='text-[7rem] font-bold leading-tight'>500</h1>
          <span className='font-medium'>Oops! Something Went Wrong!</span>
          <p className='text-center text-muted-foreground'>
            We encountered an unexpected error. <br />
            Please try again or contact support if the problem persists.
          </p>
          <div className='mt-6 flex gap-4'>
            <Button variant='outline' onClick={() => router.back()}>
              Go Back
            </Button>
            <Button onClick={reset}>Try Again</Button>
          </div>
        </div>
      </div>
      <MobileBottomNav />
    </>
  )
}
