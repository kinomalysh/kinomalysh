import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '@/shared/api/client'
import { fetchPaymentStatus, startTopup } from './model'

export type PaymentWatchState = 'idle' | 'opening' | 'waiting' | 'succeeded' | 'failed'

const POLL_MS = 4000

export function usePaymentWatcher(onSucceeded: () => void) {
  const [state, setState] = useState<PaymentWatchState>('idle')
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const succeededRef = useRef(onSucceeded)
  succeededRef.current = onSucceeded

  useEffect(() => {
    if (!paymentId || state !== 'waiting') return
    let alive = true
    const timer = window.setInterval(async () => {
      try {
        const payment = await fetchPaymentStatus(paymentId)
        if (!alive) return
        if (payment.status === 'succeeded') {
          setState('succeeded')
          succeededRef.current()
        } else if (payment.status === 'failed' || payment.status === 'canceled') {
          setState('failed')
        }
      } catch {
        /* платёжка может отвечать не сразу, ждём следующий круг */
      }
    }, POLL_MS)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [paymentId, state])

  const start = useCallback(async (packId: string) => {
    setError(null)
    setState('opening')
    const paymentWindow = window.open('', '_blank', 'noopener,noreferrer')
    try {
      const { paymentId: id, paymentUrl } = await startTopup(packId)
      if (!paymentUrl) {
        paymentWindow?.close()
        setState('idle')
        setError('Платёжная страница не открылась, попробуйте ещё раз')
        return
      }
      if (paymentWindow) paymentWindow.location.href = paymentUrl
      else window.location.href = paymentUrl
      setPaymentId(id)
      setState('waiting')
    } catch (caught) {
      paymentWindow?.close()
      setState('idle')
      setError(caught instanceof ApiError ? caught.message : 'Оплата временно недоступна')
    }
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setPaymentId(null)
    setError(null)
  }, [])

  return { state, error, start, reset }
}
