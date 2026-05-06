import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, ShoppingBag, TrendingUp, ClipboardList, Plus, ArrowRight } from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../stores/authStore'
import CurvedHeader from '../../components/CurvedHeader'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function PenjualDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/penjual/dashboard')
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const firstName = user?.name?.split(' ')[0] || 'Penjual'

  if (loading) return <LoadingSpinner full />

  const statCards = [
    { icon: Package,     label: 'Total Produk',   value: stats?.total_produk ?? 0,                               bg: 'bg-blue-50',    text: 'text-blue-500' },
    { icon: ShoppingBag, label: 'Terjual',        value: stats?.total_terjual ?? 0,                              bg: 'bg-amber-50',   text: 'text-amber-500' },
    { icon: TrendingUp,  label: 'Pendapatan',     value: `Rp ${Number(stats?.total_pendapatan||0).toLocaleString('id')}`, bg: 'bg-primary-50', text: 'text-primary-600', small: true },
    { icon: ClipboardList, label: 'Pesanan Baru', value: stats?.pesanan_baru ?? 0,                               bg: 'bg-red-50',     text: 'text-red-500' },
  ]

  return (
    <div>
      <CurvedHeader>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-purple-200 text-sm">Selamat datang,</p>
            <h2 className="text-xl font-black text-white">{firstName} 🏪</h2>
            <p className="text-purple-300 text-xs mt-0.5">{user?.email}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-black text-xl">
            {user?.name?.[0]?.toUpperCase()}
          </div>
        </div>

        {stats?.pesanan_baru > 0 && (
          <div className="bg-amber-400/20 border border-amber-300/30 rounded-xl px-3 py-2 text-xs text-amber-200">
            🔔 Ada {stats.pesanan_baru} pesanan baru yang perlu diproses
          </div>
        )}
      </CurvedHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {statCards.map(({ icon: Icon, label, value, bg, text, small }) => (
          <div key={label} className="card text-center !p-3">
            <div className={`w-10 h-10 ${bg} ${text} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className={`font-black text-gray-800 ${small ? 'text-[11px]' : 'text-lg'}`}>{value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Menu Utama</p>
      <div className="space-y-3">
        <button onClick={() => navigate('/penjual/produk')}
          className="card w-full flex items-center gap-4 hover:shadow-md active:scale-[0.99] transition-all text-left">
          <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shrink-0">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-800">Kelola Produk</p>
            <p className="text-xs text-gray-400">{stats?.produk_aktif ?? 0} produk aktif · Tambah, edit, hapus</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
        </button>

        <button onClick={() => navigate('/penjual/pesanan')}
          className="card w-full flex items-center gap-4 hover:shadow-md active:scale-[0.99] transition-all text-left">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-800">Pesanan Masuk</p>
            <p className="text-xs text-gray-400">Kelola pesanan produk Anda</p>
          </div>
          {stats?.pesanan_baru > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {stats.pesanan_baru}
            </span>
          )}
          <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
        </button>

        <button onClick={() => navigate('/penjual/laporan')}
          className="card w-full flex items-center gap-4 hover:shadow-md active:scale-[0.99] transition-all text-left">
          <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-800">Laporan Penjualan</p>
            <p className="text-xs text-gray-400">Statistik & pendapatan toko</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
        </button>
      </div>

      {/* FAB tambah produk */}
      <button
        onClick={() => navigate('/penjual/produk')}
        style={{ background: 'linear-gradient(135deg, #4C3BCF, #6C5CE7)' }}
        className="fixed bottom-20 right-5 md:bottom-8 w-14 h-14 rounded-full flex items-center justify-center shadow-xl text-white z-40 hover:opacity-90 active:scale-95 transition-all"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}
