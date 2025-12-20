import { z } from 'zod'

export const messageSchema = z.object({
  sender: z.string(),
  message: z.string(),
  timestamp: z.string(),
})

export const conversationSchema = z.object({
  id: z.string(),
  profile: z.string(),
  username: z.string(),
  fullName: z.string(),
  title: z.string(),
  messages: z.array(messageSchema),
})

export type Message = z.infer<typeof messageSchema>
export type Conversation = z.infer<typeof conversationSchema>
