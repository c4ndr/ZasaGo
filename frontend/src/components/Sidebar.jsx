import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, Users, Store,
  Bike, HandHeart, PackageSearch, UserCircle, Zap,
  Package, TrendingUp, Wrench, Wallet, Settings, ShoppingBag,
  Shirt, ChefHat, Sparkles, History, Percent, Handshake, BadgeDollarSign,
} from 'lucide-react'
import useAuthStore from '../stores/authStore'
import api from '../api/axios'

const navItems = {
  admin: [
    { to: '/admin/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/pesanan',         icon: ClipboardList,   label: 'Pesanan' },
    { to: '/admin/pengguna',        icon: Users,           label: 'Pengguna' },
    { to: '/admin/mitra',           icon: Store,           label: 'Mitra' },
    { to: '/admin/pedagang',        icon: ShoppingBag,     label: 'Pedagang' },
    { to: '/admin/layanan',         icon: Wrench,          label: 'Layanan Jasa' },
    { to: '/admin/keuangan',        icon: Wallet,          label: 'Keuangan' },
    { to: '/admin/wallet',          icon: BadgeDollarSign, label: 'Isi Saldo Mitra' },
    { to: '/admin/pengaturan-ojek',   icon: Bike,       label: 'Tarif Ojek' },
    { to: '/admin/pengaturan-jastip', icon: Handshake,  label: 'Jastip' },
    { to: '/admin/komisi',            icon: Percent,    label: 'Komisi' },
    { to: '/admin/pengaturan',        icon: Settings,   label: 'Pengaturan' },
    { to: '/akun',                  icon: UserCircle,      label: 'Akun' },
  ],
  mitra: [
    { to: '/mitra/ojek/dashboard', icon: LayoutDashboard, label: 'Beranda' },
    { to: '/mitra/pesanan',        icon: ClipboardList,   label: 'Pesanan Masuk' },
    { to: '/mitra/akun',           icon: UserCircle,      label: 'Akun' },
  ],
  mitra_urut: [
    { to: '/mitra/urut/dashboard',    icon: LayoutDashboard, label: 'Beranda' },
    { to: '/mitra/urut/pesanan',      icon: ClipboardList,   label: 'Pesanan' },
    { to: '/mitra/urut/penghasilan',  icon: TrendingUp,      label: 'Penghasilan' },
    { to: '/mitra/urut/akun',         icon: UserCircle,      label: 'Akun' },
  ],
  mitra_laundry: [
    { to: '/mitra/laundry/dashboard',    icon: LayoutDashboard, label: 'Beranda' },
    { to: '/mitra/laundry/pesanan',      icon: ClipboardList,   label: 'Pesanan' },
    { to: '/mitra/laundry/penghasilan',  icon: TrendingUp,      label: 'Penghasilan' },
    { to: '/mitra/laundry/akun',         icon: UserCircle,      label: 'Akun' },
  ],
  mitra_catering: [
    { to: '/mitra/catering/dashboard',    icon: LayoutDashboard, label: 'Beranda' },
    { to: '/mitra/catering/pesanan',      icon: ClipboardList,   label: 'Pesanan' },
    { to: '/mitra/catering/penghasilan',  icon: TrendingUp,      label: 'Penghasilan' },
    { to: '/mitra/catering/akun',         icon: UserCircle,      label: 'Akun' },
  ],
  mitra_kebersihan: [
    { to: '/mitra/kebersihan/dashboard',    icon: LayoutDashboard, label: 'Beranda' },
    { to: '/mitra/kebersihan/pesanan',      icon: ClipboardList,   label: 'Pesanan' },
    { to: '/mitra/kebersihan/penghasilan',  icon: TrendingUp,      label: 'Penghasilan' },
    { to: '/mitra/kebersihan/akun',         icon: UserCircle,      label: 'Akun' },
  ],
  mitra_antar_barang: [
    { to: '/mitra/antar/dashboard',    icon: LayoutDashboard, label: 'Beranda' },
    { to: '/mitra/antar/pesanan',      icon: ClipboardList,   label: 'Pesanan' },
    { to: '/mitra/antar/penghasilan',  icon: TrendingUp,      label: 'Penghasilan' },
    { to: '/mitra/antar/akun',         icon: UserCircle,      label: 'Akun' },
  ],
  pelanggan: [
    { to: '/pelanggan/dashboard',    icon: LayoutDashboard, label: 'Beranda' },
    { to: '/pelanggan/ojek',         icon: Bike,            label: 'Ojek' },
    { to: '/pelanggan/urut',         icon: HandHeart,       label: 'Urut/Pijat' },
    { to: '/pelanggan/laundry',      icon: Shirt,           label: 'Laundry' },
    { to: '/pelanggan/catering',     icon: ChefHat,         label: 'Catering' },
    { to: '/pelanggan/kebersihan',   icon: Sparkles,        label: 'Kebersihan' },
    { to: '/pelanggan/antar-barang', icon: Package,         label: 'Antar Barang' },
    { to: '/pelanggan/produk',       icon: PackageSearch,   label: 'Produk' },
    { to: '/pelanggan/jastip',       icon: Handshake,       label: 'Jastip' },
    { to: '/pelanggan/riwayat',      icon: History,         label: 'Riwayat' },
    { to: '/pelanggan/akun',         icon: UserCircle,      label: 'Akun' },
  ],
  penjual: [
    { to: '/penjual/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/penjual/produk',    icon: Package,         label: 'Kelola Produk' },
    { to: '/penjual/pesanan',   icon: ClipboardList,   label: 'Pesanan Masuk' },
    { to: '/penjual/laporan',   icon: TrendingUp,      label: 'Laporan' },
    { to: '/akun',              icon: UserCircle,      label: 'Akun' },
  ],
}

function getRoleNav(role) {
  if (navItems[role]) return navItems[role]
  if (role?.startsWith('mitra')) return navItems.mitra
  return []
}

export default function Sidebar({ role }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const items = getRoleNav(role)

  const handleLogout = async () => {
    try { await api.post('/logout') } catch (_) {}
    logout()
    navigate('/login')
  }

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-white border-r border-gray-100 fixed left-0 top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
          <span className="text-white font-black text-lg leading-none">Z</span>
        </div>
        <div>
          <p className="font-black text-primary-600 leading-tight tracking-tight">ZashaGo</p>
          <p className="text-[11px] text-gray-400 capitalize">{role?.replace('_', ' ')}</p>
        </div>
      </div>

      {/* Profil */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3 bg-primary-50 rounded-xl p-3">
          <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to.endsWith('/dashboard')}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-primary-50 hover:text-primary-600'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Powered by */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Zap className="w-3.5 h-3.5 text-accent" />
          <span>ZashaGo Platform</span>
        </div>
      </div>
    </aside>
  )
}
