import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, Upload, CheckCircle } from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../stores/authStore'

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function ImageUpload({ label, value, onChange, hint }) {
  const ref = useRef()
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <button type="button" onClick={() => ref.current.click()}
        className={`w-full border-2 border-dashed rounded-xl py-4 px-3 flex flex-col items-center gap-2 transition-colors ${
          value ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/50'
        }`}>
        {value ? (
          <img src={value} alt={label} className="h-24 object-contain rounded-lg" />
        ) : (
          <>
            <Upload className="w-6 h-6 text-gray-300" />
            <p className="text-xs text-gray-400">{hint || 'Klik untuk upload foto'}</p>
          </>
        )}
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={async (e) => { if (e.target.files[0]) onChange(await toBase64(e.target.files[0])) }} />
    </div>
  )
}

export default function DaftarMitra() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', password_confirmation: '',
    address: '', vehicle_type: 'Motor', vehicle_plate: '',
    ktp_image: '', sim_image: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: typeof e === 'string' ? e : e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.password_confirmation) { setError('Konfirmasi password tidak cocok'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/register', { ...form, role: 'mitra' })
      setAuth(data.user, data.token)
      navigate('/mitra/dashboard', { replace: true })
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
          <div className="text-4xl mb-2">🛵</div>
          <h1 className="text-2xl font-black text-gray-900">Daftar Mitra Ojek</h1>
          <p className="text-gray-400 text-sm mt-1">Bergabung dan mulai menghasilkan</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Data Diri</p>

            <Field label="Nama Lengkap *" value={form.name} onChange={set('name')} placeholder="Nama lengkap Anda" required />
            <Field label="Email *" type="email" value={form.email} onChange={set('email')} placeholder="email@contoh.com" required />
            <Field label="Nomor HP *" type="tel" value={form.phone} onChange={set('phone')} placeholder="08xxxxxxxxxx" required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat</label>
              <textarea className="input-field resize-none" rows={2} value={form.address} onChange={set('address')} placeholder="Alamat lengkap Anda" />
            </div>

            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pt-2">Kendaraan</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Jenis Kendaraan *</label>
              <select className="input-field" value={form.vehicle_type} onChange={set('vehicle_type')} required>
                <option value="Motor">Motor</option>
                <option value="Mobil">Mobil</option>
              </select>
            </div>

            <Field label="Nomor Plat Kendaraan *" value={form.vehicle_plate} onChange={set('vehicle_plate')} placeholder="cth: AB 1234 CD" required />

            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pt-2">Dokumen</p>

            <ImageUpload label="Foto KTP" value={form.ktp_image} onChange={(v) => setForm((p) => ({ ...p, ktp_image: v }))} hint="Upload foto KTP (JPG/PNG)" />
            <ImageUpload label="Foto SIM" value={form.sim_image} onChange={(v) => setForm((p) => ({ ...p, sim_image: v }))} hint="Upload foto SIM (JPG/PNG)" />

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

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              ⏳ Akun mitra perlu verifikasi admin sebelum dapat menerima pesanan.
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><CheckCircle className="w-5 h-5" /> Daftar Sebagai Mitra</>
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
