import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Upload } from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../stores/authStore'

const JENIS_LAYANAN = ['Cuci Kering', 'Cuci Setrika', 'Setrika Saja', 'Laundry Kiloan', 'Laundry Satuan']
const ESTIMASI_OPT  = ['1 hari', '2 hari', '3 hari', '3-5 hari']

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

export default function DaftarMitraLaundry() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({
    name: '', store_name: '', email: '', phone: '', address: '',
    password: '', password_confirmation: '',
    harga_per_kg: '', estimasi: '1 hari', antar_jemput: true, ktp_image: '',
  })
  const [jenisLayanan, setJenisLayanan] = useState([])
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleJenis = (j) => setJenisLayanan((prev) =>
    prev.includes(j) ? prev.filter((x) => x !== j) : [...prev, j]
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const bio = JSON.stringify({
        jenis_layanan: jenisLayanan,
        harga_per_kg:  form.harga_per_kg,
        estimasi:      form.estimasi,
        antar_jemput:  form.antar_jemput,
      })
      const { data } = await api.post('/register', {
        role:                  'mitra_laundry',
        name:                  form.name,
        email:                 form.email,
        phone:                 form.phone,
        address:               form.address,
        password:              form.password,
        password_confirmation: form.password_confirmation,
        store_name:            form.store_name,
        ktp_image:             form.ktp_image || undefined,
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
          <div className="text-4xl mb-2">👕</div>
          <h1 className="text-xl font-black text-gray-900">Daftar Mitra Laundry</h1>
          <p className="text-gray-400 text-sm mt-1">Terima cucian & setrika pakaian pelanggan</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5 text-sm text-amber-700">
          ⏳ Akun akan diverifikasi admin ZashaGo sebelum aktif
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { k: 'name',       label: 'Nama Pemilik', type: 'text',  ph: 'Nama lengkap' },
              { k: 'store_name', label: 'Nama Usaha',   type: 'text',  ph: 'Laundry ...' },
              { k: 'email',      label: 'Email',         type: 'email', ph: 'contoh@email.com' },
              { k: 'phone',      label: 'Nomor HP',      type: 'tel',   ph: '08xxxxxxxxxx' },
            ].map(({ k, label, type, ph }) => (
              <div key={k}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                <input type={type} className="input-field" placeholder={ph}
                  value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required={k !== 'store_name'} />
              </div>
            ))}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alamat Laundry</label>
              <textarea className="input-field resize-none" rows={2} placeholder="Alamat lokasi laundry"
                value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Jenis Layanan</label>
              <div className="flex flex-wrap gap-2">
                {JENIS_LAYANAN.map((j) => (
                  <button key={j} type="button" onClick={() => toggleJenis(j)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      jenisLayanan.includes(j) ? 'bg-sky-500 text-white border-sky-500' : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                    {j}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Harga / Kg (Rp)</label>
                <input type="number" min="0" className="input-field" placeholder="5000"
                  value={form.harga_per_kg} onChange={(e) => setForm({ ...form, harga_per_kg: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Estimasi</label>
                <select className="input-field" value={form.estimasi}
                  onChange={(e) => setForm({ ...form, estimasi: e.target.value })}>
                  {ESTIMASI_OPT.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Antar Jemput?</label>
              <div className="flex gap-3">
                {[true, false].map((v) => (
                  <button key={String(v)} type="button" onClick={() => setForm({ ...form, antar_jemput: v })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                      form.antar_jemput === v ? 'bg-sky-500 text-white border-sky-500' : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                    {v ? 'Ya' : 'Tidak'}
                  </button>
                ))}
              </div>
            </div>

            <ImageUpload label="Foto KTP *" value={form.ktp_image} onChange={(v) => setForm({ ...form, ktp_image: v })} />

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

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2" style={{ background: '#0ea5e9' }}>
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
