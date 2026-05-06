import { useEffect, useState } from 'react'
import { Save, RefreshCw, Package2, Percent, SlidersHorizontal, Info } from 'lucide-react'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'
import { formatRupiah } from '../../utils/hargaUtils'

const SETTING_KEYS = [
  'tarif_titipan_dasar',
  'tarif_titipan_per_km',
  'komisi_titipjalan',
  'diskon_titipjalan_persen',
  'titipjalan_radius_default',
  'titipjalan_max_titipan',
  'titipjalan_saldo_minimum',
]

const FIELD_CONFIG = {
  tarif_titipan_dasar:      { label: 'Tarif Dasar',              suffix: 'Rp',      min: 0,    max: 20000, step: 500  },
  tarif_titipan_per_km:     { label: 'Tarif per Kilometer',      suffix: 'Rp/km',   min: 0,    max: 10000, step: 500  },
  komisi_titipjalan:        { label: 'Komisi Platform',          suffix: '%',       min: 0,    max: 30,    step: 1    },
  diskon_titipjalan_persen: { label: '% Diskon Ongkir Master Ojek', suffix: '%',     min: 0,    max: 20,    step: 1    },
  titipjalan_radius_default:{ label: 'Radius Koridor Default',   suffix: 'meter',   min: 50,   max: 2000,  step: 50   },
  titipjalan_max_titipan:   { label: 'Maksimal Titipan per Sesi',suffix: 'titipan', min: 1,    max: 10,    step: 1    },
  titipjalan_saldo_minimum: { label: 'Saldo Minimum Wallet Mitra',suffix: 'Rp',     min: 0,    max: 100000,step: 1000 },
}

const GROUPS = [
  {
    key:   'tarif',
    label: 'Tarif Jastip',
    icon:  Package2,
    color: 'fuchsia',
    desc:  'Harga yang dibayar pelanggan untuk jasa titipan',
    keys:  ['tarif_titipan_dasar', 'tarif_titipan_per_km'],
  },
  {
    key:   'komisi',
    label: 'Komisi & Diskon',
    icon:  Percent,
    color: 'emerald',
    desc:  'Bagi hasil platform dan insentif pelanggan',
    keys:  ['komisi_titipjalan', 'diskon_titipjalan_persen'],
  },
  {
    key:   'batasan',
    label: 'Batasan Operasional',
    icon:  SlidersHorizontal,
    color: 'amber',
    desc:  'Aturan teknis sesi Jastip',
    keys:  ['titipjalan_radius_default', 'titipjalan_max_titipan', 'titipjalan_saldo_minimum'],
  },
]

