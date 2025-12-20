'use client'

import {
  IconPaperclip,
  IconPhotoPlus,
  IconPlus,
  IconSend,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

type ChatInputProps = {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

export function ChatInput({ onSubmit }: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className='flex w-full flex-none gap-2 pt-4'>
      <div className='flex flex-1 items-center gap-2 rounded-xl border border-input bg-background px-4 py-3 focus-within:outline-none focus-within:ring-1 focus-within:ring-ring lg:gap-4'>
        <div className='flex gap-1'>
          <Button
            size='icon'
            type='button'
            variant='ghost'
            className='h-8 w-8 rounded-lg'
          >
            <IconPlus size={20} className='stroke-muted-foreground' />
          </Button>
          <Button
            size='icon'
            type='button'
            variant='ghost'
            className='hidden h-8 w-8 rounded-lg lg:inline-flex'
          >
            <IconPhotoPlus size={20} className='stroke-muted-foreground' />
          </Button>
          <Button
            size='icon'
            type='button'
            variant='ghost'
            className='hidden h-8 w-8 rounded-lg lg:inline-flex'
          >
            <IconPaperclip size={20} className='stroke-muted-foreground' />
          </Button>
        </div>
        <label className='flex-1'>
          <span className='sr-only'>Chat Text Box</span>
          <input
            type='text'
            name='message'
            placeholder='Type your messages...'
            className='h-8 w-full bg-inherit focus-visible:outline-none'
          />
        </label>
        <Button
          variant='ghost'
          size='icon'
          type='submit'
          className='hidden h-8 w-8 rounded-lg sm:inline-flex'
        >
          <IconSend size={20} />
        </Button>
      </div>
      <Button type='submit' className='h-14 rounded-xl sm:hidden'>
        <IconSend size={18} /> Send
      </Button>
    </form>
  )
}
