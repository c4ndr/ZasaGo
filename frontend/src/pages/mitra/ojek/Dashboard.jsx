import { useEffect, useState, useCallback, useRef } from 'react'
import { Bike, MapPin, Navigation2, Wallet, Package2, ChevronDown, ChevronUp, X, Lock, Info, PlusCircle, ImageIcon, Clock } from 'lucide-react'
import api from '../../../api/axios'
import useAuthStore from '../../../stores/authStore'
import useSettings from '../../../hooks/useSettings'
import StatusBadge from '../../../components/StatusBadge'
import LoadingSpinner from '../../../components/LoadingSpinner'
import { formatRupiah } from '../../../utils/hargaUtils'

const STATUS_AKTIF_OJEK = ['driver_ditemukan', 'menuju_pickup', 'pelanggan_dijemput', 'dalam_perjalanan']

// ── Modal Isi Saldo ────────────────────────────────────────────────────────
function IsiSaldoModal({ onClose, onDone }) {
  const [amount, setAmount]   = useState('')
  const [bukti, setBukti]     = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef(null)

  const QUICK = [20000, 50000, 100000, 200000, 500000]

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setBukti(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = async () => {
    const num = parseFloat(amount)
    if (!num || num < 10000) return alert('Minimal topup Rp 10.000')
    setLoading(true)
    try {
      const form = new FormData()
      form.append('amount', num)
      if (bukti) form.append('bukti_transfer', bukti)
      await api.post('/wallet/topup', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      onDone()
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal mengirim permintaan')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-800">Isi Saldo Wallet</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Transfer ke rekening ZashaGo, lalu upload bukti</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* Info rekening */}
        <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-3 space-y-1.5">
          <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wide">Rekening ZashaGo</p>
          <p className="text-sm font-bold text-gray-800">BCA — 1234567890</p>
          <p className="text-xs text-gray-600">a/n ZashaGo Platform</p>
          <p className="text-[10px] text-gray-400 mt-1">Transfer sesuai jumlah tepat, lalu upload bukti di bawah</p>
        </div>

        {/* Jumlah */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-2">Jumlah Isi Saldo</label>
          <div className="flex gap-1.5 flex-wrap mb-2">
            {QUICK.map((q) => (
              <button key={q} type="button" onClick={() => setAmount(String(q))}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  amount === String(q) ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:border-primary-300'
                }`}>
                {formatRupiah(q)}
              </button>
            ))}
          </div>
          <input type="number" min="10000" step="1000" className="input-field text-sm"
            placeholder="Atau ketik jumlah lain (min Rp 10.000)"
            value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>

        {/* Upload bukti */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-2">
            Bukti Transfer <span className="text-gray-400 font-normal">(opsional, tapi disarankan)</span>
          </label>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          {preview ? (
            <div className="relative">
              <img src={preview} alt="preview" className="w-full max-h-48 object-cover rounded-xl border border-gray-200" />
              <button onClick={() => { setBukti(null); setPreview(null); fileRef.current.value = '' }}
                className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-200">
                <X className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              className="w-full flex flex-col items-center gap-2 py-5 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors">
              <ImageIcon className="w-6 h-6" />
              <p className="text-xs font-medium">Tap untuk upload foto bukti transfer</p>
              <p className="text-[10px]">JPG, PNG, WEBP maks 5MB</p>
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-outline flex-1 text-sm">Batal</button>
          <button onClick={handleSubmit} disabled={loading || !amount}
            className="btn-primary flex-1 text-sm disabled:opacity-50">
            {loading ? 'Mengirim...' : 'Kirim Permintaan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal Riwayat Topup ────────────────────────────────────────────────────
function RiwayatTopupModal({ onClose }) {
  const [list, setList]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/wallet/topup')
      .then((r) => setList(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const STATUS_COLOR = {
    pending:   'bg-amber-100 text-amber-700',
    disetujui: 'bg-emerald-100 text-emerald-700',
    ditolak:   'bg-red-100 text-red-700',
  }
  const STATUS_LABEL = { pending: 'Menunggu', disetujui: 'Disetujui', ditolak: 'Ditolak' }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800">Riwayat Isi Saldo</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        {loading ? <LoadingSpinner /> : list.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Wallet className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Belum ada riwayat topup</p>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((r) => (
              <div key={r.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-bold text-primary-700">{formatRupiah(r.amount)}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLOR[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(r.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
                {r.admin_note && (
                  <p className={`text-[10px] mt-1.5 px-2 py-1 rounded-lg ${r.status === 'ditolak' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
                    {r.admin_note}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Modal Buka Sesi Jastip ─────────────────────────────────────────────────
function BukaSesiModal({ onClose, onBuka, activeOrder }) {
  const hasActiveOrder = !!activeOrder
  const [form, setForm] = useState({
    mode: activeOrder ? 'hybrid' : 'murni',
    asal_address: '', asal_lat: '', asal_lng: '',
    tujuan_address: '', tujuan_lat: '', tujuan_lng: '',
    max_berat_kg: '', jenis_barang_diterima: '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // Auto-fill tujuan dari order ojek aktif
  const pakaiTujuanOjek = () => {
    if (!activeOrder) return
    setForm((f) => ({
      ...f,
      tujuan_address: activeOrder.destination_address || '',
      tujuan_lat:     activeOrder.destination_latitude?.toString()  || '',
      tujuan_lng:     activeOrder.destination_longitude?.toString() || '',
    }))
  }

  const handleBuka = async () => {
    if (!form.asal_address || !form.tujuan_address || !form.asal_lat || !form.tujuan_lat) {
      alert('Isi semua koordinat rute terlebih dahulu')
      return
    }
    setSaving(true)
    try {
      await api.post('/titipjalan/sesi', {
        mode:                  form.mode,
        asal_address:          form.asal_address,
        asal_lat:              parseFloat(form.asal_lat),
        asal_lng:              parseFloat(form.asal_lng),
        tujuan_address:        form.tujuan_address,
        tujuan_lat:            parseFloat(form.tujuan_lat),
        tujuan_lng:            parseFloat(form.tujuan_lng),
        max_berat_kg:          form.max_berat_kg ? parseFloat(form.max_berat_kg) : undefined,
        jenis_barang_diterima: form.jenis_barang_diterima || undefined,
      })
      onBuka()
    } catch (e) { alert(e.response?.data?.message || 'Gagal membuka sesi') }
    finally { setSaving(false) }
  }

  const isiLokasiSaya = (field) => {
    if (!navigator.geolocation) return alert('Browser tidak support GPS')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        if (field === 'asal') {
          set('asal_lat', latitude.toString())
          set('asal_lng', longitude.toString())
          if (!form.asal_address) set('asal_address', `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
        } else {
          set('tujuan_lat', latitude.toString())
          set('tujuan_lng', longitude.toString())
          if (!form.tujuan_address) set('tujuan_address', `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
        }
      },
      () => alert('Tidak bisa ambil lokasi. Pastikan izin GPS aktif.')
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Buka Sesi Jastip</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* Mode */}
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Mode Sesi</p>
          {hasActiveOrder ? (
            <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-xl px-3 py-2 text-[11px] text-fuchsia-700 mb-2">
              🛵 Kamu sedang menjalankan orderan ojek. Pilih <strong>Hybrid</strong> agar diskon ongkir otomatis diberikan ke pelanggan master.
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[11px] text-amber-700 mb-2">
              ⚠️ Tidak ada orderan ojek aktif. Mode Hybrid tidak tersedia — hanya <strong>Jastip Murni</strong>.
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => set('mode', 'murni')}
              className={`p-3 rounded-2xl text-left border-2 transition-all ${form.mode === 'murni' ? 'border-fuchsia-500 bg-fuchsia-50' : 'border-gray-100'}`}>
              <p className={`text-xs font-bold ${form.mode === 'murni' ? 'text-fuchsia-700' : 'text-gray-600'}`}>Jastip Murni</p>
              <p className="text-[10px] text-gray-400">Fokus cari titipan saja</p>
            </button>
            <button type="button"
              onClick={() => hasActiveOrder && set('mode', 'hybrid')}
              disabled={!hasActiveOrder}
              className={`p-3 rounded-2xl text-left border-2 transition-all ${!hasActiveOrder ? 'opacity-40 cursor-not-allowed border-gray-100' : form.mode === 'hybrid' ? 'border-fuchsia-500 bg-fuchsia-50' : 'border-gray-100'}`}>
              <p className={`text-xs font-bold ${form.mode === 'hybrid' ? 'text-fuchsia-700' : 'text-gray-600'}`}>Hybrid</p>
              <p className="text-[10px] text-gray-400">Ojek + boleh titipan</p>
            </button>
          </div>
        </div>

        {/* Rute Asal */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
              <Navigation2 className="w-3 h-3 text-green-500" /> Titik Asal
            </label>
            <button type="button" onClick={() => isiLokasiSaya('asal')}
              className="text-[10px] text-primary-600 font-medium">📍 Pakai lokasi saya</button>
          </div>
          <input className="input-field text-sm mb-1" placeholder="Nama / deskripsi lokasi asal"
            value={form.asal_address} onChange={(e) => set('asal_address', e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field text-xs" placeholder="Latitude" type="number" step="any"
              value={form.asal_lat} onChange={(e) => set('asal_lat', e.target.value)} />
            <input className="input-field text-xs" placeholder="Longitude" type="number" step="any"
              value={form.asal_lng} onChange={(e) => set('asal_lng', e.target.value)} />
          </div>
        </div>

        {/* Rute Tujuan */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-red-500" /> Titik Tujuan
            </label>
            {/* Tombol auto-fill dari order ojek aktif */}
            {activeOrder && (
              <button type="button" onClick={pakaiTujuanOjek}
                className="text-[10px] text-fuchsia-600 font-semibold bg-fuchsia-50 px-2 py-0.5 rounded-lg border border-fuchsia-200">
                🛵 Pakai tujuan orderan saya
              </button>
            )}
          </div>
          {activeOrder && (
            <p className="text-[10px] text-gray-400 mb-1 truncate">
              → {activeOrder.destination_address}
            </p>
          )}
          <input className="input-field text-sm mb-1" placeholder="Nama / deskripsi lokasi tujuan"
            value={form.tujuan_address} onChange={(e) => set('tujuan_address', e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field text-xs" placeholder="Latitude" type="number" step="any"
              value={form.tujuan_lat} onChange={(e) => set('tujuan_lat', e.target.value)} />
            <input className="input-field text-xs" placeholder="Longitude" type="number" step="any"
              value={form.tujuan_lng} onChange={(e) => set('tujuan_lng', e.target.value)} />
          </div>
        </div>

        {/* Preferensi barang (opsional) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Maks. Berat (kg)</label>
            <input type="number" min="0.1" step="0.1" className="input-field text-sm" placeholder="Opsional"
              value={form.max_berat_kg} onChange={(e) => set('max_berat_kg', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Jenis Barang</label>
            <input type="text" className="input-field text-sm" placeholder="Semua jenis"
              value={form.jenis_barang_diterima} onChange={(e) => set('jenis_barang_diterima', e.target.value)} />
          </div>
        </div>

        <p className="text-[10px] text-gray-400 text-center">
          Radius koridor dan kapasitas maksimal ditentukan oleh admin platform.
        </p>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-outline flex-1 text-sm">Batal</button>
          <button onClick={handleBuka} disabled={saving}
            className="flex-1 text-sm py-2.5 rounded-xl font-semibold text-white disabled:opacity-50"
            style={{ background: '#a21caf' }}>
            {saving ? 'Membuka...' : 'Buka Sesi'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Komponen utama ─────────────────────────────────────────────────────────
export default function MitraOjekDashboard() {
  const { user } = useAuthStore()
  const { settings } = useSettings()
  const [orders, setOrders]                   = useState([])
  const [availableOrders, setAvailableOrders] = useState([])
  const [sesi, setSesi]                       = useState(null)
  const [pendingTitipan, setPendingTitipan]   = useState([])
  const [walletBalance, setWalletBalance]     = useState(0)
  const [available, setAvailable]             = useState(false)
  const [toggling, setToggling]               = useState(false)
  const [tab, setTab]                         = useState('tersedia')
  const [loading, setLoading]                 = useState(true)
  const [showSesiModal, setShowSesiModal]     = useState(false)
  const [showTitipan, setShowTitipan]         = useState(true)
  const [tolakingId, setTolakingId]           = useState(null)
  const [tolakAlasan, setTolakAlasan]         = useState('')
  const [showIsiSaldo, setShowIsiSaldo]       = useState(false)
  const [showRiwayatTopup, setShowRiwayatTopup] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [ojekAvail, pesanan, profil, sesiRes] = await Promise.all([
        api.get('/ojek/tersedia'),
        api.get('/ojek/pesanan'),
        api.get('/profil'),
        api.get('/titipjalan/sesi/aktif').catch(() => ({ data: { session: null } })),
      ])
      setAvailableOrders(ojekAvail.data.data || ojekAvail.data)
      setOrders(pesanan.data.data || pesanan.data)
      setAvailable(profil.data.mitra_profile?.is_available ?? false)
      setWalletBalance(parseFloat(profil.data.mitra_profile?.balance ?? 0))
      setSesi(sesiRes.data.session)

      if (sesiRes.data.session) {
        const titipan = await api.get('/titipjalan/sesi/tersedia').catch(() => ({ data: { data: [] } }))
        setPendingTitipan(titipan.data.data || [])
      } else {
        setPendingTitipan([])
      }
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => { fetchAll().finally(() => setLoading(false)) }, [fetchAll])

  const toggleOnline = async () => {
    setToggling(true)
    try { const { data } = await api.patch('/mitra/toggle-online'); setAvailable(data.is_available) }
    catch (_) {} finally { setToggling(false) }
  }

  const terima = async (id) => {
    try {
      await api.post(`/ojek/pesanan/${id}/terima`)
      await fetchAll()
    } catch (e) { alert(e.response?.data?.message || 'Gagal') }
  }

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/ojek/pesanan/${id}/status`, { status })
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o))
    } catch (e) { alert(e.response?.data?.message || 'Gagal') }
  }

  const terimaTitipan = async (id) => {
    try {
      await api.post(`/titipan/${id}/terima`)
      setPendingTitipan((prev) => prev.filter((t) => t.id !== id))
      const sesiRes = await api.get('/titipjalan/sesi/aktif')
      setSesi(sesiRes.data.session)
    } catch (e) { alert(e.response?.data?.message || 'Gagal') }
  }

  const tolakTitipan = async (id) => {
    if (!tolakAlasan.trim()) { alert('Isi alasan penolakan'); return }
    try {
      await api.post(`/titipan/${id}/tolak`, { alasan: tolakAlasan })
      setPendingTitipan((prev) => prev.filter((t) => t.id !== id))
      setTolakingId(null); setTolakAlasan('')
    } catch (e) { alert(e.response?.data?.message || 'Gagal menolak') }
  }

  const updateStatusTitipan = async (id, status) => {
    try {
      await api.patch(`/titipan/${id}/status`, { status })
      const sesiRes = await api.get('/titipjalan/sesi/aktif')
      setSesi(sesiRes.data.session)
    } catch (e) { alert(e.response?.data?.message || 'Gagal') }
  }

  const tutupSesi = async () => {
    if (!window.confirm('Tutup sesi Jastip sekarang?')) return
    try {
      await api.post('/titipjalan/sesi/tutup')
      setSesi(null)
      setPendingTitipan([])
    } catch (e) { alert(e.response?.data?.message || 'Gagal menutup sesi') }
  }

  // Order ojek aktif (sedang dikerjakan mitra)
  const activeOrder = orders.find((o) => STATUS_AKTIF_OJEK.includes(o.status)) ?? null
  const hasActiveOrder = !!activeOrder

  const stats = {
    total:      orders.length,
    selesai:    orders.filter((o) => o.status === 'selesai').length,
    pendapatan: orders.filter((o) => o.status === 'selesai').reduce((s, o) => s + parseFloat(o.driver_earnings ?? 0), 0),
  }

  const TITIPAN_STATUS_NEXT = {
    diterima: { label: 'Dijemput', next: 'dijemput' },
    dijemput: { label: 'Diantar',  next: 'diantar' },
    diantar:  { label: 'Selesai',  next: 'selesai' },
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-4 text-white">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-primary-200 text-xs">Selamat datang,</p>
            <p className="font-bold text-lg">{user?.name}</p>
            <p className="text-primary-200 text-xs mt-0.5">Mitra Ojek</p>
          </div>
          <button onClick={toggleOnline} disabled={toggling}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${available ? 'bg-emerald-500 text-white' : 'bg-white/20 text-white'}`}>
            <Bike className="w-3.5 h-3.5" />
            {available ? 'Online' : 'Offline'}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total',      value: stats.total },
            { label: 'Selesai',    value: stats.selesai },
            { label: 'Pendapatan', value: formatRupiah(stats.pendapatan) },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-xl p-2 text-center">
              <p className="text-sm font-bold">{s.value}</p>
              <p className="text-[10px] text-primary-200">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Banner: sedang ada orderan aktif */}
      {hasActiveOrder && (
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-3 flex items-start gap-3">
          <div className="w-8 h-8 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-primary-700">Sedang Menjalankan Orderan</p>
            <p className="text-[11px] text-primary-500 mt-0.5 line-clamp-1">
              {activeOrder.order_code} · {activeOrder.destination_address}
            </p>
            <p className="text-[10px] text-primary-400 mt-0.5">Selesaikan dulu sebelum terima orderan baru</p>
          </div>
          <StatusBadge status={activeOrder.status} />
        </div>
      )}

      {/* Wallet + Jastip Section */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-fuchsia-500" />
            <span className="text-sm font-semibold text-gray-700">Wallet ZashaGo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-fuchsia-600">{formatRupiah(walletBalance)}</span>
            <button onClick={() => setShowIsiSaldo(true)}
              className="flex items-center gap-1 text-[10px] font-semibold text-white bg-fuchsia-600 hover:bg-fuchsia-700 px-2.5 py-1.5 rounded-lg transition-colors">
              <PlusCircle className="w-3.5 h-3.5" />
              Isi Saldo
            </button>
          </div>
        </div>
        <button onClick={() => setShowRiwayatTopup(true)}
          className="text-[10px] text-gray-400 hover:text-primary-600 transition-colors flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Riwayat pengisian saldo
        </button>

        {/* Info tarif Jastip dari admin */}
        {settings?.tarif_titipan_dasar && (
          <div className="bg-fuchsia-50/60 border border-fuchsia-100 rounded-xl px-3 py-2 space-y-1.5">
            <p className="text-[10px] font-bold text-fuchsia-500 uppercase tracking-wide flex items-center gap-1">
              <Info className="w-3 h-3" /> Tarif Jastip Aktif
            </p>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div>
                <p className="text-xs font-bold text-gray-700">{formatRupiah(parseFloat(settings.tarif_titipan_dasar))}</p>
                <p className="text-[9px] text-gray-400">Dasar</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-700">{formatRupiah(parseFloat(settings.tarif_titipan_per_km))}</p>
                <p className="text-[9px] text-gray-400">Per km</p>
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-600">{100 - parseFloat(settings.komisi_titipjalan ?? 10)}%</p>
                <p className="text-[9px] text-gray-400">Bagian kamu</p>
              </div>
            </div>
            <p className="text-[9px] text-gray-400 text-center">Komisi platform {settings.komisi_titipjalan ?? 10}% · Min saldo {formatRupiah(parseFloat(settings.titipjalan_saldo_minimum ?? 10000))}</p>
          </div>
        )}

        {!sesi ? (
          <>
            <button onClick={() => setShowSesiModal(true)} disabled={!available}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
              style={{ background: '#a21caf' }}>
              <Package2 className="w-4 h-4" />
              Buka Sesi Jastip
            </button>
            {!available && (
              <p className="text-center text-xs text-gray-400">Aktifkan status Online terlebih dahulu</p>
            )}
          </>
        ) : (
          <div className="space-y-2">
            {/* Info sesi aktif */}
            <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-xl p-3 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-fuchsia-700 flex items-center gap-1">
                  <Package2 className="w-3.5 h-3.5" />
                  Sesi Aktif · {sesi.mode === 'murni' ? 'Jastip Murni' : 'Hybrid'}
                </span>
                <button onClick={tutupSesi} className="text-[10px] text-red-500 font-semibold">Tutup Sesi</button>
              </div>
              <p className="text-[11px] text-gray-600 flex gap-1 items-center">
                <Navigation2 className="w-3 h-3 text-green-500 shrink-0" /> {sesi.asal_address}
              </p>
              <p className="text-[11px] text-gray-600 flex gap-1 items-center">
                <MapPin className="w-3 h-3 text-red-500 shrink-0" /> {sesi.tujuan_address}
              </p>
              <div className="flex gap-2 text-[10px] text-fuchsia-600 font-medium flex-wrap mt-1">
                <span>📏 Radius {sesi.radius_meter}m</span>
                <span>📦 {sesi.titipan?.filter(t => ['diterima','dijemput','diantar'].includes(t.status)).length ?? 0}/{sesi.max_titipan} titipan aktif</span>
                {pendingTitipan.length > 0 && <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">⏳ {pendingTitipan.length} menunggu</span>}
                {sesi.max_berat_kg && <span>⚖️ Maks {sesi.max_berat_kg}kg</span>}
              </div>
            </div>

            {/* Menunggu konfirmasi mitra */}
            {pendingTitipan.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  Menunggu Konfirmasi ({pendingTitipan.length})
                </p>
                {pendingTitipan.map((t) => (
                  <div key={t.id} className="border-2 border-amber-200 rounded-xl p-2.5 space-y-1.5 mb-2 bg-amber-50/40">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-amber-700">{t.order_code}</span>
                      <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-medium">Menunggu</span>
                    </div>
                    <p className="text-[11px] text-gray-600 font-semibold">{t.pelanggan?.name}
                      {t.pelanggan?.phone && <a href={`tel:${t.pelanggan.phone}`} className="ml-1.5 text-primary-600">📞</a>}
                    </p>
                    {t.nama_pesanan && (
                      <p className="text-[11px] text-fuchsia-700 font-medium">🛍️ {t.nama_pesanan}
                        {t.harga_barang > 0 && <span className="ml-1 text-gray-500">· {formatRupiah(t.harga_barang)}</span>}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 flex gap-1 items-start"><Navigation2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" /> {t.pickup_address}</p>
                    <p className="text-[10px] text-gray-400 flex gap-1 items-start"><MapPin className="w-3 h-3 text-red-500 shrink-0 mt-0.5" /> {t.destination_address}</p>
                    {t.berat_kg && <p className="text-[10px] text-gray-400">⚖️ {t.berat_kg} kg</p>}
                    <div className="flex justify-between items-center pt-1 border-t border-amber-100">
                      <span className="text-xs font-bold text-emerald-600">{formatRupiah(t.penghasilan_mitra)}</span>
                      <div className="flex gap-1.5">
                        <button onClick={() => { setTolakingId(t.id); setTolakAlasan('') }}
                          className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                          Tolak
                        </button>
                        <button onClick={() => terimaTitipan(t.id)}
                          className="text-[10px] font-semibold text-white px-3 py-1 rounded-lg" style={{ background: '#a21caf' }}>
                          Terima
                        </button>
                      </div>
                    </div>
                    {/* Inline form tolak */}
                    {tolakingId === t.id && (
                      <div className="pt-1.5 border-t border-red-100 space-y-2">
                        <textarea rows={2} className="input-field text-xs resize-none w-full"
                          placeholder="Alasan penolakan (wajib)..."
                          value={tolakAlasan} onChange={(e) => setTolakAlasan(e.target.value)} />
                        <div className="flex gap-2">
                          <button onClick={() => { setTolakingId(null); setTolakAlasan('') }}
                            className="flex-1 text-[10px] py-1.5 rounded-lg border border-gray-200 text-gray-500">Batal</button>
                          <button onClick={() => tolakTitipan(t.id)}
                            className="flex-1 text-[10px] py-1.5 rounded-lg bg-red-500 text-white font-semibold">Kirim Tolak</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Titipan aktif dalam sesi (sudah diterima) */}
            {sesi.titipan && sesi.titipan.filter(t => ['diterima','dijemput','diantar'].includes(t.status)).length > 0 && (
              <div>
                <button onClick={() => setShowTitipan(!showTitipan)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-gray-600 py-1">
                  <span>Titipan Aktif ({sesi.titipan.filter(t => ['diterima','dijemput','diantar'].includes(t.status)).length})</span>
                  {showTitipan ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showTitipan && sesi.titipan
                  .filter(t => ['diterima','dijemput','diantar'].includes(t.status))
                  .map((t) => (
                    <div key={t.id} className="border border-fuchsia-100 rounded-xl p-2.5 space-y-1.5 mb-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-fuchsia-600">{t.order_code}</span>
                        <StatusBadge status={t.status} />
                      </div>
                      <p className="text-[11px] text-gray-500">{t.pelanggan?.name}</p>
                      {t.nama_pesanan && (
                        <p className="text-[10px] text-fuchsia-600">🛍️ {t.nama_pesanan}</p>
                      )}
                      <p className="text-[10px] text-gray-400 flex gap-1 items-start"><Navigation2 className="w-3 h-3 text-green-500 shrink-0" /> {t.pickup_address}</p>
                      <p className="text-[10px] text-gray-400 flex gap-1 items-start"><MapPin className="w-3 h-3 text-red-500 shrink-0" /> {t.destination_address}</p>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-xs font-bold text-emerald-600">{formatRupiah(t.penghasilan_mitra)}</span>
                        {TITIPAN_STATUS_NEXT[t.status] && (
                          <button onClick={() => updateStatusTitipan(t.id, TITIPAN_STATUS_NEXT[t.status].next)}
                            className="text-[10px] font-semibold text-white px-3 py-1 rounded-lg" style={{ background: '#a21caf' }}>
                            {TITIPAN_STATUS_NEXT[t.status].label}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {pendingTitipan.length === 0 && !sesi.titipan?.some(t => ['diterima','dijemput','diantar'].includes(t.status)) && (
              <p className="text-center text-xs text-gray-400 py-2">Belum ada titipan masuk</p>
            )}
          </div>
        )}
      </div>

      {/* Tabs Ojek */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {[
          { key: 'tersedia', label: 'Pesanan Tersedia' },
          { key: 'saya',     label: 'Pesanan Saya' },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === t.key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'tersedia' && (
        <div className="space-y-3">
          {!available && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <p className="text-xs text-amber-700">Aktifkan status online untuk menerima pesanan</p>
            </div>
          )}
          {/* Info kunci jika ada order aktif */}
          {hasActiveOrder && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400 shrink-0" />
              <p className="text-xs text-gray-500">Selesaikan orderan aktif terlebih dahulu untuk bisa menerima pesanan baru.</p>
            </div>
          )}
          {availableOrders.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">🏍️</p>
              <p className="text-sm">Tidak ada pesanan tersedia</p>
            </div>
          ) : availableOrders.map((o) => (
            <div key={o.id}
              className={`card space-y-2 ${o.izin_titipjalan ? 'border-2 border-fuchsia-200 bg-fuchsia-50/30' : ''} ${hasActiveOrder ? 'opacity-60' : ''}`}>
              {o.izin_titipjalan ? (
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] bg-fuchsia-500 text-white px-2.5 py-1 rounded-full font-bold">
                    🤝 Izinkan Jastip
                  </span>
                  <span className="text-[10px] text-fuchsia-600 font-medium">+cashback 2% untuk pelanggan</span>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium w-fit">
                  ⚡ Reguler
                </span>
              )}
              <div className="flex items-center gap-2">
                <Navigation2 className="w-4 h-4 text-green-500 shrink-0" />
                <p className="text-xs text-gray-600 line-clamp-1">{o.pickup_address}</p>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs text-gray-600 line-clamp-1">{o.destination_address}</p>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                <div className="flex gap-2 text-xs text-gray-500">
                  <span>{parseFloat(o.distance_km).toFixed(1)} km</span>
                  <span className="font-semibold text-primary-600">{formatRupiah(o.price)}</span>
                </div>
                {hasActiveOrder ? (
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Terkunci
                  </span>
                ) : (
                  <button onClick={() => terima(o.id)} className="btn-primary text-xs py-1.5 px-4">Terima</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'saya' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm">Belum ada pesanan</p>
            </div>
          ) : orders.map((o) => (
            <div key={o.id} className={`card space-y-2 ${STATUS_AKTIF_OJEK.includes(o.status) ? 'border-l-4 border-l-primary-500' : ''}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-primary-600">{o.order_code}</p>
                  {o.izin_titipjalan && (
                    <span className="text-[10px] text-fuchsia-600 font-medium flex items-center gap-0.5">🤝 Izinkan Jastip</span>
                  )}
                </div>
                <StatusBadge status={o.status} />
              </div>
              <p className="text-xs text-gray-500">{o.pelanggan?.name}</p>
              <div className="text-xs text-gray-600 space-y-1">
                <p><span className="text-gray-400">Dari:</span> {o.pickup_address}</p>
                <p><span className="text-gray-400">Ke:</span> {o.destination_address}</p>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                <span className="text-sm font-bold text-primary-600">{formatRupiah(o.driver_earnings ?? o.price)}</span>
                {o.status === 'driver_ditemukan' && (
                  <button onClick={() => updateStatus(o.id, 'menuju_pickup')} className="btn-primary text-xs py-1.5 px-3">Menuju Jemput</button>
                )}
                {o.status === 'menuju_pickup' && (
                  <button onClick={() => updateStatus(o.id, 'pelanggan_dijemput')} className="btn-primary text-xs py-1.5 px-3">Sudah Jemput</button>
                )}
                {o.status === 'pelanggan_dijemput' && (
                  <button onClick={() => updateStatus(o.id, 'dalam_perjalanan')} className="btn-primary text-xs py-1.5 px-3">Mulai Jalan</button>
                )}
                {o.status === 'dalam_perjalanan' && (
                  <button onClick={() => updateStatus(o.id, 'selesai')} className="bg-emerald-600 text-white text-xs py-1.5 px-3 rounded-xl">Selesai</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showSesiModal && (
        <BukaSesiModal
          activeOrder={activeOrder}
          onClose={() => setShowSesiModal(false)}
          onBuka={() => { setShowSesiModal(false); fetchAll() }}
        />
      )}

      {showIsiSaldo && (
        <IsiSaldoModal
          onClose={() => setShowIsiSaldo(false)}
          onDone={() => {
            setShowIsiSaldo(false)
            alert('Permintaan isi saldo berhasil dikirim! Admin akan memverifikasi dan mengkreditkan saldo kamu.')
          }}
        />
      )}

      {showRiwayatTopup && (
        <RiwayatTopupModal onClose={() => setShowRiwayatTopup(false)} />
      )}
    </div>
  )
}
