'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PublicHeader } from '@/components/layout/public-header'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'

export default function NotFound() {
  const router = useRouter()
  return (
    <>
      <PublicHeader />
      <div className='min-h-screen'>
        <div className='m-auto flex h-svh w-full flex-col items-center justify-center gap-2'>
          <h1 className='text-[7rem] font-bold leading-tight'>404</h1>
          <span className='font-medium'>Oops! Page Not Found!</span>
          <p className='text-center text-muted-foreground'>
            It seems like the page you're looking for <br />
            does not exist or might have been removed.
          </p>
          <div className='mt-6 flex gap-4'>
            <Button variant='outline' onClick={() => router.back()}>
              Go Back
            </Button>
            <Button onClick={() => router.push('/books')}>Back to Home</Button>
          </div>
        </div>
      </div>
      <MobileBottomNav />
    </>
  )
}
