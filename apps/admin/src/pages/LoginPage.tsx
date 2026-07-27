import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '@/shared/api'
import { useAuth } from '@/shared/auth'
import { Button, ErrorText, Field, Input } from '@/shared/ui'

export function LoginPage() {
  const setAdmin = useAuth((s) => s.setAdmin)
  const navigate = useNavigate()
  const [loginName, setLoginName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const admin = await login(loginName.trim(), password)
      setAdmin(admin)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5 rounded-2xl border border-line bg-surface p-8 shadow-xl shadow-black/30">
        <div>
          <p className="font-display text-3xl text-ink">Киномалыш</p>
          <p className="text-sm text-ink-3">Вход в панель управления</p>
        </div>
        <Field label="Логин">
          <Input value={loginName} onChange={(e) => setLoginName(e.target.value)} autoFocus autoComplete="username" />
        </Field>
        <Field label="Пароль">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" loading={busy} className="w-full">
          Войти
        </Button>
      </form>
    </div>
  )
}
