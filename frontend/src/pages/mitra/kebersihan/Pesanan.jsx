import { useEffect, useState } from 'react'
import api from '../../../api/axios'
import StatusBadge from '../../../components/StatusBadge'
import LoadingSpinner from '../../../components/LoadingSpinner'
import { formatRupiah } from '../../../utils/hargaUtils'

const STATUS_NEXT = {
  menunggu:            { label: 'Terima',       next: 'diterima' },
  diterima:            { label: 'Menuju Lokasi', next: 'menuju_lokasi' },
  menuju_lokasi:       { label: 'Mulai Bersih',  next: 'sedang_berlangsung' },
  sedang_berlangsung:  { label: 'Selesai',       next: 'selesai' },
}

const TABS = [
  { key: 'menunggu', label: 'Menunggu', statuses: ['menunggu'] },
  { key: 'aktif',    label: 'Aktif',    statuses: ['diterima','menuju_lokasi','sedang_berlangsung'] },
  { key: 'selesai',  label: 'Selesai',  statuses: ['selesai','dibatalkan'] },
]

export default function MitraKebersihanPesanan() {
  const [orders, setOrders]   = useState([])
  const [tab, setTab]         = useState('menunggu')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/kebersihan/pesanan').then((r) => setOrders(r.data.data || r.data))
      .catch(console.error).finally(() => setLoading(false))
  }, [])

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/kebersihan/pesanan/${id}/status`, { status })
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o))
    } catch (e) { alert(e.response?.data?.message || 'Gagal') }
  }

  const tolak = async (id) => {
    if (!confirm('Tolak pesanan ini?')) return
    try {
      await api.patch(`/kebersihan/pesanan/${id}/status`, { status: 'dibatalkan' })
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: 'dibatalkan' } : o))
    } catch (e) { alert(e.response?.data?.message || 'Gagal') }
  }

  const currentTab = TABS.find((t) => t.key === tab)
  const filtered   = orders.filter((o) => currentTab?.statuses.includes(o.status))

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-800">Pesanan Kebersihan</h1>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === t.key ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((o) => (
          <div key={o.id} className="card space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-teal-600">{o.order_code}</p>
              <StatusBadge status={o.status} />
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p><span className="font-medium">Pelanggan:</span> {o.pelanggan?.name}</p>
              {o.jenis_layanan && <p><span className="font-medium">Layanan:</span> {o.jenis_layanan}</p>}
              {o.durasi_jam && <p><span className="font-medium">Durasi:</span> {o.durasi_jam} jam</p>}
              {o.service_address && <p><span className="font-medium">Alamat:</span> {o.service_address}</p>}
              {o.schedule_date && <p><span className="font-medium">Jadwal:</span> {new Date(o.schedule_date).toLocaleDateString('id-ID')}</p>}
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Penghasilan</p>
                <p className="text-sm font-bold text-emerald-600">{formatRupiah(o.penghasilan_mitra ?? 0)}</p>
              </div>
              {STATUS_NEXT[o.status] && (
                <div className="flex gap-2">
                  {o.status === 'menunggu' && (
                    <button onClick={() => tolak(o.id)} className="text-xs px-3 py-1.5 border border-red-300 text-red-500 rounded-xl">Tolak</button>
                  )}
                  <button onClick={() => updateStatus(o.id, STATUS_NEXT[o.status].next)} className="btn-primary text-xs py-1.5 px-3">
                    {STATUS_NEXT[o.status].label}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">🧹</p>
            <p className="text-sm">Tidak ada pesanan di tab ini</p>
          </div>
        )}
      </div>
    </div>
  )
}
