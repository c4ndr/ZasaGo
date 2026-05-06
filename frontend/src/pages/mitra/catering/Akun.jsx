import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Edit2, Save, X } from 'lucide-react'
import api from '../../../api/axios'
import useAuthStore from '../../../stores/authStore'
import LoadingSpinner from '../../../components/LoadingSpinner'

export default function MitraCateringAkun() {
  const { user, setUser, logout } = useAuthStore()
  const navigate  = useNavigate()
  const [profil, setProfil]   = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    api.get('/profil').then((r) => {
      setProfil(r.data)
      setForm({ name: r.data.name, phone: r.data.phone || '', bio: r.data.mitra_profile?.bio || '' })
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data } = await api.put('/profil', form)
      setUser(data.user || data)
      setProfil((p) => ({ ...p, ...form }))
      setEditing(false)
    } catch (e) { alert(e.response?.data?.message || 'Gagal menyimpan') }
    finally { setSaving(false) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-800">Akun Saya</h1>

      <div className="bg-gradient-to-r from-orange-500 to-orange-700 rounded-2xl p-5 text-white flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
          {(profil?.name || user?.name || '?')[0].toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-lg">{profil?.name || user?.name}</p>
          <p className="text-orange-200 text-xs">Mitra Catering · {profil?.mitra_profile?.is_available ? '🟢 Online' : '🔴 Offline'}</p>
        </div>
      </div>

      <div className="card space-y-3">
        <div className="flex justify-between items-center">
          <p className="font-semibold text-gray-700">Informasi Profil</p>
          {!editing
            ? <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-orange-600"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
            : <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="text-xs text-gray-400 flex items-center gap-1"><X className="w-3.5 h-3.5" /> Batal</button>
                <button onClick={handleSave} disabled={saving} className="text-xs text-orange-600 flex items-center gap-1"><Save className="w-3.5 h-3.5" /> Simpan</button>
              </div>
          }
        </div>

        {editing ? (
          <div className="space-y-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Nama</label>
              <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">No HP</label>
              <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Menu & Spesialisasi</label>
              <textarea className="input-field resize-none" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Contoh: Nasi kotak, tumpeng, prasmanan" /></div>
          </div>
        ) : (
          <div className="space-y-2">
            {[
              { label: 'Email',     value: profil?.email },
              { label: 'No HP',     value: profil?.phone || '-' },
              { label: 'Spesialisasi', value: profil?.mitra_profile?.bio || '-' },
              { label: 'Rating',    value: profil?.mitra_profile?.rating ? `⭐ ${profil.mitra_profile.rating}` : '-' },
            ].map((r) => (
              <div key={r.label} className="flex justify-between">
                <span className="text-gray-400 text-xs">{r.label}</span>
                <span className="text-xs font-medium text-right max-w-[60%]">{r.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => { logout(); navigate('/login', { replace: true }) }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-500 font-medium text-sm hover:bg-red-50 transition-colors">
        <LogOut className="w-4 h-4" /> Keluar
      </button>
    </div>
  )
}
