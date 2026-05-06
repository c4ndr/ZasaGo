import { useEffect, useState, useRef } from 'react'
import { MapPin, Clock, Package, X, CheckCircle, Circle, RefreshCw } from 'lucide-react'
import api from '../../api/axios'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
import { formatRupiah } from '../../utils/hargaUtils'

const TABS = [
  { key: 'semua',      label: 'Semua',    emoji: '📋' },
  { key: 'ojek',       label: 'Ojek',     emoji: '🛵' },
  { key: 'jastip',     label: 'Jastip',   emoji: '🤝' },
  { key: 'urut',       label: 'Urut',     emoji: '💆' },
  { key: 'laundry',    label: 'Laundry',  emoji: '👕' },
  { key: 'catering',   label: 'Catering', emoji: '🍱' },
  { key: 'kebersihan', label: 'Bersih',   emoji: '🧹' },
  { key: 'antar',      label: 'Antar',    emoji: '📦' },
  { key: 'produk',     label: 'Produk',   emoji: '🛒' },
]

const ENDPOINT = {
  ojek:       '/ojek/pesanan',
  jastip:     '/titipan',
  urut:       '/urut/pesanan',
  laundry:    '/laundry/pesanan',
  catering:   '/catering/pesanan',
  kebersihan: '/kebersihan/pesanan',
  antar:      '/antar/pesanan',
  produk:     '/produk/pesanan/saya',
}

const BISA_BATAL_OJEK   = ['mencari_driver', 'driver_ditemukan', 'menuju_pickup']
const BISA_BATAL_JASTIP = ['menunggu', 'diterima']
const STATUS_AKTIF_OJEK = ['mencari_driver', 'driver_ditemukan', 'menuju_pickup', 'pelanggan_dijemput', 'dalam_perjalanan']

// Urutan tahap perjalanan ojek
const OJEK_STEPS = [
  { status: 'mencari_driver',    label: 'Mencari Driver',   icon: '🔍' },
  { status: 'driver_ditemukan',  label: 'Driver Ditemukan', icon: '🏍️' },
  { status: 'menuju_pickup',     label: 'Menuju Jemput',    icon: '📍' },
  { status: 'pelanggan_dijemput',label: 'Sudah Dijemput',   icon: '🙋' },
  { status: 'dalam_perjalanan',  label: 'Dalam Perjalanan', icon: '🛣️' },
  { status: 'selesai',           label: 'Selesai',          icon: '✅' },
]