const colorMap = {
  fuchsia: { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', icon: 'bg-fuchsia-100', iconText: 'text-fuchsia-600', accent: 'accent-fuchsia-600', badge: 'bg-fuchsia-100 text-fuchsia-700' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-100', iconText: 'text-emerald-600', accent: 'accent-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: 'bg-amber-100',   iconText: 'text-amber-600',   accent: 'accent-amber-600',   badge: 'bg-amber-100 text-amber-700' },
}

function preview(key, val) {
  const v = parseFloat(val)
  if (key === 'tarif_titipan_dasar' || key === 'tarif_titipan_per_km' || key === 'titipjalan_saldo_minimum') return formatRupiah(v)
  if (key === 'komisi_titipjalan' || key === 'diskon_titipjalan_persen') return `${v}%`
  if (key === 'titipjalan_radius_default') return `${v} meter`
  if (key === 'titipjalan_max_titipan') return `${v} titipan`
  return v
}

export default function AdminPengaturanJastip() {
  const [values, setValues]   = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [simKm, setSimKm]     = useState(3)

  useEffect(() => {
    api.get('/admin/settings')
      .then((r) => {
        const vals = {}
        r.data.forEach((s) => { if (SETTING_KEYS.includes(s.key)) vals[s.key] = s.value })
        setValues(vals)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const set = (key, val) => setValues((prev) => ({ ...prev, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/admin/settings', { settings: values })
      localStorage.removeItem('zashaGo_settings') // invalidate client cache
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  // Simulasi perhitungan (model baru: split dari total_price)
  const tarifDasar  = parseFloat(values.tarif_titipan_dasar  ?? 5000)
  const tarifPerKm  = parseFloat(values.tarif_titipan_per_km ?? 2000)
  const komisiPct   = parseFloat(values.komisi_titipjalan     ?? 10)
  const masterPct   = parseFloat(values.diskon_titipjalan_persen ?? 2)

  const totalPrice  = tarifDasar + simKm * tarifPerKm   // jastip pelanggan bayar ini
  const masterCut   = totalPrice * masterPct / 100       // potongan ongkir master ojek
  const komisiPlat  = totalPrice * komisiPct / 100       // komisi platform/admin
  const pengMitra   = totalPrice - masterCut - komisiPlat  // pendapatan mitra bersih

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-0">Pengaturan Jastip</h1>
          <p className="text-xs text-gray-400 mt-0.5">Kelola tarif, komisi, dan batasan fitur Jastip</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${saved ? 'bg-emerald-600 text-white' : 'bg-fuchsia-600 text-white hover:bg-fuchsia-700 disabled:opacity-50'}`}>
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Tersimpan!' : saving ? 'Menyimpan...' : 'Simpan Semua'}
        </button>
      </div>

      {/* Grup setting */}
      {GROUPS.map((group) => {
        const c = colorMap[group.color]
        const Icon = group.icon
        return (
          <div key={group.key} className={`card border ${c.border}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-9 h-9 ${c.icon} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-4.5 h-4.5 ${c.iconText}`} />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{group.label}</p>
                <p className="text-[11px] text-gray-400">{group.desc}</p>
              </div>
            </div>
            <div className="space-y-5">
              {group.keys.map((key) => {
                const cfg = FIELD_CONFIG[key]
                const val = values[key] ?? ''
                return (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm text-gray-700 font-medium">{cfg.label}</label>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${c.badge}`}>
                        {preview(key, val)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="range"
                        min={cfg.min} max={cfg.max} step={cfg.step}
                        value={val}
                        onChange={(e) => set(key, e.target.value)}
                        className={`flex-1 ${c.accent}`}
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <input type="number"
                          min={cfg.min} max={cfg.max} step={cfg.step}
                          className="w-20 input-field text-sm text-center py-1.5"
                          value={val}
                          onChange={(e) => set(key, e.target.value)}
                        />
                        <span className="text-xs text-gray-400 w-10">{cfg.suffix}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Simulasi interaktif */}
      <div className="card border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
            <Info className="w-4.5 h-4.5 text-gray-500" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">Simulasi Perhitungan</p>
            <p className="text-[11px] text-gray-400">Preview bagaimana setting berpengaruh ke harga nyata</p>
          </div>
        </div>

        {/* Slider jarak simulasi */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-medium text-gray-600">Jarak Simulasi</label>
            <span className="text-xs font-bold text-gray-700">{simKm} km</span>
          </div>
          <input type="range" min={1} max={15} step={0.5} value={simKm}
            onChange={(e) => setSimKm(parseFloat(e.target.value))}
            className="w-full accent-fuchsia-600"
          />
          <div className="flex justify-between text-[10px] text-gray-300 mt-0.5">
            <span>1 km</span><span>15 km</span>
          </div>
        </div>

        {/* Hasil simulasi — model baru */}
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-gray-50 text-sm">
            <span className="text-gray-600 font-semibold">Pelanggan jastip bayar</span>
            <span className="font-bold text-gray-800">{formatRupiah(totalPrice)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-50 text-sm">
            <span className="text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-purple-400 rounded-full inline-block" />
              Diskon ongkir master ojek ({masterPct}%)
            </span>
            <span className="font-medium text-purple-600">−{formatRupiah(masterCut)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-50 text-sm">
            <span className="text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-fuchsia-500 rounded-full inline-block" />
              Komisi admin/platform ({komisiPct}%)
            </span>
            <span className="font-medium text-fuchsia-600">{formatRupiah(komisiPlat)}</span>
          </div>
          <div className="flex justify-between items-center py-2 text-sm">
            <span className="text-gray-600 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />
              Penghasilan mitra ojek ({(100 - masterPct - komisiPct).toFixed(0)}%)
            </span>
            <span className="font-bold text-emerald-600 text-base">{formatRupiah(pengMitra)}</span>
          </div>
        </div>

        {/* Distribusi visual */}
        <div className="mt-4">
          <p className="text-[10px] text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Distribusi dari ongkir jastip</p>
          <div className="flex h-4 rounded-full overflow-hidden gap-px">
            <div className="bg-emerald-500 transition-all duration-300"
              style={{ width: `${(pengMitra / totalPrice * 100).toFixed(1)}%` }}
              title={`Mitra ${(pengMitra / totalPrice * 100).toFixed(0)}%`} />
            <div className="bg-fuchsia-500 transition-all duration-300"
              style={{ width: `${(komisiPlat / totalPrice * 100).toFixed(1)}%` }}
              title={`Platform ${komisiPct}%`} />
            <div className="bg-purple-400 transition-all duration-300"
              style={{ width: `${(masterCut / totalPrice * 100).toFixed(1)}%` }}
              title={`Master ${masterPct}%`} />
          </div>
          <div className="flex flex-wrap gap-3 mt-1.5 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" /> Mitra {(pengMitra / totalPrice * 100).toFixed(0)}%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-fuchsia-500 rounded-full inline-block" /> Platform {komisiPct}%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-400 rounded-full inline-block" /> Master ojek {masterPct}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
