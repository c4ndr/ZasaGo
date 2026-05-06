import { useState } from 'react'
import { Sparkles, CheckCircle, CreditCard, Calendar, MapPin } from 'lucide-react'
import api from '../../api/axios'
import { formatRupiah } from '../../utils/hargaUtils'

const LAYANAN = ['Bersih-bersih Rumah', 'Cuci Kaca / Jendela', 'Bersih Kamar Mandi', 'Setrika Massal', 'Bersih Kantor', 'Bersih Pasca Renovasi']
const DURASI = ['1', '2', '3', '4', '5', '6']

export default function PelangganKebersihan() {
  const [form, setForm] = useState({
    jenis_layanan: 'Bersih-bersih Rumah',
    durasi_jam: '2',
    harga_per_jam: '50000',
    service_address: '',
    schedule_date: '',
    notes: '',
    payment_method: 'tunai',
  })
  const [loading, setLoading] = useState(false)
  const [order, setOrder]     = useState(null)

  const total = parseFloat(form.durasi_jam || 0) * parseFloat(form.harga_per_jam || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/kebersihan/pesanan', {
        ...form,
        durasi_jam:    parseFloat(form.durasi_jam),
        harga_per_jam: parseFloat(form.harga_per_jam),
      })
      setOrder(res.data.order)
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membuat pesanan')
    } finally {
      setLoading(false)
    }
  }

  if (order) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-violet-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Pesanan Dibuat!</h2>
        <p className="text-sm text-gray-500 mb-4">Mitra kebersihan akan segera mengonfirmasi</p>
        <div className="card w-full max-w-sm text-left space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Kode</span>
            <span className="font-bold text-violet-600">{order.order_code}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Layanan</span>
            <span className="font-medium">{order.jenis_layanan}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total</span>
            <span className="font-bold">{formatRupiah(order.total_price)}</span>
          </div>
        </div>
        <button onClick={() => setOrder(null)} className="btn-primary w-full max-w-sm">Pesan Lagi</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Kebersihan</h1>
          <p className="text-sm text-gray-400">Jasa bersih-bersih profesional</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="card space-y-4">
          <div>
            <label className="label">Jenis Layanan</label>
            <div className="grid grid-cols-2 gap-2">
              {LAYANAN.map((l) => (
                <button type="button" key={l} onClick={() => setForm({ ...form, jenis_layanan: l })}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors text-left ${form.jenis_layanan === l ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 text-gray-600'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Durasi (jam)</label>
              <div className="grid grid-cols-3 gap-1">
                {DURASI.map((d) => (
                  <button type="button" key={d} onClick={() => setForm({ ...form, durasi_jam: d })}
                    className={`py-2 rounded-xl text-xs font-medium border transition-colors ${form.durasi_jam === d ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 text-gray-600'}`}>
                    {d}j
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Harga/jam (Rp)</label>
              <input type="number" min="10000" step="5000" className="input-field"
                value={form.harga_per_jam} onChange={(e) => setForm({ ...form, harga_per_jam: e.target.value })} required />
            </div>
          </div>

          {total > 0 && (
            <div className="bg-violet-50 rounded-xl p-3 flex justify-between items-center">
              <span className="text-sm text-violet-700">Estimasi Total</span>
              <span className="font-bold text-violet-800">{formatRupiah(total)}</span>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MapPin className="w-4 h-4 text-gray-400" />
              <label className="label mb-0">Alamat Layanan</label>
            </div>
            <textarea className="input-field resize-none text-sm" rows={2}
              placeholder="Alamat lengkap tempat yang akan dibersihkan..."
              value={form.service_address} onChange={(e) => setForm({ ...form, service_address: e.target.value })}
              required />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              <label className="label mb-0">Jadwal (opsional)</label>
            </div>
            <input type="datetime-local" className="input-field"
              value={form.schedule_date} onChange={(e) => setForm({ ...form, schedule_date: e.target.value })} />
          </div>

          <div>
            <label className="label">Catatan (opsional)</label>
            <textarea className="input-field resize-none text-sm" rows={2}
              placeholder="Contoh: fokus di kamar tidur utama..."
              value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <label className="label mb-0">Pembayaran</label>
            </div>
            <div className="flex gap-2">
              {['tunai', 'dompet_digital', 'transfer'].map((m) => (
                <button type="button" key={m} onClick={() => setForm({ ...form, payment_method: m })}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${form.payment_method === m ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 text-gray-600'}`}>
                  {m === 'tunai' ? 'Tunai' : m === 'dompet_digital' ? 'E-Wallet' : 'Transfer'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? 'Memproses...' : 'Buat Pesanan Kebersihan'}
        </button>
      </form>
    </div>
  )
}
