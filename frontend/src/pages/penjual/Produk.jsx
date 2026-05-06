import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

const emptyForm = { name: '', description: '', price: '', stock: '', unit: 'pcs', category_id: '' }

export default function PenjualProduk() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      api.get('/penjual/produk'),
      api.get('/produk/kategori/list'),
    ]).then(([prod, cat]) => {
      setProducts(prod.data.data || prod.data)
      setCategories(cat.data)
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const openAdd = () => { setForm(emptyForm); setEditId(null); setError(''); setModal('form') }
  const openEdit = (p) => {
    setForm({ name: p.name, description: p.description || '', price: p.price, stock: p.stock, unit: p.unit || 'pcs', category_id: p.category_id || '' })
    setEditId(p.id); setError(''); setModal('form')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock) }
      if (editId) {
        await api.put(`/penjual/produk/${editId}`, payload)
      } else {
        await api.post('/penjual/produk', payload)
      }
      fetchData()
      setModal(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan produk')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus produk ini?')) return
    try {
      await api.delete(`/penjual/produk/${id}`)
      setProducts((p) => p.filter((x) => x.id !== id))
    } catch (e) { console.error(e) }
  }

  const handleToggle = async (p) => {
    try {
      const { data } = await api.put(`/penjual/produk/${p.id}`, { is_active: !p.is_active })
      setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, is_active: !x.is_active } : x))
    } catch (e) { console.error(e) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title mb-0">Kelola Produk</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 !py-2 !px-3 text-sm">
          <Plus className="w-4 h-4" />
          Tambah
        </button>
      </div>

      {loading ? <LoadingSpinner /> : products.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">📦</p>
          <p className="text-sm">Belum ada produk. Tambah produk pertama Anda!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="card">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center shrink-0 text-2xl">
                  📦
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-800 text-sm leading-tight">{p.name}</p>
                    <button
                      onClick={() => handleToggle(p)}
                      className={`shrink-0 ${p.is_active ? 'text-primary-600' : 'text-gray-300'}`}
                    >
                      {p.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{p.category?.name || 'Tanpa kategori'}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <p className="text-primary-600 font-bold text-sm">Rp {Number(p.price).toLocaleString('id')}</p>
                      <p className="text-xs text-gray-400">Stok: {p.stock} {p.unit}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => openEdit(p)}
                        className="w-8 h-8 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(p.id)}
                        className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg flex items-center justify-center transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === 'form' && (
        <Modal title={editId ? 'Edit Produk' : 'Tambah Produk'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="px-5 py-4 space-y-3">
            {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-xl border border-red-200">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk *</label>
              <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <textarea className="input-field resize-none" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select className="input-field" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">— Pilih Kategori —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp) *</label>
                <input type="number" min="0" className="input-field" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stok *</label>
                <input type="number" min="0" className="input-field" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
              <input className="input-field" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pcs / kg / liter" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Batal</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Simpan'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
