'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

export function SettingsSidebarNavSkeleton() {
  return (
    <>
      {/* Mobile tabs skeleton */}
      <div className='md:hidden'>
        <Tabs defaultValue='' className='w-full'>
          <TabsList className='w-full justify-start overflow-x-auto'>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className='h-9 w-24' />
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Desktop sidebar skeleton */}
      <ScrollArea
        orientation='horizontal'
        type='always'
        className='hidden w-full bg-background px-1 py-2 md:block min-w-40'
      >
        <nav className='flex py-1 space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1'>
          {[...Array(5)].map((_, i) => (
            <div key={i} className='flex items-center gap-2 p-2 rounded-md'>
              <Skeleton className='h-4 w-4' />
              <Skeleton className='h-4 w-20' />
            </div>
          ))}
        </nav>
      </ScrollArea>
    </>
  )
}

export function SettingsPageHeaderSkeleton() {
  return (
    <div className='flex-none'>
      <Skeleton className='h-6 w-20 mb-2' />
      <Skeleton className='h-4 w-72' />
    </div>
  )
}

export function ProfileFormSkeleton() {
  return (
    <div className='space-y-8'>
      {/* Username Field */}
      <div className='space-y-2'>
        <Skeleton className='h-4 w-20' />
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-4 w-80' />
      </div>

      {/* Email Field */}
      <div className='space-y-2'>
        <Skeleton className='h-4 w-12' />
        <div className='space-y-3'>
          <div className='relative'>
            <Skeleton className='h-10 w-full' />
          </div>
          <Skeleton className='h-9 w-full' />
        </div>
        <Skeleton className='h-4 w-40' />
      </div>

      {/* OTP Card Skeleton */}
      {/*<Card className='w-full'>*/}
      {/*  <CardContent className='pt-6 space-y-4'>*/}
      {/*    <div className='space-y-2'>*/}
      {/*      <Skeleton className='h-5 w-48 mx-auto' />*/}
      {/*      <Skeleton className='h-4 w-64 mx-auto' />*/}
      {/*    </div>*/}
      {/*    <div className='flex justify-center gap-2'>*/}
      {/*      {[...Array(6)].map((_, i) => (*/}
      {/*        <Skeleton key={i} className='h-12 w-10' />*/}
      {/*      ))}*/}
      {/*    </div>*/}
      {/*    <Skeleton className='h-9 w-32 mx-auto' />*/}
      {/*  </CardContent>*/}
      {/*</Card>*/}

      {/* Bio Field */}
      <div className='space-y-2'>
        <Skeleton className='h-4 w-10' />
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-4 w-72' />
      </div>

      {/* URLs Fields */}
      <div className='space-y-2'>
        <Skeleton className='h-4 w-12' />
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-9 w-24 mt-2' />
      </div>

      {/* Submit Button */}
      <Skeleton className='h-10 w-32' />
    </div>
  )
}

export function ContentSectionSkeleton() {
  return (
    <div className='flex flex-1 flex-col'>
      {/* Section Header */}
      <div className='flex-none'>
        <Skeleton className='h-6 w-20 mb-2' />
        <Skeleton className='h-4 w-72' />
      </div>

      {/* Separator */}
      <div className='h-px bg-border my-4 flex-none' />

      {/* Scroll Area with Form Content */}
      <div className='faded-bottom -mx-4 flex-1 scroll-smooth px-4 md:pb-16'>
        <div className='lg:max-w-xl -mx-1 px-1.5'>
          <ProfileFormSkeleton />
        </div>
      </div>
    </div>
  )
}
