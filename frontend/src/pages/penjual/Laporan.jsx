import { useEffect, useState } from 'react'
import { TrendingUp, Package } from 'lucide-react'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function PenjualLaporan() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/penjual/laporan')
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  const statusLabel = {
    pending: 'Menunggu', dikonfirmasi: 'Dikonfirmasi',
    dikirim: 'Dikirim', selesai: 'Selesai', dibatalkan: 'Dibatalkan',
  }

  return (
    <div>
      <h1 className="page-title">Laporan Penjualan</h1>

      {/* Pendapatan total */}
      <div className="card mb-4"
        style={{ background: 'linear-gradient(135deg, #4C3BCF 0%, #6C5CE7 100%)' }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-purple-200 text-xs">Total Pendapatan</p>
            <p className="text-2xl font-black text-white">
              Rp {Number(data?.total_pendapatan || 0).toLocaleString('id')}
            </p>
          </div>
        </div>
      </div>

      {/* Pesanan per status */}
      {data?.pesanan_per_status && Object.keys(data.pesanan_per_status).length > 0 && (
        <div className="card mb-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Status Pesanan</p>
          <div className="space-y-2">
            {Object.entries(data.pesanan_per_status).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{statusLabel[status] || status}</span>
                <span className="font-semibold text-gray-800 bg-gray-100 px-2.5 py-0.5 rounded-full text-sm">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top produk */}
      <div className="card">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Produk Terlaris</p>
        {data?.top_produk?.length > 0 ? (
          <div className="space-y-3">
            {data.top_produk.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-primary-600 font-bold text-xs">#{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">Rp {Number(p.price).toLocaleString('id')} · Stok: {p.stock}</p>
                </div>
                <span className="text-xs font-bold text-primary-600">{p.total_sold} terjual</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Belum ada data penjualan</p>
          </div>
        )}
      </div>
    </div>
  )
}
