import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useMartCartCount from '../hooks/useMartCartCount'
import useAppInfo from '../hooks/useAppInfo'
import useUnreadNotifCount from '../hooks/useUnreadNotifCount'
import { useTheme } from '../hooks/useTheme'

function parsePreset(preset) {
  if (!preset) return null
  const [emoji, color] = preset.split('|')
  return emoji && color ? { emoji, color } : null
}

function AvatarIcon({ name, photoUrl, avatarPreset, isActive }) {
  const preset = parsePreset(avatarPreset)
  const hue = [...(name ?? 'U')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  if (preset) {
    return (
      <div style={{
        width: 26, height: 26, borderRadius: '50%',
        background: preset.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15,
        outline: isActive ? `2px solid ${preset.color}` : 'none',
        outlineOffset: 1,
      }}>{preset.emoji}</div>
    )
  }
  if (photoUrl) {
    return (
      <img src={photoUrl} alt={name}
        style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover',
          outline: isActive ? `2px solid hsl(${hue},60%,45%)` : 'none' }} />
    )
  }
  const initial = (name ?? '?')[0].toUpperCase()
  return (
    <div style={{
      width: 26, height: 26, borderRadius: '50%',
      background: isActive ? `hsl(${hue},60%,45%)` : '#D1D5DB',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 800, color: '#fff',
    }}>{initial}</div>
  )
}

const IconHome = ({ filled }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    {filled
      ? <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>
      : <>
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
        </>
    }
  </svg>
)

const IconBox = ({ filled }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    {filled
      ? <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" fill="currentColor" opacity=".9"/>
      : <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    }
  </svg>
)

const IconPin = ({ filled }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    {filled
      ? <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
      : <>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth={1.8}/>
        </>
    }
  </svg>
)

const IconWallet = ({ filled }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    {filled
      ? <path d="M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2zm0 8H3V8h18v4zm-3 2a1 1 0 100 2 1 1 0 000-2z" fill="currentColor"/>
      : <>
          <rect x="1" y="4" width="22" height="16" rx="3" stroke="currentColor" strokeWidth={1.8}/>
          <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth={1.8}/>
          <circle cx="17" cy="15" r="1.5" fill="currentColor"/>
        </>
    }
  </svg>
)

const IconFood = ({ filled }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    {filled
      ? <path d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7c0-5.8-7.51-5.8-7.51 0H1v5h15.03v-5z" fill="currentColor"/>
      : <>
          <path d="M18 8h1a4 4 0 010 8h-1" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="6" y1="1" x2="6" y2="4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/>
          <line x1="10" y1="1" x2="10" y2="4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/>
          <line x1="14" y1="1" x2="14" y2="4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/>
        </>
    }
  </svg>
)

const IconServ = ({ filled }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    {filled ? (
      <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" fill="currentColor"/>
    ) : (
      <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    )}
  </svg>
)

const IconCar = ({ filled }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    {filled ? (
      <path d="M5 11l1.5-4.5h11L19 11M17 16a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM3 11h18v7a1 1 0 01-1 1H4a1 1 0 01-1-1v-7z" fill="currentColor"/>
    ) : (
      <>
        <path d="M5 11l1.5-4.5h11L19 11" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="3" y="11" width="18" height="8" rx="1" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="7" cy="17" r="1.5" fill="currentColor"/>
        <circle cx="17" cy="17" r="1.5" fill="currentColor"/>
      </>
    )}
  </svg>
)

const IconMart = ({ filled }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    {filled
      ? <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zM3 6h18M16 10a4 4 0 01-8 0" fill="none" stroke="currentColor" strokeWidth={0}/>
      : null
    }
    {filled ? (
      <>
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6L18 2H6z" fill="currentColor" opacity=".85"/>
        <path d="M3 6h18" stroke="#fff" strokeWidth={1.6} strokeLinecap="round"/>
        <path d="M16 10a4 4 0 01-8 0" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" fill="none"/>
      </>
    ) : (
      <>
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6L18 2H6z" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/>
        <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" fill="none"/>
      </>
    )}
  </svg>
)

const PELANGGAN_ITEMS = (name) => [
  { to: '/dashboard', Icon: IconHome,   label: 'Beranda'  , exact: true },
  { to: '/orders',    Icon: IconBox,    label: 'ZasaGo'   },
  { to: '/mart',      Icon: IconMart,   label: 'ZasaShop' },
  { to: '/food',      Icon: IconFood,   label: 'ZasaFood' },
  { to: '/profile',   Icon: null,       label: 'Akun',    avatar: true },
]

