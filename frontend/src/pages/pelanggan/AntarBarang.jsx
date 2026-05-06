import { useState } from 'react'
import { Package, CheckCircle, CreditCard } from 'lucide-react'
import api from '../../api/axios'
import MapPicker from '../../components/MapPicker'
import RouteMap from '../../components/RouteMap'
import { formatRupiah, hitungTarifAntar } from '../../utils/hargaUtils'
import useSettings from '../../hooks/useSettings'

export default function PelangganAntarBarang() {
  const { settings } = useSettings()
  const [step, setStep]             = useState(1)
  const [pickup, setPickup]         = useState(null)
  const [destination, setDestination] = useState(null)
  const [routeInfo, setRouteInfo]   = useState(null)
  const [form, setForm]             = useState({ jenis_barang: '', berat_kg: '', notes: '', payment_method: 'tunai' })
  const [loading, setLoading]       = useState(false)
  const [order, setOrder]           = useState(null)

  const distKm = routeInfo?.distKm ?? 0
  const harga  = distKm > 0 ? hitungTarifAntar(distKm, settings) : 0

  const handleSubmit = async () => {
    if (!pickup || !destination || distKm < 0.1) return
    setLoading(true)
    try {
      const res = await api.post('/antar/pesanan', {
        pickup_address:        pickup.address,
        pickup_latitude:       pickup.lat,
        pickup_longitude:      pickup.lng,
        destination_address:   destination.address,
        destination_latitude:  destination.lat,
        destination_longitude: destination.lng,
        distance_km:           parseFloat(distKm.toFixed(2)),
        jenis_barang:          form.jenis_barang,
        berat_kg:              form.berat_kg ? parseFloat(form.berat_kg) : undefined,
        notes:                 form.notes,
        payment_method:        form.payment_method,
      })
      setOrder(res.data.order)
      setStep(5)
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membuat pesanan')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep(1); setPickup(null); setDestination(null)
    setRouteInfo(null); setOrder(null); setForm({ jenis_barang: '', berat_kg: '', notes: '', payment_method: 'tunai' })
  }

  if (step === 5 && order) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Pesanan Dibuat!</h2>
        <p className="text-sm text-gray-500 mb-4">Mencari pengantar untuk barang kamu...</p>
        <div className="card w-full max-w-sm text-left space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Kode</span>
            <span className="font-bold text-amber-600">{order.order_code}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Jarak</span>
            <span className="font-medium">{distKm.toFixed(1)} km</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total</span>
            <span className="font-bold">{formatRupiah(order.total_price)}</span>
          </div>
        </div>
        <button onClick={reset} className="btn-primary w-full max-w-sm">Pesan Lagi</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Antar Barang</h1>
          <p className="text-sm text-gray-400">Kirim barang ke mana saja</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-2">
        {['Pickup', 'Tujuan', 'Detail', 'Konfirmasi'].map((label, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step > i + 1 ? 'bg-emerald-500 text-white' : step === i + 1 ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`text-[10px] ${step === i + 1 ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>{label}</span>
            {i < 3 && <div className={`h-0.5 w-4 ${step > i + 1 ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="card space-y-4">
          <p className="font-semibold text-gray-800 text-sm">Titik Pengambilan Barang</p>
          <MapPicker label="" value={pickup} onChange={setPickup} />
          <button onClick={() => pickup && setStep(2)} disabled={!pickup} className="btn-primary w-full disabled:opacity-50">
            Lanjut ke Tujuan
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card space-y-4">
          <p className="font-semibold text-gray-800 text-sm">Tujuan Pengiriman</p>
          <MapPicker label="" value={destination} onChange={setDestination} />
          {pickup && destination && (
            <div>
              <p className="text-xs text-gray-500 mb-1 font-medium">Rute Pengiriman</p>
              <RouteMap pickup={pickup} destination={destination} onRoute={setRouteInfo} />
              {routeInfo && (
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">{routeInfo.distKm.toFixed(1)} km</span>
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-lg">~{routeInfo.durMin} menit</span>
                  <span className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-lg font-semibold">{formatRupiah(harga)}</span>
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="btn-outline flex-1">Kembali</button>
            <button onClick={() => destination && routeInfo && setStep(3)} disabled={!destination || !routeInfo} className="btn-primary flex-1 disabled:opacity-50">
              Lanjut
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card space-y-4">
          <p className="font-semibold text-gray-800 text-sm">Detail Barang</p>
          <div>
            <label className="label">Jenis Barang (opsional)</label>
            <input type="text" className="input-field text-sm" placeholder="Contoh: paket, makanan, dokumen..."
              value={form.jenis_barang} onChange={(e) => setForm({ ...form, jenis_barang: e.target.value })} />
          </div>
          <div>
            <label className="label">Berat Barang (kg, opsional)</label>
            <input type="number" min="0.1" step="0.1" className="input-field text-sm"
              placeholder="Estimasi berat"
              value={form.berat_kg} onChange={(e) => setForm({ ...form, berat_kg: e.target.value })} />
          </div>
          <div>
            <label className="label">Catatan (opsional)</label>
            <textarea className="input-field resize-none text-sm" rows={2}
              placeholder="Contoh: barang mudah pecah, hati-hati..."
              value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="btn-outline flex-1">Kembali</button>
            <button onClick={() => setStep(4)} className="btn-primary flex-1">Konfirmasi</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <div className="card space-y-3">
            <p className="font-semibold text-gray-800 text-sm">Ringkasan Pengiriman</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p><span className="text-gray-400">Dari:</span> {pickup?.address}</p>
              <p><span className="text-gray-400">Ke:</span> {destination?.address}</p>
              {form.jenis_barang && <p><span className="text-gray-400">Barang:</span> {form.jenis_barang}</p>}
            </div>
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <div className="flex-1 text-center">
                <p className="text-lg font-bold text-gray-800">{distKm.toFixed(1)}</p>
                <p className="text-[10px] text-gray-400">km</p>
              </div>
              <div className="w-px bg-gray-100" />
              <div className="flex-1 text-center">
                <p className="text-lg font-bold text-gray-800">{routeInfo?.durMin}</p>
                <p className="text-[10px] text-gray-400">menit</p>
              </div>
              <div className="w-px bg-gray-100" />
              <div className="flex-1 text-center">
                <p className="text-lg font-bold text-amber-600">{formatRupiah(harga)}</p>
                <p className="text-[10px] text-gray-400">total</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <p className="font-semibold text-gray-800 text-sm">Pembayaran</p>
            </div>
            <div className="flex gap-2">
              {['tunai', 'dompet_digital', 'transfer'].map((m) => (
                <button type="button" key={m} onClick={() => setForm({ ...form, payment_method: m })}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${form.payment_method === m ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 text-gray-600'}`}>
                  {m === 'tunai' ? 'Tunai' : m === 'dompet_digital' ? 'E-Wallet' : 'Transfer'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(3)} className="btn-outline flex-1">Kembali</button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
              {loading ? 'Memproses...' : 'Pesan Sekarang'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
