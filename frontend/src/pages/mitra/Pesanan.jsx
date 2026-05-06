import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, MapPin, Clock, ChevronRight, Package2, Navigation2, Banknote, CreditCard, RefreshCw } from 'lucide-react'
import api from '../../api/axios'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
import { formatRupiah } from '../../utils/hargaUtils'

const TABS = [
  { key: 'ojek',   label: 'Ojek' },
  { key: 'jastip', label: 'Jastip' },
  { key: 'urut',   label: 'Urut' },
]

const ojekActions = {
  driver_ditemukan:   { label: 'Menuju Pickup',       next: 'menuju_pickup' },
  menuju_pickup:      { label: 'Sudah Sampai Pickup', next: 'pelanggan_dijemput' },
  pelanggan_dijemput: { label: 'Mulai Perjalanan',    next: 'dalam_perjalanan' },
  dalam_perjalanan:   { label: 'Selesai',             next: 'selesai' },
}

const urutActions = {
  diterima:           { label: 'Menuju Lokasi', next: 'menuju_lokasi' },
  menuju_lokasi:      { label: 'Mulai Urut',    next: 'sedang_berlangsung' },
  sedang_berlangsung: { label: 'Selesai',       next: 'selesai' },
}

const jastipActions = {
  diterima: { label: 'Sudah Dijemput', next: 'dijemput' },
  dijemput: { label: 'Sedang Diantar', next: 'diantar' },
  diantar:  { label: 'Selesai',        next: 'selesai' },
}

const ALASAN_TOLAK = [
  { value: 'tidak_tersedia',  label: 'Barang tidak tersedia' },
  { value: 'habis',           label: 'Barang habis' },
  { value: 'toko_tutup',      label: 'Toko/warung tutup' },
  { value: 'diluar_rute',     label: 'Di luar rute saya' },
  { value: 'berat_melebihi',  label: 'Berat melebihi kapasitas' },
  { value: 'lainnya',         label: 'Alasan lain' },
]

const PAYMENT_LABEL = {
  tunai: 'Tunai',
  dompet_digital: 'E-Wallet',
  transfer: 'Transfer',
}

