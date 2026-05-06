import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, ToggleLeft, ToggleRight, Star, X, ShieldCheck, ShieldAlert } from 'lucide-react'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'

const SERVICE_TABS = [
  { key: '', label: 'Semua' },
  { key: 'ojek', label: '🛵 Ojek' },
  { key: 'urut', label: '💆 Urut' },
  { key: 'laundry', label: '👕 Laundry' },
  { key: 'catering', label: '🍱 Catering' },
  { key: 'kebersihan', label: '🧹 Kebersihan' },
  { key: 'antar_barang', label: '📦 Antar' },
]
const STATUS_TABS = [
  { key: '', label: 'Semua' },
  { key: 'pending', label: 'Menunggu' },
  { key: 'terverifikasi', label: 'Terverifikasi' },
]
const SERVICE_LABEL = {
  ojek:'Ojek', urut:'Urut', laundry:'Laundry', catering:'Catering',
  kebersihan:'Kebersihan', antar_barang:'Antar Barang', produk:'Produk', semua:'Semua',
}
const SERVICE_BADGE = {
  ojek:'bg-orange-100 text-orange-700', urut:'bg-pink-100 text-pink-700',
  laundry:'bg-sky-100 text-sky-700', catering:'bg-emerald-100 text-emerald-700',
  kebersihan:'bg-violet-100 text-violet-700', antar_barang:'bg-amber-100 text-amber-700',
  produk:'bg-indigo-100 text-indigo-700', semua:'bg-gray-100 text-gray-600',
}

