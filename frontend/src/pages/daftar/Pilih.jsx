import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const ROLES = [
  {
    to: '/daftar/pelanggan',
    emoji: '🙋',
    title: 'Pelanggan',
    desc: 'Nikmati semua layanan ZashaGo',
    bg: 'from-indigo-500 to-primary-600',
    border: 'border-indigo-200',
    label: 'bg-indigo-50 text-indigo-600',
  },
  {
    to: '/daftar/mitra',
    emoji: '🛵',
    title: 'Mitra Ojek',
    desc: 'Antar jemput penumpang & barang',
    bg: 'from-orange-500 to-amber-400',
    border: 'border-orange-200',
    label: 'bg-orange-50 text-orange-600',
  },
  {
    to: '/daftar/mitra-urut',
    emoji: '💆',
    title: 'Mitra Urut/Pijat',
    desc: 'Layani jasa pijat & urut ke rumah',
    bg: 'from-pink-500 to-rose-400',
    border: 'border-pink-200',
    label: 'bg-pink-50 text-pink-600',
  },
  {
    to: '/daftar/mitra-laundry',
    emoji: '👕',
    title: 'Mitra Laundry',
    desc: 'Terima cucian & setrika pakaian',
    bg: 'from-sky-500 to-cyan-400',
    border: 'border-sky-200',
    label: 'bg-sky-50 text-sky-600',
  },
  {
    to: '/daftar/mitra-catering',
    emoji: '🍱',
    title: 'Mitra Catering',
    desc: 'Sajikan makanan untuk pelanggan',
    bg: 'from-emerald-500 to-teal-400',
    border: 'border-emerald-200',
    label: 'bg-emerald-50 text-emerald-600',
  },
  {
    to: '/daftar/mitra-kebersihan',
    emoji: '🧹',
    title: 'Mitra Kebersihan',
    desc: 'Layani jasa bersih-bersih',
    bg: 'from-violet-500 to-purple-400',
    border: 'border-violet-200',
    label: 'bg-violet-50 text-violet-600',
  },
  {
    to: '/daftar/mitra-antar',
    emoji: '📦',
    title: 'Mitra Antar Barang',
    desc: 'Antar barang ke tujuan pelanggan',
    bg: 'from-amber-500 to-yellow-400',
    border: 'border-amber-200',
    label: 'bg-amber-50 text-amber-600',
  },
  {
    to: '/daftar/penjual',
    emoji: '🏪',
    title: 'Pedagang / Penjual',
    desc: 'Jualan produk online di ZashaGo',
    bg: 'from-fuchsia-500 to-pink-400',
    border: 'border-fuchsia-200',
    label: 'bg-fuchsia-50 text-fuchsia-600',
  },
]

export default function DaftarPilih() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div style={{ position:'absolute', width:400, height:400, background:'rgba(76,59,207,0.06)', borderRadius:'50%', top:-100, right:-100 }} />
        <div style={{ position:'absolute', width:300, height:300, background:'rgba(189,180,255,0.08)', borderRadius:'50%', bottom:-80, left:-80 }} />
      </div>

      <div className="w-full max-w-md mx-auto relative">
        <Link to="/login" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Login
        </Link>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #4C3BCF, #6C5CE7)' }}>
            <span className="text-white font-black text-xl">Z</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Daftar ZashaGo</h1>
          <p className="text-gray-400 text-sm mt-1">Pilih jenis akun yang ingin dibuat</p>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-6">
          {ROLES.map(({ to, emoji, title, desc, bg, border }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className={`bg-white border-2 ${border} rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-md active:scale-[0.97] transition-all text-center group`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${bg} flex items-center justify-center text-2xl shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                {emoji}
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm leading-tight">{title}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{desc}</p>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 pb-4">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-primary-600 font-semibold hover:underline">Masuk</Link>
        </p>
      </div>
    </div>
  )
}
