import { useEffect, useState } from 'react'
import { Users, Bike, HandHeart, ShoppingBag, AlertCircle, TrendingUp, Wallet, ClipboardList, Store, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'
import CurvedHeader from '../../components/CurvedHeader'
import useAuthStore from '../../stores/authStore'

const SERVICE_LABEL = {
  ojek: 'Ojek', urut: 'Urut', laundry: 'Laundry', catering: 'Catering',
  kebersihan: 'Kebersihan', antar_barang: 'Antar Barang', produk: 'Produk', semua: 'Semua',
}
const SERVICE_ICON  = { ojek:'🛵', urut:'💆', laundry:'👕', catering:'🍱', kebersihan:'🧹', antar_barang:'📦', produk:'🛒' }
const SERVICE_COLOR = ['bg-orange-500','bg-pink-500','bg-sky-500','bg-emerald-500','bg-violet-500','bg-amber-500','bg-indigo-500']

function MiniCard({ label, value, sub, color = 'bg-primary-50 text-primary-700' }) {
  return (
    <div className="bg-white/15 rounded-xl py-2.5 px-2 text-center border border-white/20">
      <p className="text-xl font-black text-white">{value ?? '—'}</p>
      <p className="text-purple-200 text-[10px] mt-0.5 leading-tight">{label}</p>
      {sub != null && <p className="text-purple-300 text-[9px]">{sub}</p>}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, sub, onClick }) {
  return (
    <button onClick={onClick} className={`card flex items-center gap-3 w-full text-left ${onClick ? 'hover:shadow-md cursor-pointer' : ''} transition-shadow`}>
      <div className={`w-11 h-11 ${color} rounded-2xl flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-black text-gray-800">{value ?? '—'}</p>
        <p className="text-xs text-gray-500 leading-tight">{label}</p>
        {sub != null && <p className="text-[11px] text-gray-400">{sub}</p>}
      </div>
    </button>
  )
}

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const navigate  = useNavigate()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/statistik')
      .then((r) => setData(r.data))
      .catch(() => api.get('/admin/dashboard').then((r) => setData(r.data)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner full />

  const fmt = (n) => Number(n || 0).toLocaleString('id-ID')

  return (
    <div>
      <CurvedHeader>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-purple-200 text-sm">Panel Admin</p>
            <h2 className="text-xl font-black text-white">ZashaGo</h2>
            <p className="text-purple-300 text-xs mt-0.5">Halo, {user?.name?.split(' ')[0]} 👋</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <MiniCard label="Pengguna"  value={data?.users?.total}            />
          <MiniCard label="Mitra"     value={data?.users?.mitra}            />
          <MiniCard label="Pesanan"   value={data?.pesanan?.hari_ini}       />
          <MiniCard label="Pending"   value={data?.verifikasi_pending}      />
        </div>
      </CurvedHeader>

      {/* Alert verifikasi */}
      {(data?.verifikasi_pending > 0) && (
        <button onClick={() => navigate('/admin/mitra')}
          className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl px-4 py-3 mb-5 w-full text-left">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium flex-1">
            <strong>{data.verifikasi_pending}</strong> mitra menunggu verifikasi
          </p>
          <span className="text-xs text-amber-600">Lihat →</span>
        </button>
      )}

      {/* Keuangan */}
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Keuangan</p>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard icon={Wallet}       label="Pendapatan Hari Ini" value={`Rp ${fmt(data?.keuangan?.hari_ini)}`}   color="bg-emerald-500" onClick={() => navigate('/admin/keuangan')} />
        <StatCard icon={TrendingUp}   label="Bulan Ini"           value={`Rp ${fmt(data?.keuangan?.bulan)}`}     color="bg-teal-500"    onClick={() => navigate('/admin/keuangan')} />
      </div>

      {/* Pengguna */}
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Pengguna</p>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard icon={Users}  label="Total Pengguna"  value={data?.users?.total}     color="bg-primary-600" onClick={() => navigate('/admin/pengguna')} />
        <StatCard icon={Users}  label="Pelanggan"       value={data?.users?.pelanggan} color="bg-indigo-500"  onClick={() => navigate('/admin/pengguna?role=pelanggan')} />
        <StatCard icon={Users}  label="Total Mitra"     value={data?.users?.mitra}     color="bg-blue-500"    onClick={() => navigate('/admin/mitra')} />
        <StatCard icon={Store}  label="Pedagang"        value={data?.users?.penjual}   color="bg-fuchsia-500" onClick={() => navigate('/admin/pedagang')} />
      </div>

      {/* Mitra per layanan */}
      {data?.mitra?.per_layanan?.length > 0 && (
        <>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Mitra per Layanan</p>
          <div className="card mb-5">
            <div className="space-y-2.5">
              {data.mitra.per_layanan.map((row, i) => (
                <div key={row.service_type} className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${SERVICE_COLOR[i % SERVICE_COLOR.length]} rounded-xl flex items-center justify-center text-sm shrink-0`}>
                    {SERVICE_ICON[row.service_type] || '⚙️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-gray-700">{SERVICE_LABEL[row.service_type] || row.service_type}</p>
                      <p className="text-xs text-gray-400">{row.total} mitra · <span className="text-emerald-600">{row.online} online</span></p>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${SERVICE_COLOR[i % SERVICE_COLOR.length]} rounded-full`}
                        style={{ width: `${Math.min(100, (row.verified / row.total) * 100 || 0)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Pesanan */}
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Pesanan</p>
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Bike}        label="Ojek Total"     value={data?.pesanan?.ojek_total}   color="bg-orange-500" onClick={() => navigate('/admin/pesanan')} />
        <StatCard icon={HandHeart}   label="Urut Total"     value={data?.pesanan?.urut_total}   color="bg-pink-500"   onClick={() => navigate('/admin/pesanan')} />
        <StatCard icon={ShoppingBag} label="Produk Total"   value={data?.pesanan?.produk_total} color="bg-indigo-500" onClick={() => navigate('/admin/pesanan')} />
        <StatCard icon={ClipboardList} label="Hari Ini"     value={data?.pesanan?.hari_ini}     color="bg-cyan-500"   onClick={() => navigate('/admin/pesanan')} />
      </div>
    </div>
  )
}
