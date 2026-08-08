import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import api, { storageUrl } from '../../services/api'
import { SVC } from '../../utils/svcTheme'

function fmtRp(v)   { return 'Rp ' + Number(v || 0).toLocaleString('id-ID') }
function fmtDate(d) { return new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }

const MODULE_META = {
  zasago:   { label: 'ZasaGo',    color: SVC.zasago.fg,   rgb: SVC.zasago.rgb },
  zasafood: { label: 'ZasaFood',  color: SVC.zasafood.fg, rgb: SVC.zasafood.rgb },
  zasamart: { label: 'ZasaShop',  color: SVC.zasashop.fg, rgb: SVC.zasashop.rgb },
  zasahome: { label: 'ZasaHome',  color: SVC.zasahome.fg, rgb: SVC.zasahome.rgb },
  zasaserv: { label: 'ZasaServis',color: SVC.zasaserv.fg, rgb: SVC.zasaserv.rgb },
  zasaride: { label: 'ZasaRide',  color: SVC.zasaride.fg, rgb: SVC.zasaride.rgb },
}

const STATUS_META = {
  pending:   { label: 'Menunggu',  color: 'var(--k-warn)',    rgb: '184,134,11' },
  reviewing: { label: 'Ditinjau',  color: 'var(--k-primary)', rgb: '40,55,75' },
  resolved:  { label: 'Selesai',   color: 'var(--k-accent)',  rgb: '46,125,91' },
  rejected:  { label: 'Ditolak',   color: 'var(--k-danger)',  rgb: '192,67,92' },
}

const STATUS_TABS = [
  { key: 'pending',  label: 'Menunggu' },
  { key: 'resolved', label: 'Selesai' },
  { key: 'rejected', label: 'Ditolak' },
  { key: 'all',      label: 'Semua' },
]

