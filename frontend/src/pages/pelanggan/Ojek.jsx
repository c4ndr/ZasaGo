import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, Navigation2, CreditCard, FileText, CheckCircle, Circle, RefreshCw, X, Package, ChevronDown, ChevronUp, Tag } from 'lucide-react'
import api from '../../api/axios'
import MapPicker from '../../components/MapPicker'
import RouteMap from '../../components/RouteMap'
import { formatRupiah, hitungTarifOjek } from '../../utils/hargaUtils'
import useSettings from '../../hooks/useSettings'
import LoadingSpinner from '../../components/LoadingSpinner'

const OJEK_STEPS = [
  { status: 'mencari_driver',     label: 'Mencari Driver' },
  { status: 'driver_ditemukan',   label: 'Driver Ditemukan' },
  { status: 'menuju_pickup',      label: 'Menuju Jemput' },
  { status: 'pelanggan_dijemput', label: 'Sudah Dijemput' },
  { status: 'dalam_perjalanan',   label: 'Dalam Perjalanan' },
  { status: 'selesai',            label: 'Selesai' },
]
const STATUS_AKTIF = ['mencari_driver', 'driver_ditemukan', 'menuju_pickup', 'pelanggan_dijemput', 'dalam_perjalanan']
const BISA_BATAL   = ['mencari_driver', 'driver_ditemukan', 'menuju_pickup']

