import { useState, useEffect } from 'react'
import api from '../api/axios'

const CACHE_KEY = 'zashaGo_settings'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export default function useSettings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      try {
        const { data, ts } = JSON.parse(cached)
        if (Date.now() - ts < CACHE_TTL) {
          setSettings(data)
          setLoading(false)
          return
        }
      } catch (_) {}
    }

    api.get('/settings/publik')
      .then((r) => {
        setSettings(r.data)
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: r.data, ts: Date.now() }))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { settings, loading }
}