const MITRA_ITEMS = (name) => [
  { to: '/dashboard',       Icon: IconHome,   label: 'Beranda'    , exact: true },
  { to: '/mitra/aktivitas', Icon: IconBox,    label: 'Aktivitas' },
  { to: '/mitra/gps',       Icon: IconPin,    label: 'GPS' },
  { to: '/wallet',          Icon: IconWallet, label: 'Penghasilan' },
  { to: '/profile',         Icon: null,       label: 'Akun',       avatar: true },
]

export default function BottomNav() {
  const { user } = useAuth()
  const { count: cartCount } = useMartCartCount()
  const { features } = useAppInfo()
  const notifCount = useUnreadNotifCount()
  const { isDark } = useTheme()
  const feat = features ?? {}

  if (!user || user.role === 'admin' || user.role === 'merchant' || user.role === 'home_provider' || user.role === 'serv_provider' || user.role === 'seller') return null

  const isMitra = user.role?.startsWith('mitra')
  const neu = !isMitra && isDark // dark neumorphic teal — cuma pelanggan + mode gelap

  // Filter item berdasarkan feature flags
  const allPelanggan = PELANGGAN_ITEMS(user.name)
  const filteredPelanggan = allPelanggan.filter(item => {
    if (item.to === '/orders') return feat.zasago   !== false
    if (item.to === '/mart')   return feat.zasamart !== false
    if (item.to === '/food')   return feat.zasafood !== false
    return true
  })

  const allMitra = MITRA_ITEMS(user.name)
  const filteredMitra = allMitra.filter(item => {
    // Mitra nav items are generic (dashboard, aktivitas, GPS, wallet, profile) — no module filtering needed
    return true
  })

  const items = isMitra ? filteredMitra : filteredPelanggan

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480, zIndex: 50,
      padding: '0 16px calc(14px + env(safe-area-inset-bottom, 0px))',
      pointerEvents: 'none',
    }}>
      <nav className={neu ? 'zq-neu' : ''} style={{
        pointerEvents: 'auto',
        background: neu ? 'var(--k-card)' : 'var(--k-primary)',
        borderRadius: 999,
        boxShadow: neu
          ? '6px 6px 14px rgba(0,0,0,0.55), -6px -6px 14px rgba(255,255,255,0.03)'
          : '0 3px 8px rgba(20,28,40,0.3), 0 14px 28px -8px rgba(20,28,40,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'stretch', height: 64,
        padding: '0 4px',
      }}>
        {items.map(({ to, Icon, label, exact, avatar }) => {
          const badgeNum   = to === '/mart' && cartCount > 0 ? cartCount
            : to === '/dashboard' && notifCount > 0 ? notifCount : 0
          const badgeLabel = badgeNum > 99 ? '99+' : String(badgeNum)
          return (
            <NavLink
              key={to}
              to={to}
              end={exact}
              style={{ flex: 1, textDecoration: 'none' }}
            >
              {({ isActive }) => (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', height: '100%', gap: 3,
                }}>
                  <span style={{
                    position: 'relative',
                    width: 34, height: 34, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive
                      ? (neu ? 'linear-gradient(135deg, #4ECDC4, #3fb6ad)' : 'var(--k-wallet-bg)')
                      : 'transparent',
                    color: isActive
                      ? (neu ? '#0E2624' : 'var(--k-primary)')
                      : (neu ? '#8992A8' : 'rgba(255,255,255,0.55)'),
                    boxShadow: isActive
                      ? (neu ? '0 3px 8px rgba(0,0,0,0.4), 0 0 0 1px rgba(78,205,196,0.3)' : '0 3px 8px rgba(0,0,0,0.25)')
                      : 'none',
                    transition: 'background 0.18s, color 0.18s',
                  }}>
                    {avatar
                      ? <AvatarIcon name={user.name} photoUrl={user.photo_url} avatarPreset={user.avatar_preset} isActive={isActive} />
                      : <Icon filled={isActive} />
                    }
                    {badgeNum > 0 && (
                      <span style={{
                        position: 'absolute', top: -4, right: -4,
                        background: '#EF4444', color: '#fff',
                        fontSize: 9, fontWeight: 900,
                        minWidth: 16, height: 16, borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1.5px solid ${neu ? '#1c2236' : 'var(--k-primary)'}`, padding: '0 2px', lineHeight: 1,
                      }}>{badgeLabel}</span>
                    )}
                  </span>
                  <span style={{
                    fontSize: 9.5, fontWeight: isActive ? 700 : 600,
                    color: isActive
                      ? (neu ? '#F4F6F8' : '#fff')
                      : (neu ? '#8992A8' : 'rgba(255,255,255,0.55)'),
                    transition: 'color 0.18s', lineHeight: 1,
                  }}>{label}</span>
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
