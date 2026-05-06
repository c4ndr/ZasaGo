import { useState } from 'react'
import { Shirt, CheckCircle, CreditCard } from 'lucide-react'
import api from '../../api/axios'
import { formatRupiah } from '../../utils/hargaUtils'

const LAYANAN = ['Cuci & Setrika', 'Cuci Saja', 'Setrika Saja', 'Cuci Kering (Dry Clean)', 'Sepatu / Tas']
const ESTIMASI = ['1 hari', '2 hari', '3 hari', '5-7 hari']

export default function PelangganLaundry() {
  const [form, setForm] = useState({
    jenis_layanan: 'Cuci & Setrika',
    berat_kg: '1',
    harga_per_kg: '7000',
    pickup_address: '',
    notes: '',
    payment_method: 'tunai',
  })
  const [loading, setLoading]   = useState(false)
  const [order, setOrder]       = useState(null)

  const total = parseFloat(form.berat_kg || 0) * parseFloat(form.harga_per_kg || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/laundry/pesanan', {
        ...form,
        berat_kg:     parseFloat(form.berat_kg),
        harga_per_kg: parseFloat(form.harga_per_kg),
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
        <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-sky-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Pesanan Laundry Dibuat!</h2>
        <p className="text-sm text-gray-500 mb-4">Menunggu mitra laundry mengonfirmasi</p>
        <div className="card w-full max-w-sm text-left space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Kode</span>
            <span className="font-bold text-sky-600">{order.order_code}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Layanan</span>
            <span className="font-medium">{order.jenis_layanan}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Estimasi</span>
            <span className="font-medium">{formatRupiah(order.total_price)}</span>
          </div>
        </div>
        <button onClick={() => setOrder(null)} className="btn-primary w-full max-w-sm">Pesan Lagi</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center">
          <Shirt className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Laundry</h1>
          <p className="text-sm text-gray-400">Antar jemput pakaian bersih</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="card space-y-4">
          <div>
            <label className="label">Jenis Layanan</label>
            <div className="grid grid-cols-2 gap-2">
              {LAYANAN.map((l) => (
                <button type="button" key={l} onClick={() => setForm({ ...form, jenis_layanan: l })}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors text-left ${form.jenis_layanan === l ? 'bg-sky-600 text-white border-sky-600' : 'border-gray-200 text-gray-600'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Berat (kg)</label>
              <input type="number" min="0.5" step="0.5" className="input-field"
                value={form.berat_kg} onChange={(e) => setForm({ ...form, berat_kg: e.target.value })} required />
            </div>
            <div>
              <label className="label">Harga/kg (Rp)</label>
              <input type="number" min="1000" step="500" className="input-field"
                value={form.harga_per_kg} onChange={(e) => setForm({ ...form, harga_per_kg: e.target.value })} required />
            </div>
          </div>

          {total > 0 && (
            <div className="bg-sky-50 rounded-xl p-3 flex justify-between items-center">
              <span className="text-sm text-sky-700">Estimasi Total</span>
              <span className="font-bold text-sky-800">{formatRupiah(total)}</span>
            </div>
          )}

          <div>
            <label className="label">Alamat Pickup (opsional)</label>
            <textarea className="input-field resize-none text-sm" rows={2}
              placeholder="Alamat jemput pakaian..."
              value={form.pickup_address} onChange={(e) => setForm({ ...form, pickup_address: e.target.value })} />
          </div>

          <div>
            <label className="label">Catatan (opsional)</label>
            <textarea className="input-field resize-none text-sm" rows={2}
              placeholder="Contoh: ada noda bandel di baju merah..."
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
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${form.payment_method === m ? 'bg-sky-600 text-white border-sky-600' : 'border-gray-200 text-gray-600'}`}>
                  {m === 'tunai' ? 'Tunai' : m === 'dompet_digital' ? 'E-Wallet' : 'Transfer'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? 'Memproses...' : 'Buat Pesanan Laundry'}
        </button>
      </form>
    </div>
  )
}
