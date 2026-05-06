import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import api from '../../api/axios'
import { formatRupiah } from '../../utils/hargaUtils'

const PREVIEW_KM = [1, 3, 5, 10]

export default function AdminPengaturanOjek() {
  const [settings, setSettings] = useState({ tarif_dasar_ojek: 5000, tarif_per_km_ojek: 3000, ojek_min_distance: 1 })
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  useEffect(() => {
    api.get('/settings/publik').then((r) => {
      setSettings((prev) => ({
        tarif_dasar_ojek:   parseFloat(r.data.tarif_dasar_ojek ?? prev.tarif_dasar_ojek),
        tarif_per_km_ojek:  parseFloat(r.data.tarif_per_km_ojek ?? prev.tarif_per_km_ojek),
        ojek_min_distance:  parseFloat(r.data.ojek_min_distance ?? prev.ojek_min_distance),
      }))
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const hitungTotal = (km) => settings.tarif_dasar_ojek + km * settings.tarif_per_km_ojek

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/settings', { settings })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) { alert(e.response?.data?.message || 'Gagal menyimpan') }
    finally { setSaving(false) }
  }

  const field = (key, label, suffix = 'Rp') => (
    <div className="card space-y-2">
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 w-6">{suffix}</span>
        <input type="number" min="0" className="input-field flex-1"
          value={settings[key]}
          onChange={(e) => setSettings((p) => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))} />
      </div>
    </div>
  )

  if (loading) return <div className="text-center py-12 text-gray-400">Memuat...</div>

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-800">Pengaturan Harga Ojek</h1>

      {field('tarif_dasar_ojek', 'Harga Dasar')}
      {field('tarif_per_km_ojek', 'Harga per KM')}
      {field('ojek_min_distance', 'Jarak Minimum', 'KM')}

      <div className="card space-y-3">
        <p className="text-sm font-semibold text-gray-700">Preview Kalkulasi</p>
        <div className="space-y-2">
          {PREVIEW_KM.map((km) => (
            <div key={km} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
              <div className="text-xs text-gray-600">
                <span className="font-medium">{km} km</span>
                <span className="text-gray-400 ml-2">({formatRupiah(settings.tarif_dasar_ojek)} + {km}×{formatRupiah(settings.tarif_per_km_ojek)})</span>
              </div>
              <span className="text-sm font-bold text-primary-600">{formatRupiah(hitungTotal(km))}</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors ${saved ? 'bg-emerald-500 text-white' : 'btn-primary'}`}>
        <Save className="w-4 h-4" />
        {saved ? 'Tersimpan!' : saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
      </button>
    </div>
  )
}