// Komponen stepper progress ojek
function OjekProgress({ order, onRefresh, refreshing }) {
  const currentIdx = OJEK_STEPS.findIndex((s) => s.status === order.status)

  return (
    <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 mt-2 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-primary-700">Perjalanan Berlangsung</p>
          {order.mitra?.name && (
            <p className="text-[11px] text-primary-500">Driver: {order.mitra.name}</p>
          )}
        </div>
        <button onClick={onRefresh} disabled={refreshing}
          className="flex items-center gap-1 text-[10px] text-primary-600 font-medium bg-primary-100 px-2 py-1 rounded-lg disabled:opacity-50">
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          Update
        </button>
      </div>

      {/* Stepper horizontal */}
      <div className="relative">
        {/* Garis penghubung */}
        <div className="absolute top-3 left-3 right-3 h-0.5 bg-gray-200" />
        <div
          className="absolute top-3 left-3 h-0.5 bg-primary-500 transition-all duration-500"
          style={{ width: currentIdx <= 0 ? '0%' : `${(currentIdx / (OJEK_STEPS.length - 1)) * 100}%` }}
        />
        <div className="relative flex justify-between">
          {OJEK_STEPS.map((step, i) => {
            const done    = i < currentIdx
            const current = i === currentIdx
            return (
              <div key={step.status} className="flex flex-col items-center" style={{ width: `${100 / OJEK_STEPS.length}%` }}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 text-[10px] transition-all
                  ${done    ? 'bg-primary-600 text-white' :
                    current ? 'bg-white border-2 border-primary-600 text-primary-600 scale-110 shadow-md' :
                              'bg-white border-2 border-gray-200 text-gray-300'}`}>
                  {done ? <CheckCircle className="w-3.5 h-3.5" /> : current ? <Circle className="w-3 h-3 fill-primary-600" /> : <Circle className="w-3 h-3" />}
                </div>
                <p className={`text-[8px] text-center mt-1 leading-tight font-medium
                  ${done || current ? 'text-primary-600' : 'text-gray-300'}`}
                  style={{ maxWidth: 40 }}>
                  {step.label}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Info cashback jastip jika ada */}
      {order.izin_titipjalan && parseFloat(order.diskon_titipjalan || 0) > 0 && (
        <div className="bg-fuchsia-50 border border-fuchsia-100 rounded-lg px-2.5 py-1.5 text-[10px] text-fuchsia-600 font-medium">
          💸 Cashback Jastip: {formatRupiah(order.diskon_titipjalan)}
        </div>
      )}
    </div>
  )
}

export default function PelangganRiwayat() {
  const [tab, setTab]             = useState('semua')
  const [data, setData]           = useState({})
  const [loading, setLoading]     = useState(false)
  const [cancelling, setCancelling] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const pollRef = useRef(null)

  const fetchTab = (key, silent = false) => {
    if (!silent) setLoading(true)
    const req = key === 'semua'
      ? api.get('/pelanggan/pesanan/semua').then((r) => ({ data: r.data }))
      : api.get(ENDPOINT[key]).then((r) => ({ data: r.data.data || r.data }))

    return req
      .then(({ data: result }) => setData((prev) => ({ ...prev, [key]: result })))
      .catch(console.error)
      .finally(() => { if (!silent) setLoading(false) })
  }

  useEffect(() => {
    if (!data[tab]) fetchTab(tab)
  }, [tab])

  // Auto-polling setiap 20 detik jika ada ojek order aktif di tab ojek/semua
  useEffect(() => {
    clearInterval(pollRef.current)
    if (tab !== 'ojek' && tab !== 'semua') return

    const orders = data[tab] || []
    const hasAktif = orders.some((o) => {
      const jenis = o.jenis ?? tab
      return (jenis === 'ojek') && STATUS_AKTIF_OJEK.includes(o.status)
    })
    if (!hasAktif) return

    pollRef.current = setInterval(() => fetchTab(tab, true), 20000)
    return () => clearInterval(pollRef.current)
  }, [tab, data])

  const manualRefresh = async () => {
    setRefreshing(true)
    await fetchTab(tab, true)
    setRefreshing(false)
  }

  const batalOjek = async (order) => {
    if (!window.confirm('Batalkan pesanan ojek ini?')) return
    setCancelling(order.id)
    try {
      await api.post(`/ojek/pesanan/${order.id}/batal`)
      setData((prev) => { const n = { ...prev }; delete n.ojek; delete n.semua; return n })
      fetchTab(tab)
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal membatalkan')
    } finally { setCancelling(null) }
  }

  const batalJastip = async (order) => {
    if (!window.confirm('Batalkan titipan ini?')) return
    setCancelling(order.id)
    try {
      await api.post(`/titipan/${order.id}/batal`)
      setData((prev) => { const n = { ...prev }; delete n.jastip; delete n.semua; return n })
      fetchTab(tab)
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal membatalkan')
    } finally { setCancelling(null) }
  }

  const orders = data[tab] || []

  const getAmount = (order) => {
    if (order.jenis === 'produk' || order.total_amount != null) return parseFloat(order.total_amount ?? 0)
    return parseFloat(order.price ?? order.total_price ?? 0)
  }

  return (
    <div>
      <h1 className="page-title">Riwayat Pesanan</h1>

      <div className="flex gap-1 overflow-x-auto pb-1 mb-5 scrollbar-none">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
              tab === t.key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">{TABS.find((t) => t.key === tab)?.emoji}</p>
          <p className="text-sm">Belum ada riwayat pesanan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const jenis = order.jenis ?? tab
            const isJastip = jenis === 'jastip' || (tab === 'semua' && order.order_code?.startsWith('TJP-'))
            const isOjekAktif = (jenis === 'ojek') && STATUS_AKTIF_OJEK.includes(order.status)

            return (
              <div key={`${jenis}-${order.id}`}
                className={`card ${isJastip ? 'border-l-4 border-l-fuchsia-400' : ''} ${isOjekAktif ? 'border-l-4 border-l-primary-500' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800 text-sm">{order.order_code}</p>
                      {order.jenis && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full capitalize">{order.jenis}</span>
                      )}
                      {(jenis === 'ojek' || jenis === 'antar') && order.izin_titipjalan && (
                        <span className="text-[10px] bg-fuchsia-100 text-fuchsia-600 px-1.5 py-0.5 rounded-full font-medium">🤝 Jastip</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {/* Ojek / Antar */}
                {(jenis === 'ojek' || jenis === 'antar') && (
                  <div className="space-y-1 text-xs text-gray-500 mb-2">
                    <div className="flex gap-2"><MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" /><span className="line-clamp-1">{order.pickup_address}</span></div>
                    <div className="flex gap-2"><MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" /><span className="line-clamp-1">{order.destination_address}</span></div>
                  </div>
                )}

                {/* Progress stepper untuk ojek aktif */}
                {isOjekAktif && (
                  <OjekProgress order={order} onRefresh={manualRefresh} refreshing={refreshing} />
                )}

                {/* Jastip */}
                {isJastip && (
                  <div className="space-y-1.5 mb-2">
                    {order.nama_pesanan && (
                      <div className="bg-fuchsia-50 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
                        <span className="text-fuchsia-500">🛍️</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">{order.nama_pesanan}</p>
                          {order.harga_barang > 0 && (
                            <p className="text-[10px] text-fuchsia-600 font-semibold">{formatRupiah(order.harga_barang)}</p>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex gap-2"><MapPin className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" /><span className="line-clamp-1">{order.pickup_address}</span></div>
                      <div className="flex gap-2"><MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" /><span className="line-clamp-1">{order.destination_address}</span></div>
                    </div>
                    {order.jenis_barang && (
                      <p className="text-[10px] text-fuchsia-600">{order.jenis_barang}{order.berat_kg ? ` · ${order.berat_kg} kg` : ''}</p>
                    )}
                    {order.tolak_alasan && (
                      <div className="bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5 text-xs text-red-600">
                        ❌ Ditolak mitra: {order.tolak_alasan}
                      </div>
                    )}
                    {order.payment_method && (
                      <p className="text-[10px] text-gray-400">
                        Bayar: {{ tunai: 'Tunai', dompet_digital: 'E-Wallet', transfer: 'Transfer' }[order.payment_method] || order.payment_method}
                      </p>
                    )}
                  </div>
                )}

                {/* Urut */}
                {jenis === 'urut' && (
                  <div className="text-xs text-gray-500 mb-2">
                    <p>{order.service?.name}</p>
                    {order.scheduled_at && (
                      <div className="flex items-center gap-1.5 mt-0.5 text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(order.scheduled_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    )}
                  </div>
                )}

                {/* Laundry */}
                {jenis === 'laundry' && (
                  <p className="text-xs text-gray-500 mb-2">{order.jenis_layanan}{order.berat_kg ? ` · ${order.berat_kg} kg` : ''}</p>
                )}

                {/* Catering */}
                {jenis === 'catering' && (
                  <p className="text-xs text-gray-500 mb-2">{order.jenis_acara} · {order.jumlah_porsi} porsi</p>
                )}

                {/* Kebersihan */}
                {jenis === 'kebersihan' && (
                  <p className="text-xs text-gray-500 mb-2">{order.jenis_layanan} · {order.durasi_jam} jam</p>
                )}

                {/* Produk */}
                {jenis === 'produk' && order.items?.length > 0 && (
                  <div className="space-y-0.5 mb-2">
                    {order.items.slice(0, 2).map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-xs text-gray-500">
                        <Package className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                        <span>{item.product_name} × {item.quantity}</span>
                      </div>
                    ))}
                    {order.items.length > 2 && <p className="text-xs text-gray-400">+{order.items.length - 2} item lainnya</p>}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 truncate">
                      {order.mitra?.name || (jenis === 'produk' ? order.payment_method?.replace('_', ' ') : 'Mencari mitra...')}
                    </p>
                    {jenis === 'ojek' && parseFloat(order.diskon_titipjalan || 0) > 0 && (
                      <p className="text-[10px] text-fuchsia-600 font-medium">💸 Cashback {formatRupiah(order.diskon_titipjalan)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {jenis === 'ojek' && BISA_BATAL_OJEK.includes(order.status) && (
                      <button onClick={() => batalOjek(order)} disabled={cancelling === order.id}
                        className="flex items-center gap-1 text-[10px] text-red-500 border border-red-200 px-2 py-1 rounded-lg font-medium disabled:opacity-50">
                        <X className="w-3 h-3" />
                        {cancelling === order.id ? '...' : 'Batal'}
                      </button>
                    )}
                    {isJastip && BISA_BATAL_JASTIP.includes(order.status) && (
                      <button onClick={() => batalJastip(order)} disabled={cancelling === order.id}
                        className="flex items-center gap-1 text-[10px] text-red-500 border border-red-200 px-2 py-1 rounded-lg font-medium disabled:opacity-50">
                        <X className="w-3 h-3" />
                        {cancelling === order.id ? '...' : 'Batal'}
                      </button>
                    )}
                    <span className="font-bold text-primary-600 text-sm">{formatRupiah(getAmount(order))}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
