import { useEffect, useState } from 'react'
import { ShoppingBag, ShoppingCart, Plus, Minus, X, Search } from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../stores/authStore'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function PelangganProduk() {
  const { user } = useAuthStore()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)
  const [checkoutForm, setCheckoutForm] = useState({
    shipping_address: user?.address || '',
    recipient_name: user?.name || '',
    recipient_phone: user?.phone || '',
    payment_method: 'cod',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')

  const fetchProducts = () => {
    setLoading(true)
    const params = {}
    if (search) params.search = search
    if (categoryId) params.category_id = categoryId
    api.get('/produk', { params })
      .then((r) => setProducts(r.data.data || r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    api.get('/produk/kategori/list').then((r) => setCategories(r.data))
    fetchProducts()
  }, [])

  useEffect(() => { fetchProducts() }, [categoryId])

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0)
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0)

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, qty: 1, price: product.sale_price || product.price }]
    })
  }

  const changeQty = (id, delta) => {
    setCart((prev) =>
      prev.flatMap((i) => {
        if (i.id !== id) return [i]
        const newQty = i.qty + delta
        return newQty <= 0 ? [] : [{ ...i, qty: newQty }]
      })
    )
  }

  const handleCheckout = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { data } = await api.post('/produk/pesanan', {
        items: cart.map((i) => ({ product_id: i.id, quantity: i.qty })),
        ...checkoutForm,
      })
      setSuccess(data.order)
      setCart([])
      setShowCart(false)
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal membuat pesanan.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-5xl mb-4">📦</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Pesanan Berhasil!</h2>
        <p className="text-gray-400 text-sm mb-1">Kode: <strong className="text-primary-600">{success.order_code}</strong></p>
        <p className="text-gray-400 text-sm mb-6">Total: <strong>Rp {Number(success.total_amount).toLocaleString('id')}</strong></p>
        <button onClick={() => setSuccess(null)} className="btn-primary">Belanja Lagi</button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Produk Lokal</h1>
            <p className="text-xs text-gray-400">Belanja produk lokal dari mitra ZashaGo</p>
          </div>
        </div>
        {cartCount > 0 && (
          <button onClick={() => setShowCart(true)} className="relative bg-indigo-50 text-indigo-600 p-2.5 rounded-xl">
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input-field pl-9"
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
          />
        </div>
        <select className="input-field w-36" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Semua</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : products.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">🛒</p>
          <p className="text-sm">Produk tidak ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {products.map((product) => {
            const inCart = cart.find((i) => i.id === product.id)
            const price = product.sale_price || product.price
            return (
              <div key={product.id} className="card !p-3 flex flex-col">
                <div className="w-full aspect-square bg-gray-100 rounded-xl mb-3 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2 flex-1">{product.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 mb-2">{product.mitra?.name}</p>
                {product.sale_price && (
                  <p className="text-xs text-gray-300 line-through">Rp {Number(product.price).toLocaleString('id')}</p>
                )}
                <p className="font-bold text-primary-600 text-sm">Rp {Number(price).toLocaleString('id')}</p>
                <p className="text-xs text-gray-400 mb-3">Stok: {product.stock}</p>

                {inCart ? (
                  <div className="flex items-center justify-between bg-indigo-50 rounded-xl px-2 py-1">
                    <button onClick={() => changeQty(product.id, -1)} className="text-indigo-600 p-1"><Minus className="w-3.5 h-3.5" /></button>
                    <span className="text-sm font-bold text-indigo-700">{inCart.qty}</span>
                    <button onClick={() => changeQty(product.id, 1)} className="text-indigo-600 p-1"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <button onClick={() => addToCart(product)} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-medium py-2 rounded-xl transition-colors flex items-center justify-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Tambah
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Keranjang float button */}
      {cartCount > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 max-w-md mx-auto">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3.5 rounded-2xl font-semibold shadow-lg flex items-center justify-between px-5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span>{cartCount} item</span>
            </div>
            <span>Rp {cartTotal.toLocaleString('id')} →</span>
          </button>
        </div>
      )}

      {/* Modal Keranjang + Checkout */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Keranjang ({cartCount} item)</h3>
              <button onClick={() => setShowCart(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="px-5 py-4 space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">Rp {Number(item.price).toLocaleString('id')}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-2 py-1">
                    <button onClick={() => changeQty(item.id, -1)}><Minus className="w-3.5 h-3.5 text-gray-600" /></button>
                    <span className="text-sm font-bold w-5 text-center">{item.qty}</span>
                    <button onClick={() => changeQty(item.id, 1)}><Plus className="w-3.5 h-3.5 text-gray-600" /></button>
                  </div>
                  <p className="text-sm font-semibold text-primary-600 w-20 text-right">
                    Rp {(item.price * item.qty).toLocaleString('id')}
                  </p>
                </div>
              ))}

              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <p className="text-sm text-gray-500">Subtotal</p>
                <p className="font-bold text-gray-800">Rp {cartTotal.toLocaleString('id')}</p>
              </div>
              <div className="flex justify-between text-sm">
                <p className="text-gray-500">Ongkir</p>
                <p className="text-gray-700">Rp 10.000</p>
              </div>
              <div className="flex justify-between font-bold">
                <p className="text-gray-700">Total</p>
                <p className="text-primary-600">Rp {(cartTotal + 10000).toLocaleString('id')}</p>
              </div>
            </div>

            {/* Form Checkout */}
            {error && <div className="mx-5 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-2">{error}</div>}
            <form onSubmit={handleCheckout} className="px-5 pb-5 space-y-3">
              <p className="font-semibold text-gray-800 text-sm">Detail Pengiriman</p>
              <input className="input-field" placeholder="Nama penerima" value={checkoutForm.recipient_name} onChange={(e) => setCheckoutForm({ ...checkoutForm, recipient_name: e.target.value })} required />
              <input className="input-field" placeholder="Nomor HP penerima" value={checkoutForm.recipient_phone} onChange={(e) => setCheckoutForm({ ...checkoutForm, recipient_phone: e.target.value })} required />
              <textarea className="input-field resize-none" rows={2} placeholder="Alamat pengiriman lengkap" value={checkoutForm.shipping_address} onChange={(e) => setCheckoutForm({ ...checkoutForm, shipping_address: e.target.value })} required />
              <select className="input-field" value={checkoutForm.payment_method} onChange={(e) => setCheckoutForm({ ...checkoutForm, payment_method: e.target.value })}>
                <option value="cod">📦 COD (Bayar di Tempat)</option>
                <option value="transfer">🏦 Transfer Bank</option>
                <option value="dompet_digital">📱 Dompet Digital</option>
              </select>
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : '🛒 Buat Pesanan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
