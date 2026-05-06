import { useEffect, useState } from 'react'
import { Search, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '../../api/axios'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'

const ROLE_TABS = [
  { key: '',          label: 'Semua' },
  { key: 'pelanggan', label: 'Pelanggan' },
  { key: 'mitra',     label: 'Mitra' },
  { key: 'penjual',   label: 'Pedagang' },
  { key: 'admin',     label: 'Admin' },
]

const ROLE_COLOR = {
  admin:              'bg-purple-100 text-purple-700',
  mitra:              'bg-blue-100 text-blue-700',
  mitra_urut:         'bg-pink-100 text-pink-700',
  mitra_laundry:      'bg-sky-100 text-sky-700',
  mitra_catering:     'bg-emerald-100 text-emerald-700',
  mitra_kebersihan:   'bg-violet-100 text-violet-700',
  mitra_antar_barang: 'bg-amber-100 text-amber-700',
  pelanggan:          'bg-indigo-100 text-indigo-700',
  penjual:            'bg-fuchsia-100 text-fuchsia-700',
}
const ROLE_LABEL = {
  admin:'Admin', mitra:'Mitra Ojek', mitra_urut:'Mitra Urut', mitra_laundry:'Mitra Laundry',
  mitra_catering:'Mitra Catering', mitra_kebersihan:'Mitra Kebersihan',
  mitra_antar_barang:'Mitra Antar', pelanggan:'Pelanggan', penjual:'Pedagang',
}

export default function AdminPengguna() {
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [roleTab, setRoleTab]   = useState('')
  const [toggling, setToggling] = useState(null)

  const fetchUsers = () => {
    setLoading(true)
    const params = {}
    if (search)  params.search = search
    if (roleTab) params.role   = roleTab
    api.get('/admin/users', { params })
      .then((r) => setUsers(r.data.data || r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [roleTab])

  const handleToggle = async (user) => {
    setToggling(user.id)
    try {
      await api.patch(`/admin/users/${user.id}/toggle-status`)
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
    } catch (e) { console.error(e) }
    finally { setToggling(null) }
  }

  return (
    <div>
      <h1 className="page-title">Kelola Pengguna</h1>

      {/* Role tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4 overflow-x-auto">
        {ROLE_TABS.map((t) => (
          <button key={t.key} onClick={() => setRoleTab(t.key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap px-2 min-w-fit ${
              roleTab === t.key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" className="input-field pl-9" placeholder="Cari nama, email, nomor HP..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()} />
        </div>
        <button onClick={fetchUsers} className="btn-primary px-4">Cari</button>
      </div>

      <p className="text-xs text-gray-400 mb-3">{users.length} pengguna</p>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className={`card flex items-center gap-3 transition-opacity ${!user.is_active ? 'opacity-60' : ''}`}>
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-semibold text-gray-800 text-sm">{user.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${ROLE_COLOR[user.role] || 'bg-gray-100 text-gray-600'}`}>
                    {ROLE_LABEL[user.role] || user.role}
                  </span>
                  {!user.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">Nonaktif</span>}
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">{user.email} · {user.phone}</p>
                <p className="text-[10px] text-gray-300 mt-0.5">
                  Bergabung {new Date(user.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                </p>
              </div>
              <button onClick={() => handleToggle(user)} disabled={toggling === user.id}
                title={user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                className="shrink-0 transition-colors">
                {user.is_active
                  ? <ToggleRight className="w-7 h-7 text-primary-600 hover:text-red-500" />
                  : <ToggleLeft  className="w-7 h-7 text-gray-400 hover:text-primary-600" />
                }
              </button>
            </div>
          ))}

          {users.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">👥</p>
              <p className="text-sm">Tidak ada pengguna ditemukan</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
