import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Upload } from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../stores/authStore'

const JENIS_MASAKAN = ['Masakan Padang', 'Masakan Jawa', 'Masakan Sunda', 'Chinese Food', 'Western', 'Lainnya']
const JENIS_ACARA   = ['Pernikahan', 'Arisan', 'Rapat', 'Harian', 'Lainnya']

function ImageUpload({ label, value, onChange, required }) {
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

export default function DaftarMitraCatering() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({
    name: '', store_name: '', email: '', phone: '', address: '',
    password: '', password_confirmation: '',
    min_order: '', harga_mulai: '', ktp_image: '', sim_image: '',
  })
  const [masakan, setMasakan]   = useState([])
  const [acara, setAcara]       = useState([])
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const toggle = (arr, setter, v) => setter((prev) =>
    prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const bio = JSON.stringify({
        jenis_masakan: masakan,
        jenis_acara:   acara,
        min_order:     form.min_order,
        harga_mulai:   form.harga_mulai,
      })
      const { data } = await api.post('/register', {
        role:                  'mitra_catering',
        name:                  form.name,
        email:                 form.email,
        phone:                 form.phone,
        address:               form.address,
        password:              form.password,
        password_confirmation: form.password_confirmation,
        store_name:            form.store_name,
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
          <div className="text-4xl mb-2">🍱</div>
          <h1 className="text-xl font-black text-gray-900">Daftar Mitra Catering</h1>
          <p className="text-gray-400 text-sm mt-1">Sajikan makanan lezat untuk pelanggan ZashaGo</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5 text-sm text-amber-700">
          ⏳ Akun akan diverifikasi admin ZashaGo sebelum aktif
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { k: 'name',       label: 'Nama Pemilik',      type: 'text',  ph: 'Nama lengkap' },
              { k: 'store_name', label: 'Nama Usaha Catering', type: 'text', ph: 'Catering ...' },
              { k: 'email',      label: 'Email',              type: 'email', ph: 'contoh@email.com' },
              { k: 'phone',      label: 'Nomor HP',           type: 'tel',   ph: '08xxxxxxxxxx' },
            ].map(({ k, label, type, ph }) => (
              <div key={k}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                <input type={type} className="input-field" placeholder={ph}
                  value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required={k !== 'store_name'} />
              </div>
            ))}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alamat Dapur / Produksi</label>
              <textarea className="input-field resize-none" rows={2} placeholder="Alamat dapur produksi"
                value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Jenis Masakan</label>
              <div className="flex flex-wrap gap-2">
                {JENIS_MASAKAN.map((j) => (
                  <button key={j} type="button" onClick={() => toggle(masakan, setMasakan, j)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      masakan.includes(j) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                    {j}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Min. Order (porsi)</label>
                <input type="number" min="1" className="input-field" placeholder="10"
                  value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Harga/Porsi (Rp)</label>
                <input type="number" min="0" className="input-field" placeholder="15000"
                  value={form.harga_mulai} onChange={(e) => setForm({ ...form, harga_mulai: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Melayani Acara</label>
              <div className="flex flex-wrap gap-2">
                {JENIS_ACARA.map((j) => (
                  <button key={j} type="button" onClick={() => toggle(acara, setAcara, j)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      acara.includes(j) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                    {j}
                  </button>
                ))}
              </div>
            </div>

            <ImageUpload label="Foto KTP *" value={form.ktp_image} onChange={(v) => setForm({ ...form, ktp_image: v })} />
            <ImageUpload label="Foto Contoh Masakan (opsional)" value={form.sim_image} onChange={(v) => setForm({ ...form, sim_image: v })} />

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

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2" style={{ background: '#10b981' }}>
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
