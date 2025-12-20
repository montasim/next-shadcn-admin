'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Conversation } from './data/schema'
import { searchConversations, sendMessage } from './actions'
import { ChatSidebar } from './components/chat-sidebar'
import { ChatHeader } from './components/chat-header'
import { ChatMessages } from './components/chat-messages'
import { ChatInput } from './components/chat-input'

type ChatsClientProps = {
  initialConversations: Conversation[]
}

export function ChatsClient({ initialConversations }: ChatsClientProps) {
  const [search, setSearch] = useState('')
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedUser, setSelectedUser] = useState<Conversation>(initialConversations[0])
  const [mobileSelectedUser, setMobileSelectedUser] = useState<Conversation | null>(null)

  // 検索処理
  const handleSearch = async (query: string) => {
    setSearch(query)
    if (query.trim()) {
      const results = await searchConversations(query)
      setConversations(results)
    } else {
      setConversations(initialConversations)
    }
  }

  // メッセージ送信処理
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const message = formData.get('message')?.toString() || ''
    
    if (!message.trim()) return

    const timestamp = new Date().toISOString()
    const newMessage = {
      sender: 'You',
      message,
      timestamp,
    }
    
    // 楽観的更新
    const updatedSelectedUser = {
      ...selectedUser,
      messages: [newMessage, ...selectedUser.messages]
    }
    setSelectedUser(updatedSelectedUser)

    // 会話リストを更新
    const updatedConversations = conversations.map(conv => {
      if (conv.id === selectedUser.id) {
        return {
          ...conv,
          messages: [newMessage, ...conv.messages]
        }
      }
      return conv
    })
    setConversations(updatedConversations)
    
    try {
      await sendMessage(selectedUser.id, formData)
      event.currentTarget.reset()
    } catch (error) {
      console.error('Failed to send message:', error)
      // エラー時は元の状態に戻す
      setSelectedUser(selectedUser)
      setConversations(conversations)
    }
  }

  return (
    <section className='flex gap-4'>
      {/* Left Side */}
      <ChatSidebar
        conversations={conversations}
        selectedUser={selectedUser}
        search={search}
        onSearch={handleSearch}
        onSelectUser={(user) => {
          setSelectedUser(user)
          setMobileSelectedUser(user)
        }}
      />

      {/* Right Side */}
      <div
        className={cn(
          'absolute inset-0 hidden left-full z-50 w-full flex-1 flex-col rounded-md border bg-primary-foreground shadow-sm transition-all duration-200 sm:static sm:z-auto sm:flex',
          mobileSelectedUser && 'left-0 flex'
        )}
      >
        <ChatHeader
          selectedUser={selectedUser}
          isMobile={true}
          onBack={() => setMobileSelectedUser(null)}
        />
        <ChatMessages messages={selectedUser.messages} />
        <ChatInput onSubmit={handleSubmit} />
      </div>
    </section>
  )
}
