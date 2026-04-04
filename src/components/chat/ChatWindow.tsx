'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Message } from '@/types'

type Props = {
  userId: string
  roomId: string
}

export function ChatWindow({ userId, roomId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  // 過去メッセージ取得
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, profile:profiles(username, avatar_url)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50)
      if (data) setMessages(data)
      setLoading(false)
    }
    fetch()
  }, [roomId, supabase])

  // リアルタイム購読
  useEffect(() => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `room_id=eq.${roomId}`,
      }, async (payload) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', payload.new.user_id)
          .single()
        setMessages(prev => [...prev, { ...(payload.new as Message), profile: profile ?? undefined }])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId, supabase])

  // 自動スクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    await supabase.from('messages').insert({ room_id: roomId, user_id: userId, content: input.trim() })
    setInput('')
  }, [input, roomId, userId, supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 720, margin: '0 auto' }}>
      {/* ヘッダー */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>💬 チャット</h1>
        <button onClick={signOut}
          style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 14 }}>
          ログアウト
        </button>
      </div>

      {/* メッセージ一覧 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#9ca3af' }}>読み込み中...</p>
        ) : messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af' }}>まだメッセージがありません</p>
        ) : (
          messages.map(msg => {
            const isMe = msg.user_id === userId
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                {!isMe && (
                  <span style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                    {msg.profile?.username ?? '名無し'}
                  </span>
                )}
                <div style={{
                  maxWidth: '70%', padding: '10px 14px', fontSize: 15, lineHeight: 1.6,
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isMe ? '#3B82F6' : '#f3f4f6',
                  color: isMe ? '#fff' : '#111',
                }}>
                  {msg.content}
                </div>
                <span style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                  {new Date(msg.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力フォーム */}
      <form onSubmit={sendMessage}
        style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8, flexShrink: 0 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          placeholder="メッセージを入力..."
          style={{ flex: 1, padding: '10px 14px', borderRadius: 24, border: '1px solid #d1d5db', fontSize: 15, outline: 'none' }} />
        <button type="submit" disabled={!input.trim()}
          style={{ padding: '10px 20px', borderRadius: 24, background: '#3B82F6', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 15, opacity: !input.trim() ? 0.5 : 1 }}>
          送信
        </button>
      </form>
    </div>
  )
}
