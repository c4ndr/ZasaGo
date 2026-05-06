import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Store, ArrowLeft } from 'lucide-react'
import api from '../api/axios'
import useAuthStore from '../stores/authStore'

export default function RegisterPenjual() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', password_confirmation: '',
    address: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.password_confirmation) {
      setError('Konfirmasi password tidak cocok')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/register', { ...form, role: 'penjual' })
      setAuth(data.user, data.token)
      navigate('/penjual/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || Object.values(err.response?.data?.errors || {})[0]?.[0] || 'Registrasi gagal.')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'name',    label: 'Nama Toko / Nama Lengkap', placeholder: 'cth: Toko Berkah Jaya', type: 'text' },
    { key: 'email',   label: 'Email',                     placeholder: 'email@toko.com',         type: 'email' },
    { key: 'phone',   label: 'Nomor HP / WhatsApp',       placeholder: '08xxxxxxxxxx',           type: 'tel' },
    { key: 'address', label: 'Alamat Toko',                placeholder: 'Jl. ..., Desa ...',      type: 'text' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div style={{ position:'absolute', width:400, height:400, background:'rgba(76,59,207,0.06)', borderRadius:'50%', top:-100, right:-100 }} />
        <div style={{ position:'absolute', width:300, height:300, background:'rgba(189,180,255,0.08)', borderRadius:'50%', bottom:-80, left:-80 }} />
      </div>

      <div className="w-full max-w-sm relative">
        <button onClick={() => navigate('/login')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Login
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #4C3BCF, #6C5CE7)' }}>
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Daftar Sebagai Penjual</h1>
          <p className="text-gray-400 text-sm mt-1">Mulai berjualan di ZashaGo</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                <input
                  type={type}
                  className="input-field"
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  required={key !== 'address'}
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-11"
                  placeholder="Min. 8 karakter"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Ulangi password"
                value={form.password_confirmation}
                onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                required
              />
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : '🏪 Daftar Sekarang'
              }
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-300 mt-4">© 2025 ZashaGo Platform</p>
      </div>
    </div>
  )
}
