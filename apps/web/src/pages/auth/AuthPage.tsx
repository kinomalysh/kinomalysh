import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { WarningCircle } from '@phosphor-icons/react'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Field } from '@/shared/ui/Field'
import { ROUTES } from '@/shared/config/routes'
import { useSeo } from '@/shared/lib/seo'
import { ApiError } from '@/shared/api/client'
import { useSession } from '@/entities/session/model'

type Mode = 'login' | 'register' | 'verify'

const TITLES: Record<Mode, string> = {
  login: 'С возвращением',
  register: 'Читательский билет',
  verify: 'Код из письма',
}

const SUBTITLES: Record<Mode, string> = {
  login: 'Войдите, чтобы забрать свои мультфильмы',
  register: 'Пара полей - и можно заказывать мультфильм',
  verify: 'Мы отправили четыре цифры на вашу почту',
}

export function AuthPage() {
  useSeo('auth')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') ?? ROUTES.library

  const status = useSession((s) => s.status)
  const login = useSession((s) => s.login)
  const register = useSession((s) => s.register)
  const verify = useSession((s) => s.verify)
  const resend = useSession((s) => s.resend)

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (status === 'authed') navigate(next, { replace: true })
  }, [status, next, navigate])

  const run = async (task: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await task()
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message)
        const payload = caught.payload as { needVerify?: boolean } | undefined
        if (payload?.needVerify) {
          setMode('verify')
          setNotice('Почта не подтверждена - новый код уже в пути')
        }
      } else {
        setError('Сервер не отвечает, попробуйте ещё раз')
      }
    } finally {
      setBusy(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (mode === 'login') {
      void run(() => login({ email: email.trim(), password }))
      return
    }
    if (mode === 'register') {
      void run(async () => {
        await register({ email: email.trim(), password, name: name.trim() })
        setMode('verify')
        setNotice('Код отправлен - проверьте почту, включая «Спам»')
      })
      return
    }
    void run(() => verify({ email: email.trim(), code }))
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 pt-6 animate-rise">
      <header className="space-y-2 text-center">
        <h1 className="font-display text-2xl text-ink-900">{TITLES[mode]}</h1>
        <p className="text-sm text-ink-800">{SUBTITLES[mode]}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <Field
            label="Как вас зовут"
            placeholder="Имя"
            value={name}
            maxLength={50}
            autoComplete="name"
            required
            onChange={(event) => setName(event.target.value)}
          />
        )}

        {mode !== 'verify' && (
          <>
            <Field
              label="Почта"
              type="email"
              placeholder="you@example.com"
              value={email}
              autoComplete="email"
              required
              onChange={(event) => setEmail(event.target.value)}
            />
            <Field
              label="Пароль"
              type="password"
              placeholder={mode === 'register' ? 'Минимум 8 символов' : 'Ваш пароль'}
              value={password}
              minLength={mode === 'register' ? 8 : undefined}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              required
              onChange={(event) => setPassword(event.target.value)}
            />
          </>
        )}

        {mode === 'verify' && (
          <Field
            label="Код из письма"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            placeholder="0000"
            value={code}
            className="text-center font-display text-2xl tracking-[0.5em]"
            required
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 4))}
          />
        )}

        {notice && !error && (
          <p className="rounded-2xl bg-mustard/15 px-4 py-3 text-xs text-ink-800">{notice}</p>
        )}

        {error && (
          <Card className="flex items-start gap-3 p-4">
            <WarningCircle className="mt-0.5 h-5 w-5 shrink-0 text-berry" />
            <p className="text-sm text-ink-800">{error}</p>
          </Card>
        )}

        <Button type="submit" size="lg" className="w-full" loading={busy}>
          {mode === 'login' ? 'Войти' : mode === 'register' ? 'Создать билет' : 'Подтвердить'}
        </Button>
      </form>

      <div className="space-y-2 text-center text-sm">
        {mode === 'login' && (
          <button
            type="button"
            className="cursor-pointer text-ink-800 underline underline-offset-4"
            onClick={() => {
              setMode('register')
              setError(null)
            }}
          >
            Впервые здесь? Завести билет
          </button>
        )}
        {mode === 'register' && (
          <button
            type="button"
            className="cursor-pointer text-ink-800 underline underline-offset-4"
            onClick={() => {
              setMode('login')
              setError(null)
            }}
          >
            У меня уже есть билет
          </button>
        )}
        {mode === 'verify' && (
          <button
            type="button"
            className="cursor-pointer text-ink-800 underline underline-offset-4"
            onClick={() =>
              void run(async () => {
                await resend(email.trim())
                setNotice('Отправили новый код')
              })
            }
          >
            Прислать код ещё раз
          </button>
        )}
      </div>
    </div>
  )
}
