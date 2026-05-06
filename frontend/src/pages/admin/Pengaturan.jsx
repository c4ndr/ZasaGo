import { useEffect, useState } from 'react'
import { Save, Sliders, Info, RefreshCw } from 'lucide-react'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'
import { formatRupiah } from '../../utils/hargaUtils'

const GROUPS = {
  ojek:       { label: 'Tarif Ojek',           color: 'text-primary-600',  bg: 'bg-primary-50' },
  antar:      { label: 'Tarif Antar Barang',    color: 'text-amber-600',    bg: 'bg-amber-50' },
  komisi:     { label: 'Komisi Platform (%)',   color: 'text-emerald-600',  bg: 'bg-emerald-50' },
  titipjalan: { label: 'Pengaturan Jastip',     color: 'text-fuchsia-600',  bg: 'bg-fuchsia-50' },
}

// Tentukan tipe dan range slider per key Jastip
const JASTIP_FIELD_META = {
  komisi_titipjalan:       { suffix: '%',   min: 0,  max: 30,    step: 1,    preview: (v) => `${v}%` },
  diskon_titipjalan_persen:{ suffix: '%',   min: 0,  max: 20,    step: 1,    preview: (v) => `${v}%` },
  titipjalan_radius_default:{ suffix: 'm',  min: 50, max: 2000,  step: 50,   preview: (v) => `${v} meter` },
  titipjalan_max_titipan:  { suffix: 'titipan', min: 1, max: 10, step: 1,    preview: (v) => `${v} titipan` },
  titipjalan_saldo_minimum:{ suffix: 'Rp',  min: 0,  max: 100000, step: 1000, preview: (v) => `Rp ${Number(v).toLocaleString('id')}` },
  tarif_titipan_dasar:     { suffix: 'Rp',  min: 0,  max: 20000,  step: 500,  preview: (v) => `Rp ${Number(v).toLocaleString('id')}` },
  tarif_titipan_per_km:    { suffix: 'Rp',  min: 0,  max: 10000,  step: 500,  preview: (v) => `Rp ${Number(v).toLocaleString('id')} / km` },
}

export default function AdminPengaturan() {
  const [settings, setSettings] = useState([])
  const [values, setValues]     = useState({})
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  useEffect(() => {
    api.get('/admin/settings').then((r) => {
      setSettings(r.data)
      const vals = {}
      r.data.forEach((s) => { vals[s.key] = s.value })
      setValues(vals)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/admin/settings', { settings: values })
      localStorage.removeItem('zashaGo_settings')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const grouped = settings.reduce((acc, s) => {
    if (!acc[s.group]) acc[s.group] = []
    acc[s.group].push(s)
    return acc
  }, {})

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title mb-0">Pengaturan</h1>
        <button onClick={handleSave} disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${saved ? 'bg-emerald-600 text-white' : 'btn-primary'}`}>
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Tersimpan!' : saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>

      {Object.entries(GROUPS).map(([group, meta]) => {
        const items = grouped[group] ?? []
        if (!items.length) return null
        return (
          <div key={group} className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-8 h-8 ${meta.bg} rounded-xl flex items-center justify-center`}>
                <Sliders className={`w-4 h-4 ${meta.color}`} />
              </div>
              <p className="font-bold text-gray-800 text-sm">{meta.label}</p>
            </div>
            <div className="space-y-4">
              {items.map((s) => {
                const isPercent = group === 'komisi'
                const val = parseFloat(values[s.key] ?? s.value)

                let preview, sliderMin, sliderMax, sliderStep
                if (group === 'titipjalan') {
                  const fm = JASTIP_FIELD_META[s.key] ?? { suffix: '', min: 0, max: 100, step: 1, preview: (v) => v }
                  preview    = fm.preview(val)
                  sliderMin  = fm.min
                  sliderMax  = fm.max
                  sliderStep = fm.step
                } else {
                  preview    = isPercent ? `${val}%` : s.key.includes('dasar') ? `Tarif dasar: ${formatRupiah(val)}` : `Per KM: ${formatRupiah(val)}`
                  sliderMin  = isPercent ? 0 : (group === 'ojek' || group === 'antar' ? (s.key.includes('dasar') ? 0 : 500) : 0)
                  sliderMax  = isPercent ? 30 : s.key.includes('dasar') ? 20000 : 10000
                  sliderStep = isPercent ? 1 : 500
                }

                return (
                  <div key={s.key}>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-gray-700 font-medium">{s.label}</label>
                      <span className={`text-xs font-bold ${meta.color}`}>{preview}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={sliderMin}
                        max={sliderMax}
                        step={sliderStep}
                        value={values[s.key] ?? s.value}
                        onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                        className={`flex-1 ${group === 'titipjalan' ? 'accent-fuchsia-600' : 'accent-primary-600'}`}
                      />
                      <input
                        type="number"
                        className="w-20 input-field text-sm text-center py-1.5"
                        value={values[s.key] ?? s.value}
                        onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Preview simulasi */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
            <Info className="w-4 h-4 text-gray-500" />
          </div>
          <p className="font-bold text-gray-800 text-sm">Simulasi Tarif</p>
        </div>
        <div className="space-y-2">
          {[1, 3, 5, 10].map((km) => {
            const tarifOjek  = parseFloat(values.tarif_dasar_ojek ?? 5000) + km * parseFloat(values.tarif_per_km_ojek ?? 3000)
            const tarifAntar = parseFloat(values.tarif_dasar_antar ?? 8000) + km * parseFloat(values.tarif_per_km_antar ?? 4000)
            return (
              <div key={km} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 text-sm">
                <span className="text-gray-500">{km} km</span>
                <div className="flex gap-4">
                  <span className="text-primary-600 font-medium">Ojek: {formatRupiah(tarifOjek)}</span>
                  <span className="text-amber-600 font-medium">Antar: {formatRupiah(tarifAntar)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
