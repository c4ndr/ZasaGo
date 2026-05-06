import { useEffect, useState } from 'react'
import { Search, ToggleLeft, ToggleRight, Store, Package, X } from 'lucide-react'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function AdminPedagang() {
  const [sellers, setSellers]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [toggling, setToggling]   = useState(null)
  const [detail, setDetail]       = useState(null)

  const fetchSellers = () => {
    setLoading(true)
    const params = {}
    if (search) params.search = search
    api.get('/admin/pedagang', { params })
      .then((r) => setSellers(r.data.data || r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchSellers() }, [])

  const handleToggle = async (seller) => {
    setToggling(seller.id)
    try {
      await api.patch(`/admin/users/${seller.id}/toggle-status`)
      setSellers((prev) => prev.map((s) =>
        s.id === seller.id ? { ...s, is_active: !s.is_active } : s
      ))
    } catch (e) { console.error(e) }
    finally { setToggling(null) }
  }

  return (
    <div>
      <h1 className="page-title">Kelola Pedagang</h1>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" className="input-field pl-9" placeholder="Cari nama atau toko..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchSellers()} />
        </div>
        <button onClick={fetchSellers} className="btn-primary px-4">Cari</button>
      </div>

      <p className="text-xs text-gray-400 mb-3">{sellers.length} pedagang terdaftar</p>

      {loading ? <LoadingSpinner /> : sellers.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">🏪</p>
          <p className="text-sm">Tidak ada pedagang ditemukan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sellers.map((seller) => (
            <div key={seller.id} className={`card transition-opacity ${!seller.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 bg-fuchsia-500 rounded-2xl flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">{seller.mitra_profile?.store_name || seller.name}</p>
                  <p className="text-xs text-gray-500">{seller.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{seller.email} · {seller.phone}</p>
                  {seller.mitra_profile?.store_desc && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{seller.mitra_profile.store_desc}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      seller.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {seller.is_active ? '● Aktif' : '○ Nonaktif'}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                      <Package className="w-3 h-3" />
                      Pedagang
                    </span>
                  </div>
                </div>
                <button onClick={() => handleToggle(seller)} disabled={toggling === seller.id}
                  title={seller.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  className="shrink-0 text-gray-400 hover:text-primary-600 transition-colors mt-1">
                  {seller.is_active
                    ? <ToggleRight className="w-7 h-7 text-primary-600" />
                    : <ToggleLeft  className="w-7 h-7 text-gray-400" />
                  }
                </button>
              </div>

              <button onClick={() => setDetail(seller)}
                className="mt-3 w-full text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 py-2 rounded-xl transition-colors">
                Lihat Detail
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Detail Pedagang</h3>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-2">
              {[
                ['Nama Pemilik',  detail.name],
                ['Nama Toko',     detail.mitra_profile?.store_name],
                ['Email',         detail.email],
                ['Nomor HP',      detail.phone],
                ['Alamat',        detail.address],
                ['Deskripsi Toko', detail.mitra_profile?.store_desc],
                ['Status',        detail.is_active ? 'Aktif' : 'Nonaktif'],
                ['Bergabung',     new Date(detail.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="flex justify-between py-2 border-b border-gray-50">
                  <p className="text-xs text-gray-500 shrink-0">{label}</p>
                  <p className="text-xs font-semibold text-gray-700 text-right ml-4">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
