import { useEffect, useState } from 'react'
import { Wallet, TrendingUp, ArrowUpRight, Receipt } from 'lucide-react'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'

const SERVICE_COLOR = { ojek:'bg-orange-500', urut:'bg-pink-500', produk:'bg-indigo-500' }
const SERVICE_ICON  = { ojek:'🛵', urut:'💆', produk:'🛒' }

function RevenueCard({ label, value, icon, sub, color = 'bg-primary-600' }) {
  const fmt = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`
  return (
    <div className={`${color} rounded-2xl p-4 text-white`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium opacity-80">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-xl font-black">{fmt(value)}</p>
      {sub && <p className="text-[11px] opacity-70 mt-1">{sub}</p>}
    </div>
  )
}

export default function AdminKeuangan() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/keuangan')
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner full />

  const fmt = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`
  const ring = data?.ringkasan || {}
  const grafik = data?.grafik_7hari || []
  const perLayanan = data?.per_layanan || {}
  const transaksi = data?.transaksi || []

  const maxVal = Math.max(...grafik.map((d) => d.pendapatan), 1)

  return (
    <div className="pb-4">
      <h1 className="page-title">Keuangan</h1>

      {/* Revenue cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <RevenueCard label="Hari Ini"   value={ring.hari_ini}   icon="💰" color="bg-emerald-500" />
        <RevenueCard label="Minggu Ini" value={ring.minggu_ini} icon="📈" color="bg-teal-500" />
        <RevenueCard label="Bulan Ini"  value={ring.bulan_ini}  icon="📅" color="bg-primary-600" />
        <RevenueCard label="Total Komisi (10%)" value={ring.total_komisi} icon="🏦" color="bg-violet-500" sub="dari semua transaksi" />
      </div>

      {/* Bar chart 7 hari */}
      <div className="card mb-5">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Pendapatan 7 Hari Terakhir</p>
        {grafik.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-4">Belum ada data</p>
        ) : (
          <div className="flex items-end gap-1.5 h-28">
            {grafik.map((d) => (
              <div key={d.tanggal} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-[9px] text-gray-400 font-medium">
                  {d.pendapatan > 0 ? `${Math.round(d.pendapatan / 1000)}k` : ''}
                </p>
                <div className="w-full bg-gray-100 rounded-t-lg overflow-hidden" style={{ height: 80 }}>
                  <div
                    className="w-full bg-primary-500 rounded-t-lg transition-all duration-500"
                    style={{ height: `${Math.max(4, (d.pendapatan / maxVal) * 80)}px`, marginTop: 'auto' }}
                  />
                </div>
                <p className="text-[9px] text-gray-400">{d.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per layanan */}
      <div className="card mb-5">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Pendapatan per Layanan</p>
        <div className="space-y-3">
          {Object.entries(perLayanan).map(([key, val]) => {
            const total = Object.values(perLayanan).reduce((a, b) => a + b, 0)
            const pct = total > 0 ? Math.round((val / total) * 100) : 0
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{SERVICE_ICON[key] || '⚙️'}</span>
                    <p className="text-sm font-medium text-gray-700 capitalize">{key}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">{fmt(val)}</p>
                    <p className="text-[10px] text-gray-400">{pct}%</p>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${SERVICE_COLOR[key] || 'bg-gray-400'} rounded-full transition-all`}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Transaksi terbaru */}
      <div className="card">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Transaksi Terbaru</p>
        {transaksi.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-4">Belum ada transaksi</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {transaksi.map((tx, i) => (
              <div key={i} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-base shrink-0">
                  {SERVICE_ICON[tx.jenis?.toLowerCase()] || '💳'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{tx.pelanggan || 'Pelanggan'}</p>
                  <p className="text-xs text-gray-400">{tx.jenis} · {tx.tanggal ? new Date(tx.tanggal).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '—'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-800">{fmt(tx.nominal)}</p>
                  <p className="text-[10px] text-emerald-600">+{fmt(tx.komisi)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
