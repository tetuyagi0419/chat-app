'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Message } from '@/types'

type Props = {
  userId: string
  roomId: string
}

export function ChatWindow({ userId, roomId }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting')
  const bottomRef = useRef<HTMLDivElement>(null)

  // 過去メッセージ取得
  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*, profile:profiles(username, avatar_url)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50)
      if (error) {
        setFetchError('メッセージの読み込みに失敗しました')
      } else {
        if (data) setMessages(data)
      }
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('connected')
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') setRealtimeStatus('disconnected')
        else setRealtimeStatus('connecting')
      })

    return () => { supabase.removeChannel(channel) }
  }, [roomId, supabase])

  // 自動スクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending) return
    setSendError(null)
    setSending(true)
    const { error } = await supabase
      .from('messages')
      .insert({ room_id: roomId, user_id: userId, content: input.trim() })
    if (error) {
      setSendError('送信に失敗しました。もう一度お試しください')
    } else {
      setInput('')
    }
    setSending(false)
  }, [input, roomId, userId, supabase, sending])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 720, margin: '0 auto' }}>
      {/* ヘッダー */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>💬 チャット</h1>
          {realtimeStatus === 'disconnected' && (
            <span style={{ fontSize: 12, color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '2px 8px' }}>
              接続が切れました
            </span>
          )}
          {realtimeStatus === 'connecting' && (
            <span style={{ fontSize: 12, color: '#f59e0b', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '2px 8px' }}>
              接続中...
            </span>
          )}
        </div>
        <button onClick={signOut}
          style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 14 }}>
          ログアウト
        </button>
      </div>

      {/* メッセージ一覧 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#9ca3af' }}>読み込み中...</p>
        ) : fetchError ? (
          <p style={{ textAlign: 'center', color: '#ef4444' }}>{fetchError}</p>
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

      {/* 送信エラー */}
      {sendError && (
        <p style={{ margin: '0 16px', padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#ef4444' }}>
          {sendError}
        </p>
      )}

      {/* 入力フォーム */}
      <form onSubmit={sendMessage}
        style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8, flexShrink: 0 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          placeholder="メッセージを入力..."
          disabled={sending}
          style={{ flex: 1, padding: '10px 14px', borderRadius: 24, border: '1px solid #d1d5db', fontSize: 15, outline: 'none', opacity: sending ? 0.6 : 1 }} />
        <button type="submit" disabled={!input.trim() || sending}
          style={{ padding: '10px 20px', borderRadius: 24, background: '#3B82F6', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 15, opacity: (!input.trim() || sending) ? 0.5 : 1 }}>
          {sending ? '送信中...' : '送信'}
        </button>
      </form>
    </div>
  )
}
