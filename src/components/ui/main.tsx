import React from 'react'
import { cn } from '@/lib/utils'

interface MainProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean
  noPadding?: boolean
  noMobileNavPadding?: boolean
  ref?: React.Ref<HTMLElement>
}

export const Main = ({ fixed, noPadding, noMobileNavPadding, ...props }: MainProps) => {
  return (
    <main
      className={cn(
        'peer-[.header-fixed]/header:mt-16',
        !noPadding && 'p-2',
        !noMobileNavPadding && 'pb-mobile-nav-safe',
        fixed && 'fixed-main flex flex-col flex-grow overflow-hidden'
      )}
      {...props}
    />
  )
}

Main.displayName = 'Main'
