import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import api from '../../api/axios'
import { formatRupiah } from '../../utils/hargaUtils'

const LAYANAN = [
  { key: 'komisi_ojek',      label: 'Ojek',        icon: '🛵' },
  { key: 'komisi_urut',      label: 'Urut',        icon: '💆' },
  { key: 'komisi_laundry',   label: 'Laundry',     icon: '👕' },
  { key: 'komisi_catering',  label: 'Catering',    icon: '🍱' },
  { key: 'komisi_kebersihan',label: 'Kebersihan',  icon: '🧹' },
  { key: 'komisi_antar',     label: 'Antar Barang',icon: '📦' },
  { key: 'komisi_produk',    label: 'Produk',      icon: '🛍️' },
]

const PREVIEW_AMOUNT = 50000

export default function AdminKomisi() {
  const [komisi, setKomisi]     = useState({})
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(null)
  const [savingAll, setSavingAll] = useState(false)
  const [saved, setSaved]       = useState({})

  useEffect(() => {
    api.get('/settings/publik').then((r) => {
      const vals = {}
      LAYANAN.forEach(({ key }) => { vals[key] = parseFloat(r.data[key] ?? 10) })
      setKomisi(vals)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const saveOne = async (key) => {
    setSaving(key)
    try {
      await api.put('/settings', { settings: { [key]: komisi[key] } })
      setSaved((p) => ({ ...p, [key]: true }))
      setTimeout(() => setSaved((p) => ({ ...p, [key]: false })), 2000)
    } catch (e) { alert('Gagal menyimpan') }
    finally { setSaving(null) }
  }

  const saveAll = async () => {
    setSavingAll(true)
    try {
      await api.put('/settings', { settings: komisi })
      const all = {}; LAYANAN.forEach(({ key }) => { all[key] = true }); setSaved(all)
      setTimeout(() => setSaved({}), 2000)
    } catch (e) { alert('Gagal menyimpan semua') }
    finally { setSavingAll(false) }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Memuat...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold text-gray-800">Pengaturan Komisi</h1>
        <button onClick={saveAll} disabled={savingAll}
          className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-semibold transition-colors ${savingAll ? 'bg-gray-200 text-gray-500' : 'btn-primary'}`}>
          <Save className="w-3.5 h-3.5" />
          {savingAll ? 'Menyimpan...' : 'Simpan Semua'}
        </button>
      </div>

      <div className="space-y-3">
        {LAYANAN.map(({ key, label, icon }) => {
          const persen  = komisi[key] ?? 10
          const komisiRp = PREVIEW_AMOUNT * persen / 100
          const mitraRp  = PREVIEW_AMOUNT - komisiRp
          return (
            <div key={key} className="card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{icon}</span>
                  <p className="font-semibold text-gray-700 text-sm">{label}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" min="0" max="100" step="0.5"
                    className="w-16 text-center input-field text-sm py-1.5 font-bold"
                    value={persen}
                    onChange={(e) => setKomisi((p) => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))} />
                  <span className="text-xs text-gray-400">%</span>
                  <button onClick={() => saveOne(key)} disabled={saving === key}
                    className={`text-xs px-2 py-1.5 rounded-lg font-medium transition-colors ${saved[key] ? 'bg-emerald-100 text-emerald-600' : 'bg-primary-50 text-primary-600 hover:bg-primary-100'}`}>
                    {saved[key] ? '✓' : saving === key ? '...' : 'Simpan'}
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5 text-xs text-gray-500">
                Pesanan <span className="font-semibold text-gray-700">{formatRupiah(PREVIEW_AMOUNT)}</span> →
                Komisi Platform <span className="font-semibold text-red-500">{formatRupiah(komisiRp)}</span> ·
                Mitra terima <span className="font-semibold text-emerald-600">{formatRupiah(mitraRp)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
