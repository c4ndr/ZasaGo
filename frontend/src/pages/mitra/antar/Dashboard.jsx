import { useEffect, useState } from 'react'
import { Package, MapPin, Navigation2 } from 'lucide-react'
import api from '../../../api/axios'
import useAuthStore from '../../../stores/authStore'
import StatusBadge from '../../../components/StatusBadge'
import LoadingSpinner from '../../../components/LoadingSpinner'
import { formatRupiah } from '../../../utils/hargaUtils'

export default function MitraAntarDashboard() {
  const { user }  = useAuthStore()
  const [orders, setOrders]     = useState([])
  const [available, setAvailable] = useState(false)
  const [toggling, setToggling]   = useState(false)
  const [tab, setTab]   = useState('tersedia')
  const [loading, setLoading] = useState(true)
  const [availableOrders, setAvailableOrders] = useState([])

  useEffect(() => {
    Promise.all([api.get('/antar/pesanan'), api.get('/profil'), api.get('/antar/tersedia')])
      .then(([pesanan, profil, tersedia]) => {
        setOrders(pesanan.data.data || pesanan.data)
        setAvailable(profil.data.mitra_profile?.is_available ?? false)
        setAvailableOrders(tersedia.data.data || tersedia.data)
      }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const toggleOnline = async () => {
    setToggling(true)
    try { const { data } = await api.patch('/mitra/toggle-online'); setAvailable(data.is_available) }
    catch (_) {} finally { setToggling(false) }
  }

  const terima = async (id) => {
    try {
      await api.post(`/antar/pesanan/${id}/terima`)
      setAvailableOrders((prev) => prev.filter((o) => o.id !== id))
    } catch (e) { alert(e.response?.data?.message || 'Gagal') }
  }

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/antar/pesanan/${id}/status`, { status })
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o))
    } catch (e) { alert(e.response?.data?.message || 'Gagal') }
  }

  const selesai = orders.filter((o) => o.status === 'selesai')
  const pendapatan = selesai.reduce((s, o) => s + parseFloat(o.penghasilan_mitra ?? 0), 0)

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-amber-500 to-amber-700 rounded-2xl p-4 text-white">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-amber-200 text-xs">Mitra Antar Barang</p>
            <p className="font-bold text-lg">{user?.name}</p>
          </div>
          <button onClick={toggleOnline} disabled={toggling}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${available ? 'bg-emerald-500' : 'bg-white/20'}`}>
            <Package className="w-3.5 h-3.5" />
            {available ? 'Online' : 'Offline'}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[{ label: 'Total', value: orders.length }, { label: 'Selesai', value: selesai.length }, { label: 'Pendapatan', value: formatRupiah(pendapatan) }].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-xl p-2 text-center">
              <p className="text-sm font-bold">{s.value}</p>
              <p className="text-[10px] text-amber-200">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {[{ key: 'tersedia', label: 'Tersedia' }, { key: 'saya', label: 'Pesanan Saya' }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === t.key ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'tersedia' && (
        <div className="space-y-3">
          {availableOrders.length === 0 ? (
            <div className="text-center py-10 text-gray-400"><p className="text-3xl mb-2">📦</p><p className="text-sm">Tidak ada pesanan tersedia</p></div>
          ) : availableOrders.map((o) => (
            <div key={o.id} className="card space-y-2">
              <div className="flex gap-2">
                <Navigation2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600 line-clamp-1">{o.pickup_address}</p>
              </div>
              <div className="flex gap-2">
                <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600 line-clamp-1">{o.destination_address}</p>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                <div className="text-xs text-gray-500 space-x-2">
                  <span>{parseFloat(o.distance_km).toFixed(1)} km</span>
                  <span className="font-semibold text-amber-600">{formatRupiah(o.total_price)}</span>
                </div>
                <button onClick={() => terima(o.id)} className="btn-primary text-xs py-1.5 px-4">Terima</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'saya' && (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="card space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-amber-600">{o.order_code}</p>
                <StatusBadge status={o.status} />
              </div>
              <p className="text-xs text-gray-500">{o.pelanggan?.name}</p>
              <div className="text-xs text-gray-600 space-y-0.5">
                <p><span className="text-gray-400">Dari:</span> {o.pickup_address}</p>
                <p><span className="text-gray-400">Ke:</span> {o.destination_address}</p>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                <span className="text-sm font-bold text-amber-600">{formatRupiah(o.penghasilan_mitra ?? o.total_price)}</span>
                {o.status === 'driver_ditemukan' && <button onClick={() => updateStatus(o.id, 'menuju_pickup')} className="btn-primary text-xs py-1.5 px-3">Menuju Pickup</button>}
                {o.status === 'menuju_pickup' && <button onClick={() => updateStatus(o.id, 'barang_dijemput')} className="btn-primary text-xs py-1.5 px-3">Barang Dijemput</button>}
                {o.status === 'barang_dijemput' && <button onClick={() => updateStatus(o.id, 'dalam_perjalanan')} className="btn-primary text-xs py-1.5 px-3">Mulai Antar</button>}
                {o.status === 'dalam_perjalanan' && <button onClick={() => updateStatus(o.id, 'selesai')} className="bg-emerald-600 text-white text-xs py-1.5 px-3 rounded-xl">Selesai</button>}
              </div>
            </div>
          ))}
          {orders.length === 0 && <div className="text-center py-10 text-gray-400"><p className="text-3xl mb-2">📋</p><p className="text-sm">Belum ada pesanan</p></div>}
        </div>
      )}
    </div>
  )
}
