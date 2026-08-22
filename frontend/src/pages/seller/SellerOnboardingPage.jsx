import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { SVC, svcShadow, Gloss } from '../../utils/svcTheme'

export default function SellerOnboardingPage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', address: '', phone: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Sudah punya toko — tidak perlu buka lagi, langsung ke Seller Centre
  if (user?.mart_seller) return <Navigate to="/seller" replace />

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const r = await api.post('/mart/store', form)
      updateUser({ mart_seller: r.data })
      navigate('/seller')
    } catch (err) {
      const errs = err.response?.data?.errors
      setError(errs ? Object.values(errs).flat().join(' ') : (err.response?.data?.message || 'Gagal membuka toko.'))
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--k-bg)', paddingBottom: 32 }}>
      <div style={{ padding: '52px 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link to="/profile" style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--k-card)', border: '1px solid var(--k-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--k-muted)', textDecoration: 'none', fontSize: 18 }}>←</Link>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--k-text)', flex: 1 }}>Buka Toko</h1>
        </div>

        <div style={{ borderRadius: 20, background: SVC.zasashop.bg, padding: 18, position: 'relative', overflow: 'hidden', boxShadow: svcShadow(SVC.zasashop.rgb, true) }}>
          <Gloss />
          <div style={{ position: 'relative' }}>
            <p style={{ fontSize: 28, marginBottom: 8 }}>🏪</p>
            <p style={{ color: SVC.zasashop.fg, fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Mulai jualan di ZasaShop</p>
            <p style={{ color: SVC.zasashop.fg, opacity: 0.8, fontSize: 12.5, lineHeight: 1.6 }}>
              Akun Anda tetap bisa dipakai belanja seperti biasa. Toko akan aktif setelah diverifikasi admin.
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px', maxWidth: 480, margin: '0 auto' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">Nama Toko</label>
            <input type="text" name="name" value={form.name} onChange={handleChange}
              className="input-field" placeholder="Contoh: Toko Berkah Jaya" required maxLength={100} />
          </div>

          <div>
            <label className="label">Alamat Toko</label>
            <input type="text" name="address" value={form.address} onChange={handleChange}
              className="input-field" placeholder="Alamat lengkap toko" required maxLength={500} />
          </div>

          <div>
            <label className="label">Nomor Telepon (opsional)</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange}
              className="input-field" placeholder="08xxxxxxxxxx" maxLength={20} />
          </div>

          <div>
            <label className="label">Deskripsi Toko (opsional)</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              className="input-field" placeholder="Jual apa saja tokomu?" rows={3} maxLength={1000}
              style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          {error && <div className="error-box fade-in">{error}</div>}

          <button type="submit" disabled={loading || !form.name.trim() || !form.address.trim()}
            style={{
              width: '100%', padding: '15px', borderRadius: 16, border: 'none',
              background: SVC.zasashop.bg, color: SVC.zasashop.fg, fontWeight: 800, fontSize: 15,
              cursor: 'pointer', transition: 'opacity 0.2s',
              opacity: loading || !form.name.trim() || !form.address.trim() ? 0.45 : 1,
              boxShadow: svcShadow(SVC.zasashop.rgb),
            }}>
            {loading ? 'Membuka Toko...' : 'Buka Toko Sekarang'}
          </button>
        </form>
      </div>
    </div>
  )
}