export default function PelangganOjek() {
  const { settings } = useSettings()

  // Booking form
  const [step, setStep]               = useState(1)
  const [pickup, setPickup]           = useState(null)
  const [destination, setDestination] = useState(null)
  const [routeInfo, setRouteInfo]     = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('tunai')
  const [notes, setNotes]             = useState('')
  const [izinTitipjalan, setIzinTitipjalan] = useState(false)
  const [ordering, setOrdering]       = useState(false)

  // Active order tracking
  const [activeOrder, setActiveOrder]       = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing]         = useState(false)
  const [cancelling, setCancelling]         = useState(false)
  const pollRef       = useRef(null)
  const echoChannel   = useRef(null)   // WebSocket channel ref
  const echoOrderId   = useRef(null)   // Order ID for the active channel

  // Jastip selama ride (untuk master pelanggan)
  const [jastipList, setJastipList]         = useState([])
  const [totalDiskon, setTotalDiskon]       = useState(0)
  const [showJastip, setShowJastip]         = useState(false)
  const prevJastipCount = useRef(0)

  // Toast notifikasi jastip baru
  const [jastipToast, setJastipToast]       = useState(null)  // { diskon, nama }
  const toastTimer = useRef(null)

  const distKm = routeInfo?.distKm ?? 0
  const harga  = distKm > 0 ? hitungTarifOjek(distKm, settings) : 0

  const findActiveOrder = (orders) => {
    const active = orders.find((o) => STATUS_AKTIF.includes(o.status))
    if (active) return active
    // Tampilkan order selesai selama 5 menit terakhir
    const done = orders.find((o) => o.status === 'selesai')
    if (done) {
      const diffMin = (Date.now() - new Date(done.updated_at)) / 60000
      return diffMin < 5 ? done : null
    }
    return null
  }

  const showJastipToast = (diskon, nama) => {
    clearTimeout(toastTimer.current)
    setJastipToast({ diskon, nama })
    toastTimer.current = setTimeout(() => setJastipToast(null), 8000)
  }

  const fetchJastip = async (orderId) => {
    try {
      const res = await api.get(`/ojek/pesanan/${orderId}/jastip`)
      const list = res.data.data || []
      setTotalDiskon(res.data.total_diskon || 0)
      // Deteksi jastip baru → tampilkan notifikasi
      if (list.length > prevJastipCount.current && prevJastipCount.current !== -1) {
        const newest = list[0]
        showJastipToast(res.data.total_diskon, newest?.nama_pesanan)
        setShowJastip(true)
      }
      prevJastipCount.current = list.length
      setJastipList(list)
    } catch (_) {}
  }

  const fetchActiveOrder = async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const res = await api.get('/ojek/pesanan')
      const orders = res.data.data || res.data
      const found = findActiveOrder(orders)
      setActiveOrder(found)
      // Jika order aktif dan izin jastip, langsung fetch jastip list
      if (found?.izin_titipjalan && STATUS_AKTIF.includes(found.status)) {
        fetchJastip(found.id)
      }
    } catch (e) { console.error(e) }
    finally { if (!silent) setRefreshing(false) }
  }

  useEffect(() => {
    fetchActiveOrder().finally(() => setInitialLoading(false))
  }, [])

  // Reset + subscribe WebSocket saat order berganti
  useEffect(() => {
    // Bersihkan state lama
    prevJastipCount.current = -1
    setJastipList([])
    setTotalDiskon(0)
    setJastipToast(null)
    clearTimeout(toastTimer.current)

    // Unsubscribe channel lama
    if (echoChannel.current) {
      echoChannel.current.stopListening('.jastip.diterima')
      if (echoOrderId.current) window.Echo.leave(`ojek-order.${echoOrderId.current}`)
      echoChannel.current = null
      echoOrderId.current = null
    }

    if (!activeOrder?.id || !activeOrder.izin_titipjalan) {
      console.log('[Ojek] skip subscribe: no active order or izin_titipjalan false', activeOrder?.id, activeOrder?.izin_titipjalan)
      return
    }

    console.log('[Ojek] subscribing to channel ojek-order.' + activeOrder.id, 'window.Echo=', !!window.Echo)

    // Fetch data awal jastip (sekali)
    fetchJastip(activeOrder.id)

    // Log semua raw event dari pusher connector
    const pusher = window.Echo.connector.pusher
    pusher.connection.bind('state_change', (s) => console.log('[pusher] state:', s.previous, '->', s.current))
    pusher.bind_global((ev, data) => console.log('[pusher] raw event:', ev, data))

    // Subscribe private channel WebSocket
    try {
      const channel = window.Echo.private(`ojek-order.${activeOrder.id}`)
      channel
        .listen('.jastip.diterima', (data) => {
          console.log('[Ojek] event jastip.diterima diterima:', data)
          setTotalDiskon(data.diskon_baru)
          setJastipList((prev) => {
            const sudahAda = prev.some((t) => t.order_code === data.order_code)
            if (sudahAda) return prev
            return [{ order_code: data.order_code, nama_pesanan: data.nama_barang, total_price: 0 }, ...prev]
          })
          showJastipToast(data.diskon_baru, data.nama_barang)
          setShowJastip(true)
          fetchJastip(activeOrder.id)
        })
        .error((err) => console.error('[Ojek] channel error:', err))
      echoChannel.current = channel
      echoOrderId.current = activeOrder.id
      console.log('[Ojek] subscribed OK')
    } catch (e) {
      console.error('[Ojek] WebSocket subscribe gagal:', e)
    }

    return () => {
      if (echoChannel.current) {
        echoChannel.current.stopListening('.jastip.diterima')
        if (echoOrderId.current) window.Echo.leave(`ojek-order.${echoOrderId.current}`)
        echoChannel.current = null
        echoOrderId.current = null
      }
    }
  }, [activeOrder?.id, activeOrder?.izin_titipjalan])

  // Auto-poll status ojek setiap 15 detik (tetap jalan untuk update driver/status)
  useEffect(() => {
    clearInterval(pollRef.current)
    if (!activeOrder || !STATUS_AKTIF.includes(activeOrder.status)) return
    pollRef.current = setInterval(() => fetchActiveOrder(true), 15000)
    return () => clearInterval(pollRef.current)
  }, [activeOrder?.id, activeOrder?.status])

  // Cleanup Echo saat unmount komponen
  useEffect(() => {
    return () => {
      clearInterval(pollRef.current)
      clearTimeout(toastTimer.current)
    }
  }, [])

  const handleOrder = async () => {
    if (!pickup || !destination || distKm < 0.1) return
    setOrdering(true)
    try {
      const res = await api.post('/ojek', {
        pickup_address:       pickup.address,
        pickup_latitude:      pickup.lat,
        pickup_longitude:     pickup.lng,
        destination_address:  destination.address,
        destination_latitude: destination.lat,
        destination_longitude: destination.lng,
        distance_km:          parseFloat(distKm.toFixed(2)),
        payment_method:       paymentMethod,
        notes,
        izin_titipjalan:      izinTitipjalan,
      })
      setActiveOrder(res.data.order)
      setStep(1); setPickup(null); setDestination(null)
      setRouteInfo(null); setNotes(''); setIzinTitipjalan(false)
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal membuat pesanan')
    } finally {
      setOrdering(false)
    }
  }

  const cancelOrder = async () => {
    if (!window.confirm('Batalkan pesanan ojek ini?')) return
    setCancelling(true)
    try {
      await api.post(`/ojek/pesanan/${activeOrder.id}/batal`)
      setActiveOrder(null)
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal membatalkan')
    } finally { setCancelling(false) }
  }

  const manualRefresh = async () => {
    setRefreshing(true)
    await fetchActiveOrder(true)
    setRefreshing(false)
  }

  if (initialLoading) return <LoadingSpinner />

  // ── Tampilan order aktif / selesai ─────────────────────────────────────────
  if (activeOrder) {
    const currentIdx = OJEK_STEPS.findIndex((s) => s.status === activeOrder.status)
    const isDone = activeOrder.status === 'selesai'

    if (isDone) {
      return (
        <div className="space-y-4">
          <h1 className="page-title">Pesanan Ojek</h1>
          <div className="flex flex-col items-center py-12 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Perjalanan Selesai!</h2>
            <p className="text-sm text-gray-500 mb-2">Terima kasih telah menggunakan layanan kami.</p>
            {parseFloat(activeOrder.diskon_titipjalan || 0) > 0 && (
              <div className="bg-fuchsia-50 border border-fuchsia-100 rounded-2xl px-4 py-4 mb-4 text-center w-full">
                <p className="text-xs text-fuchsia-500 mb-1">Ongkir awal</p>
                <p className="text-sm text-gray-400 line-through">{formatRupiah(activeOrder.price)}</p>
                <p className="text-xs text-fuchsia-500 mt-2 mb-0.5">Diskon jastip ({jastipList.length} titipan)</p>
                <p className="text-xs text-fuchsia-600 font-semibold">- {formatRupiah(activeOrder.diskon_titipjalan)}</p>
                <div className="border-t border-fuchsia-200 mt-2 pt-2">
                  <p className="text-base font-black text-fuchsia-700">
                    {formatRupiah(Math.max(0, parseFloat(activeOrder.price) - parseFloat(activeOrder.diskon_titipjalan)))}
                  </p>
                  <p className="text-[10px] text-fuchsia-400">yang kamu bayar</p>
                </div>
              </div>
            )}
            <button onClick={() => setActiveOrder(null)} className="btn-primary px-8">
              Pesan Lagi
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="page-title">Pesanan Ojek</h1>
          <button onClick={manualRefresh} disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-primary-600 font-medium bg-primary-50 px-3 py-1.5 rounded-xl border border-primary-100">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Update
          </button>
        </div>

        {/* ── Toast notifikasi jastip baru (portal ke document.body) ── */}
        {jastipToast && createPortal(
          <div
            className="flex items-start gap-3 rounded-2xl px-4 py-3 border-2 border-fuchsia-400 bg-white"
            style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, width: '90vw', maxWidth: 380, boxShadow: '0 8px 32px rgba(232,121,249,0.25)' }}>
            <span className="text-2xl leading-none shrink-0">🎉</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-fuchsia-800">Selamat! Ongkir kamu berkurang!</p>
              <p className="text-xs text-fuchsia-600 mt-0.5">
                Driver menerima titipan jastip.{' '}
                <span className="font-bold">Diskon ongkir total: {formatRupiah(jastipToast.diskon)}</span>
              </p>
              {jastipToast.nama && (
                <p className="text-[10px] text-fuchsia-400 mt-0.5">Barang: {jastipToast.nama}</p>
              )}
            </div>
            <button onClick={() => setJastipToast(null)} className="text-fuchsia-300 hover:text-fuchsia-500 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>,
          document.body
        )}

        {/* Progress stepper */}
        <div className="card">
          <p className="text-xs font-bold text-primary-700 mb-1">Status Perjalanan</p>
          {activeOrder.mitra?.name ? (
            <p className="text-xs text-gray-500 mb-3">
              Driver: <span className="font-semibold text-gray-700">{activeOrder.mitra.name}</span>
              {activeOrder.mitra.phone && (
                <a href={`tel:${activeOrder.mitra.phone}`} className="ml-2 text-primary-600">📞</a>
              )}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mb-3 animate-pulse">Mencari driver terdekat...</p>
          )}

          <div className="relative mt-2">
            <div className="absolute top-3 left-3 right-3 h-0.5 bg-gray-200" />
            <div className="absolute top-3 left-3 h-0.5 bg-primary-500 transition-all duration-500"
              style={{ width: currentIdx <= 0 ? '0%' : `${(currentIdx / (OJEK_STEPS.length - 1)) * 100}%` }} />
            <div className="relative flex justify-between">
              {OJEK_STEPS.map((s, i) => {
                const done    = i < currentIdx
                const current = i === currentIdx
                return (
                  <div key={s.status} className="flex flex-col items-center" style={{ width: `${100 / OJEK_STEPS.length}%` }}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all
                      ${done    ? 'bg-primary-600' :
                        current ? 'bg-white border-2 border-primary-600 scale-110 shadow-md' :
                                  'bg-white border-2 border-gray-200'}`}>
                      {done    ? <CheckCircle className="w-3.5 h-3.5 text-white" /> :
                       current ? <Circle className="w-3 h-3 fill-primary-600 text-primary-600" /> :
                                 <Circle className="w-3 h-3 text-gray-300" />}
                    </div>
                    <p className={`text-[8px] text-center mt-1 leading-tight font-medium ${done || current ? 'text-primary-600' : 'text-gray-300'}`}
                      style={{ maxWidth: 40 }}>
                      {s.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {activeOrder.izin_titipjalan && (
            <div className="mt-3 text-[10px] text-fuchsia-400 text-center">
              🤝 Fitur jastip aktif — diskon otomatis saat driver terima titipan
            </div>
          )}
        </div>

        {/* ── Card Jastip (hanya muncul jika izin jastip aktif) ── */}
        {activeOrder.izin_titipjalan && (
          <div className={`rounded-2xl border-2 overflow-hidden transition-all ${
            jastipList.length > 0 ? 'border-fuchsia-200 bg-fuchsia-50' : 'border-dashed border-fuchsia-100 bg-white'
          }`}>
            {/* Header selalu tampil */}
            <button
              onClick={() => setShowJastip((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-fuchsia-600 shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-bold text-fuchsia-700">
                    Titipan Jastip {jastipList.length > 0 ? `(${jastipList.length})` : ''}
                  </p>
                  {jastipList.length > 0 ? (
                    <p className="text-[10px] text-fuchsia-500">
                      Diskon ongkir: <span className="font-bold">{formatRupiah(totalDiskon)}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-fuchsia-400">Belum ada titipan diterima</p>
                  )}
                </div>
              </div>
              {jastipList.length > 0 && (
                showJastip
                  ? <ChevronUp className="w-4 h-4 text-fuchsia-500" />
                  : <ChevronDown className="w-4 h-4 text-fuchsia-500" />
              )}
            </button>

            {/* Daftar titipan */}
            {showJastip && jastipList.length > 0 && (
              <div className="px-4 pb-3 space-y-2 border-t border-fuchsia-100 pt-2">
                {jastipList.map((t) => (
                  <div key={t.order_code} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-fuchsia-100">
                    <Tag className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">{t.nama_pesanan}</p>
                      <p className="text-[10px] text-gray-400">{t.order_code}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold text-fuchsia-600">{formatRupiah(t.total_price)}</p>
                      <p className="text-[9px] text-gray-400">ongkir jastip</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Detail perjalanan */}
        <div className="card space-y-2">
          <p className="text-xs font-bold text-gray-700">Detail Perjalanan</p>
          <div className="flex items-start gap-2">
            <Navigation2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-gray-400">Penjemputan</p>
              <p className="text-xs text-gray-700">{activeOrder.pickup_address}</p>
            </div>
          </div>
          <div className="border-l-2 border-dashed border-gray-200 ml-2 h-3" />
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-gray-400">Tujuan</p>
              <p className="text-xs text-gray-700">{activeOrder.destination_address}</p>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">{activeOrder.order_code}</span>
              {parseFloat(totalDiskon) > 0 ? (
                <span className="text-gray-400 line-through">{formatRupiah(activeOrder.price)}</span>
              ) : (
                <span className="font-bold text-primary-600">{formatRupiah(activeOrder.price)}</span>
              )}
            </div>
            {parseFloat(totalDiskon) > 0 && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] text-fuchsia-500">Diskon jastip ({formatRupiah(totalDiskon)})</span>
                <span className="text-sm font-black text-fuchsia-700">
                  {formatRupiah(Math.max(0, parseFloat(activeOrder.price) - parseFloat(totalDiskon)))}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tombol batal */}
        {BISA_BATAL.includes(activeOrder.status) && (
          <button onClick={cancelOrder} disabled={cancelling}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-red-200 text-red-500 rounded-2xl text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50">
            <X className="w-4 h-4" />
            {cancelling ? 'Membatalkan...' : 'Batalkan Pesanan'}
          </button>
        )}
      </div>
    )
  }

  // ── Form pemesanan ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <h1 className="page-title">Pesan Ojek</h1>

      <div className="flex items-center gap-1 mb-2">
        {['Jemput', 'Tujuan', 'Konfirmasi'].map((label, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step > i + 1 ? 'bg-emerald-500 text-white' :
              step === i + 1 ? 'bg-primary-600 text-white' :
              'bg-gray-200 text-gray-400'}`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`text-xs ${step === i + 1 ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>{label}</span>
            {i < 2 && <div className={`h-0.5 w-6 ${step > i + 1 ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Navigation2 className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Titik Penjemputan</p>
              <p className="text-xs text-gray-400">Tap peta atau cari alamat</p>
            </div>
          </div>
          <MapPicker label="" value={pickup} onChange={setPickup} />
          <button onClick={() => pickup && setStep(2)} disabled={!pickup} className="btn-primary w-full disabled:opacity-50">
            Lanjut ke Tujuan
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <MapPin className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Tujuan</p>
              <p className="text-xs text-gray-400">Kemana kamu mau pergi?</p>
            </div>
          </div>
          <MapPicker label="" value={destination} onChange={setDestination} />
          {pickup && destination && (
            <div>
              <p className="text-xs text-gray-500 mb-1 font-medium">Rute Perjalanan</p>
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
            <button onClick={() => destination && routeInfo && setStep(3)} disabled={!destination || !routeInfo}
              className="btn-primary flex-1 disabled:opacity-50">
              Konfirmasi
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div className="card space-y-3">
            <p className="font-semibold text-gray-800 text-sm">Ringkasan Perjalanan</p>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Navigation2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Penjemputan</p>
                  <p className="text-xs text-gray-700 line-clamp-2">{pickup?.address}</p>
                </div>
              </div>
              <div className="border-l-2 border-dashed border-gray-200 ml-2 h-3" />
              <div className="flex gap-2">
                <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Tujuan</p>
                  <p className="text-xs text-gray-700 line-clamp-2">{destination?.address}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <div className="flex-1 text-center">
                <p className="text-lg font-bold text-gray-800">{routeInfo?.distKm.toFixed(1)}</p>
                <p className="text-[10px] text-gray-400">km</p>
              </div>
              <div className="w-px bg-gray-100" />
              <div className="flex-1 text-center">
                <p className="text-lg font-bold text-gray-800">{routeInfo?.durMin}</p>
                <p className="text-[10px] text-gray-400">menit</p>
              </div>
              <div className="w-px bg-gray-100" />
              <div className="flex-1 text-center">
                <p className="text-lg font-bold text-primary-600">{formatRupiah(harga)}</p>
                <p className="text-[10px] text-gray-400">total</p>
              </div>
            </div>
          </div>

          {/* Mode Layanan */}
          <div className="card space-y-3">
            <p className="font-semibold text-gray-800 text-sm">Mode Layanan</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setIzinTitipjalan(false)}
                className={`rounded-2xl p-3 text-left border-2 transition-all ${!izinTitipjalan ? 'border-primary-500 bg-primary-50' : 'border-gray-100 bg-gray-50'}`}>
                <p className="text-base mb-1">⚡</p>
                <p className={`text-xs font-bold ${!izinTitipjalan ? 'text-primary-700' : 'text-gray-600'}`}>Reguler</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Prioritas kecepatan, diantar langsung</p>
              </button>
              <button type="button" onClick={() => setIzinTitipjalan(true)}
                className={`rounded-2xl p-3 text-left border-2 transition-all ${izinTitipjalan ? 'border-fuchsia-500 bg-fuchsia-50' : 'border-gray-100 bg-gray-50'}`}>
                <p className="text-base mb-1">🤝</p>
                <p className={`text-xs font-bold ${izinTitipjalan ? 'text-fuchsia-700' : 'text-gray-600'}`}>Izinkan Jastip</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Hemat ongkir jika ada titipan searah</p>
              </button>
            </div>
            {izinTitipjalan && (
              <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-xl px-3 py-2 text-[11px] text-fuchsia-700 space-y-0.5">
                <p className="font-semibold">✅ Kamu mengizinkan Jastip</p>
                <p>Mitra boleh mampir ambil titipan yang searah. Kamu dapat cashback ongkir jika ada titipan yang masuk.</p>
                <p className="text-fuchsia-500">+10–20 menit estimasi waktu</p>
              </div>
            )}
          </div>

          <div className="card space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <p className="font-semibold text-gray-800 text-sm">Pembayaran</p>
            </div>
            <div className="flex gap-2">
              {['tunai', 'dompet_digital', 'transfer'].map((m) => (
                <button key={m} onClick={() => setPaymentMethod(m)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${
                    paymentMethod === m ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600'}`}>
                  {m === 'tunai' ? 'Tunai' : m === 'dompet_digital' ? 'E-Wallet' : 'Transfer'}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <p className="font-semibold text-gray-800 text-sm">Catatan (opsional)</p>
            </div>
            <textarea className="input-field text-sm resize-none" rows={2}
              placeholder="Contoh: tolong hubungi dulu ya..."
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="btn-outline flex-1">Kembali</button>
            <button onClick={handleOrder} disabled={ordering} className="btn-primary flex-1 disabled:opacity-50">
              {ordering ? 'Memproses...' : 'Pesan Sekarang'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