export default function AdminMitra() {
  const [serviceTab, setServiceTab] = useState('')
  const [statusTab,  setStatusTab]  = useState('')
  const [mitras, setMitras]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [processing, setProcessing] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [reason, setReason]         = useState('')
  const [detail, setDetail]         = useState(null)
  const [fetchError, setFetchError] = useState(null)

  const fetchMitras = () => {
    setLoading(true)
    setFetchError(null)
    const params = {}
    if (serviceTab) params.service_type = serviceTab
    if (statusTab)  params.status       = statusTab
    api.get('/admin/mitra', { params })
      .then((r) => setMitras(r.data.data || r.data))
      .catch((e) => {
        console.error(e)
        setFetchError(e.response?.status === 403
          ? 'Akses ditolak. Pastikan Anda login sebagai admin.'
          : `Gagal memuat data (${e.response?.status ?? 'network error'})`)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchMitras() }, [serviceTab, statusTab])

  const handleVerify = async (id, action, alasan = '') => {
    setProcessing(id)
    try {
      await api.post(`/admin/mitra/${id}/verifikasi`, { action, reason: alasan })
      setMitras((prev) => prev.map((m) =>
        m.id === id ? { ...m, is_verified: action === 'setujui' } : m
      ))
      setRejectModal(null)
      setReason('')
    } catch (e) { console.error(e) }
    finally { setProcessing(null) }
  }

  const handleToggleUser = async (mitra) => {
    try {
      await api.patch(`/admin/users/${mitra.user?.id}/toggle-status`)
      setMitras((prev) => prev.map((m) =>
        m.id === mitra.id ? { ...m, user: { ...m.user, is_active: !m.user.is_active } } : m
      ))
    } catch (e) { console.error(e) }
  }

  return (
    <div>
      <h1 className="page-title">Kelola Mitra</h1>

      {/* Service tabs - scrollable */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 -mx-4 px-4">
        {SERVICE_TABS.map((t) => (
          <button key={t.key} onClick={() => setServiceTab(t.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
              serviceTab === t.key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4">
        {STATUS_TABS.map((t) => (
          <button key={t.key} onClick={() => setStatusTab(t.key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusTab === t.key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 mb-3">{mitras.length} mitra ditemukan</p>

      {loading ? <LoadingSpinner /> : fetchError ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-sm font-semibold text-red-600">{fetchError}</p>
          <button onClick={fetchMitras} className="mt-4 text-xs text-primary-600 underline">Coba lagi</button>
        </div>
      ) : mitras.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">🛠️</p>
          <p className="text-sm">Tidak ada mitra</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mitras.map((mitra) => (
            <div key={mitra.id} className={`card transition-opacity ${mitra.user?.is_active === false ? 'opacity-50' : ''}`}>
              <div className="flex items-start gap-3 mb-3">
                {/* Avatar */}
                <div className="w-11 h-11 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                  {mitra.user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800 text-sm">{mitra.user?.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      SERVICE_BADGE[mitra.service_type] || 'bg-gray-100 text-gray-600'
                    }`}>
                      {SERVICE_LABEL[mitra.service_type] || mitra.service_type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{mitra.user?.email} · {mitra.user?.phone}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {/* Verifikasi badge */}
                    {mitra.is_verified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Terverifikasi</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700">
                        <ShieldAlert className="w-3 h-3" />
                        <span>Pending</span>
                      </span>
                    )}
                    {/* Online badge */}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      mitra.is_available ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {mitra.is_available ? '● Online' : '○ Offline'}
                    </span>
                    {/* Rating */}
                    {mitra.rating > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {Number(mitra.rating).toFixed(1)}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">{mitra.total_orders || 0} pesanan</span>
                  </div>
                </div>
              </div>

              {mitra.bio && (
                <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2 mb-3 line-clamp-2">{mitra.bio}</p>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {!mitra.is_verified ? (
                  <>
                    <button onClick={() => handleVerify(mitra.id, 'setujui')}
                      disabled={processing === mitra.id}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-xl text-xs font-semibold transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" /> Verifikasi
                    </button>
                    <button onClick={() => setRejectModal(mitra)}
                      disabled={processing === mitra.id}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-xl text-xs font-semibold transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> Tolak
                    </button>
                  </>
                ) : (
                  <button onClick={() => handleVerify(mitra.id, 'tolak')}
                    disabled={processing === mitra.id}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-amber-50 text-amber-700 py-2 rounded-xl text-xs font-semibold">
                    Batalkan Verifikasi
                  </button>
                )}
                <button onClick={() => setDetail(mitra)}
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold transition-colors">
                  Detail
                </button>
                <button onClick={() => handleToggleUser(mitra)}
                  title={mitra.user?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  className="w-9 h-9 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl transition-colors">
                  {mitra.user?.is_active !== false
                    ? <ToggleRight className="w-5 h-5 text-primary-600" />
                    : <ToggleLeft  className="w-5 h-5 text-gray-400" />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tolak */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm">
            <h3 className="font-bold text-gray-800 mb-1">Tolak Verifikasi</h3>
            <p className="text-sm text-gray-400 mb-4">Alasan penolakan untuk <strong>{rejectModal.user?.name}</strong></p>
            <textarea className="input-field resize-none" rows={3} placeholder="Alasan penolakan..."
              value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setRejectModal(null); setReason('') }} className="btn-secondary flex-1">Batal</button>
              <button onClick={() => handleVerify(rejectModal.id, 'tolak', reason)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold transition-colors">
                Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail */}
      {detail && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="font-bold text-gray-800">Detail Mitra</h3>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center text-white font-black text-xl">
                  {detail.user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{detail.user?.name}</p>
                  <p className="text-xs text-gray-400">{detail.user?.email}</p>
                  <p className="text-xs text-gray-400">{detail.user?.phone}</p>
                </div>
              </div>
              {[
                ['Jenis Layanan', SERVICE_LABEL[detail.service_type] || detail.service_type],
                ['Jenis Kendaraan', detail.vehicle_type],
                ['Nomor Plat', detail.vehicle_plate],
                ['Nama Toko', detail.store_name],
                ['Status', detail.is_verified ? 'Terverifikasi ✓' : 'Menunggu Verifikasi'],
                ['Online', detail.is_available ? 'Online' : 'Offline'],
                ['Rating', detail.rating > 0 ? `${Number(detail.rating).toFixed(1)} ⭐` : '—'],
                ['Total Pesanan', detail.total_orders ?? 0],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="flex justify-between py-2 border-b border-gray-50">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-xs font-semibold text-gray-700 text-right max-w-[60%]">{String(value)}</p>
                </div>
              ))}
              {detail.bio && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Bio / Spesialisasi</p>
                  <p className="text-xs text-gray-700 bg-gray-50 rounded-xl p-3">{detail.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
