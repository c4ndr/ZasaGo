import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './stores/authStore'

import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import Login          from './pages/Login'
import Akun           from './pages/Akun'
import DaftarPilih         from './pages/daftar/Pilih'
import DaftarPelanggan     from './pages/daftar/Pelanggan'
import DaftarMitra         from './pages/daftar/Mitra'
import DaftarPenjual       from './pages/daftar/Penjual'
import DaftarMitraUrut     from './pages/daftar/MitraUrut'
import DaftarMitraLaundry  from './pages/daftar/MitraLaundry'
import DaftarMitraCatering from './pages/daftar/MitraCatering'
import DaftarMitraKebersihan from './pages/daftar/MitraKebersihan'
import DaftarMitraAntar    from './pages/daftar/MitraAntar'

import AdminDashboard    from './pages/admin/Dashboard'
import AdminPesanan      from './pages/admin/Pesanan'
import AdminPengguna     from './pages/admin/Pengguna'
import AdminMitra        from './pages/admin/Mitra'
import AdminLayanan      from './pages/admin/Layanan'
import AdminPedagang     from './pages/admin/Pedagang'
import AdminKeuangan     from './pages/admin/Keuangan'
import AdminPengaturan      from './pages/admin/Pengaturan'
import AdminPengaturanOjek  from './pages/admin/PengaturanOjek'
import AdminPengaturanJastip from './pages/admin/PengaturanJastip'
import AdminKomisi           from './pages/admin/Komisi'
import AdminWallet           from './pages/admin/Wallet'

import MitraDashboard from './pages/mitra/Dashboard'
import MitraPesanan   from './pages/mitra/Pesanan'
import MitraAkun      from './pages/mitra/Akun'

import MitraOjekDashboard       from './pages/mitra/ojek/Dashboard'

import MitraUrutDashboard       from './pages/mitra/urut/Dashboard'
import MitraUrutPesanan         from './pages/mitra/urut/Pesanan'
import MitraUrutPenghasilan     from './pages/mitra/urut/Penghasilan'
import MitraUrutAkun            from './pages/mitra/urut/Akun'

import MitraLaundryDashboard    from './pages/mitra/laundry/Dashboard'
import MitraLaundryPesanan      from './pages/mitra/laundry/Pesanan'
import MitraLaundryPenghasilan  from './pages/mitra/laundry/Penghasilan'
import MitraLaundryAkun         from './pages/mitra/laundry/Akun'

import MitraCateringDashboard   from './pages/mitra/catering/Dashboard'
import MitraCateringPesanan     from './pages/mitra/catering/Pesanan'
import MitraCateringPenghasilan from './pages/mitra/catering/Penghasilan'
import MitraCateringAkun        from './pages/mitra/catering/Akun'

import MitraKebersihanDashboard   from './pages/mitra/kebersihan/Dashboard'
import MitraKebersihanPesanan     from './pages/mitra/kebersihan/Pesanan'
import MitraKebersihanPenghasilan from './pages/mitra/kebersihan/Penghasilan'
import MitraKebersihanAkun        from './pages/mitra/kebersihan/Akun'

import MitraAntarDashboard    from './pages/mitra/antar/Dashboard'
import MitraAntarPesanan      from './pages/mitra/antar/Pesanan'
import MitraAntarPenghasilan  from './pages/mitra/antar/Penghasilan'
import MitraAntarAkun         from './pages/mitra/antar/Akun'

import PelangganDashboard  from './pages/pelanggan/Dashboard'
import PelangganOjek       from './pages/pelanggan/Ojek'
import PelangganUrut       from './pages/pelanggan/Urut'
import PelangganProduk     from './pages/pelanggan/Produk'
import PelangganLaundry    from './pages/pelanggan/Laundry'
import PelangganCatering   from './pages/pelanggan/Catering'
import PelangganKebersihan from './pages/pelanggan/Kebersihan'
import PelangganAntarBarang from './pages/pelanggan/AntarBarang'
import PelangganRiwayat    from './pages/pelanggan/Riwayat'
import PelangganJastip     from './pages/pelanggan/Jastip'
import PelangganAkun       from './pages/pelanggan/Akun'

