import { useCallback, useEffect, useRef, useState } from 'react'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  refreshing: boolean
  error: string | null
  reload: () => void
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isFirstLoad = useRef(true)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps)

  const load = useCallback(() => {
    let alive = true
    if (isFirstLoad.current) setLoading(true)
    else setRefreshing(true)
    setError(null)
    run()
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Ошибка'))
      .finally(() => {
        if (!alive) return
        isFirstLoad.current = false
        setLoading(false)
        setRefreshing(false)
      })
    return () => {
      alive = false
    }
  }, [run])

  useEffect(() => {
    isFirstLoad.current = true
    return load()
  }, [load])

  return { data, loading, refreshing, error, reload: load }
}
