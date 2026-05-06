import { useEffect, useState } from 'react'
import { HandHeart, Clock, MapPin } from 'lucide-react'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function PelangganUrut() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ address: '', scheduled_at: '', payment_method: 'tunai', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/urut/layanan')
      .then((r) => setServices(r.data.data || r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleBook = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { data } = await api.post('/urut/pesanan', {
        service_id: selected.id,
        ...form,
      })
      setSuccess(data.order)
      setSelected(null)
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal membuat pesanan.')
    } finally {
      setSubmitting(false)
    }
  }

  const minDateTime = new Date(Date.now() + 60 * 60 * 1000)
    .toISOString().slice(0, 16)

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-5xl mb-4">💆</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Pesanan Diterima!</h2>
        <p className="text-gray-400 text-sm mb-1">Kode: <strong className="text-primary-600">{success.order_code}</strong></p>
        <p className="text-gray-400 text-sm mb-6">Mitra akan segera menghubungi Anda.</p>
        <button onClick={() => setSuccess(null)} className="btn-primary">Pesan Lagi</button>
      </div>
    )
  }

  if (selected) {
    return (
      <div>
        <button onClick={() => setSelected(null)} className="text-sm text-primary-600 mb-4 flex items-center gap-1">
          ← Kembali
        </button>
        <div className="card mb-5 border-l-4 border-l-pink-400">
          <p className="font-bold text-gray-800">{selected.name}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{selected.duration_minutes} menit</span>
            <span className="font-semibold text-primary-600">Rp {Number(selected.price).toLocaleString('id')}</span>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

        <form onSubmit={handleBook} className="space-y-4">
          <div className="card space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <MapPin className="w-4 h-4 text-red-500 inline mr-1" />
                Alamat Layanan
              </label>
              <textarea
                className="input-field resize-none"
                rows={2}
                placeholder="Masukkan alamat lengkap..."
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Clock className="w-4 h-4 text-blue-500 inline mr-1" />
                Jadwal
              </label>
              <input
                type="datetime-local"
                className="input-field"
                min={minDateTime}
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Metode Pembayaran</label>
              <select className="input-field" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                <option value="tunai">💵 Tunai</option>
                <option value="dompet_digital">📱 Dompet Digital</option>
                <option value="transfer">🏦 Transfer Bank</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan (opsional)</label>
              <textarea className="input-field resize-none" rows={2} placeholder="Catatan khusus..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : '💆 Pesan Sekarang'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center">
          <HandHeart className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Layanan Urut</h1>
          <p className="text-sm text-gray-400">Pijat tradisional ke rumah Anda</p>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : services.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">💆</p>
          <p className="text-sm">Belum ada layanan tersedia</p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center shrink-0">
                  <HandHeart className="w-6 h-6 text-pink-500" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{service.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{service.mitra?.name}</p>
                  {service.description && <p className="text-xs text-gray-500 mt-1">{service.description}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{service.duration_minutes} menit</span>
                    <span className="font-bold text-primary-600">Rp {Number(service.price).toLocaleString('id')}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelected(service)}
                className="btn-primary w-full mt-4 text-sm"
              >
                Pesan
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
