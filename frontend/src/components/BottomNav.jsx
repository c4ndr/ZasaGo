import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Bike, HandHeart, PackageSearch,
  ClipboardList, Users, Store, UserCircle, Package,
  TrendingUp, Wrench, Wallet, History, Handshake, BadgeDollarSign,
} from 'lucide-react'

const navItems = {
  admin: [
    { to: '/admin/dashboard', icon: LayoutDashboard,  label: 'Beranda' },
    { to: '/admin/pesanan',   icon: ClipboardList,    label: 'Pesanan' },
    { to: '/admin/wallet',    icon: BadgeDollarSign,  label: 'Isi Saldo' },
    { to: '/admin/keuangan',  icon: Wallet,           label: 'Keuangan' },
    { to: '/akun',            icon: UserCircle,       label: 'Akun' },
  ],
  mitra: [
    { to: '/mitra/ojek/dashboard', icon: LayoutDashboard, label: 'Beranda' },
    { to: '/mitra/pesanan',        icon: ClipboardList,   label: 'Pesanan' },
    { to: '/mitra/akun',           icon: UserCircle,      label: 'Akun' },
  ],
  mitra_urut: [
    { to: '/mitra/urut/dashboard',   icon: LayoutDashboard, label: 'Beranda' },
    { to: '/mitra/urut/pesanan',     icon: ClipboardList,   label: 'Pesanan' },
    { to: '/mitra/urut/penghasilan', icon: TrendingUp,      label: 'Penghasilan' },
    { to: '/mitra/urut/akun',        icon: UserCircle,      label: 'Akun' },
  ],
  mitra_laundry: [
    { to: '/mitra/laundry/dashboard',   icon: LayoutDashboard, label: 'Beranda' },
    { to: '/mitra/laundry/pesanan',     icon: ClipboardList,   label: 'Pesanan' },
    { to: '/mitra/laundry/penghasilan', icon: TrendingUp,      label: 'Penghasilan' },
    { to: '/mitra/laundry/akun',        icon: UserCircle,      label: 'Akun' },
  ],
  mitra_catering: [
    { to: '/mitra/catering/dashboard',   icon: LayoutDashboard, label: 'Beranda' },
    { to: '/mitra/catering/pesanan',     icon: ClipboardList,   label: 'Pesanan' },
    { to: '/mitra/catering/penghasilan', icon: TrendingUp,      label: 'Penghasilan' },
    { to: '/mitra/catering/akun',        icon: UserCircle,      label: 'Akun' },
  ],
  mitra_kebersihan: [
    { to: '/mitra/kebersihan/dashboard',   icon: LayoutDashboard, label: 'Beranda' },
    { to: '/mitra/kebersihan/pesanan',     icon: ClipboardList,   label: 'Pesanan' },
    { to: '/mitra/kebersihan/penghasilan', icon: TrendingUp,      label: 'Penghasilan' },
    { to: '/mitra/kebersihan/akun',        icon: UserCircle,      label: 'Akun' },
  ],
  mitra_antar_barang: [
    { to: '/mitra/antar/dashboard',   icon: LayoutDashboard, label: 'Beranda' },
    { to: '/mitra/antar/pesanan',     icon: ClipboardList,   label: 'Pesanan' },
    { to: '/mitra/antar/penghasilan', icon: TrendingUp,      label: 'Penghasilan' },
    { to: '/mitra/antar/akun',        icon: UserCircle,      label: 'Akun' },
  ],
  pelanggan: [
    { to: '/pelanggan/dashboard', icon: LayoutDashboard, label: 'Beranda' },
    { to: '/pelanggan/ojek',      icon: Bike,            label: 'Ojek' },
    { to: '/pelanggan/jastip',    icon: Handshake,       label: 'Jastip' },
    { to: '/pelanggan/riwayat',   icon: History,         label: 'Riwayat' },
    { to: '/pelanggan/akun',      icon: UserCircle,      label: 'Akun' },
  ],
  penjual: [
    { to: '/penjual/dashboard', icon: LayoutDashboard, label: 'Beranda' },
    { to: '/penjual/produk',    icon: Package,         label: 'Produk' },
    { to: '/penjual/pesanan',   icon: ClipboardList,   label: 'Pesanan' },
    { to: '/penjual/laporan',   icon: TrendingUp,      label: 'Laporan' },
    { to: '/akun',              icon: UserCircle,      label: 'Akun' },
  ],
}

function getRoleNav(role) {
  if (navItems[role]) return navItems[role]
  if (role?.startsWith('mitra')) return navItems.mitra
  return []
}

export default function BottomNav({ role }) {
  const items = getRoleNav(role)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
      <div className="flex items-center justify-around" style={{ height: 60 }}>
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 flex-1 h-full px-0.5 transition-colors duration-150 ${
                isActive ? 'text-primary-600' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-primary-50' : ''}`}>
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <span className="text-[9px] font-medium leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
