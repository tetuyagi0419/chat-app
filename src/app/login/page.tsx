import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '0 16px' }}>
      <LoginForm />
    </main>
  )
}
