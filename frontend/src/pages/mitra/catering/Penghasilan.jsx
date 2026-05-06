import { useEffect, useState } from 'react'
import api from '../../../api/axios'
import LoadingSpinner from '../../../components/LoadingSpinner'
import { formatRupiah } from '../../../utils/hargaUtils'

const PERIODS = [
  { key: 'hari',   label: 'Hari Ini' },
  { key: 'minggu', label: '7 Hari' },
  { key: 'bulan',  label: '30 Hari' },
  { key: 'semua',  label: 'Semua' },
]

export default function MitraCateringPenghasilan() {
  const [orders, setOrders]   = useState([])
  const [period, setPeriod]   = useState('bulan')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/catering/pesanan').then((r) => setOrders(r.data.data || r.data))
      .catch(console.error).finally(() => setLoading(false))
  }, [])

  const filtered = orders.filter((o) => {
    if (o.status !== 'selesai') return false
    const d = new Date(o.updated_at || o.created_at), now = new Date()
    if (period === 'hari')   return d.toDateString() === now.toDateString()
    if (period === 'minggu') return (now - d) / 86400000 <= 7
    if (period === 'bulan')  return (now - d) / 86400000 <= 30
    return true
  })
  const total = filtered.reduce((s, o) => s + parseFloat(o.penghasilan_mitra ?? 0), 0)

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-800">Penghasilan</h1>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {PERIODS.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${period === p.key ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="bg-gradient-to-r from-orange-500 to-orange-700 rounded-2xl p-5 text-white text-center">
        <p className="text-orange-200 text-xs mb-1">Total Penghasilan</p>
        <p className="text-3xl font-black">{formatRupiah(total)}</p>
        <p className="text-orange-200 text-xs mt-1">{filtered.length} pesanan selesai</p>
      </div>

      <div className="space-y-2">
        {filtered.map((o) => (
          <div key={o.id} className="card flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-gray-700">{o.order_code}</p>
              <p className="text-[11px] text-gray-400">{o.pelanggan?.name} · {o.jumlah_porsi} porsi</p>
              <p className="text-[10px] text-gray-300">{new Date(o.updated_at || o.created_at).toLocaleDateString('id-ID')}</p>
            </div>
            <p className="text-sm font-bold text-emerald-600">{formatRupiah(o.penghasilan_mitra ?? 0)}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">💰</p>
            <p className="text-sm">Belum ada penghasilan di periode ini</p>
          </div>
        )}
      </div>
    </div>
  )
}
