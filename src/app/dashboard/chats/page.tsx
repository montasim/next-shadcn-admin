import { ChatsClient } from './chats-client'

// Data
import { conversations } from './data/convo.json'

export default function ChatsPage() {
  return (
    <>
      <ChatsClient initialConversations={conversations} />
    </>
  )
}
