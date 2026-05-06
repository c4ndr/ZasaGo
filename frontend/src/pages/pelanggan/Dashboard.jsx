import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, ArrowRight, TrendingUp, Send, History, Plus, Bell, X } from 'lucide-react'
import useAuthStore from '../../stores/authStore'
import CurvedHeader from '../../components/CurvedHeader'
import api from '../../api/axios'

const ROUTE_MAP = {
  'ojek':           '/pelanggan/ojek',
  'urut':           '/pelanggan/urut',
  'urut/pijat':     '/pelanggan/urut',
  'pijat':          '/pelanggan/urut',
  'produk':         '/pelanggan/produk',
  'belanja':        '/pelanggan/produk',
  'laundry':        '/pelanggan/laundry',
  'catering':       '/pelanggan/catering',
  'kebersihan':     '/pelanggan/kebersihan',
  'antar barang':   '/pelanggan/antar-barang',
  'antar_barang':   '/pelanggan/antar-barang',
  'jastip':         '/pelanggan/jastip',
}

const COLOR_PALETTE = [
  { bg: 'bg-orange-500', badge: 'bg-orange-50 text-orange-600' },
  { bg: 'bg-pink-500',   badge: 'bg-pink-50 text-pink-600' },
  { bg: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-600' },
  { bg: 'bg-teal-500',   badge: 'bg-teal-50 text-teal-600' },
  { bg: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-600' },
  { bg: 'bg-primary-600',badge: 'bg-primary-50 text-primary-600' },
]

function ComingSoonModal({ service, onClose }) {
  const [notified, setNotified] = useState(false)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 pb-8" onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideUp 0.25s ease-out' }}>
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="text-center">
          <div className="text-5xl mb-3">{service?.icon || '🔧'}</div>
          <h3 className="text-xl font-black text-gray-800 mb-1">{service?.nama}</h3>
          <p className="text-sm text-gray-400 mb-5">Layanan ini sedang dalam pengembangan. Kami akan segera menghadirkannya untuk Anda!</p>

          {!notified ? (
            <button
              onClick={() => setNotified(true)}
              className="btn-primary w-full flex items-center justify-center gap-2">
              <Bell className="w-4 h-4" />
              Beritahu Saya Saat Tersedia
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3 bg-primary-50 rounded-xl text-primary-700 font-semibold text-sm">
              ✓ Anda akan diberitahu saat layanan tersedia
            </div>
          )}

          <button onClick={onClose} className="mt-3 w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors">
            Kembali ke Beranda
          </button>
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity:0; } to { transform: translateY(0); opacity:1; } }`}</style>
    </div>
  )
}

export default function PelangganDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [showTopupModal, setShowTopupModal] = useState(false)
  const [walletBalance] = useState(0)
  const [services, setServices] = useState([])
  const [comingSoon, setComingSoon] = useState(null)

  const jam = new Date().getHours()
  const salam = jam < 12 ? 'Selamat Pagi' : jam < 15 ? 'Selamat Siang' : jam < 18 ? 'Selamat Sore' : 'Selamat Malam'
  const firstName = user?.name?.split(' ')[0] || 'Pengguna'

  useEffect(() => {
    api.get('/layanan/aktif')
      .then((r) => setServices(r.data))
      .catch(() => setServices([
        { id: 1, nama: 'Ojek',        icon: '🛵', deskripsi: 'Antar jemput cepat & aman' },
        { id: 2, nama: 'Urut/Pijat',  icon: '💆', deskripsi: 'Pijat tradisional ke rumah' },
        { id: 3, nama: 'Produk',      icon: '🛒', deskripsi: 'Belanja produk lokal desa' },
        { id: 4, nama: 'Laundry',     icon: '👕', deskripsi: 'Cuci & setrika pakaian' },
        { id: 5, nama: 'Catering',    icon: '🍱', deskripsi: 'Katering harian & acara' },
        { id: 6, nama: 'Kebersihan',  icon: '🧹', deskripsi: 'Jasa bersih-bersih rumah' },
      ]))
  }, [])

  const handleServiceClick = (svc) => {
    const key = svc.nama.toLowerCase()
    const route = ROUTE_MAP[key]
    if (route) {
      navigate(route)
    } else {
      setComingSoon(svc)
    }
  }

  return (
    <div>
      {/* ── Curved Purple Header ──────────────────────────────────── */}
      <CurvedHeader>
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-purple-200 text-sm">{salam},</p>
            <h2 className="text-xl font-black text-white">{firstName} 👋</h2>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
        </div>

        {/* Wallet Card */}
        <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
          <div className="flex items-center justify-between mb-1">
            <p className="text-purple-200 text-xs font-medium">Dompet ZashaGo</p>
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">Aktif</span>
          </div>
          <p className="text-2xl font-black text-white mb-4">Rp {walletBalance.toLocaleString('id-ID')}</p>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setShowTopupModal(true)} className="wallet-btn">
              <Plus className="w-4 h-4" /> Top Up
            </button>
            <button className="wallet-btn">
              <Send className="w-4 h-4" /> Transfer
            </button>
            <button onClick={() => navigate('/pelanggan/riwayat')} className="wallet-btn">
              <History className="w-4 h-4" /> Riwayat
            </button>
          </div>
        </div>
      </CurvedHeader>

      {/* ── Layanan (dinamis dari API) ─────────────────────────────── */}
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Layanan Kami</p>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {services.map((svc, idx) => {
          const key = svc.nama.toLowerCase()
          const hasRoute = !!ROUTE_MAP[key]
          const color = COLOR_PALETTE[idx % COLOR_PALETTE.length]
          return (
            <button
              key={svc.id}
              onClick={() => handleServiceClick(svc)}
              className="flex flex-col items-center gap-2 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.97] transition-all relative"
            >
              {!hasRoute && (
                <span className="absolute top-1.5 right-1.5 text-[9px] bg-amber-100 text-amber-600 font-bold px-1.5 py-0.5 rounded-full leading-none">
                  Segera
                </span>
              )}
              <div className={`w-12 h-12 ${color.bg} rounded-2xl flex items-center justify-center text-xl`}>
                {svc.icon}
              </div>
              <p className="text-xs font-semibold text-gray-700 text-center leading-tight px-1">{svc.nama}</p>
            </button>
          )
        })}
      </div>

      {/* ── Shortcut Riwayat ──────────────────────────────────────── */}
      <button onClick={() => navigate('/pelanggan/riwayat')}
        className="card w-full flex items-center gap-3 hover:shadow-md transition-all duration-150 text-left">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-gray-500" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-700 text-sm">Riwayat Pesanan</p>
          <p className="text-xs text-gray-400">Lihat semua pesanan Anda</p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400" />
      </button>

      {/* Modal Top Up */}
      {showTopupModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="font-bold text-gray-800">Top Up Dompet</h3>
            </div>
            <p className="text-sm text-gray-400 mb-5">Fitur top up akan segera tersedia.</p>
            <button onClick={() => setShowTopupModal(false)} className="btn-primary w-full">Tutup</button>
          </div>
        </div>
      )}

      {/* Modal Coming Soon */}
      {comingSoon && <ComingSoonModal service={comingSoon} onClose={() => setComingSoon(null)} />}
    </div>
  )
}
