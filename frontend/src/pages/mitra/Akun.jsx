import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Mail, Phone, MapPin, Lock, LogOut,
  Edit3, ChevronRight, X, Eye, EyeOff,
  Bell, HelpCircle, FileText, ClipboardList,
  CheckCircle, Moon, Headphones, AlertCircle,
  Bike, ShieldCheck, ShieldAlert, Power,
} from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../stores/authStore'

function Spin() {
  return <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
}

function Toggle({ on, onToggle }) {
  return (
    <button onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${on ? 'bg-primary-600' : 'bg-gray-200'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

export default function MitraAkun() {
  const { user, logout, setUser } = useAuthStore()
  const navigate = useNavigate()

  const [modal, setModal]       = useState(null)   // 'edit' | 'password'
  const [toast, setToast]       = useState(null)
  const [loading, setLoading]   = useState(false)
  const [syncing, setSyncing]   = useState(true)
  const [notifOn, setNotifOn]   = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const [togglingOnline, setTogglingOnline] = useState(false)

  const [editForm, setEditForm] = useState({
    name: '', phone: '', address: '', gender: '', birth_date: '',
  })
  const [passForm, setPassForm] = useState({
    current_password: '', password: '', password_confirmation: '',
  })
  const [showPass, setShowPass] = useState({})
  const [mitraProfile, setMitraProfile] = useState(null)

  useEffect(() => {
    api.get('/profil')
      .then(({ data }) => {
        setUser(data)
        setMitraProfile(data.mitra_profile || null)
        setIsOnline(data.mitra_profile?.is_available ?? false)
        setEditForm({
          name:       data.name       || '',
          phone:      data.phone      || '',
          address:    data.address    || '',
          gender:     data.gender     || '',
          birth_date: data.birth_date ? String(data.birth_date).substring(0, 10) : '',
        })
      })
      .catch(console.error)
      .finally(() => setSyncing(false))
  }, [])

  const profileComplete = user?.name && user?.phone && user?.address

  const showToast = (ok, text) => {
    setToast({ ok, text })
    setTimeout(() => setToast(null), 3000)
  }

  const handleLogout = async () => {
    try { await api.post('/logout') } catch (_) {}
    logout()
    navigate('/login', { replace: true })
  }

  const handleEditProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/profil', editForm)
      setUser(data.user)
      setEditForm({
        name:       data.user.name       || '',
        phone:      data.user.phone      || '',
        address:    data.user.address    || '',
        gender:     data.user.gender     || '',
        birth_date: data.user.birth_date ? String(data.user.birth_date).substring(0, 10) : '',
      })
      showToast(true, 'Profil berhasil diperbarui')
      setModal(null)
    } catch (err) {
      showToast(false, err.response?.data?.message || 'Gagal memperbarui profil')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passForm.password !== passForm.password_confirmation) {
      showToast(false, 'Konfirmasi password tidak cocok')
      return
    }
    setLoading(true)
    try {
      await api.post('/ganti-password', passForm)
      showToast(true, 'Password berhasil diubah')
      setPassForm({ current_password: '', password: '', password_confirmation: '' })
      setModal(null)
    } catch (err) {
      showToast(false, err.response?.data?.message || 'Gagal mengubah password')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleOnline = async () => {
    setTogglingOnline(true)
    try {
      const { data } = await api.patch('/mitra/toggle-online')
      setIsOnline(data.is_available)
      showToast(true, data.is_online ? 'Status: Online — siap menerima pesanan' : 'Status: Offline')
    } catch (_) {
      setIsOnline((v) => !v)
      showToast(false, 'Gagal mengubah status online')
    } finally {
      setTogglingOnline(false)
    }
  }

  const toggleShow = (k) => setShowPass((p) => ({ ...p, [k]: !p[k] }))

  const genderLabel = { pria: 'Pria', wanita: 'Wanita' }
  const isVerified  = mitraProfile?.is_verified ?? false

  const infoFields = [
    { icon: User,          label: 'Nama Lengkap',    value: user?.name },
    { icon: Mail,          label: 'Email',            value: user?.email },
    { icon: Phone,         label: 'Nomor HP',         value: user?.phone },
    { icon: MapPin,        label: 'Alamat',           value: user?.address },
    { icon: User,          label: 'Jenis Kelamin',    value: genderLabel[user?.gender] },
    { icon: ClipboardList, label: 'Tanggal Lahir',    value: user?.birth_date ? new Date(user.birth_date).toLocaleDateString('id-ID', { dateStyle: 'long' }) : null },
    { icon: Bike,          label: 'Jenis Kendaraan',  value: mitraProfile?.vehicle_type },
    { icon: Bike,          label: 'Nomor Plat',       value: mitraProfile?.vehicle_plate },
  ].filter((f) => f.value)

  return (
    <div className="pb-4">
      {/* ── Header Curved ─────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4C3BCF 0%, #6C5CE7 100%)',
          borderBottomLeftRadius: '50px 25px',
          borderBottomRightRadius: '50px 25px',
          position: 'relative', overflow: 'hidden',
        }}
        className="-mx-4 -mt-5 md:-mx-6 md:-mt-6 px-5 pt-8 pb-10 mb-5"
      >
        {[
          { w:220, h:220, top:-80,  right:-50, bg:'rgba(255,255,255,0.07)' },
          { w:140, h:140, top:30,   right:100, bg:'rgba(189,180,255,0.12)' },
          { w:80,  h:80,  bottom:0, left:30,   bg:'rgba(255,255,255,0.05)' },
          { w:55,  h:55,  top:15,   left:60,   bg:'rgba(189,180,255,0.18)' },
        ].map((s, i) => (
          <div key={i} style={{ position:'absolute', borderRadius:'50%', pointerEvents:'none', background: s.bg, ...s }} />
        ))}

        <div className="relative z-10 flex flex-col items-center text-center">
          <div style={{ background: 'rgba(255,255,255,0.2)', boxShadow: '0 0 0 4px rgba(255,255,255,0.3)' }}
            className="w-24 h-24 rounded-full flex items-center justify-center mb-4">
            <span className="text-white font-black text-4xl leading-none select-none">
              {user?.name?.[0]?.toUpperCase()}
            </span>
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight leading-tight">{user?.name}</h1>

          {/* Verification badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-2 ${
            isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {isVerified
              ? <><ShieldCheck className="w-3 h-3" /> Terverifikasi</>
              : <><ShieldAlert className="w-3 h-3" /> Menunggu Verifikasi</>
            }
          </span>

          <div className="flex flex-col gap-1 mt-3">
            <p className="text-purple-200 text-sm">{user?.email}</p>
            {user?.phone && <p className="text-purple-300 text-xs">{user.phone}</p>}
          </div>

          {/* Online/Offline toggle */}
          <button
            onClick={handleToggleOnline}
            disabled={togglingOnline}
            className={`mt-4 flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm transition-all ${
              isOnline
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40'
                : 'bg-white/20 text-white border border-white/30'
            }`}
          >
            <Power className="w-4 h-4" />
            {togglingOnline ? 'Mengubah...' : isOnline ? 'Online — Aktif' : 'Offline'}
          </button>
        </div>
      </div>

      {/* ── Toast ───────────────────────────────────────────────── */}
      {toast && (
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium mb-4 ${
          toast.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          <CheckCircle className={`w-4 h-4 shrink-0 ${toast.ok ? 'text-emerald-500' : 'text-red-400'}`} />
          {toast.text}
        </div>
      )}

      {/* ── Banner verifikasi pending ───────────────────────────── */}
      {!syncing && !isVerified && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Akun belum terverifikasi</p>
            <p className="text-xs text-amber-600">Admin sedang memproses verifikasi dokumen Anda</p>
          </div>
        </div>
      )}

      {/* ── Banner profil tidak lengkap ─────────────────────────── */}
      {!syncing && !profileComplete && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 mb-4">
          <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-800">Lengkapi profil Anda</p>
            <p className="text-xs text-blue-600">Isi nomor HP dan alamat lengkap</p>
          </div>
          <button onClick={() => setModal('edit')}
            className="text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 px-2.5 py-1 rounded-lg transition-colors">
            Lengkapi
          </button>
        </div>
      )}

      {/* ── Informasi Akun ─────────────────────────────────────── */}
      <section className="card mb-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Informasi Akun</p>
        <div className="space-y-3">
          {infoFields.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400 leading-none mb-0.5">{label}</p>
                <p className="text-sm font-medium text-gray-700 truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pengaturan Akun ─────────────────────────────────────── */}
      <section className="card mb-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Pengaturan Akun</p>
        <div className="divide-y divide-gray-50">
          {[
            { icon: Edit3, label: 'Edit Profil',    sub: 'Ubah nama, HP, alamat & lebih', onClick: () => setModal('edit') },
            { icon: Lock,  label: 'Ganti Password', sub: 'Keamanan akun',                 onClick: () => setModal('password') },
          ].map(({ icon: Icon, label, sub, onClick }) => (
            <button key={label} onClick={onClick}
              className="flex items-center gap-3 w-full py-3 first:pt-1 last:pb-1 hover:bg-gray-50 active:bg-gray-100 -mx-1 px-1 rounded-xl transition-colors group">
              <div className="w-9 h-9 bg-primary-50 group-hover:bg-primary-100 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                <Icon className="w-4 h-4 text-primary-600" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </button>
          ))}

          <div className="flex items-center gap-3 w-full py-3">
            <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-primary-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-800">Notifikasi</p>
              <p className="text-xs text-gray-400">Push notifikasi aktif</p>
            </div>
            <Toggle on={notifOn} onToggle={() => setNotifOn((v) => !v)} />
          </div>

          <div className="flex items-center gap-3 w-full py-3">
            <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
              <Moon className="w-4 h-4 text-primary-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-800">Mode Gelap</p>
              <p className="text-xs text-gray-400">Tampilan gelap / terang</p>
            </div>
            <Toggle on={darkMode} onToggle={() => setDarkMode((v) => !v)} />
          </div>
        </div>
      </section>

      {/* ── Lainnya ─────────────────────────────────────────────── */}
      <section className="card mb-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Lainnya</p>
        <div className="divide-y divide-gray-50">
          {[
            { icon: ClipboardList, label: 'Riwayat Pesanan',   sub: 'Lihat semua pesanan masuk',  onClick: () => navigate('/mitra/pesanan') },
            { icon: Headphones,   label: 'Hubungi CS',         sub: 'Bantuan 24 jam',              onClick: () => showToast(true, 'Hubungi CS ZashaGo di 0800-000-ZASHA') },
            { icon: HelpCircle,   label: 'FAQ',                sub: 'Pertanyaan umum mitra',       onClick: () => showToast(true, 'FAQ ZashaGo segera hadir') },
            { icon: FileText,     label: 'Syarat & Ketentuan', sub: 'Privasi & kebijakan mitra',   onClick: () => showToast(true, 'Syarat & Ketentuan ZashaGo') },
          ].map(({ icon: Icon, label, sub, onClick }) => (
            <button key={label} onClick={onClick}
              className="flex items-center gap-3 w-full py-3 first:pt-1 last:pb-1 hover:bg-gray-50 active:bg-gray-100 -mx-1 px-1 rounded-xl transition-colors group">
              <div className="w-9 h-9 bg-primary-50 group-hover:bg-primary-100 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                <Icon className="w-4 h-4 text-primary-600" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </button>
          ))}
        </div>
      </section>

      <p className="text-center text-xs text-gray-300 mb-5">ZashaGo v1.0.0 · © 2025</p>

      {/* ── Tombol Logout ─────────────────────────────────────────── */}
      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base
          bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-lg shadow-red-200 transition-all">
        <LogOut className="w-5 h-5" />
        Keluar dari ZashaGo
      </button>

      {/* ════ MODAL EDIT PROFIL ════════════════════════════════════ */}
      {modal === 'edit' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
                  <Edit3 className="w-4 h-4 text-primary-600" />
                </div>
                <h3 className="font-bold text-gray-800">Edit Profil</h3>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditProfile} className="px-6 py-5 space-y-4">
              {[
                { k: 'name',    label: 'Nama Lengkap', type: 'text', ph: 'Nama lengkap' },
                { k: 'phone',   label: 'Nomor HP',     type: 'tel',  ph: '08xxxxxxxxxx' },
              ].map(({ k, label, type, ph }) => (
                <div key={k}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                  <input type={type} className="input-field" placeholder={ph}
                    value={editForm[k]} onChange={(e) => setEditForm({ ...editForm, [k]: e.target.value })} required={k === 'name'} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alamat</label>
                <textarea className="input-field resize-none" rows={3} placeholder="Alamat lengkap Anda"
                  value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jenis Kelamin</label>
                  <select className="input-field" value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}>
                    <option value="">— Pilih —</option>
                    <option value="pria">Pria</option>
                    <option value="wanita">Wanita</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tgl Lahir</label>
                  <input type="date" className="input-field" value={editForm.birth_date}
                    onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                    max={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? <Spin /> : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ MODAL GANTI PASSWORD ═════════════════════════════════ */}
      {modal === 'password' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center"><Lock className="w-4 h-4 text-primary-600" /></div>
                <h3 className="font-bold text-gray-800">Ganti Password</h3>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="px-6 py-5 space-y-4">
              {[
                { k: 'current_password',      label: 'Password Lama',            ph: 'Masukkan password lama' },
                { k: 'password',              label: 'Password Baru',            ph: 'Min. 8 karakter' },
                { k: 'password_confirmation', label: 'Konfirmasi Password Baru', ph: 'Ulangi password baru' },
              ].map(({ k, label, ph }) => (
                <div key={k}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                  <div className="relative">
                    <input type={showPass[k] ? 'text' : 'password'} className="input-field pr-11"
                      placeholder={ph} value={passForm[k]}
                      onChange={(e) => setPassForm({ ...passForm, [k]: e.target.value })} required />
                    <button type="button" onClick={() => toggleShow(k)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass[k] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? <Spin /> : 'Ganti Password'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
