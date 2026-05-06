import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Upload } from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../stores/authStore'

const JENIS_KENDARAAN = ['Motor', 'Mobil', 'Pick Up', 'Truck']
const JANGKAUAN_OPT   = ['Dalam Kota', 'Antar Kota', 'Antar Provinsi']

function ImageUpload({ label, value, onChange }) {
  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result)
    reader.readAsDataURL(file)
  }
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-primary-400 transition-colors">
        <Upload className="w-5 h-5 text-gray-400 shrink-0" />
        <span className="text-sm text-gray-500 truncate">{value ? '✓ Foto terupload' : 'Ketuk untuk upload foto'}</span>
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </label>
    </div>
  )
}

export default function DaftarMitraAntar() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '',
    password: '', password_confirmation: '',
    vehicle_type: 'Motor', vehicle_plate: '',
    kapasitas: '', jangkauan: 'Dalam Kota',
    ktp_image: '', sim_image: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const bio = JSON.stringify({
        kapasitas: form.kapasitas,
        jangkauan: form.jangkauan,
      })
      const { data } = await api.post('/register', {
        role:                  'mitra_antar_barang',
        name:                  form.name,
        email:                 form.email,
        phone:                 form.phone,
        address:               form.address,
        password:              form.password,
        password_confirmation: form.password_confirmation,
        vehicle_type:          form.vehicle_type,
        vehicle_plate:         form.vehicle_plate,
        ktp_image:             form.ktp_image || undefined,
        sim_image:             form.sim_image || undefined,
        bio,
      })
      setAuth(data.user, data.token)
      navigate('/mitra/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || Object.values(err.response?.data?.errors || {})[0]?.[0] || 'Registrasi gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-sm mx-auto">
        <Link to="/daftar" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>

        <div className="text-center mb-5">
          <div className="text-4xl mb-2">📦</div>
          <h1 className="text-xl font-black text-gray-900">Daftar Mitra Antar Barang</h1>
          <p className="text-gray-400 text-sm mt-1">Antar barang ke tujuan pelanggan ZashaGo</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5 text-sm text-amber-700">
          ⏳ Akun akan diverifikasi admin ZashaGo sebelum aktif
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { k: 'name',  label: 'Nama Lengkap', type: 'text',  ph: 'Nama lengkap' },
              { k: 'email', label: 'Email',          type: 'email', ph: 'contoh@email.com' },
              { k: 'phone', label: 'Nomor HP',       type: 'tel',   ph: '08xxxxxxxxxx' },
            ].map(({ k, label, type, ph }) => (
              <div key={k}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                <input type={type} className="input-field" placeholder={ph}
                  value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required />
              </div>
            ))}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alamat</label>
              <textarea className="input-field resize-none" rows={2} placeholder="Alamat domisili Anda"
                value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Jenis Kendaraan</label>
              <div className="grid grid-cols-2 gap-2">
                {JENIS_KENDARAAN.map((v) => (
                  <button key={v} type="button" onClick={() => setForm({ ...form, vehicle_type: v })}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                      form.vehicle_type === v ? 'bg-amber-500 text-white border-amber-500' : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nomor Plat Kendaraan</label>
              <input type="text" className="input-field uppercase" placeholder="AB 1234 CD"
                value={form.vehicle_plate} onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value.toUpperCase() })} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kapasitas Maks (kg)</label>
                <input type="number" min="1" className="input-field" placeholder="100"
                  value={form.kapasitas} onChange={(e) => setForm({ ...form, kapasitas: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jangkauan</label>
                <select className="input-field" value={form.jangkauan}
                  onChange={(e) => setForm({ ...form, jangkauan: e.target.value })}>
                  {JANGKAUAN_OPT.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <ImageUpload label="Foto KTP *" value={form.ktp_image} onChange={(v) => setForm({ ...form, ktp_image: v })} />
            <ImageUpload label="Foto STNK Kendaraan *" value={form.sim_image} onChange={(v) => setForm({ ...form, sim_image: v })} />

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input-field pr-11" placeholder="Min. 8 karakter"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Konfirmasi Password</label>
              <input type="password" className="input-field" placeholder="Ulangi password"
                value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} required />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2" style={{ background: '#f59e0b' }}>
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Daftar Sekarang'}
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
