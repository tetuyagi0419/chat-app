'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
      router.push('/chat')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  const inputStyle: React.CSSProperties = {
    padding: '10px 12px', borderRadius: 8,
    border: '1px solid #d1d5db', fontSize: 15, width: '100%', outline: 'none',
  }
  const btnStyle: React.CSSProperties = {
    padding: '12px', borderRadius: 8, fontSize: 15,
    border: 'none', cursor: 'pointer', width: '100%',
  }

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <h1 style={{ textAlign: 'center', marginBottom: 32, fontSize: 24, fontWeight: 600 }}>
        {isSignUp ? 'アカウント作成' : 'ログイン'}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input type="email" placeholder="メールアドレス" value={email}
          onChange={e => setEmail(e.target.value)} required style={inputStyle} />
        <input type="password" placeholder="パスワード（6文字以上）" value={password}
          onChange={e => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
        {error && <p style={{ color: '#ef4444', fontSize: 14 }}>{error}</p>}
        <button type="submit" disabled={loading}
          style={{ ...btnStyle, background: '#3B82F6', color: '#fff', opacity: loading ? 0.7 : 1 }}>
          {loading ? '処理中...' : isSignUp ? '登録する' : 'ログイン'}
        </button>
      </form>

      <div style={{ textAlign: 'center', margin: '16px 0', color: '#9ca3af', fontSize: 14 }}>または</div>

      <button onClick={handleGoogle}
        style={{ ...btnStyle, background: '#fff', border: '1px solid #d1d5db', color: '#374151' }}>
        Googleでログイン
      </button>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6b7280' }}>
        {isSignUp ? 'すでにアカウントをお持ちの方は' : 'アカウントをお持ちでない方は'}
        <button onClick={() => setIsSignUp(!isSignUp)}
          style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: 14, marginLeft: 4 }}>
          {isSignUp ? 'ログイン' : '新規登録'}
        </button>
      </p>
    </div>
  )
}