import PenjualDashboard from './pages/penjual/Dashboard'
import PenjualProduk    from './pages/penjual/Produk'
import PenjualPesanan   from './pages/penjual/Pesanan'
import PenjualLaporan   from './pages/penjual/Laporan'

function getMitraDashboard(role) {
  if (role === 'mitra_urut')        return '/mitra/urut/dashboard'
  if (role === 'mitra_laundry')     return '/mitra/laundry/dashboard'
  if (role === 'mitra_catering')    return '/mitra/catering/dashboard'
  if (role === 'mitra_kebersihan')  return '/mitra/kebersihan/dashboard'
  if (role === 'mitra_antar_barang') return '/mitra/antar/dashboard'
  return '/mitra/ojek/dashboard'
}

function RootRedirect() {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  const role = user.role
  if (role === 'admin')     return <Navigate to="/admin/dashboard"     replace />
  if (role === 'pelanggan') return <Navigate to="/pelanggan/dashboard" replace />
  if (role === 'penjual')   return <Navigate to="/penjual/dashboard"   replace />
  if (role?.startsWith('mitra')) return <Navigate to={getMitraDashboard(role)} replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"              element={<Login />} />
        <Route path="/daftar"             element={<DaftarPilih />} />
        <Route path="/daftar/pelanggan"       element={<DaftarPelanggan />} />
        <Route path="/daftar/mitra"           element={<DaftarMitra />} />
        <Route path="/daftar/mitra-urut"      element={<DaftarMitraUrut />} />
        <Route path="/daftar/mitra-laundry"   element={<DaftarMitraLaundry />} />
        <Route path="/daftar/mitra-catering"  element={<DaftarMitraCatering />} />
        <Route path="/daftar/mitra-kebersihan" element={<DaftarMitraKebersihan />} />
        <Route path="/daftar/mitra-antar"       element={<DaftarMitraAntar />} />
        <Route path="/daftar/penjual"         element={<DaftarPenjual />} />
        <Route path="/daftar-penjual"         element={<DaftarPenjual />} />
        <Route path="/"                   element={<RootRedirect />} />

        {/* ── Admin ─────────────────────────────────────────────────── */}
        <Route element={<ProtectedRoute roles={['admin']}><Layout /></ProtectedRoute>}>
          <Route path="/admin/dashboard"        element={<AdminDashboard />} />
          <Route path="/admin/pesanan"          element={<AdminPesanan />} />
          <Route path="/admin/pengguna"         element={<AdminPengguna />} />
          <Route path="/admin/mitra"            element={<AdminMitra />} />
          <Route path="/admin/layanan"          element={<AdminLayanan />} />
          <Route path="/admin/pedagang"         element={<AdminPedagang />} />
          <Route path="/admin/keuangan"         element={<AdminKeuangan />} />
          <Route path="/admin/pengaturan"         element={<AdminPengaturan />} />
          <Route path="/admin/pengaturan-ojek"  element={<AdminPengaturanOjek />} />
          <Route path="/admin/pengaturan-jastip" element={<AdminPengaturanJastip />} />
          <Route path="/admin/komisi"           element={<AdminKomisi />} />
          <Route path="/admin/wallet"           element={<AdminWallet />} />
          <Route path="/akun"                   element={<Akun />} />
        </Route>

        {/* ── Mitra (ojek / umum) ───────────────────────────────────── */}
        <Route element={<ProtectedRoute roles={['mitra']}><Layout /></ProtectedRoute>}>
          <Route path="/mitra/dashboard"   element={<MitraDashboard />} />
          <Route path="/mitra/ojek/dashboard" element={<MitraOjekDashboard />} />
          <Route path="/mitra/pesanan"     element={<MitraPesanan />} />
          <Route path="/mitra/akun"        element={<MitraAkun />} />

          {/* Urut */}
          <Route path="/mitra/urut/dashboard"    element={<MitraUrutDashboard />} />
          <Route path="/mitra/urut/pesanan"      element={<MitraUrutPesanan />} />
          <Route path="/mitra/urut/penghasilan"  element={<MitraUrutPenghasilan />} />
          <Route path="/mitra/urut/akun"         element={<MitraUrutAkun />} />

          {/* Laundry */}
          <Route path="/mitra/laundry/dashboard"    element={<MitraLaundryDashboard />} />
          <Route path="/mitra/laundry/pesanan"      element={<MitraLaundryPesanan />} />
          <Route path="/mitra/laundry/penghasilan"  element={<MitraLaundryPenghasilan />} />
          <Route path="/mitra/laundry/akun"         element={<MitraLaundryAkun />} />

          {/* Catering */}
          <Route path="/mitra/catering/dashboard"    element={<MitraCateringDashboard />} />
          <Route path="/mitra/catering/pesanan"      element={<MitraCateringPesanan />} />
          <Route path="/mitra/catering/penghasilan"  element={<MitraCateringPenghasilan />} />
          <Route path="/mitra/catering/akun"         element={<MitraCateringAkun />} />

          {/* Kebersihan */}
          <Route path="/mitra/kebersihan/dashboard"    element={<MitraKebersihanDashboard />} />
          <Route path="/mitra/kebersihan/pesanan"      element={<MitraKebersihanPesanan />} />
          <Route path="/mitra/kebersihan/penghasilan"  element={<MitraKebersihanPenghasilan />} />
          <Route path="/mitra/kebersihan/akun"         element={<MitraKebersihanAkun />} />

          {/* Antar Barang */}
          <Route path="/mitra/antar/dashboard"    element={<MitraAntarDashboard />} />
          <Route path="/mitra/antar/pesanan"      element={<MitraAntarPesanan />} />
          <Route path="/mitra/antar/penghasilan"  element={<MitraAntarPenghasilan />} />
          <Route path="/mitra/antar/akun"         element={<MitraAntarAkun />} />
        </Route>

        {/* ── Pelanggan ──────────────────────────────────────────────── */}
        <Route element={<ProtectedRoute roles={['pelanggan']}><Layout /></ProtectedRoute>}>
          <Route path="/pelanggan/dashboard"    element={<PelangganDashboard />} />
          <Route path="/pelanggan/ojek"         element={<PelangganOjek />} />
          <Route path="/pelanggan/urut"         element={<PelangganUrut />} />
          <Route path="/pelanggan/produk"       element={<PelangganProduk />} />
          <Route path="/pelanggan/laundry"      element={<PelangganLaundry />} />
          <Route path="/pelanggan/catering"     element={<PelangganCatering />} />
          <Route path="/pelanggan/kebersihan"   element={<PelangganKebersihan />} />
          <Route path="/pelanggan/antar-barang" element={<PelangganAntarBarang />} />
          <Route path="/pelanggan/jastip"       element={<PelangganJastip />} />
          <Route path="/pelanggan/riwayat"      element={<PelangganRiwayat />} />
          <Route path="/pelanggan/akun"         element={<PelangganAkun />} />
        </Route>

        {/* ── Penjual ────────────────────────────────────────────────── */}
        <Route element={<ProtectedRoute roles={['penjual']}><Layout /></ProtectedRoute>}>
          <Route path="/penjual/dashboard" element={<PenjualDashboard />} />
          <Route path="/penjual/produk"    element={<PenjualProduk />} />
          <Route path="/penjual/pesanan"   element={<PenjualPesanan />} />
          <Route path="/penjual/laporan"   element={<PenjualLaporan />} />
          <Route path="/akun"              element={<Akun />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
