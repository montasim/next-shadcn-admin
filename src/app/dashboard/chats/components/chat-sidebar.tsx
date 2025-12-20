'use client'

import { Fragment } from 'react'
import { IconEdit, IconMessages, IconSearch } from '@tabler/icons-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { Conversation } from '../data/schema'

type ChatSidebarProps = {
  conversations: Conversation[]
  selectedUser: Conversation
  search: string
  onSearch: (query: string) => void
  onSelectUser: (user: Conversation) => void
}

export function ChatSidebar({
  conversations,
  selectedUser,
  search,
  onSearch,
  onSelectUser,
}: ChatSidebarProps) {
  return (
    <div className='flex w-full flex-col gap-2 sm:w-56 lg:w-72 2xl:w-80'>
      <div className='sticky top-0 z-10 -mx-4 bg-background px-4 pb-3 shadow-md sm:static sm:z-auto sm:mx-0 sm:p-0 sm:shadow-none'>
        <div className='flex items-center justify-between py-2'>
          <div className='flex gap-2'>
            <h1 className='text-2xl font-bold'>Inbox</h1>
            <IconMessages size={20} />
          </div>

          <Button size='icon' variant='ghost' className='rounded-lg'>
            <IconEdit size={24} className='stroke-muted-foreground' />
          </Button>
        </div>

        <label className='flex h-12 w-full items-center space-x-0 rounded-md border border-input pl-2 focus-within:outline-none focus-within:ring-1 focus-within:ring-ring'>
          <IconSearch size={15} className='mr-2 stroke-slate-500' />
          <span className='sr-only'>Search</span>
          <input
            type='text'
            className='w-full flex-1 bg-inherit text-sm focus-visible:outline-none'
            placeholder='Search chat...'
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </label>
      </div>

      <ScrollArea className='-mx-3 h-full p-3'>
        {conversations.map((chatUsr) => {
          const { id, profile, username, messages, fullName } = chatUsr
          const lastConvo = messages[0]
          const lastMsg =
            lastConvo.sender === 'You'
              ? `You: ${lastConvo.message}`
              : lastConvo.message
          return (
            <Fragment key={id}>
              <button
                type='button'
                className={cn(
                  `-mx-1 flex w-full rounded-md px-2 py-2 text-left text-sm hover:bg-secondary/75`,
                  selectedUser.id === id && 'sm:bg-muted'
                )}
                onClick={() => onSelectUser(chatUsr)}
              >
                <div className='flex gap-2'>
                  <Avatar>
                    <AvatarImage src={profile} alt={username} />
                    <AvatarFallback>{username}</AvatarFallback>
                  </Avatar>
                  <div className='flex flex-col'>
                    <span className='font-medium'>{fullName}</span>
                    <span className='line-clamp-2 text-ellipsis text-muted-foreground'>
                      {lastMsg}
                    </span>
                  </div>
                </div>
              </button>
              <Separator className='my-1' />
            </Fragment>
          )
        })}
      </ScrollArea>
    </div>
  )
}
