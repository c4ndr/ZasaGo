import { useState } from 'react'
import { ChefHat, CheckCircle, CreditCard, Calendar } from 'lucide-react'
import api from '../../api/axios'
import { formatRupiah } from '../../utils/hargaUtils'

const ACARA = ['Pernikahan', 'Ulang Tahun', 'Arisan', 'Meeting/Rapat', 'Syukuran', 'Lainnya']

export default function PelangganCatering() {
  const [form, setForm] = useState({
    jenis_acara: 'Arisan',
    jumlah_porsi: '10',
    harga_per_porsi: '25000',
    delivery_address: '',
    event_date: '',
    menu_notes: '',
    notes: '',
    payment_method: 'tunai',
  })
  const [loading, setLoading] = useState(false)
  const [order, setOrder]     = useState(null)

  const total = parseInt(form.jumlah_porsi || 0) * parseFloat(form.harga_per_porsi || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/catering/pesanan', {
        ...form,
        jumlah_porsi:    parseInt(form.jumlah_porsi),
        harga_per_porsi: parseFloat(form.harga_per_porsi),
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
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Pesanan Catering Dibuat!</h2>
        <p className="text-sm text-gray-500 mb-4">Mitra catering akan segera mengonfirmasi</p>
        <div className="card w-full max-w-sm text-left space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Kode</span>
            <span className="font-bold text-emerald-600">{order.order_code}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Acara</span>
            <span className="font-medium">{order.jenis_acara}</span>
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
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
          <ChefHat className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Catering</h1>
          <p className="text-sm text-gray-400">Pesan makanan untuk acara Anda</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="card space-y-4">
          <div>
            <label className="label">Jenis Acara</label>
            <div className="grid grid-cols-3 gap-2">
              {ACARA.map((a) => (
                <button type="button" key={a} onClick={() => setForm({ ...form, jenis_acara: a })}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border transition-colors ${form.jenis_acara === a ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Jumlah Porsi</label>
              <input type="number" min="1" className="input-field"
                value={form.jumlah_porsi} onChange={(e) => setForm({ ...form, jumlah_porsi: e.target.value })} required />
            </div>
            <div>
              <label className="label">Harga/Porsi (Rp)</label>
              <input type="number" min="5000" step="1000" className="input-field"
                value={form.harga_per_porsi} onChange={(e) => setForm({ ...form, harga_per_porsi: e.target.value })} required />
            </div>
          </div>

          {total > 0 && (
            <div className="bg-emerald-50 rounded-xl p-3 flex justify-between items-center">
              <span className="text-sm text-emerald-700">Estimasi Total</span>
              <span className="font-bold text-emerald-800">{formatRupiah(total)}</span>
            </div>
          )}

          <div>
            <label className="label">Alamat Pengiriman</label>
            <textarea className="input-field resize-none text-sm" rows={2}
              placeholder="Alamat lengkap pengiriman catering..."
              value={form.delivery_address} onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              <label className="label mb-0">Tanggal & Waktu Acara</label>
            </div>
            <input type="datetime-local" className="input-field"
              value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
          </div>

          <div>
            <label className="label">Permintaan Menu (opsional)</label>
            <textarea className="input-field resize-none text-sm" rows={2}
              placeholder="Contoh: nasi tumpeng, ayam bakar, dll..."
              value={form.menu_notes} onChange={(e) => setForm({ ...form, menu_notes: e.target.value })} />
          </div>

          <div>
            <label className="label">Catatan Tambahan (opsional)</label>
            <textarea className="input-field resize-none text-sm" rows={2}
              placeholder="Contoh: tidak ada bawang merah..."
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
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${form.payment_method === m ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600'}`}>
                  {m === 'tunai' ? 'Tunai' : m === 'dompet_digital' ? 'E-Wallet' : 'Transfer'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? 'Memproses...' : 'Buat Pesanan Catering'}
        </button>
      </form>
    </div>
  )
}
