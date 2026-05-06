import { useEffect, useState } from 'react'
import { HandHeart } from 'lucide-react'
import api from '../../../api/axios'
import useAuthStore from '../../../stores/authStore'
import StatusBadge from '../../../components/StatusBadge'
import LoadingSpinner from '../../../components/LoadingSpinner'
import { formatRupiah } from '../../../utils/hargaUtils'

const STATUS_NEXT = {
  menunggu:   { label: 'Terima', next: 'diterima' },
  diterima:   { label: 'Menuju Lokasi', next: 'menuju_lokasi' },
  menuju_lokasi: { label: 'Mulai Urut', next: 'sedang_berlangsung' },
  sedang_berlangsung: { label: 'Selesai', next: 'selesai' },
}

export default function MitraUrutDashboard() {
  const { user }  = useAuthStore()
  const [orders, setOrders]   = useState([])
  const [available, setAvailable] = useState(false)
  const [toggling, setToggling]   = useState(false)
  const [tab, setTab]   = useState('aktif')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/urut/pesanan'), api.get('/profil')])
      .then(([pesanan, profil]) => {
        setOrders(pesanan.data.data || pesanan.data)
        setAvailable(profil.data.mitra_profile?.is_available ?? false)
      }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const toggleOnline = async () => {
    setToggling(true)
    try { const { data } = await api.patch('/mitra/toggle-online'); setAvailable(data.is_available) }
    catch (_) {} finally { setToggling(false) }
  }

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/urut/pesanan/${id}/status`, { status })
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o))
    } catch (e) { alert(e.response?.data?.message || 'Gagal') }
  }

  const aktif   = orders.filter((o) => !['selesai','dibatalkan'].includes(o.status))
  const selesai = orders.filter((o) => o.status === 'selesai')
  const pendapatan = selesai.reduce((s, o) => s + parseFloat(o.penghasilan_mitra ?? o.price ?? 0), 0)

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-pink-500 to-pink-700 rounded-2xl p-4 text-white">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-pink-200 text-xs">Mitra Urut</p>
            <p className="font-bold text-lg">{user?.name}</p>
          </div>
          <button onClick={toggleOnline} disabled={toggling}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${available ? 'bg-emerald-500' : 'bg-white/20'}`}>
            <HandHeart className="w-3.5 h-3.5" />
            {available ? 'Online' : 'Offline'}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[{ label: 'Total', value: orders.length }, { label: 'Selesai', value: selesai.length }, { label: 'Pendapatan', value: formatRupiah(pendapatan) }].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-xl p-2 text-center">
              <p className="text-sm font-bold">{s.value}</p>
              <p className="text-[10px] text-pink-200">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {[{ key: 'aktif', label: 'Aktif' }, { key: 'selesai', label: 'Selesai' }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === t.key ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {(tab === 'aktif' ? aktif : selesai).map((o) => (
          <div key={o.id} className="card space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-pink-600">{o.order_code}</p>
              <StatusBadge status={o.status} />
            </div>
            <p className="text-xs text-gray-600">{o.pelanggan?.name}</p>
            {o.address && <p className="text-xs text-gray-400 line-clamp-1">{o.address}</p>}
            {o.scheduled_at && <p className="text-xs text-gray-400">Jadwal: {new Date(o.scheduled_at).toLocaleString('id-ID')}</p>}
            {STATUS_NEXT[o.status] && (
              <button onClick={() => updateStatus(o.id, STATUS_NEXT[o.status].next)} className="btn-primary text-xs py-1.5 w-full">
                {STATUS_NEXT[o.status].label}
              </button>
            )}
          </div>
        ))}
        {(tab === 'aktif' ? aktif : selesai).length === 0 && (
          <div className="text-center py-10 text-gray-400"><p className="text-3xl mb-2">💆</p><p className="text-sm">Tidak ada pesanan</p></div>
        )}
      </div>
    </div>
  )
}
