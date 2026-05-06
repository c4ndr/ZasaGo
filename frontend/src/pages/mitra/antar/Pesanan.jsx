import { useEffect, useState } from 'react'
import api from '../../../api/axios'
import StatusBadge from '../../../components/StatusBadge'
import LoadingSpinner from '../../../components/LoadingSpinner'
import { formatRupiah } from '../../../utils/hargaUtils'

const STATUS_NEXT = {
  diterima:   { label: 'Pickup Barang',  next: 'menuju_pickup' },
  menuju_pickup: { label: 'Dalam Perjalanan', next: 'dalam_pengiriman' },
  dalam_pengiriman: { label: 'Selesai', next: 'selesai' },
}

const TABS = [
  { key: 'menunggu',   label: 'Menunggu',   statuses: ['menunggu'] },
  { key: 'pickup',     label: 'Pickup',     statuses: ['diterima','menuju_pickup'] },
  { key: 'perjalanan', label: 'Perjalanan', statuses: ['dalam_pengiriman'] },
  { key: 'selesai',    label: 'Selesai',    statuses: ['selesai','dibatalkan'] },
]

export default function MitraAntarPesanan() {
  const [orders, setOrders]          = useState([])
  const [tersedia, setTersedia]      = useState([])
  const [tab, setTab]                = useState('menunggu')
  const [loading, setLoading]        = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/antar/pesanan'),
      api.get('/antar/tersedia').catch(() => ({ data: [] })),
    ]).then(([myOrders, avail]) => {
      setOrders(myOrders.data.data || myOrders.data)
      setTersedia(avail.data.data || avail.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const terima = async (id) => {
    try {
      await api.post(`/antar/pesanan/${id}/terima`)
      setTersedia((prev) => prev.filter((o) => o.id !== id))
      const { data } = await api.get('/antar/pesanan')
      setOrders(data.data || data)
    } catch (e) { alert(e.response?.data?.message || 'Gagal terima pesanan') }
  }

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/antar/pesanan/${id}/status`, { status })
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o))
    } catch (e) { alert(e.response?.data?.message || 'Gagal update status') }
  }

  const currentTab = TABS.find((t) => t.key === tab)
  const filtered   = orders.filter((o) => currentTab?.statuses.includes(o.status))

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-800">Pesanan Antar Barang</h1>

      {tab === 'menunggu' && tersedia.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pesanan Tersedia</p>
          {tersedia.map((o) => (
            <div key={o.id} className="card space-y-2 border-l-4 border-indigo-400">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-indigo-600">{o.order_code}</p>
                <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">Baru</span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <p><span className="font-medium">Dari:</span> {o.pickup_address}</p>
                <p><span className="font-medium">Ke:</span> {o.destination_address}</p>
                {o.distance_km && <p><span className="font-medium">Jarak:</span> {o.distance_km} km</p>}
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm font-bold text-emerald-600">{formatRupiah(o.driver_earnings ?? 0)}</p>
                <button onClick={() => terima(o.id)} className="btn-primary text-xs py-1.5 px-4">Ambil Pesanan</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${tab === t.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((o) => (
          <div key={o.id} className="card space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-indigo-600">{o.order_code}</p>
              <StatusBadge status={o.status} />
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p><span className="font-medium">Dari:</span> {o.pickup_address}</p>
              <p><span className="font-medium">Ke:</span> {o.destination_address}</p>
              {o.distance_km && <p><span className="font-medium">Jarak:</span> {o.distance_km} km</p>}
              {o.jenis_barang && <p><span className="font-medium">Barang:</span> {o.jenis_barang}</p>}
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Penghasilan</p>
                <p className="text-sm font-bold text-emerald-600">{formatRupiah(o.driver_earnings ?? o.penghasilan_mitra ?? 0)}</p>
              </div>
              {STATUS_NEXT[o.status] && (
                <button onClick={() => updateStatus(o.id, STATUS_NEXT[o.status].next)} className="btn-primary text-xs py-1.5 px-3">
                  {STATUS_NEXT[o.status].label}
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📦</p>
            <p className="text-sm">Tidak ada pesanan di tab ini</p>
          </div>
        )}
      </div>
    </div>
  )
}