function ComplaintCard({ item, onResolve, onReject, busy }) {
  const [open, setOpen]           = useState(false)
  const [showResolve, setResolve] = useState(false)
  const [showReject, setReject]   = useState(false)
  const [note, setNote]           = useState('')
  const [refund, setRefund]       = useState('')

  const mod    = MODULE_META[item.order_type] ?? { label: item.order_type, color: 'var(--k-muted)', rgb: '148,139,125' }
  const status = STATUS_META[item.status] ?? STATUS_META.pending
  const isBusy = busy === item.id

  return (
    <div onClick={() => setOpen(o => !o)} style={{
      borderTop: '1px solid var(--k-border)', cursor: 'pointer', padding: '14px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--k-text)' }}>{item.customer?.name}</span>
            <span style={{ padding: '2px 9px', borderRadius: 100, fontSize: 10, fontWeight: 700,
              background: `rgba(${mod.rgb},0.10)`, color: mod.color, border: `1px solid rgba(${mod.rgb},0.27)` }}>{mod.label}</span>
            <span style={{ padding: '2px 9px', borderRadius: 100, fontSize: 10, fontWeight: 700,
              background: `rgba(${status.rgb},0.10)`, color: status.color, border: `1px solid rgba(${status.rgb},0.27)` }}>{status.label}</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--k-text)', marginBottom: 2 }}>{item.reason}</p>
          {item.description && <p style={{ fontSize: 12, color: 'var(--k-muted)' }}>{item.description}</p>}
          <p style={{ fontSize: 11, color: 'var(--k-muted)', marginTop: 4 }}>{fmtDate(item.created_at)} · order_id #{item.order_id}</p>
        </div>
        <span style={{ fontSize: 11, color: 'var(--k-muted)', flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div onClick={e => e.stopPropagation()} style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {item.photo_path && (
            <img src={storageUrl(item.photo_path)} alt="Bukti laporan"
              style={{ maxWidth: 240, borderRadius: 12, border: '1px solid var(--k-border)' }} />
          )}

          {item.resolution_note && (
            <div style={{ background: 'var(--k-card2)', border: '1px solid var(--k-border)', borderRadius: 12, padding: '10px 14px' }}>
              <p style={{ fontSize: 10, color: 'var(--k-muted)', marginBottom: 4 }}>Catatan Penyelesaian</p>
              <p style={{ fontSize: 12, color: 'var(--k-text)' }}>{item.resolution_note}</p>
              {item.refund_amount > 0 && (
                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--k-accent)', marginTop: 6 }}>Refund: {fmtRp(item.refund_amount)}</p>
              )}
            </div>
          )}

          {(item.status === 'pending' || item.status === 'reviewing') && (
            <>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setResolve(s => !s); setReject(false) }}
                  style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    border: 'none', background: 'var(--k-accent)', color: '#0C0C16' }}>
                  ✓ Selesaikan
                </button>
                <button onClick={() => { setReject(s => !s); setResolve(false) }}
                  style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    background: 'transparent', border: '1px solid var(--k-danger)', color: 'var(--k-danger)' }}>
                  ✕ Tolak
                </button>
              </div>

              {showResolve && (
                <div style={{ background: 'rgba(46,125,91,0.06)', border: '1px solid rgba(46,125,91,0.25)', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input className="input-field" placeholder="Nominal refund (opsional, kosongkan jika tidak ada refund)"
                    type="number" value={refund} onChange={e => setRefund(e.target.value)}
                    style={{ padding: '9px 14px', fontSize: 13 }} />
                  <input className="input-field" placeholder="Catatan penyelesaian (wajib)"
                    value={note} onChange={e => setNote(e.target.value)}
                    style={{ padding: '9px 14px', fontSize: 13 }} />
                  <button disabled={!note || isBusy}
                    onClick={() => onResolve(item.id, note, refund ? Number(refund) : null)}
                    style={{ padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      border: 'none', background: 'var(--k-accent)', color: '#0C0C16', opacity: (!note || isBusy) ? 0.5 : 1, alignSelf: 'flex-start' }}>
                    {isBusy ? 'Memproses...' : 'Kirim Penyelesaian'}
                  </button>
                </div>
              )}

              {showReject && (
                <div style={{ background: 'rgba(192,67,92,0.06)', border: '1px solid rgba(192,67,92,0.25)', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 8 }}>
                  <input className="input-field" placeholder="Alasan penolakan (wajib)"
                    value={note} onChange={e => setNote(e.target.value)}
                    style={{ flex: 1, padding: '9px 14px', fontSize: 13 }} />
                  <button disabled={!note || isBusy} onClick={() => onReject(item.id, note)}
                    style={{ padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      border: 'none', background: 'var(--k-danger)', color: '#fff', opacity: (!note || isBusy) ? 0.5 : 1, flexShrink: 0 }}>
                    Kirim
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminComplaintsPage() {
  const [status,  setStatus]  = useState('pending')
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy,    setBusy]    = useState(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    api.get(`/admin/complaints?status=${status}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [status])

  useEffect(() => { fetchData() }, [fetchData])

  const handleResolve = async (id, resolution_note, refund_amount) => {
    setBusy(id)
    try {
      await api.post(`/admin/complaints/${id}/resolve`, { resolution_note, refund_amount })
      fetchData()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyelesaikan komplain.')
    } finally { setBusy(null) }
  }

  const handleReject = async (id, resolution_note) => {
    setBusy(id)
    try {
      await api.post(`/admin/complaints/${id}/reject`, { resolution_note })
      fetchData()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menolak komplain.')
    } finally { setBusy(null) }
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <p style={{ color: 'var(--k-muted)', fontSize: 14 }}>
          Laporan masalah pelanggan pada pesanan yang sudah selesai — tinjau dan selesaikan (refund opsional)
        </p>
        <button onClick={fetchData} style={{ padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
          background: 'var(--k-card)', border: '1px solid var(--k-border)', color: 'var(--k-sub)', cursor: 'pointer' }}>
          ↻ Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUS_TABS.map(t => {
          const active = status === t.key
          return (
            <button key={t.key} onClick={() => setStatus(t.key)}
              style={{ padding: '7px 18px', borderRadius: 100, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                border: active ? '1px solid var(--k-accent)' : '1px solid var(--k-border)',
                background: active ? 'rgba(46,125,91,0.1)' : 'transparent',
                color: active ? 'var(--k-accent)' : 'var(--k-sub)' }}>
              {t.label}
            </button>
          )
        })}
      </div>

      <div style={{ background: 'var(--k-card)', border: '1px solid var(--k-border)', borderRadius: 20, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--k-muted)' }}>Memuat data...</div>
        ) : !data?.data?.length ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--k-muted)' }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>📭</span>
            Tidak ada laporan.
          </div>
        ) : (
          data.data.map(item => (
            <ComplaintCard key={item.id} item={item} onResolve={handleResolve} onReject={handleReject} busy={busy} />
          ))
        )}
      </div>
    </AdminLayout>
  )
}
