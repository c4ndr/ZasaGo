import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SVC, svcShadow, Gloss } from '../utils/svcTheme'

const NAV = [
  { to: '/seller',          emoji: '📊', label: 'Dashboard', exact: true },
  { to: '/seller/orders',   emoji: '📦', label: 'Pesanan'  },
  { to: '/seller/products', emoji: '🛍️', label: 'Produk'   },
  { to: '/seller/wallet',   emoji: '💰', label: 'Dompet'   },
  { to: '/seller/settings', emoji: '⚙️', label: 'Setelan'  },
]

export default function MartSellerLayout({ children, title }) {
  const { user, logout } = useAuth()
  const navigate   = useNavigate()
  const isDualRole = user?.role !== 'seller'

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--k-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        background: SVC.zasashop.bg, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 50, overflow: 'hidden', boxShadow: svcShadow(SVC.zasashop.rgb),
      }}>
        <Gloss />
        <span style={{ position: 'relative', fontSize: 22 }}>🏪</span>
        <p style={{ position: 'relative', color: SVC.zasashop.fg, fontWeight: 800, fontSize: 15, flex: 1 }}>{title || 'ZasaShop Seller'}</p>
        {isDualRole ? (
          <button onClick={() => navigate('/dashboard')} style={{ position: 'relative', background: 'rgba(255,255,255,0.35)', border: 'none', borderRadius: 8, padding: '6px 12px', color: SVC.zasashop.fg, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🛍️ Mode Pembeli</button>
        ) : (
          <button onClick={logout} style={{ position: 'relative', background: 'rgba(255,255,255,0.35)', border: 'none', borderRadius: 8, padding: '6px 12px', color: SVC.zasashop.fg, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Keluar</button>
        )}
      </div>

      {/* Content */}
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 72 }}>
        {children}
      </main>

      {/* Bottom nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: 'var(--k-surface)', borderTop: '1px solid var(--k-border)', display: 'flex', paddingBottom: 'env(safe-area-inset-bottom,0px)', zIndex: 50 }}>
        {NAV.map(({ to, emoji, label, exact }) => (
          <NavLink key={to} to={to} end={exact} style={{ flex: 1, textDecoration: 'none' }}>
            {({ isActive }) => (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 10, paddingBottom: 10, gap: 2 }}>
                <span style={{ fontSize: 20 }}>{emoji}</span>
                <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: isActive ? SVC.zasashop.fg : 'var(--k-muted)', transition: 'color 0.18s' }}>{label}</span>
                <span style={{ height: 3, borderRadius: 3, width: isActive ? 20 : 0, background: SVC.zasashop.fg, transition: 'width 0.2s ease', marginTop: 1 }} />
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
