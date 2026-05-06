import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
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

const emptyForm = { nama: '', icon: '🔧', deskripsi: '', urutan: 0 }

const EMOJI_OPTIONS = ['🛵','💆','👕','🍱','🧹','📦','🏠','💊','🚗','🔧','⚡','🌿','🎓','📱','🛒','💈']

export default function AdminLayanan() {
  const [layanan, setLayanan] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchData = () => {
    setLoading(true)
    api.get('/admin/layanan')
      .then((r) => setLayanan(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const openAdd  = () => { setForm(emptyForm); setEditId(null); setError(''); setModal('form') }
  const openEdit = (l) => { setForm({ nama: l.nama, icon: l.icon, deskripsi: l.deskripsi || '', urutan: l.urutan }); setEditId(l.id); setError(''); setModal('form') }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editId) {
        const { data } = await api.put(`/admin/layanan/${editId}`, form)
        setLayanan((prev) => prev.map((l) => l.id === editId ? data.data : l))
      } else {
        const { data } = await api.post('/admin/layanan', form)
        setLayanan((prev) => [...prev, data.data])
      }
      setModal(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (l) => {
    try {
      const { data } = await api.patch(`/admin/layanan/${l.id}/toggle`)
      setLayanan((prev) => prev.map((x) => x.id === l.id ? data.data : x))
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus layanan ini?')) return
    try {
      await api.delete(`/admin/layanan/${id}`)
      setLayanan((prev) => prev.filter((l) => l.id !== id))
    } catch (e) { console.error(e) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title mb-0">Layanan Jasa</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 !py-2 !px-3 text-sm">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {loading ? <LoadingSpinner /> : layanan.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">🔧</p>
          <p className="text-sm">Belum ada layanan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {layanan.map((l) => (
            <div key={l.id} className={`card transition-opacity ${l.is_active ? '' : 'opacity-50'}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                  {l.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800 text-sm">{l.nama}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${l.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                      {l.is_active ? '● Aktif' : '○ Nonaktif'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{l.deskripsi}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">Urutan: {l.urutan}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Toggle switch ON/OFF */}
                  <button onClick={() => handleToggle(l)} title={l.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${l.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${l.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <button onClick={() => openEdit(l)}
                    className="w-8 h-8 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(l.id)}
                    className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg flex items-center justify-center transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === 'form' && (
        <Modal title={editId ? 'Edit Layanan' : 'Tambah Layanan'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="px-5 py-4 space-y-3">
            {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-xl border border-red-200">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Layanan *</label>
              <input className="input-field" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required autoFocus />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon Emoji *</label>
              <div className="grid grid-cols-8 gap-1.5 mb-2">
                {EMOJI_OPTIONS.map((em) => (
                  <button key={em} type="button"
                    onClick={() => setForm({ ...form, icon: em })}
                    className={`aspect-square rounded-xl text-lg flex items-center justify-center transition-colors ${form.icon === em ? 'bg-primary-100 ring-2 ring-primary-400' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    {em}
                  </button>
                ))}
              </div>
              <input className="input-field text-center text-lg" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} maxLength={4} placeholder="Ketik emoji" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <input className="input-field" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urutan Tampil</label>
              <input type="number" min="0" className="input-field" value={form.urutan} onChange={(e) => setForm({ ...form, urutan: Number(e.target.value) })} />
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
