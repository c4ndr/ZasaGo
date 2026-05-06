import { useEffect, useState } from 'react'
import api from '../../../api/axios'
import StatusBadge from '../../../components/StatusBadge'
import LoadingSpinner from '../../../components/LoadingSpinner'
import { formatRupiah } from '../../../utils/hargaUtils'

const STATUS_NEXT = {
  menunggu:            { label: 'Terima Pesanan', next: 'diterima', color: 'btn-primary' },
  diterima:            { label: 'Menuju Lokasi',  next: 'menuju_lokasi', color: 'btn-primary' },
  menuju_lokasi:       { label: 'Mulai Urut',     next: 'sedang_berlangsung', color: 'btn-primary' },
  sedang_berlangsung:  { label: 'Selesai',        next: 'selesai', color: 'bg-emerald-500 text-white rounded-xl py-2 px-4 text-sm font-semibold' },
}

const TABS = [
  { key: 'menunggu',  label: 'Menunggu' },
  { key: 'aktif',     label: 'Aktif' },
  { key: 'selesai',   label: 'Selesai' },
]

export default function MitraUrutPesanan() {
  const [orders, setOrders] = useState([])
  const [tab, setTab]       = useState('menunggu')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/urut/pesanan').then((r) => setOrders(r.data.data || r.data))
      .catch(console.error).finally(() => setLoading(false))
  }, [])

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/urut/pesanan/${id}/status`, { status })
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o))
    } catch (e) { alert(e.response?.data?.message || 'Gagal update status') }
  }

  const tolak = async (id) => {
    if (!confirm('Tolak pesanan ini?')) return
    try {
      await api.patch(`/urut/pesanan/${id}/status`, { status: 'dibatalkan' })
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: 'dibatalkan' } : o))
    } catch (e) { alert(e.response?.data?.message || 'Gagal') }
  }

  const filtered = orders.filter((o) => {
    if (tab === 'menunggu') return o.status === 'menunggu'
    if (tab === 'aktif')    return ['diterima','menuju_lokasi','sedang_berlangsung'].includes(o.status)
    return ['selesai','dibatalkan'].includes(o.status)
  })

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-800">Pesanan Urut</h1>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === t.key ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500'}`}>
            {t.label}
            {t.key !== 'selesai' && (
              <span className="ml-1 bg-pink-100 text-pink-600 rounded-full px-1.5 text-[10px]">
                {orders.filter((o) => t.key === 'menunggu' ? o.status === 'menunggu' : ['diterima','menuju_lokasi','sedang_berlangsung'].includes(o.status)).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((o) => (
          <div key={o.id} className="card space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-pink-600">{o.order_code}</p>
              <StatusBadge status={o.status} />
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p><span className="font-medium">Pelanggan:</span> {o.pelanggan?.name}</p>
              {o.jenis_urut && <p><span className="font-medium">Jenis:</span> {o.jenis_urut}</p>}
              {o.address && <p><span className="font-medium">Alamat:</span> {o.address}</p>}
              {o.scheduled_at && <p><span className="font-medium">Jadwal:</span> {new Date(o.scheduled_at).toLocaleString('id-ID')}</p>}
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Penghasilan</p>
                <p className="text-sm font-bold text-emerald-600">{formatRupiah(o.penghasilan_mitra ?? o.price ?? 0)}</p>
              </div>
              {STATUS_NEXT[o.status] && (
                <div className="flex gap-2">
                  {o.status === 'menunggu' && (
                    <button onClick={() => tolak(o.id)} className="text-xs px-3 py-1.5 border border-red-300 text-red-500 rounded-xl">Tolak</button>
                  )}
                  <button onClick={() => updateStatus(o.id, STATUS_NEXT[o.status].next)}
                    className={`text-xs px-3 py-1.5 ${STATUS_NEXT[o.status].color ?? 'btn-primary'}`}>
                    {STATUS_NEXT[o.status].label}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">💆</p>
            <p className="text-sm">Tidak ada pesanan di tab ini</p>
          </div>
        )}
      </div>
    </div>
  )
}
