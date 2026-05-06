import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import api from '../api/axios'
import useAuthStore from '../stores/authStore'

const getRedirectByRole = (role) => {
  if (role === 'admin')              return '/admin/dashboard'
  if (role === 'pelanggan')          return '/pelanggan/dashboard'
  if (role === 'penjual')            return '/penjual/dashboard'
  if (role === 'mitra_urut')         return '/mitra/urut/dashboard'
  if (role === 'mitra_laundry')      return '/mitra/laundry/dashboard'
  if (role === 'mitra_catering')     return '/mitra/catering/dashboard'
  if (role === 'mitra_kebersihan')   return '/mitra/kebersihan/dashboard'
  if (role === 'mitra_antar_barang') return '/mitra/antar/dashboard'
  if (role === 'mitra')              return '/mitra/ojek/dashboard'
  if (role?.startsWith('mitra'))     return '/mitra/dashboard'
  return '/login'
}

const DEMO_FALLBACK = {
  pelanggan: { login: 'pelanggan@godesa.id', password: 'password' },
  mitra:     { login: 'ojek@godesa.id',      password: 'password' },
  admin:     { login: 'admin@godesa.id',      password: 'password' },
  penjual:   { login: 'penjual@godesa.id',   password: 'password' },
}

const roleConfig = {
  pelanggan: { label: 'Pelanggan', desc: 'Pesan ojek, urut & belanja' },
  penjual:   { label: 'Penjual',   desc: 'Jual produk di ZashaGo' },
  mitra:     { label: 'Mitra',     desc: 'Terima pesanan & kelola layanan' },
  admin:     { label: 'Admin',     desc: 'Kelola platform ZashaGo' },
}

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [selectedRole, setSelectedRole] = useState('pelanggan')
  const [form, setForm] = useState({ login: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fillDemo = () => {
    const acc = DEMO_FALLBACK[selectedRole]
    if (acc) setForm({ login: acc.login, password: acc.password })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/login', form)
      setAuth(data.user, data.token)
      navigate(getRedirectByRole(data.user.role), { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Email/No HP atau password salah.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div style={{ position:'absolute', width:400, height:400, background:'rgba(76,59,207,0.06)', borderRadius:'50%', top:-100, right:-100 }} />
        <div style={{ position:'absolute', width:300, height:300, background:'rgba(189,180,255,0.08)', borderRadius:'50%', bottom:-80, left:-80 }} />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #4C3BCF, #6C5CE7)' }}>
            <span className="text-white font-black text-3xl leading-none">Z</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">ZashaGo</h1>
          <p className="text-gray-400 text-sm mt-1 font-medium">Ojek · Urut · Belanja</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-7 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Masuk ke Akun</h2>

          {/* Pilihan Role */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-5">
            {Object.entries(roleConfig).map(([key, cfg]) => (
              <button key={key} type="button" onClick={() => setSelectedRole(key)}
                className={`flex-1 py-1.5 rounded-xl text-[11px] font-semibold transition-all duration-200 ${
                  selectedRole === key ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {cfg.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-400 mb-4 text-center">{roleConfig[selectedRole].desc}</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email / Nomor HP</label>
              <input type="text" className="input-field" placeholder="contoh@email.com atau 08xxxxxxxx"
                value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} required autoFocus />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input-field pr-11"
                  placeholder="Masukkan password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-1">
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : 'Masuk'
              }
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-300">atau</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Tombol Daftar yang jelas */}
          <Link to="/daftar"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-primary-600 text-primary-600 font-semibold text-sm hover:bg-primary-50 transition-colors">
            Daftar Akun Baru
          </Link>

          {/* Demo fill */}
          <button type="button" onClick={fillDemo}
            className="mt-3 w-full text-xs text-center text-gray-400 hover:text-primary-600 font-medium py-2 rounded-xl hover:bg-gray-50 transition-colors">
            Isi otomatis akun demo {roleConfig[selectedRole].label}
          </button>
        </div>

        <p className="text-center text-xs text-gray-300 mt-4">© 2025 ZashaGo Platform</p>
      </div>
    </div>
  )
}
