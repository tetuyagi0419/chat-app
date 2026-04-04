import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatWindow } from '@/components/chat/ChatWindow'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <ChatWindow userId={user.id} roomId="general" />
}
