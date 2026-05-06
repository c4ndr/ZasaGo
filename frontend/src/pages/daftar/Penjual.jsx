import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../stores/authStore'

const KATEGORI = ['Makanan', 'Minuman', 'Kebutuhan Rumah', 'Elektronik', 'Fashion', 'Pertanian', 'Lainnya']

export default function DaftarPenjual() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({
    name: '', store_name: '', email: '', phone: '',
    password: '', password_confirmation: '',
    address: '', store_desc: '', kategori: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.password_confirmation) { setError('Konfirmasi password tidak cocok'); return }
    setLoading(true)
    try {
      const payload = {
        ...form,
        role: 'penjual',
        store_desc: [form.store_desc, form.kategori].filter(Boolean).join(' | Kategori: '),
      }
      const { data } = await api.post('/register', payload)
      setAuth(data.user, data.token)
      navigate('/penjual/dashboard', { replace: true })
    } catch (err) {
      const errs = err.response?.data?.errors
      setError(errs ? Object.values(errs)[0][0] : err.response?.data?.message || 'Registrasi gagal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-sm mx-auto">
        <Link to="/daftar" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Pilih jenis akun
        </Link>

        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🏪</div>
          <h1 className="text-2xl font-black text-gray-900">Daftar Pedagang</h1>
          <p className="text-gray-400 text-sm mt-1">Jualan lebih mudah bersama ZashaGo</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Data Pemilik</p>

            <Field label="Nama Pemilik *" value={form.name} onChange={set('name')} placeholder="Nama lengkap pemilik" required />
            <Field label="Email *" type="email" value={form.email} onChange={set('email')} placeholder="email@toko.com" required />
            <Field label="Nomor HP / WhatsApp *" type="tel" value={form.phone} onChange={set('phone')} placeholder="08xxxxxxxxxx" required />

            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pt-2">Info Toko</p>

            <Field label="Nama Toko *" value={form.store_name} onChange={set('store_name')} placeholder="cth: Toko Berkah Jaya" required />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori Produk *</label>
              <select className="input-field" value={form.kategori} onChange={set('kategori')} required>
                <option value="">— Pilih Kategori —</option>
                {KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat Toko *</label>
              <textarea className="input-field resize-none" rows={2} value={form.address} onChange={set('address')} placeholder="Jl. ..., Desa ..." required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi Toko</label>
              <textarea className="input-field resize-none" rows={2} value={form.store_desc} onChange={set('store_desc')} placeholder="Ceritakan tentang toko Anda..." />
            </div>

            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pt-2">Keamanan</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input-field pr-11"
                  placeholder="Min. 8 karakter" value={form.password} onChange={set('password')} required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Field label="Konfirmasi Password *" type="password" value={form.password_confirmation} onChange={set('password_confirmation')} placeholder="Ulangi password" required />

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><CheckCircle className="w-5 h-5" /> Daftar Sekarang</>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 mt-4">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-primary-600 font-semibold hover:underline">Masuk</Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', required = false }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input type={type} className="input-field" placeholder={placeholder} value={value} onChange={onChange} required={required} />
    </div>
  )
}
