import { useEffect, useState } from 'react'
import { MapPin, Navigation2, Package2, X, CreditCard, FileText, CheckCircle, ShoppingBag, Banknote, Map, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../../api/axios'
import MapPicker from '../../components/MapPicker'
import LoadingSpinner from '../../components/LoadingSpinner'
import JastipRouteMap from '../../components/JastipRouteMap'
import useSettings from '../../hooks/useSettings'
import { formatRupiah, hitungTarifJastip, haversineKm } from '../../utils/hargaUtils'

// ── Modal form titipan ─────────────────────────────────────────────────────
function FormTitipanModal({ sesi, onClose, onSubmit, settings }) {
  const [pickup, setPickup]           = useState(null)
  const [destination, setDestination] = useState(null)
  const [namaPesanan, setNamaPesanan] = useState('')
  const [hargaBarang, setHargaBarang] = useState('')
  const [jenis, setJenis]             = useState('')
  const [berat, setBerat]             = useState('')
  const [catatan, setCatatan]         = useState('')
  const [payment, setPayment]         = useState('tunai')
  const [loading, setLoading]         = useState(false)

  const distKm = pickup && destination
    ? haversineKm(pickup.lat, pickup.lng, destination.lat, destination.lng)
    : 0
  const hargaOngkir = distKm > 0 ? hitungTarifJastip(distKm, settings) : 0
  const totalBayar  = hargaOngkir + (parseFloat(hargaBarang) || 0)

  const handleSubmit = async () => {
    if (!namaPesanan.trim()) return alert('Isi nama/deskripsi pesanan terlebih dahulu')
    if (!pickup || !destination) return alert('Pilih titik jemput dan tujuan')
    if (distKm < 0.1)           return alert('Jarak terlalu dekat')
    setLoading(true)
    try {
      const res = await api.post('/titipan', {
        session_id:          sesi.id,
        pickup_address:      pickup.address,
        pickup_lat:          pickup.lat,
        pickup_lng:          pickup.lng,
        destination_address: destination.address,
        destination_lat:     destination.lat,
        destination_lng:     destination.lng,
        nama_pesanan:        namaPesanan.trim(),
        harga_barang:        hargaBarang ? parseFloat(hargaBarang) : undefined,
        jenis_barang:        jenis || undefined,
        berat_kg:            berat ? parseFloat(berat) : undefined,
        catatan:             catatan || undefined,
        payment_method:      payment,
      })
      onSubmit(res.data.order)
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal membuat titipan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-800">Buat Titipan</h3>
            <p className="text-[11px] text-fuchsia-600 mt-0.5">Mitra: {sesi.mitra?.name} · {sesi.slot_tersisa} slot tersisa</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* Info tarif — hanya tampil, tidak bisa diubah pelanggan */}
        <div className="bg-fuchsia-50 border border-fuchsia-100 rounded-xl px-3 py-2.5 space-y-1">
          <p className="text-[10px] font-bold text-fuchsia-600 uppercase tracking-wide">Tarif Platform</p>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Tarif dasar</span>
            <span className="font-medium">{formatRupiah(parseFloat(settings?.tarif_titipan_dasar ?? 5000))}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Per kilometer</span>
            <span className="font-medium">{formatRupiah(parseFloat(settings?.tarif_titipan_per_km ?? 2000))}</span>
          </div>
          <div className="flex justify-between text-xs text-fuchsia-600 font-semibold border-t border-fuchsia-100 pt-1 mt-1">
            <span>Diskon berbagi rute</span>
            <span>{settings?.diskon_titipjalan_persen ?? 2}%</span>
          </div>
          <p className="text-[9px] text-gray-400">Tarif ditentukan oleh platform, tidak dapat diubah</p>
        </div>

        {/* Detail pesanan */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 mb-1">
            <ShoppingBag className="w-4 h-4 text-fuchsia-500" />
            <p className="text-xs font-semibold text-gray-700">Detail Pesanan</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Nama / Deskripsi Pesanan <span className="text-red-500">*</span>
            </label>
            <input type="text" className="input-field text-sm" placeholder="Contoh: Nasi goreng 2 porsi, obat warung..."
              value={namaPesanan} onChange={(e) => setNamaPesanan(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1 flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5" /> Harga Barang (opsional)
            </label>
            <input type="number" min="0" step="500" className="input-field text-sm" placeholder="Harga item di toko, mis. 25000"
              value={hargaBarang} onChange={(e) => setHargaBarang(e.target.value)} />
            <p className="text-[10px] text-gray-400 mt-0.5">Mitra perlu tahu nilai barang yang akan dibeli/diambil</p>
          </div>
        </div>

        {/* Titik jemput */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <Navigation2 className="w-3 h-3 text-green-600" />
            </div>
            <p className="text-xs font-semibold text-gray-700">Titik Jemput / Toko</p>
          </div>
          <MapPicker label="" value={pickup} onChange={setPickup} />
        </div>

        {/* Titik tujuan */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
              <MapPin className="w-3 h-3 text-red-500" />
            </div>
            <p className="text-xs font-semibold text-gray-700">Tujuan Titipan</p>
          </div>
          <MapPicker label="" value={destination} onChange={setDestination} />
        </div>

        {/* Estimasi harga */}
        {distKm > 0 && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Ongkir ({distKm.toFixed(1)} km, diskon {settings?.diskon_titipjalan_persen ?? 2}%)</span>
              <span className="font-medium">{formatRupiah(hargaOngkir)}</span>
            </div>
            {hargaBarang > 0 && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Harga barang</span>
                <span className="font-medium">{formatRupiah(parseFloat(hargaBarang))}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-emerald-100 pt-1.5">
              <p className="text-xs font-semibold text-gray-700">Total estimasi</p>
              <p className="text-base font-bold text-emerald-600">{formatRupiah(totalBayar)}</p>
            </div>
          </div>
        )}

        {/* Info barang */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Jenis Barang</label>
            <input type="text" className="input-field text-sm" placeholder="Dokumen, makanan..."
              value={jenis} onChange={(e) => setJenis(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Berat (kg)</label>
            <input type="number" min="0.1" step="0.1" className="input-field text-sm" placeholder="Opsional"
              value={berat} onChange={(e) => setBerat(e.target.value)} />
          </div>
        </div>
        {sesi.max_berat_kg && (
          <p className="text-[10px] text-amber-600">⚠️ Mitra hanya terima maks. {sesi.max_berat_kg} kg</p>
        )}
        {sesi.jenis_barang_diterima && (
          <p className="text-[10px] text-gray-400">Jenis barang mitra: {sesi.jenis_barang_diterima}</p>
        )}

        {/* Pembayaran */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <CreditCard className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-semibold text-gray-700">Pembayaran</p>
          </div>
          <div className="flex gap-2">
            {['tunai','dompet_digital','transfer'].map((m) => (
              <button key={m} onClick={() => setPayment(m)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${payment === m ? 'bg-fuchsia-600 text-white border-fuchsia-600' : 'border-gray-200 text-gray-600'}`}>
                {m === 'tunai' ? 'Tunai' : m === 'dompet_digital' ? 'E-Wallet' : 'Transfer'}
              </button>
            ))}
          </div>
        </div>

        {/* Catatan */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <FileText className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-semibold text-gray-700">Catatan (opsional)</p>
          </div>
          <textarea className="input-field text-sm resize-none" rows={2}
            placeholder="Titip ke satpam depan, tolong hati-hati..."
            value={catatan} onChange={(e) => setCatatan(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-outline flex-1 text-sm">Batal</button>
          <button onClick={handleSubmit} disabled={loading || !pickup || !destination || distKm < 0.1}
            className="flex-1 text-sm py-2.5 rounded-xl font-semibold text-white disabled:opacity-50"
            style={{ background: '#a21caf' }}>
            {loading ? 'Memproses...' : 'Kirim Titipan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Halaman utama ──────────────────────────────────────────────────────────
export default function PelangganJastip() {
  const { settings } = useSettings()
  const [sesiList, setSesiList]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [selectedSesi, setSelectedSesi] = useState(null)
  const [order, setOrder]               = useState(null)
  const [expandedMap, setExpandedMap]   = useState(null)

  useEffect(() => {
    api.get('/jastip/sesi')
      .then((r) => setSesiList(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (order) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 bg-fuchsia-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-fuchsia-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Titipan Dibuat!</h2>
        <p className="text-sm text-gray-500 mb-4">Menunggu mitra konfirmasi titipanmu</p>
        <div className="card w-full max-w-sm text-left space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Kode</span>
            <span className="font-bold text-fuchsia-600">{order.order_code}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total</span>
            <span className="font-bold text-gray-800">{formatRupiah(order.total_price)}</span>
          </div>
        </div>
        <button onClick={() => setOrder(null)} className="w-full max-w-sm py-3 rounded-xl font-semibold text-white" style={{ background: '#a21caf' }}>
          Buat Titipan Lagi
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title mb-0">Jastip</h1>
        <p className="text-xs text-gray-400 mt-0.5">Titipkan paket searah rute mitra yang sedang aktif</p>
      </div>

      {/* Info tarif admin-only */}
      <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-2xl px-4 py-3">
        <p className="text-xs font-bold text-fuchsia-700 mb-1.5">Tarif Jastip Platform</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-sm font-bold text-fuchsia-600">{formatRupiah(parseFloat(settings?.tarif_titipan_dasar ?? 5000))}</p>
            <p className="text-[10px] text-gray-400">Tarif dasar</p>
          </div>
          <div>
            <p className="text-sm font-bold text-fuchsia-600">{formatRupiah(parseFloat(settings?.tarif_titipan_per_km ?? 2000))}</p>
            <p className="text-[10px] text-gray-400">Per km</p>
          </div>
          <div>
            <p className="text-sm font-bold text-fuchsia-600">{settings?.diskon_titipjalan_persen ?? 2}%</p>
            <p className="text-[10px] text-gray-400">Diskon rute</p>
          </div>
        </div>
      </div>

      {/* List sesi aktif */}
      {loading ? <LoadingSpinner /> : sesiList.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">🤝</p>
          <p className="text-sm font-medium">Belum ada mitra Jastip aktif</p>
          <p className="text-xs mt-1">Coba lagi beberapa saat nanti</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 font-medium">{sesiList.length} mitra aktif tersedia</p>
          {sesiList.map((sesi) => (
            <div key={sesi.id} className="card space-y-3">
              {/* Header mitra */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-fuchsia-100 rounded-full flex items-center justify-center">
                    <Package2 className="w-4.5 h-4.5 text-fuchsia-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{sesi.mitra?.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sesi.mode === 'hybrid' ? 'bg-fuchsia-100 text-fuchsia-600' : 'bg-gray-100 text-gray-500'}`}>
                      {sesi.mode === 'hybrid' ? '🔀 Hybrid' : '📦 Jastip Murni'}
                    </span>
                  </div>
                </div>
                {/* Slot badge */}
                <div className={`text-center px-2.5 py-1 rounded-xl ${sesi.slot_tersisa > 0 ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
                  <p className={`text-sm font-bold ${sesi.slot_tersisa > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{sesi.slot_tersisa}</p>
                  <p className="text-[9px] text-gray-400">slot</p>
                </div>
              </div>

              {/* Rute teks */}
              <div className="bg-gray-50 rounded-xl p-2.5 space-y-1.5">
                <div className="flex gap-2 items-start">
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[8px] text-white font-bold">A</span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-1">{sesi.asal_address}</p>
                </div>
                <div className="border-l-2 border-dashed border-gray-200 ml-[7px] h-3" />
                <div className="flex gap-2 items-start">
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[8px] text-white font-bold">B</span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-1">{sesi.tujuan_address}</p>
                </div>
              </div>

              {/* Tombol lihat rute di peta */}
              {sesi.asal_lat && sesi.tujuan_lat && (
                <button
                  onClick={() => setExpandedMap(expandedMap === sesi.id ? null : sesi.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium border border-fuchsia-200 text-fuchsia-700 bg-fuchsia-50 hover:bg-fuchsia-100 transition-colors">
                  <Map className="w-3.5 h-3.5" />
                  {expandedMap === sesi.id ? 'Sembunyikan Peta' : 'Lihat Area Coverage di Peta'}
                  {expandedMap === sesi.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}

              {/* Peta rute koridor */}
              {expandedMap === sesi.id && (
                <div>
                  <JastipRouteMap
                    asalLat={parseFloat(sesi.asal_lat)}
                    asalLng={parseFloat(sesi.asal_lng)}
                    tujuanLat={parseFloat(sesi.tujuan_lat)}
                    tujuanLng={parseFloat(sesi.tujuan_lng)}
                    radiusMeter={sesi.radius_meter || 300}
                  />
                  <p className="text-[10px] text-fuchsia-600 text-center mt-1.5">
                    🟣 Area ungu = titipan yang akan diterima (radius {sesi.radius_meter}m dari rute)
                  </p>
                </div>
              )}

              {/* Info kapasitas */}
              <div className="flex gap-2 flex-wrap text-[10px] text-gray-500">
                <span className="bg-gray-100 px-2 py-0.5 rounded-lg">📏 Radius {sesi.radius_meter}m</span>
                {sesi.max_berat_kg && <span className="bg-gray-100 px-2 py-0.5 rounded-lg">⚖️ Maks {sesi.max_berat_kg}kg</span>}
                {sesi.jenis_barang_diterima && <span className="bg-gray-100 px-2 py-0.5 rounded-lg">📦 {sesi.jenis_barang_diterima}</span>}
              </div>

              {sesi.slot_tersisa > 0 ? (
                <button onClick={() => setSelectedSesi(sesi)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: '#a21caf' }}>
                  Titipkan ke Mitra Ini
                </button>
              ) : (
                <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center text-gray-400 bg-gray-100">
                  Slot Penuh
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedSesi && (
        <FormTitipanModal
          sesi={selectedSesi}
          settings={settings}
          onClose={() => setSelectedSesi(null)}
          onSubmit={(o) => { setSelectedSesi(null); setOrder(o) }}
        />
      )}
    </div>
  )
}
