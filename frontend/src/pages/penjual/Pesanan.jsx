import { useEffect, useState } from 'react'
import { Package } from 'lucide-react'
import api from '../../api/axios'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'

const nextStatusMap = {
  pending:  { label: 'Konfirmasi',    next: 'dikonfirmasi' },
  dikonfirmasi: { label: 'Kirim',     next: 'dikirim' },
  dikirim:  { label: 'Selesai',       next: 'selesai' },
}

export default function PenjualPesanan() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    api.get('/penjual/pesanan')
      .then((r) => setOrders(r.data.data || r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId)
    try {
      await api.patch(`/penjual/pesanan/${orderId}/status`, { status })
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o))
    } catch (e) { console.error(e) }
    finally { setUpdating(null) }
  }

  return (
    <div>
      <h1 className="page-title">Pesanan Masuk</h1>

      {loading ? <LoadingSpinner /> : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">📋</p>
          <p className="text-sm">Belum ada pesanan masuk</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const action = nextStatusMap[order.status]
            return (
              <div key={order.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{order.order_code}</p>
                    <p className="text-xs text-gray-400">{order.pelanggan?.name}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {order.items?.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-xs text-gray-500">
                        <Package className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                        <span>{item.product?.name || item.product_name} × {item.quantity}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs text-gray-400">+{order.items.length - 3} item lainnya</p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <span className="font-bold text-primary-600 text-sm">
                    Rp {Number(order.total_amount).toLocaleString('id')}
                  </span>
                  {action && (
                    <button
                      onClick={() => updateStatus(order.id, action.next)}
                      disabled={updating === order.id}
                      className="bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {updating === order.id ? '...' : action.label}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