// ── Modal tolak dengan pilihan alasan ────────────────────────────────────────
function TolakModal({ order, onClose, onTolak }) {
  const [alasan, setAlasan] = useState('')
  const [custom, setCustom] = useState('')
  const [loading, setLoading] = useState(false)

  const finalAlasan = alasan === 'lainnya' ? (custom.trim() || 'Alasan lain') : ALASAN_TOLAK.find(a => a.value === alasan)?.label || alasan

  const handleTolak = async () => {
    if (!alasan) return alert('Pilih alasan penolakan')
    if (alasan === 'lainnya' && !custom.trim()) return alert('Tulis alasan penolakan')
    setLoading(true)
    try {
      await api.post(`/titipan/${order.id}/tolak`, { alasan: finalAlasan })
      onTolak(order.id)
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal menolak titipan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div>
          <h3 className="font-bold text-gray-800">Tolak Titipan</h3>
          <p className="text-xs text-gray-400 mt-0.5">Pilih alasan penolakan — pelanggan akan diberitahu</p>
        </div>
        <div className="space-y-2">
          {ALASAN_TOLAK.map((a) => (
            <button key={a.value} onClick={() => setAlasan(a.value)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm border transition-colors ${
                alasan === a.value
                  ? 'border-red-400 bg-red-50 text-red-700 font-medium'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
              {a.label}
            </button>
          ))}
        </div>
        {alasan === 'lainnya' && (
          <textarea className="input-field text-sm resize-none w-full" rows={2}
            placeholder="Tuliskan alasan..."
            value={custom} onChange={(e) => setCustom(e.target.value)} />
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-outline flex-1 text-sm">Batal</button>
          <button onClick={handleTolak} disabled={loading || !alasan}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors">
            {loading ? 'Memproses...' : 'Tolak Titipan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Kartu titipan masuk (menunggu konfirmasi) ─────────────────────────────────
function JastipPendingCard({ order, onTerima, onTolak, processing }) {
  return (
    <div className="card border-l-4 border-l-fuchsia-500 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-sm text-gray-800">{order.order_code}</p>
          <p className="text-xs text-gray-400">{order.pelanggan?.name}</p>
        </div>
        <span className="text-[10px] px-2 py-1 bg-amber-100 text-amber-700 font-semibold rounded-full">Menunggu</span>
      </div>

      {/* Nama pesanan + harga barang */}
      <div className="bg-fuchsia-50 rounded-xl p-3 space-y-1.5">
        <div className="flex items-start gap-2">
          <Package2 className="w-4 h-4 text-fuchsia-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-700">{order.nama_pesanan}</p>
            {order.jenis_barang && <p className="text-[10px] text-gray-400">{order.jenis_barang}</p>}
          </div>
          {order.harga_barang > 0 && (
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-fuchsia-700">{formatRupiah(order.harga_barang)}</p>
              <p className="text-[9px] text-gray-400">harga barang</p>
            </div>
          )}
        </div>
        {order.berat_kg && (
          <p className="text-[10px] text-gray-500">⚖️ Berat: {order.berat_kg} kg</p>
        )}
      </div>

      {/* Rute */}
      <div className="space-y-1.5 text-xs text-gray-500">
        <div className="flex gap-2 items-start">
          <Navigation2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
          <span className="line-clamp-1">{order.pickup_address}</span>
        </div>
        <div className="border-l-2 border-dashed border-gray-200 ml-[6px] h-3" />
        <div className="flex gap-2 items-start">
          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <span className="line-clamp-1">{order.destination_address}</span>
        </div>
      </div>

      {/* Harga + Pembayaran */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <CreditCard className="w-3.5 h-3.5" />
          <span>{PAYMENT_LABEL[order.payment_method] || order.payment_method}</span>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-fuchsia-700">{formatRupiah(order.total_price)}</p>
          <p className="text-[9px] text-gray-400">ongkir ({order.distance_km} km)</p>
        </div>
      </div>

      {order.catatan && (
        <p className="text-xs text-gray-400 italic">📝 {order.catatan}</p>
      )}

      {/* Tombol terima / tolak */}
      <div className="flex gap-2">
        <button onClick={() => onTolak(order)} disabled={processing === order.id}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors">
          <XCircle className="w-4 h-4" /> Tolak
        </button>
        <button onClick={() => onTerima(order.id)} disabled={processing === order.id}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 transition-colors">
          <CheckCircle className="w-4 h-4" />
          {processing === order.id ? 'Memproses...' : 'Terima'}
        </button>
      </div>
    </div>
  )
}

// ── Kartu titipan aktif / riwayat ─────────────────────────────────────────────
function JastipCard({ order, onUpdateStatus, updating }) {
  const nextAction = jastipActions[order.status]
  const statusColor = {
    diterima:   'text-blue-600',
    dijemput:   'text-amber-600',
    diantar:    'text-indigo-600',
    selesai:    'text-emerald-600',
    dibatalkan: 'text-gray-400',
    ditolak:    'text-red-500',
  }

  return (
    <div className="card space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-sm text-gray-800">{order.order_code}</p>
          <p className="text-xs text-gray-400">{order.pelanggan?.name}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {order.nama_pesanan && (
        <div className="flex items-center gap-2 bg-fuchsia-50 rounded-lg px-2.5 py-1.5">
          <Package2 className="w-3.5 h-3.5 text-fuchsia-500 shrink-0" />
          <p className="text-xs font-medium text-gray-700 truncate">{order.nama_pesanan}</p>
          {order.harga_barang > 0 && (
            <span className="text-[10px] text-fuchsia-600 font-bold shrink-0">{formatRupiah(order.harga_barang)}</span>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500">
        <div className="flex gap-2 items-start">
          <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <span className="line-clamp-1">{order.destination_address}</span>
        </div>
      </div>

      {order.tolak_alasan && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-2.5 py-1.5">
          Alasan: {order.tolak_alasan}
        </p>
      )}

      <div className="flex items-center justify-between pt-1.5 border-t border-gray-50">
        <span className={`text-sm font-bold ${statusColor[order.status] || 'text-gray-600'}`}>
          {formatRupiah(order.total_price)}
        </span>
        {nextAction && (
          <button onClick={() => onUpdateStatus(order.id, nextAction.next)} disabled={updating === order.id}
            className="flex items-center gap-1 bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
            {nextAction.label}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Halaman utama ─────────────────────────────────────────────────────────────
export default function MitraPesanan() {
  const [tab, setTab]             = useState('ojek')
  const [ojekOrders, setOjekOrders]     = useState([])
  const [ojekAvail, setOjekAvail]       = useState([])
  const [urutOrders, setUrutOrders]     = useState([])
  const [jastipPending, setJastipPending] = useState([])
  const [jastipMine, setJastipMine]       = useState([])
  const [loading, setLoading]     = useState(false)
  const [accepting, setAccepting] = useState(null)
  const [updating, setUpdating]   = useState(null)
  const [tolakTarget, setTolakTarget] = useState(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    if (tab === 'ojek') {
      Promise.all([
        api.get('/ojek/pesanan'),
        api.get('/ojek/tersedia'),
      ]).then(([mine, avail]) => {
        setOjekOrders(mine.data.data || mine.data)
        setOjekAvail(avail.data.data || avail.data)
      }).catch(console.error).finally(() => setLoading(false))
    } else if (tab === 'jastip') {
      Promise.all([
        api.get('/titipan/mitra/pending'),
        api.get('/titipan'),
      ]).then(([pending, mine]) => {
        setJastipPending(pending.data.data || [])
        setJastipMine((mine.data.data || mine.data).filter(o => o.status !== 'menunggu'))
      }).catch(console.error).finally(() => setLoading(false))
    } else {
      api.get('/urut/pesanan')
        .then((r) => setUrutOrders(r.data.data || r.data))
        .catch(console.error).finally(() => setLoading(false))
    }
  }, [tab])

  useEffect(() => { fetchData() }, [fetchData])

  const acceptOjek = async (id) => {
    setAccepting(id)
    try { await api.post(`/ojek/pesanan/${id}/terima`); fetchData() }
    catch (e) { alert(e.response?.data?.message || 'Gagal menerima pesanan') }
    finally { setAccepting(null) }
  }

  const updateOjekStatus = async (id, status) => {
    setUpdating(id)
    try {
      await api.patch(`/ojek/pesanan/${id}/status`, { status })
      setOjekOrders((p) => p.map((o) => o.id === id ? { ...o, status } : o))
    } catch (e) { console.error(e) }
    finally { setUpdating(null) }
  }

  const updateUrutStatus = async (id, status) => {
    setUpdating(id)
    try {
      await api.patch(`/urut/pesanan/${id}/status`, { status })
      setUrutOrders((p) => p.map((o) => o.id === id ? { ...o, status } : o))
    } catch (e) { console.error(e) }
    finally { setUpdating(null) }
  }

  const terimaJastip = async (id) => {
    setAccepting(id)
    try {
      await api.post(`/titipan/${id}/terima`)
      setJastipPending((p) => p.filter((o) => o.id !== id))
      fetchData()
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal menerima titipan')
    } finally { setAccepting(null) }
  }

  const afterTolak = (id) => {
    setTolakTarget(null)
    setJastipPending((p) => p.filter((o) => o.id !== id))
  }

  const updateJastipStatus = async (id, status) => {
    setUpdating(id)
    try {
      await api.patch(`/titipan/${id}/status`, { status })
      setJastipMine((p) => p.map((o) => o.id === id ? { ...o, status } : o))
    } catch (e) { console.error(e) }
    finally { setUpdating(null) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title mb-0">Pesanan Masuk</h1>
        <button onClick={fetchData} className="p-2 text-gray-400 hover:text-gray-600">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors relative ${
              tab === t.key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'
            }`}>
            {t.label}
            {t.key === 'jastip' && jastipPending.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-fuchsia-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {jastipPending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* ── TAB OJEK ── */}
          {tab === 'ojek' && (
            <>
              {ojekAvail.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-2">Tersedia ({ojekAvail.length})</p>
                  <div className="space-y-2">
                    {ojekAvail.map((order) => (
                      <div key={order.id} className="card border-l-4 border-l-primary-600">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-sm text-gray-800">{order.order_code}</p>
                            <p className="text-xs text-gray-400">{order.pelanggan?.name}</p>
                          </div>
                          <p className="font-bold text-primary-600">{formatRupiah(Number(order.price))}</p>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1 mb-3">
                          <div className="flex gap-2"><MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" /><span>{order.pickup_address}</span></div>
                          <div className="flex gap-2"><MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" /><span>{order.destination_address}</span></div>
                        </div>
                        <button onClick={() => acceptOjek(order.id)} disabled={accepting === order.id}
                          className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          {accepting === order.id ? 'Memproses...' : 'Terima Pesanan'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Riwayat Pesanan</p>
              {ojekOrders.length === 0 ? (
                <div className="text-center py-10 text-gray-400"><p className="text-3xl mb-2">📋</p><p className="text-sm">Belum ada pesanan</p></div>
              ) : (
                <div className="space-y-2">
                  {ojekOrders.map((order) => {
                    const nextAction = ojekActions[order.status]
                    return (
                      <div key={order.id} className="card">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold text-sm text-gray-800">{order.order_code}</p>
                          <StatusBadge status={order.status} />
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{order.pelanggan?.name} · {order.distance_km} km</p>
                        <div className="text-xs text-gray-500 space-y-1 mb-2">
                          <div className="flex gap-2"><MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" /><span>{order.pickup_address}</span></div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                          <span className="font-semibold text-primary-600 text-sm">{formatRupiah(Number(order.price))}</span>
                          {nextAction && (
                            <button onClick={() => updateOjekStatus(order.id, nextAction.next)} disabled={updating === order.id}
                              className="flex items-center gap-1 bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                              {nextAction.label}<ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* ── TAB JASTIP ── */}
          {tab === 'jastip' && (
            <>
              {jastipPending.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-fuchsia-600 uppercase tracking-wide mb-2">
                    Menunggu Konfirmasi ({jastipPending.length})
                  </p>
                  <div className="space-y-3">
                    {jastipPending.map((order) => (
                      <JastipPendingCard key={order.id} order={order}
                        onTerima={terimaJastip}
                        onTolak={setTolakTarget}
                        processing={accepting} />
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pesanan Aktif & Riwayat</p>
              {jastipMine.length === 0 && jastipPending.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-3xl mb-2">🤝</p>
                  <p className="text-sm">Belum ada titipan</p>
                  <p className="text-xs mt-1">Buka sesi Jastip di Beranda untuk menerima titipan</p>
                </div>
              ) : jastipMine.length === 0 ? null : (
                <div className="space-y-2">
                  {jastipMine.map((order) => (
                    <JastipCard key={order.id} order={order}
                      onUpdateStatus={updateJastipStatus}
                      updating={updating} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── TAB URUT ── */}
          {tab === 'urut' && (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pesanan Urut/Pijat</p>
              {urutOrders.length === 0 ? (
                <div className="text-center py-10 text-gray-400"><p className="text-3xl mb-2">💆</p><p className="text-sm">Belum ada pesanan urut</p></div>
              ) : (
                <div className="space-y-2">
                  {urutOrders.map((order) => {
                    const nextAction = urutActions[order.status]
                    return (
                      <div key={order.id} className="card">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold text-sm text-gray-800">{order.order_code}</p>
                          <StatusBadge status={order.status} />
                        </div>
                        <p className="text-xs text-gray-400 mb-2">
                          {order.pelanggan?.name} · {order.service?.name}
                        </p>
                        {order.scheduled_at && (
                          <div className="flex gap-1.5 text-xs text-gray-400 mb-2">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(order.scheduled_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                          <span className="font-semibold text-primary-600 text-sm">{formatRupiah(Number(order.price))}</span>
                          {nextAction && (
                            <button onClick={() => updateUrutStatus(order.id, nextAction.next)} disabled={updating === order.id}
                              className="flex items-center gap-1 bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                              {nextAction.label}<ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modal tolak */}
      {tolakTarget && (
        <TolakModal
          order={tolakTarget}
          onClose={() => setTolakTarget(null)}
          onTolak={afterTolak}
        />
      )}
    </div>
  )
}
