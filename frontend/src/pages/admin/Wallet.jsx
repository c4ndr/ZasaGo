import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, ImageIcon, X, Wallet, Clock, ChevronDown } from 'lucide-react'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'

const STATUS_TABS = [
  { key: '',          label: 'Semua' },
  { key: 'pending',   label: 'Menunggu' },
  { key: 'disetujui', label: 'Disetujui' },
  { key: 'ditolak',   label: 'Ditolak' },
]

const STATUS_BADGE = {
  pending:   'bg-amber-100 text-amber-700',
  disetujui: 'bg-emerald-100 text-emerald-700',
  ditolak:   'bg-red-100 text-red-700',
}

const fmt = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`

function BuktiModal({ url, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute -top-10 right-0 text-white flex items-center gap-1.5 text-sm">
          <X className="w-4 h-4" /> Tutup
        </button>
        <img src={url} alt="Bukti transfer" className="w-full rounded-2xl shadow-xl" />
      </div>
    </div>
  )
}

function TolakModal({ topup, onClose, onDone }) {
  const [note, setNote]       = useState('')
  const [loading, setLoading] = useState(false)

  const handleTolak = async () => {
    if (!note.trim()) return alert('Isi alasan penolakan')
    setLoading(true)
    try {
      await api.post(`/admin/wallet/topup/${topup.id}/tolak`, { admin_note: note })
      onDone()
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal menolak')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4">
        <div>
          <h3 className="font-bold text-gray-800">Tolak Permintaan</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Topup {fmt(topup.amount)} dari <strong>{topup.mitra?.name}</strong>
          </p>
        </div>
        <textarea className="input-field resize-none w-full" rows={3}
          placeholder="Alasan penolakan (wajib)..."
          value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-outline flex-1 text-sm">Batal</button>
          <button onClick={handleTolak} disabled={loading || !note.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors">
            {loading ? 'Memproses...' : 'Tolak'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminWallet() {
  const [statusTab, setStatusTab]   = useState('pending')
  const [requests, setRequests]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [processing, setProcessing] = useState(null)
  const [buktiUrl, setBuktiUrl]     = useState(null)
  const [tolakTarget, setTolakTarget] = useState(null)
  const [page, setPage]             = useState(1)
  const [lastPage, setLastPage]     = useState(1)

  const fetchRequests = (p = 1) => {
    setLoading(true)
    const params = { page: p }
    if (statusTab) params.status = statusTab
    api.get('/admin/wallet/topup', { params })
      .then((r) => {
        setRequests(r.data.data)
        setPage(r.data.current_page)
        setLastPage(r.data.last_page)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRequests(1) }, [statusTab])

  const handleSetujui = async (topup) => {
    if (!window.confirm(`Setujui topup ${fmt(topup.amount)} untuk ${topup.mitra?.name}?`)) return
    setProcessing(topup.id)
    try {
      await api.post(`/admin/wallet/topup/${topup.id}/setujui`)
      fetchRequests(page)
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal menyetujui')
    } finally { setProcessing(null) }
  }

  const storageBase = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'
  const buktiSrc = (path) => `${storageBase}/storage/${path}`

  const pendingCount = statusTab === '' ? requests.filter(r => r.status === 'pending').length : (statusTab === 'pending' ? requests.length : 0)

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-5 h-5 text-primary-600" />
        <h1 className="page-title mb-0">Isi Saldo Mitra</h1>
        {pendingCount > 0 && (
          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {pendingCount} menunggu
          </span>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4">
        {STATUS_TABS.map((t) => (
          <button key={t.key} onClick={() => setStatusTab(t.key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusTab === t.key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : requests.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Tidak ada permintaan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="card">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{req.mitra?.name}</p>
                  <p className="text-xs text-gray-400">{req.mitra?.phone}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(req.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${STATUS_BADGE[req.status]}`}>
                  {req.status === 'pending' ? 'Menunggu' : req.status === 'disetujui' ? 'Disetujui' : 'Ditolak'}
                </span>
              </div>

              {/* Jumlah */}
              <div className="bg-primary-50 rounded-xl px-3 py-2.5 mb-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">Jumlah topup</span>
                <span className="text-lg font-black text-primary-700">{fmt(req.amount)}</span>
              </div>

              {/* Bukti transfer */}
              {req.bukti_transfer ? (
                <button onClick={() => setBuktiUrl(buktiSrc(req.bukti_transfer))}
                  className="flex items-center gap-2 text-xs text-primary-600 font-medium bg-primary-50 border border-primary-100 px-3 py-2 rounded-xl mb-3 w-full hover:bg-primary-100 transition-colors">
                  <ImageIcon className="w-4 h-4" />
                  Lihat Bukti Transfer
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-xl mb-3">
                  <ImageIcon className="w-4 h-4" />
                  Tidak ada bukti transfer
                </div>
              )}

              {/* Admin note */}
              {req.admin_note && (
                <div className={`text-xs px-3 py-2 rounded-xl mb-3 ${
                  req.status === 'ditolak' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'
                }`}>
                  📝 {req.admin_note}
                </div>
              )}

              {/* Actions */}
              {req.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => setTolakTarget(req)} disabled={processing === req.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors">
                    <XCircle className="w-4 h-4" /> Tolak
                  </button>
                  <button onClick={() => handleSetujui(req)} disabled={processing === req.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                    <CheckCircle className="w-4 h-4" />
                    {processing === req.id ? 'Memproses...' : 'Setujui'}
                  </button>
                </div>
              )}

              {req.status !== 'pending' && req.reviewed_at && (
                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Direview: {new Date(req.reviewed_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              )}
            </div>
          ))}

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex gap-2 justify-center pt-2">
              {Array.from({ length: lastPage }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => fetchRequests(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold ${
                    p === page ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {buktiUrl && <BuktiModal url={buktiUrl} onClose={() => setBuktiUrl(null)} />}
      {tolakTarget && (
        <TolakModal
          topup={tolakTarget}
          onClose={() => setTolakTarget(null)}
          onDone={() => { setTolakTarget(null); fetchRequests(page) }}
        />
      )}
    </div>
  )
}
