import { useEffect, useState } from 'react'
import { MapPin, Clock } from 'lucide-react'
import api from '../../api/axios'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'

const TABS = [
  { key: 'ojek',       label: '🛵 Ojek',     endpoint: '/admin/pesanan/ojek' },
  { key: 'jastip',    label: '🤝 Jastip',   endpoint: '/admin/pesanan/jastip' },
  { key: 'urut',       label: '💆 Urut',     endpoint: '/admin/pesanan/urut' },
  { key: 'produk',     label: '🛒 Produk',   endpoint: '/admin/pesanan/produk' },
  { key: 'laundry',    label: '👕 Laundry',  endpoint: '/admin/pesanan/laundry' },
  { key: 'catering',   label: '🍱 Catering', endpoint: '/admin/pesanan/catering' },
  { key: 'kebersihan', label: '🧹 Bersih',   endpoint: '/admin/pesanan/kebersihan' },
  { key: 'antar',      label: '📦 Antar',    endpoint: '/admin/pesanan/antar' },
]

const fmt = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`

function OjekCard({ order }) {
  const diskon = parseFloat(order.diskon_titipjalan || 0)
  return (
    <div className={`card ${order.izin_titipjalan ? 'border-l-4 border-l-fuchsia-400' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-800 text-sm">{order.order_code}</p>
          <p className="text-xs text-gray-400">{order.pelanggan?.name}</p>
          {order.izin_titipjalan && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-fuchsia-100 text-fuchsia-700 px-1.5 py-0.5 rounded-full font-medium mt-0.5">
              🤝 Izinkan Jastip{diskon > 0 ? ` · diskon ${fmt(diskon)}` : ''}
            </span>
          )}
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="space-y-1 text-xs text-gray-500 mt-2">
        <div className="flex gap-2"><MapPin className="w-3.5 h-3.5 text-primary-500 mt-0.5 shrink-0" /><span className="line-clamp-1">{order.pickup_address}</span></div>
        <div className="flex gap-2"><MapPin className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" /><span className="line-clamp-1">{order.destination_address}</span></div>
      </div>
      <div className="flex justify-between mt-3 pt-3 border-t border-gray-50">
        <div className="text-xs text-gray-400">
          <p>{order.distance_km} km · {order.mitra?.name || 'Belum ada driver'}</p>
          {parseFloat(order.komisi_platform || 0) > 0 && (
            <p className="text-emerald-600">Komisi: {fmt(order.komisi_platform)}</p>
          )}
        </div>
        <span className="font-bold text-primary-600 text-sm">{fmt(order.price)}</span>
      </div>
    </div>
  )
}

function JastipCard({ order }) {
  return (
    <div className="card border-l-4 border-l-fuchsia-400">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-800 text-sm">{order.order_code}</p>
          <p className="text-xs text-gray-400">{order.pelanggan?.name}</p>
          {order.jenis_barang && <p className="text-[10px] text-fuchsia-600 mt-0.5">{order.jenis_barang}{order.berat_kg ? ` · ${order.berat_kg} kg` : ''}</p>}
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="space-y-1 text-xs text-gray-500 mt-2">
        <div className="flex gap-2"><MapPin className="w-3.5 h-3.5 text-primary-500 mt-0.5 shrink-0" /><span className="line-clamp-1">{order.pickup_address}</span></div>
        <div className="flex gap-2"><MapPin className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" /><span className="line-clamp-1">{order.destination_address}</span></div>
      </div>
      <div className="flex justify-between mt-3 pt-3 border-t border-gray-50">
        <div className="text-xs text-gray-400">
          <p>{order.mitra?.name || 'Belum ada mitra'}</p>
          {parseFloat(order.komisi_platform || 0) > 0 && <p className="text-emerald-600">Komisi: {fmt(order.komisi_platform)}</p>}
        </div>
        <div className="text-right">
          <p className="font-bold text-fuchsia-600 text-sm">{fmt(order.total_price)}</p>
          {parseFloat(order.diskon_persen || 0) > 0 && <p className="text-[10px] text-gray-400">diskon {order.diskon_persen}%</p>}
        </div>
      </div>
    </div>
  )
}

function UrutCard({ order }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-800 text-sm">{order.order_code}</p>
          <p className="text-xs text-gray-400">{order.pelanggan?.name}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <p className="text-xs text-gray-500">{order.service?.name}</p>
      {order.scheduled_at && (
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          <span>{new Date(order.scheduled_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
        </div>
      )}
      <div className="flex justify-between mt-3 pt-3 border-t border-gray-50">
        <span className="text-xs text-gray-400">{order.mitra?.name || 'Belum ada mitra'}</span>
        <span className="font-bold text-primary-600 text-sm">{fmt(order.price)}</span>
      </div>
    </div>
  )
}

function ProdukCard({ order }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-800 text-sm">{order.order_code}</p>
          <p className="text-xs text-gray-400">{order.pelanggan?.name}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <p className="text-xs text-gray-500">{order.items?.length ?? 0} item · {order.recipient_name}</p>
      <div className="flex justify-between mt-3 pt-3 border-t border-gray-50">
        <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('id-ID')}</span>
        <span className="font-bold text-primary-600 text-sm">{fmt(order.total_amount)}</span>
      </div>
    </div>
  )
}

function GenericCard({ order, tab }) {
  const detail = tab === 'laundry'    ? `${order.jenis_layanan}${order.berat_kg ? ` · ${order.berat_kg} kg` : ''}` :
                 tab === 'catering'   ? `${order.jenis_acara ?? ''} · ${order.jumlah_porsi ?? 0} porsi` :
                 tab === 'kebersihan' ? `${order.jenis_layanan} · ${order.durasi_jam} jam` :
                 tab === 'antar'      ? `${order.pickup_address?.substring(0, 30)}...` : ''
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-800 text-sm">{order.order_code}</p>
          <p className="text-xs text-gray-400">{order.pelanggan?.name}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <p className="text-xs text-gray-500">{detail}</p>
      <div className="flex justify-between mt-3 pt-3 border-t border-gray-50">
        <span className="text-xs text-gray-400">{order.mitra?.name || 'Belum ada mitra'}</span>
        <span className="font-bold text-primary-600 text-sm">{fmt(order.total_price ?? order.price)}</span>
      </div>
    </div>
  )
}

export default function AdminPesanan() {
  const [tab, setTab]     = useState('ojek')
  const [data, setData]   = useState({})
  const [loading, setLoading] = useState(false)

  const activeTab = TABS.find((t) => t.key === tab)

  useEffect(() => {
    if (!activeTab?.endpoint) return
    if (data[tab]) return
    setLoading(true)
    api.get(activeTab.endpoint)
      .then((r) => setData((prev) => ({ ...prev, [tab]: r.data.data || r.data })))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [tab])

  const orders = data[tab] || []

  return (
    <div>
      <h1 className="page-title">Kelola Pesanan</h1>

      {/* Scrollable tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-4 px-4">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
              tab === t.key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">📋</p>
          <p className="text-sm">Belum ada pesanan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) =>
            tab === 'ojek'   ? <OjekCard    key={order.id} order={order} /> :
            tab === 'jastip' ? <JastipCard  key={order.id} order={order} /> :
            tab === 'urut'   ? <UrutCard    key={order.id} order={order} /> :
            tab === 'produk' ? <ProdukCard  key={order.id} order={order} /> :
                               <GenericCard key={order.id} order={order} tab={tab} />
          )}
        </div>
      )}
    </div>
  )
}
