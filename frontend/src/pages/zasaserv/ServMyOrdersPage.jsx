import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { SVC, svcShadow, Gloss } from '../../utils/svcTheme'

const STATUS_LABEL = {
  pending:     { label: 'Menunggu',   color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  confirmed:   { label: 'Dikonfirmasi', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  traveling:   { label: 'Dalam Perjalanan', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  in_progress: { label: 'Sedang Dikerjakan', color: '#EC4899', bg: 'rgba(236,72,153,0.1)' },
  completed:   { label: 'Selesai',    color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
  cancelled:   { label: 'Dibatalkan', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
}

function fmt(n) { return 'Rp ' + Number(n).toLocaleString('id') }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-' }

// ── Rating Modal ──────────────────────────────────────────────────────────────
function Stars({ score, onChange, size = 28 }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button" onClick={() => onChange(s)} style={{
          fontSize: size, background: 'none', border: 'none', cursor: 'pointer',
          opacity: s <= score ? 1 : 0.25, transition: 'opacity 0.15s', padding: 0,
        }}>⭐</button>
      ))}
    </div>
  )
}

function ServRatingModal({ order, onClose, onDone }) {
  const [score,   setScore]   = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const submit = async () => {
    setLoading(true); setError(null)
    try {
      await api.post(`/serv/orders/${order.id}/rate`, { score, comment: comment || undefined })
      onDone()
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal mengirim rating.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--k-surface)', borderRadius: '22px 22px 0 0', padding: '22px 18px 36px', width: '100%', maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <p style={{ fontWeight: 800, fontSize: 17, marginBottom: 2 }}>Beri Ulasan</p>
        <p style={{ fontSize: 12, color: 'var(--k-muted)', marginBottom: 20 }}>{order.provider?.name}</p>

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Rating Teknisi</p>
          <Stars score={score} onChange={setScore} />
        </div>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Tulis komentar (opsional)..."
          rows={3}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--k-border)', background: 'var(--k-input)', color: 'var(--k-text)', fontSize: 13, resize: 'none', boxSizing: 'border-box', marginBottom: 12 }}
        />

        {error && <p style={{ color: '#EF4444', fontSize: 12, marginBottom: 10 }}>{error}</p>}

        <button onClick={submit} disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: 999, border: 'none', background: loading ? 'var(--k-border)' : 'var(--k-primary)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer', boxShadow: loading ? 'none' : '0 4px 10px -2px rgba(30,40,55,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
          {loading ? 'Mengirim...' : 'Kirim Ulasan'}
        </button>
      </div>
    </div>
  )
}

export default function ServMyOrdersPage() {
  const navigate = useNavigate()
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [ratingModal, setRatingModal] = useState(null)

  const load = () => {
    api.get('/serv/orders')
      .then(r => setOrders(r.data.data ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--k-bg)', paddingBottom: 80 }}>
      {ratingModal && (
        <ServRatingModal
          order={ratingModal}
          onClose={() => setRatingModal(null)}
          onDone={() => { setRatingModal(null); load() }}
        />
      )}

      <div style={{ background: SVC.zasaserv.bg, padding: '52px 16px 20px', position: 'relative', overflow: 'hidden', boxShadow: svcShadow(SVC.zasaserv.rgb, true) }}>
        <Gloss />
        <div style={{ position: 'relative' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'var(--k-surface)', border: 'none', color: SVC.zasaserv.fg, borderRadius: 999, padding: '6px 14px', fontSize: 13, cursor: 'pointer', marginBottom: 12, boxShadow: `0 3px 8px rgba(${SVC.zasaserv.rgb},0.22), inset 0 1.5px 0 rgba(255,255,255,0.9)` }}>← Kembali</button>
          <div style={{ fontWeight: 800, fontSize: 20, color: SVC.zasaserv.fg }}>Pesanan Servis Saya</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: 100, borderRadius: 18, marginBottom: 12, background: 'var(--k-card)' }} />
          ))
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--k-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
            <div>Belum ada pesanan servis</div>
            <button onClick={() => navigate('/serv')} style={{ marginTop: 16, padding: '10px 24px', background: 'var(--k-primary)', color: '#fff', border: 'none', borderRadius: 999, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 10px -2px rgba(30,40,55,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
              Cari Teknisi
            </button>
          </div>
        ) : orders.map(order => {
          const st = STATUS_LABEL[order.status] ?? STATUS_LABEL.pending
          const canRate = order.status === 'completed' && !order.rated_at
          return (
            <div key={order.id}
              style={{ background: 'var(--k-card)', borderRadius: 18, padding: 16, marginBottom: 12, boxShadow: 'var(--k-shadow), var(--k-inset-hi)' }}>
              <div onClick={() => navigate(`/serv/orders/${order.id}`)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{order.provider?.name ?? '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--k-muted)', marginTop: 2 }}>{order.order_number}</div>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, height: 'fit-content' }}>{st.label}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--k-muted)' }}>{fmtDate(order.created_at)}</div>
                  <div style={{ fontWeight: 700, color: '#059669' }}>{fmt(order.total_price)}</div>
                </div>
              </div>

              {canRate && (
                <button onClick={() => setRatingModal(order)}
                  style={{ marginTop: 12, width: '100%', padding: '9px', borderRadius: 999, border: `1.5px solid rgba(${SVC.zasaserv.rgb},0.4)`, background: `rgba(${SVC.zasaserv.rgb},0.1)`, color: SVC.zasaserv.fg, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  ⭐ Beri Ulasan
                </button>
              )}
              {order.status === 'completed' && order.rated_at && (
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--k-muted)', textAlign: 'center' }}>
                  ✓ Sudah diberi ulasan
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
