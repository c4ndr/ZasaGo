import { useEffect, useState, useCallback } from 'react'
import { Sparkles } from 'lucide-react'
import api from '../../../api/axios'
import useAuthStore from '../../../stores/authStore'
import StatusBadge from '../../../components/StatusBadge'
import LoadingSpinner from '../../../components/LoadingSpinner'
import { formatRupiah } from '../../../utils/hargaUtils'

const STATUS_NEXT = {
  diterima:           { label: 'Menuju Lokasi', next: 'menuju_lokasi' },
  menuju_lokasi:      { label: 'Mulai Bekerja', next: 'sedang_berlangsung' },
  sedang_berlangsung: { label: 'Selesai',       next: 'selesai' },
}

export default function MitraKebersihanDashboard() {
  const { user }     = useAuthStore()
  const [orders, setOrders]       = useState([])
  const [tersedia, setTersedia]   = useState([])
  const [available, setAvailable] = useState(false)
  const [toggling, setToggling]   = useState(false)
  const [tab, setTab]             = useState('masuk')
  const [loading, setLoading]     = useState(true)

  const fetchAll = useCallback(() =>
    Promise.all([
      api.get('/kebersihan/pesanan'),
      api.get('/kebersihan/tersedia'),
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
      await api.post(`/kebersihan/pesanan/${id}/terima`)
      setTersedia((prev) => prev.filter((o) => o.id !== id))
      const { data } = await api.get('/kebersihan/pesanan')
      setOrders(data.data || data)
      setTab('aktif')
    } catch (e) { alert(e.response?.data?.message || 'Gagal mengambil pesanan') }
  }

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/kebersihan/pesanan/${id}/status`, { status })
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o))
    } catch (e) { alert(e.response?.data?.message || 'Gagal') }
  }

  const aktif      = orders.filter((o) => !['selesai', 'dibatalkan'].includes(o.status))
  const selesai    = orders.filter((o) => o.status === 'selesai')
  const pendapatan = selesai.reduce((s, o) => s + parseFloat(o.penghasilan_mitra ?? 0), 0)

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-violet-500 to-violet-700 rounded-2xl p-4 text-white">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-violet-200 text-xs">Mitra Kebersihan</p>
            <p className="font-bold text-lg">{user?.name}</p>
          </div>
          <button onClick={toggleOnline} disabled={toggling}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${available ? 'bg-emerald-500' : 'bg-white/20'}`}>
            <Sparkles className="w-3.5 h-3.5" />
            {available ? 'Online' : 'Offline'}
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
              <p className="text-[10px] text-violet-200">{s.label}</p>
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
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === t.key ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'masuk' && (
        <div className="space-y-3">
          {tersedia.length === 0 ? (
            <div className="text-center py-10 text-gray-400"><p className="text-3xl mb-2">🧹</p><p className="text-sm">Belum ada pesanan masuk</p></div>
          ) : tersedia.map((o) => (
            <div key={o.id} className="card space-y-2 border-l-4 border-violet-400">
              <p className="text-xs font-bold text-violet-600">{o.order_code}</p>
              <div className="text-xs text-gray-600 space-y-0.5">
                <p><span className="font-medium">Pelanggan:</span> {o.pelanggan?.name}</p>
                <p><span className="font-medium">Layanan:</span> {o.jenis_layanan}</p>
                <p><span className="font-medium">Durasi:</span> {o.durasi_jam} jam</p>
                {o.schedule_date && <p><span className="font-medium">Jadwal:</span> {new Date(o.schedule_date).toLocaleDateString('id-ID')}</p>}
                {o.service_address && <p><span className="font-medium">Alamat:</span> {o.service_address}</p>}
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm font-bold text-emerald-600">{formatRupiah(o.total_price ?? 0)}</p>
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
                <p className="text-xs font-bold text-violet-600">{o.order_code}</p>
                <StatusBadge status={o.status} />
              </div>
              <p className="text-xs text-gray-600">{o.pelanggan?.name} · {o.jenis_layanan}</p>
              <p className="text-xs text-gray-400">{o.durasi_jam} jam · {formatRupiah(o.total_price)}</p>
              {o.service_address && <p className="text-xs text-gray-400 line-clamp-1">{o.service_address}</p>}
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
                <p className="text-xs font-bold text-violet-600">{o.order_code}</p>
                <p className="text-xs text-gray-500">{o.pelanggan?.name} · {o.jenis_layanan}</p>
              </div>
              <p className="text-sm font-bold text-emerald-600">{formatRupiah(o.penghasilan_mitra ?? 0)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
