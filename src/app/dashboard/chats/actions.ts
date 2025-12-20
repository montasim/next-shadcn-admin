'use server'

import { revalidatePath } from 'next/cache'
import { Message, Conversation, conversationSchema, messageSchema } from './data/schema'
import { conversations } from './data/convo.json'

// メモリ内データストア
let conversationsData = conversations

export async function getConversations() {
  return conversationsData
}

export async function getConversation(id: string) {
  return conversationsData.find(conv => conv.id === id)
}

export async function sendMessage(conversationId: string, formData: FormData) {
  const rawData = {
    sender: 'You',
    message: formData.get('message')?.toString() || '',
    timestamp: new Date().toISOString(),
  }

  // バリデーション
  const validatedData = messageSchema.parse(rawData)

  // 会話を検索
  const conversation = conversationsData.find(conv => conv.id === conversationId)
  if (!conversation) {
    throw new Error('Conversation not found')
  }

  // メッセージを追加
  conversation.messages.unshift(validatedData)
  
  revalidatePath('/chats')
  return { message: 'Message sent successfully' }
}

export async function searchConversations(query: string) {
  return conversationsData.filter(({ fullName }) =>
    fullName.toLowerCase().includes(query.trim().toLowerCase())
  )
}
