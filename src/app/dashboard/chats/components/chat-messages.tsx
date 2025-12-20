'use client'

import { Fragment } from 'react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Message } from '../data/schema'

type ChatMessagesProps = {
  messages: Message[]
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  // メッセージをグループ化
  const groupedMessages = messages.reduce(
    (acc: Record<string, Message[]>, obj) => {
      const key = format(new Date(obj.timestamp), 'd MMM, yyyy')
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(obj)
      return acc
    },
    {}
  )

  return (
    <div className='flex h-[calc(100vh-16rem)] flex-col gap-2 rounded-md px-4 pb-4 pt-0'>
      <div className='flex flex-1 overflow-hidden'>
        <div className='chat-text-container relative -mr-4 flex h-full w-full flex-col overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-secondary'>
          <div className='chat-flex flex flex-col-reverse justify-start gap-4 py-2 pb-4 pr-4'>
            {Object.keys(groupedMessages)
              .reverse()
              .map((key) => (
                <Fragment key={key}>
                  <div className='text-center text-xs text-muted-foreground'>
                    {key}
                  </div>
                  {groupedMessages[key].reverse().map((msg, index) => (
                    <div
                      key={`${msg.sender}-${msg.timestamp}-${index}`}
                      className={cn(
                        'chat-box max-w-[60%] break-words px-3 py-2 shadow-lg',
                        msg.sender === 'You'
                          ? 'self-end rounded-[16px_16px_0_16px] bg-primary/85 text-primary-foreground'
                          : 'self-start rounded-[16px_16px_16px_0] bg-secondary'
                      )}
                    >
                      {msg.message}{' '}
                      <span
                        className={cn(
                          'mt-1 block text-xs font-light italic text-muted-foreground',
                          msg.sender === 'You' && 'text-right'
                        )}
                      >
                        {format(new Date(msg.timestamp), 'h:mm a')}
                      </span>
                    </div>
                  ))}
                </Fragment>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
