import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const TYPE_ICON = {
  order_accepted:      '✅',
  order_on_pickup:     '🛵',
  order_picked_up:     '📦',
  order_delivered:     '🏠',
  order_completed:     '💰',
  order_cancelled:     '❌',
  rating_request:      '⭐',
  jastip_accepted:     '⚡',
  new_order:           '🔔',
  food_new_order:      '🍜',
  food_accepted:       '✅',
  food_rejected:       '❌',
  food_preparing:      '👨‍🍳',
  food_ready:          '🎉',
  food_mitra_assigned: '🏍️',
  food_picked_up:      '📦',
  food_on_delivery:    '🚀',
  food_delivered:      '🎊',
  food_completed:      '⭐',
  food_cancelled:             '❌',
  food_timeout:               '⏰',
  food_rating_request:        '⭐',
  food_jastip_session_closed: '🔴',
  mitra_gps_lost:             '📡',
  mart_mitra_accepted:        '🛵',
  mart_status_on_delivery:    '🚀',
  mart_status_completed:      '🛒',
}

const ACCENT  = { color: 'var(--k-accent)',  rgb: '46,125,91' }
const INFO    = { color: 'var(--k-info)',    rgb: '42,95,130' }
const MUTED   = { color: 'var(--k-muted)',   rgb: '148,139,125' }
const WARN    = { color: 'var(--k-warn)',    rgb: '184,134,11' }
const PRIMARY = { color: 'var(--k-primary)', rgb: '40,55,75' }
const DANGER  = { color: 'var(--k-danger)',  rgb: '192,67,92' }

const TYPE_COLOR = {
  order_accepted:      ACCENT,
  order_on_pickup:     INFO,
  order_picked_up:     INFO,
  order_delivered:     ACCENT,
  order_completed:     ACCENT,
  order_cancelled:     MUTED,
  rating_request:      WARN,
  jastip_accepted:     ACCENT,
  new_order:           PRIMARY,
  food_new_order:      WARN,
  food_accepted:       ACCENT,
  food_rejected:       DANGER,
  food_preparing:      PRIMARY,
  food_ready:          ACCENT,
  food_mitra_assigned: INFO,
  food_picked_up:      PRIMARY,
  food_on_delivery:    INFO,
  food_delivered:      ACCENT,
  food_completed:      ACCENT,
  food_cancelled:             MUTED,
  food_timeout:               DANGER,
  food_rating_request:        WARN,
  food_jastip_session_closed: DANGER,
  mitra_gps_lost:             WARN,
  mart_mitra_accepted:        PRIMARY,
  mart_status_on_delivery:    PRIMARY,
  mart_status_completed:      PRIMARY,
}

function formatTime(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60)   return 'Baru saja'
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export default function NotificationsPage() {
  const navigate   = useNavigate()
  const { user }   = useAuth()
  const isMitra    = user?.role === 'mitra_motor' || user?.role === 'mitra_mobil'
  const isMerchant = user?.role === 'merchant'
  const [notifs,   setNotifs]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [marking,  setMarking]  = useState(false)

  const fetchNotifs = useCallback(() => {
    api.get('/notifications').then(r => {
      setNotifs(r.data.data?.data ?? [])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchNotifs() }, [fetchNotifs])

  const markAllRead = async () => {
    setMarking(true)
    try {
      await api.post('/notifications/read')
      setNotifs(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })))
    } finally {
      setMarking(false)
    }
  }

  const getNavTarget = (notif) => {
    // Notifikasi yang hanya dikirim ke mitra ZasaGo
    if (notif.type === 'new_order' || notif.type === 'order_cancelled') {
      return '/mitra/orders'
    }
    // Notifikasi order baru makanan: merchant ke halaman order, mitra ke halaman mitra food
    if (notif.type === 'food_new_order') {
      if (isMerchant) return '/merchant/orders'
      if (isMitra)    return '/mitra/food/orders'
    }
    // Navigasi berbasis data
    if (notif.data?.food_order_id)              return `/food/orders/${notif.data.food_order_id}`
    if (notif.data?.module === 'zasamart' && notif.data?.order_id) return `/mart/orders/${notif.data.order_id}`
    if (notif.data?.order_id)                   return `/orders/${notif.data.order_id}/tracking`
    if (notif.data?.order_number)               return '/orders'
    return null
  }

  const markOneRead = async (notif) => {
    if (!notif.read_at) {
      await api.post('/notifications/read', { id: notif.id }).catch(() => {})
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n))
    }
    const target = getNavTarget(notif)
    if (target) navigate(target)
  }

  const unreadCount = notifs.filter(n => !n.read_at).length

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--k-bg)', paddingBottom: 100 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ background: 'var(--k-surface)', borderBottom: '1px solid var(--k-border)', padding: '52px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/dashboard" style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--k-card)', border: '1px solid var(--k-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--k-muted)', textDecoration: 'none', fontSize: 18 }}>←</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--k-text)' }}>
              Notifikasi
              {unreadCount > 0 && (
                <span style={{ marginLeft: 8, background: 'var(--k-accent)', color: '#0C0C16', fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 100 }}>
                  {unreadCount}
                </span>
              )}
            </h1>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} disabled={marking} style={{
              fontSize: 12, fontWeight: 700, color: 'var(--k-accent)',
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
            }}>
              {marking ? '...' : 'Tandai semua dibaca'}
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 28, height: 28, border: '2.5px solid var(--k-accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : notifs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🔔</p>
            <p style={{ color: 'var(--k-text)', fontWeight: 700, marginBottom: 6 }}>Belum ada notifikasi</p>
            <p style={{ color: 'var(--k-muted)', fontSize: 13 }}>Notifikasi order dan transaksi akan muncul di sini</p>
          </div>
        ) : notifs.map(notif => {
          const icon  = TYPE_ICON[notif.type]  ?? '🔔'
          const tc    = TYPE_COLOR[notif.type] ?? MUTED
          const isUnread = !notif.read_at
          return (
            <button key={notif.id} onClick={() => markOneRead(notif)} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '14px 16px', borderRadius: 18, textAlign: 'left',
              background: isUnread ? `rgba(${tc.rgb},0.08)` : 'var(--k-card)',
              border: `1px solid ${isUnread ? `rgba(${tc.rgb},0.25)` : 'var(--k-border)'}`,
              cursor: 'pointer', width: '100%',
              transition: 'all 0.15s',
            }}>
              {/* Ikon */}
              <div style={{
                width: 42, height: 42, borderRadius: 14, flexShrink: 0,
                background: `rgba(${tc.rgb},0.15)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, position: 'relative',
              }}>
                {icon}
                {isUnread && (
                  <span style={{
                    position: 'absolute', top: -2, right: -2,
                    width: 10, height: 10, borderRadius: '50%',
                    background: tc.color, border: '2px solid var(--k-bg)',
                  }} />
                )}
              </div>

              {/* Konten */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: isUnread ? 700 : 600, color: 'var(--k-text)', marginBottom: 3, lineHeight: 1.4 }}>
                  {notif.title}
                </p>
                <p style={{ fontSize: 12, color: 'var(--k-muted)', lineHeight: 1.5, marginBottom: 4 }}>
                  {notif.body}
                </p>
                <p style={{ fontSize: 10, fontWeight: isUnread ? 700 : 400, color: isUnread ? tc.color : 'var(--k-muted)' }}>
                  {formatTime(notif.created_at)}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <BottomNav />
    </div>
  )
}
