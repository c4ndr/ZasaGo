import { useEffect, useState, useCallback } from 'react'
import { ChefHat } from 'lucide-react'
import api from '../../../api/axios'
import useAuthStore from '../../../stores/authStore'
import StatusBadge from '../../../components/StatusBadge'
import LoadingSpinner from '../../../components/LoadingSpinner'
import { formatRupiah } from '../../../utils/hargaUtils'

const STATUS_NEXT = {
  diterima: { label: 'Mulai Proses', next: 'diproses' },
  diproses: { label: 'Kirim',        next: 'dikirim' },
  dikirim:  { label: 'Selesai',      next: 'selesai' },
}

export default function MitraCateringDashboard() {
  const { user }     = useAuthStore()
  const [orders, setOrders]       = useState([])
  const [tersedia, setTersedia]   = useState([])
  const [available, setAvailable] = useState(false)
  const [toggling, setToggling]   = useState(false)
  const [tab, setTab]             = useState('masuk')
  const [loading, setLoading]     = useState(true)

  const fetchAll = useCallback(() =>
    Promise.all([
      api.get('/catering/pesanan'),
      api.get('/catering/tersedia'),
      api.get('/profil'),
    ]).then(([pesanan, avail, profil]) => {
      setOrders(pesanan.data.data || pesanan.data)
      setTersedia(avail.data.data || avail.data)
      setAvailable(profil.data.mitra_profile?.is_available ?? false)
    }).catch(console.error)
  , [])

  useEffect(() => { fetchAll().finally(() => setLoading(false)) }, [fetchAll])

  const toggleOnline = async () => {
    setToggling(true)
    try { const { data } = await api.patch('/mitra/toggle-online'); setAvailable(data.is_available) }
    catch (_) {} finally { setToggling(false) }
  }

  const terima = async (id) => {
    try {
      await api.post(`/catering/pesanan/${id}/terima`)
      setTersedia((prev) => prev.filter((o) => o.id !== id))
      const { data } = await api.get('/catering/pesanan')
      setOrders(data.data || data)
      setTab('aktif')
    } catch (e) { alert(e.response?.data?.message || 'Gagal mengambil pesanan') }
  }

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/catering/pesanan/${id}/status`, { status })
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o))
    } catch (e) { alert(e.response?.data?.message || 'Gagal') }
  }

  const aktif      = orders.filter((o) => !['selesai', 'dibatalkan'].includes(o.status))
  const selesai    = orders.filter((o) => o.status === 'selesai')
  const pendapatan = selesai.reduce((s, o) => s + parseFloat(o.penghasilan_mitra ?? 0), 0)

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-2xl p-4 text-white">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-emerald-200 text-xs">Mitra Catering</p>
            <p className="font-bold text-lg">{user?.name}</p>
          </div>
          <button onClick={toggleOnline} disabled={toggling}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${available ? 'bg-emerald-400' : 'bg-white/20'}`}>
            <ChefHat className="w-3.5 h-3.5" />
            {available ? 'Buka' : 'Tutup'}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Masuk', value: tersedia.length },
            { label: 'Aktif', value: aktif.length },
            { label: 'Pendapatan', value: formatRupiah(pendapatan) },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-xl p-2 text-center">
              <p className="text-sm font-bold">{s.value}</p>
              <p className="text-[10px] text-emerald-200">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {[
          { key: 'masuk',   label: `Masuk${tersedia.length > 0 ? ` (${tersedia.length})` : ''}` },
          { key: 'aktif',   label: 'Aktif' },
          { key: 'selesai', label: 'Selesai' },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === t.key ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'masuk' && (
        <div className="space-y-3">
          {tersedia.length === 0 ? (
            <div className="text-center py-10 text-gray-400"><p className="text-3xl mb-2">🍱</p><p className="text-sm">Belum ada pesanan masuk</p></div>
          ) : tersedia.map((o) => (
            <div key={o.id} className="card space-y-2 border-l-4 border-emerald-400">
              <p className="text-xs font-bold text-emerald-600">{o.order_code}</p>
              <div className="text-xs text-gray-600 space-y-0.5">
                <p><span className="font-medium">Pelanggan:</span> {o.pelanggan?.name}</p>
                {o.jenis_acara && <p><span className="font-medium">Acara:</span> {o.jenis_acara}</p>}
                <p><span className="font-medium">Porsi:</span> {o.jumlah_porsi}</p>
                {o.event_date && <p><span className="font-medium">Tgl Acara:</span> {new Date(o.event_date).toLocaleDateString('id-ID')}</p>}
                {o.delivery_address && <p><span className="font-medium">Alamat:</span> {o.delivery_address}</p>}
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm font-bold text-emerald-700">{formatRupiah(o.total_price ?? 0)}</p>
                <button onClick={() => terima(o.id)} className="btn-primary text-xs py-1.5 px-4">Ambil Pesanan</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'aktif' && (
        <div className="space-y-3">
          {aktif.length === 0 ? (
            <div className="text-center py-10 text-gray-400"><p className="text-3xl mb-2">📋</p><p className="text-sm">Tidak ada pesanan aktif</p></div>
          ) : aktif.map((o) => (
            <div key={o.id} className="card space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-emerald-600">{o.order_code}</p>
                <StatusBadge status={o.status} />
              </div>
              <p className="text-xs text-gray-600">{o.pelanggan?.name} · {o.jenis_acara}</p>
              <p className="text-xs text-gray-400">{o.jumlah_porsi} porsi · {formatRupiah(o.total_price)}</p>
              {o.event_date && <p className="text-xs text-gray-400">Acara: {new Date(o.event_date).toLocaleString('id-ID')}</p>}
              {STATUS_NEXT[o.status] && (
                <button onClick={() => updateStatus(o.id, STATUS_NEXT[o.status].next)} className="btn-primary text-xs py-1.5 w-full">
                  {STATUS_NEXT[o.status].label}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'selesai' && (
        <div className="space-y-2">
          {selesai.length === 0 ? (
            <div className="text-center py-10 text-gray-400"><p className="text-3xl mb-2">✅</p><p className="text-sm">Belum ada pesanan selesai</p></div>
          ) : selesai.map((o) => (
            <div key={o.id} className="card flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-emerald-600">{o.order_code}</p>
                <p className="text-xs text-gray-500">{o.pelanggan?.name} · {o.jumlah_porsi} porsi</p>
              </div>
              <p className="text-sm font-bold text-emerald-600">{formatRupiah(o.penghasilan_mitra ?? 0)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
