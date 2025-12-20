'use client'

import { IconArrowLeft, IconDotsVertical, IconPhone, IconVideo } from '@tabler/icons-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Conversation } from '../data/schema'

type ChatHeaderProps = {
  selectedUser: Conversation
  isMobile?: boolean
  onBack?: () => void
}

export function ChatHeader({ selectedUser, isMobile, onBack }: ChatHeaderProps) {
  return (
    <div className='mb-1 flex flex-none justify-between rounded-t-md bg-secondary p-4 shadow-lg'>
      {/* Left */}
      <div className='flex gap-3'>
        {isMobile && (
          <Button
            size='icon'
            variant='ghost'
            className='-ml-2 h-full sm:hidden'
            onClick={onBack}
          >
            <IconArrowLeft />
          </Button>
        )}
        <div className='flex items-center gap-2 lg:gap-4'>
          <Avatar className='size-9 lg:size-11'>
            <AvatarImage src={selectedUser.profile} alt={selectedUser.username} />
            <AvatarFallback>{selectedUser.username}</AvatarFallback>
          </Avatar>
          <div className='flex flex-col'>
            <span className='text-sm font-medium lg:text-base'>
              {selectedUser.fullName}
            </span>
            <span className='line-clamp-1 block max-w-32 text-ellipsis text-nowrap text-xs text-muted-foreground lg:max-w-none lg:text-sm'>
              {selectedUser.title}
            </span>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className='-mr-1 flex items-center gap-1 lg:gap-2'>
        <Button
          size='icon'
          variant='ghost'
          className='hidden size-8 rounded-full sm:inline-flex lg:size-10'
        >
          <IconVideo size={22} className='stroke-muted-foreground' />
        </Button>
        <Button
          size='icon'
          variant='ghost'
          className='hidden size-8 rounded-full sm:inline-flex lg:size-10'
        >
          <IconPhone size={22} className='stroke-muted-foreground' />
        </Button>
        <Button
          size='icon'
          variant='ghost'
          className='h-10 rounded-md sm:h-8 sm:w-4 lg:h-10 lg:w-6'
        >
          <IconDotsVertical className='stroke-muted-foreground sm:size-5' />
        </Button>
      </div>
    </div>
  )
}
