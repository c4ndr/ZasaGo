import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import ActiveOrdersCard from '../components/ActiveOrdersCard'
import MitraAvailableOrdersCard from '../components/MitraAvailableOrdersCard'
import api from '../services/api'
import { requestNotifPermission } from '../utils/systemNotif'
import useNotifCount from '../hooks/useNotifCount'
import useActiveOrders from '../hooks/useActiveOrders'
import useMitraAvailableOrders from '../hooks/useMitraAvailableOrders'
import { useTheme } from '../hooks/useTheme'
import useAppInfo from '../hooks/useAppInfo'
import { SVC, svcShadow, Gloss } from '../utils/svcTheme'

const ROLE_LABELS = {
  pelanggan: 'Pelanggan', mitra_motor: 'Mitra Motor',
  mitra_mobil: 'Mitra Mobil', admin: 'Admin',
  home_provider: 'Home Provider', serv_provider: 'Serv Provider',
  seller: 'Seller', merchant: 'Merchant',
}

const DEFAULT_BANNERS = [
  {
    svc: 'zasago', emoji: '🎉', title: 'Selamat Datang di ZasaQu!',
    subtitle: 'Kirim barang, pesan makanan, semua dalam satu aplikasi.',
  },
  {
    svc: 'jastip', emoji: '🛍️', title: 'Jastip — Titip Beli Barang',
    subtitle: 'Titip belanja ke mitra terpercaya, hemat waktu & tenaga.',
  },
  {
    svc: 'zasafood', emoji: '🍜', title: 'ZasaFood — Pesan Dari Warung Lokal',
    subtitle: 'Hemat ongkir dengan fitur sesi kuliner bersama.',
  },
]

const STORAGE_URL = import.meta.env.VITE_STORAGE_URL || ((import.meta.env.VITE_API_URL || '') + '/storage')

function getGreeting() {
  const h = new Date().getHours()
  if (h < 11) return { text: 'Selamat Pagi', emoji: '☀️' }
  if (h < 15) return { text: 'Selamat Siang', emoji: '🌤️' }
  if (h < 18) return { text: 'Selamat Sore', emoji: '🌇' }
  return { text: 'Selamat Malam', emoji: '🌙' }
}

function getDateStr() {
  return new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatRp(v) {
  return new Intl.NumberFormat('id-ID').format(Number(v || 0))
}

const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
)

/* ── Kartu layanan — warna solid per layanan ── */
function ServiceCard({ to, emoji, title, desc, badge, badgeActive = true, svc, active = true }) {
  const { bg, fg, rgb } = svc
  const inner = (
    <div style={{
      background: bg,
      borderRadius: 18, padding: '12px 11px',
      position: 'relative', overflow: 'hidden',
      opacity: active ? 1 : 0.55,
      transition: 'transform 0.15s, box-shadow 0.15s',
      cursor: active ? 'pointer' : 'default',
      minHeight: 101,
      boxShadow: svcShadow(rgb),
    }}>
      <Gloss />
      {/* Bubble ikon putih timbul */}
      <div style={{
        position: 'relative', width: 32, height: 32, borderRadius: 11,
        background: 'var(--k-surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, marginBottom: 7,
        boxShadow: `0 3px 8px rgba(${rgb},0.28), inset 0 1.5px 0 rgba(255,255,255,0.95), inset 0 -3px 5px -3px rgba(${rgb},0.4)`,
      }}>{emoji}</div>
      <p style={{ position: 'relative', fontSize: 12, fontWeight: 800, color: fg, marginBottom: 2 }}>{title}</p>
      <p style={{ position: 'relative', fontSize: 9.5, color: fg, opacity: 0.72, marginBottom: 7, lineHeight: 1.3 }}>{desc}</p>
      <span style={{
        position: 'relative', fontSize: 8.5, fontWeight: 700, padding: '2px 7px',
        borderRadius: 100,
        background: badgeActive ? 'var(--k-primary)' : 'rgba(255,255,255,0.55)',
        color: badgeActive ? '#fff' : fg,
        letterSpacing: '0.04em',
      }}>{badge}</span>
    </div>
  )

  if (!active || !to) return inner
  return <Link to={to} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link>
}

/* ── Kartu aksi utama (besar) ── */
function MainCard({ to, emoji, title, desc, svc }) {
  const { bg, fg, rgb } = svc
  return (
    <Link to={to} style={{ textDecoration: 'none', flex: 1 }}>
      <div style={{
        background: bg,
        borderRadius: 18, padding: '13px 13px',
        position: 'relative', overflow: 'hidden',
        transition: 'transform 0.15s',
        boxShadow: svcShadow(rgb, true),
      }}>
        <Gloss />
        <div style={{
          position: 'relative', width: 38, height: 38, borderRadius: 13,
          background: 'var(--k-surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 19,
          boxShadow: `0 3px 8px rgba(${rgb},0.28), inset 0 1.5px 0 rgba(255,255,255,0.95), inset 0 -3px 5px -3px rgba(${rgb},0.4)`,
        }}>{emoji}</div>
        <p style={{ position: 'relative', fontSize: 12, fontWeight: 800, color: fg, marginTop: 8, marginBottom: 3 }}>{title}</p>
        <p style={{ position: 'relative', fontSize: 9.5, color: fg, opacity: 0.72, lineHeight: 1.3 }}>{desc}</p>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const isMitra      = user?.role?.startsWith('mitra')
  const vehicleType  = user?.role === 'mitra_motor' ? 'motor' : user?.role === 'mitra_mobil' ? 'mobil' : null

  const [walletData,       setWalletData]       = useState(null)
  const [locationName,     setLocationName]     = useState(null)
  const [bannerIdx,        setBannerIdx]        = useState(0)
  const [promos,           setPromos]           = useState(DEFAULT_BANNERS)
  const touchStartX = useRef(null)
  const { count: notifCount } = useNotifCount()
  const { isDark, toggle: toggleTheme } = useTheme()
  const { app_logo_url, app_name, features } = useAppInfo()
  const feat = features ?? {}
  const greeting = getGreeting()
  const { orders: activeOrders }    = useActiveOrders(!isMitra, feat)
  const { orders: availableOrders } = useMitraAvailableOrders(isMitra, feat)

  useEffect(() => {
    if (user?.role === 'admin') return
    api.get('/wallet/summary').then(r => setWalletData(r.data)).catch(() => {})
  }, [user])


  useEffect(() => {
    if (user?.role === 'admin') navigate('/admin', { replace: true })
  }, [user, navigate])

  useEffect(() => { requestNotifPermission() }, [])

  // Fetch promo banners dari API (public endpoint, no auth)
  useEffect(() => {
    const base = (import.meta.env.VITE_API_URL || '') + '/api'
    fetch(`${base}/promos`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data) && data.length > 0) setPromos(data) })
      .catch(() => {})
  }, [])

  // Reverse geocode lokasi user
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lon } = pos.coords
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
        .then(r => r.json())
        .then(d => {
          const a = d.address || {}
          const name = a.suburb || a.village || a.town || a.city_district || a.city || a.county || null
          if (name) setLocationName(name)
        })
        .catch(() => {})
    }, () => {})
  }, [])

  // Auto-slide banner setiap 4 detik
  useEffect(() => {
    if (promos.length <= 1) return
    const t = setInterval(() => setBannerIdx(i => (i + 1) % promos.length), 4000)
    return () => clearInterval(t)
  }, [promos.length])

  if (user?.role === 'admin') return null

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--k-bg)', paddingBottom: 100 }}>
      <style>{`@keyframes dashPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.5)}}`}</style>

      {/* ── Header ─────────────────────────────────── */}
      <div style={{ background: 'var(--k-header-bg)', position: 'relative' }}>
        {/* Strip atas: sapaan + lokasi */}
        <div style={{
          paddingTop: 48, paddingLeft: 20, paddingRight: 20, paddingBottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--k-sub)' }}>
            {greeting.emoji} {greeting.text}
          </span>
          {locationName && (
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--k-sub)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 13 }}>📍</span>{locationName}
            </span>
          )}
        </div>

        {/* Baris logo kiri + tombol kanan */}
        <div style={{
          padding: '10px 20px 4px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <img src={app_logo_url || '/logo-zasaqu.png'} alt={app_name || 'ZasaQu'}
            onError={e => { e.currentTarget.src = '/logo-zasaqu.png' }}
            style={{ height: 50, display: 'block' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Toggle mode gelap/terang */}
            <button
              onClick={toggleTheme}
              style={{
                width: 40, height: 40, borderRadius: 14,
                background: 'var(--k-surface)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 18,
                boxShadow: 'var(--k-shadow), var(--k-inset-hi)',
              }}
              aria-label="Ganti tema"
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* Notifikasi */}
            <Link to="/notifications" style={{
              position: 'relative',
              width: 40, height: 40, borderRadius: 14,
              background: 'var(--k-surface)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', fontSize: 18,
              boxShadow: 'var(--k-shadow), var(--k-inset-hi)',
            }}>
              🔔
              {notifCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  background: 'var(--k-primary)', color: '#fff',
                  fontSize: 9, fontWeight: 900, minWidth: 16, height: 16,
                  borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid var(--k-surface)', padding: '0 2px',
                }}>
                  {notifCount > 99 ? '99+' : notifCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Nama + role badge */}
        <div style={{ padding: '0 20px 18px' }}>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: 'var(--k-text)', lineHeight: 1.25, marginBottom: 8 }}>
            Halo, {user?.name?.split(' ')[0]} 👋
          </h1>
          <span style={{
            display: 'inline-block', padding: '4px 12px', borderRadius: 100,
            background: 'var(--k-zasago-bg)', color: 'var(--k-zasago-fg)',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
          }}>
            {ROLE_LABELS[user?.role]}
          </span>
        </div>
      </div>

      {/* ── Banner Promo Slide ──────────────────────── */}
      <div style={{ padding: '16px 16px 0' }}>
        <div
          style={{ borderRadius: 18, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
          onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
          onTouchEnd={e => {
            if (touchStartX.current === null) return
            const dx = e.changedTouches[0].clientX - touchStartX.current
            if (dx < -40) setBannerIdx(i => (i + 1) % promos.length)
            else if (dx > 40) setBannerIdx(i => (i - 1 + promos.length) % promos.length)
            touchStartX.current = null
          }}
        >
          {/* Slide aktif */}
          {promos.map((b, i) => {
            const svc = b.svc ? SVC[b.svc] : null
            const isCustom = !!b.gradient /* promo dari admin API, pola lama tetap dihormati */
            const bgStyle = b.gradient || svc?.bg || 'var(--k-zasago-bg)'
            const fgColor = isCustom ? '#fff' : (svc?.fg || 'var(--k-text)')
            const slideContent = (
              <div key={b.id ?? i} style={{
                display: i === bannerIdx ? 'flex' : 'none',
                background: bgStyle,
                padding: '18px 20px',
                alignItems: 'center', gap: 14,
                minHeight: 88,
                boxShadow: !isCustom && svc ? svcShadow(svc.rgb) : undefined,
              }}>
                {(b.image_data_url || b.image_path) ? (
                  <img src={b.image_data_url || `${STORAGE_URL}/${b.image_path}`} alt="" style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                    background: isCustom ? 'rgba(255,255,255,0.22)' : 'var(--k-surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26,
                    boxShadow: !isCustom && svc ? `0 3px 8px rgba(${svc.rgb},0.25)` : undefined,
                  }}>{b.emoji ?? '🎉'}</div>
                )}
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: fgColor, marginBottom: 3 }}>{b.title}</div>
                  <div style={{ fontSize: 12, color: fgColor, opacity: isCustom ? 0.82 : 0.75, lineHeight: 1.4 }}>{b.subtitle ?? b.description ?? b.desc}</div>
                </div>
              </div>
            )
            if (b.link_url) {
              return <a key={b.id ?? i} href={b.link_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'block' }}>{slideContent}</a>
            }
            return slideContent
          })}

          {/* Dot indikator */}
          {promos.length > 1 && (
            <div style={{
              position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 5, zIndex: 2,
            }}>
              {promos.map((_, i) => {
                const dotDark = !promos[bannerIdx]?.gradient
                return (
                  <span
                    key={i}
                    onClick={() => setBannerIdx(i)}
                    style={{
                      width: i === bannerIdx ? 18 : 6, height: 6, borderRadius: 3,
                      background: i === bannerIdx
                        ? (dotDark ? 'var(--k-text)' : '#fff')
                        : (dotDark ? 'rgba(30,34,51,0.25)' : 'rgba(255,255,255,0.45)'),
                      transition: 'width 0.25s ease, background 0.25s',
                      cursor: 'pointer',
                    }}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '12px 16px 0' }}>

        {/* ── Kartu Saldo ──────────────────────────── */}
        <div style={{
          borderRadius: 22,
          background: 'var(--k-wallet-bg)',
          padding: '18px 18px 16px',
          marginBottom: 13,
          position: 'relative', overflow: 'hidden',
          boxShadow: svcShadow(SVC.wallet.rgb, true),
        }}>
          <Gloss />
          <div style={{ position: 'relative' }}>
          <p style={{ color: 'var(--k-wallet-fg)', opacity: 0.8, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 7 }}>
            Saldo Tersedia
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
            <span style={{ color: 'var(--k-wallet-fg)', opacity: 0.75, fontSize: 16, fontWeight: 600 }}>Rp</span>
            <span style={{ color: 'var(--k-wallet-fg)', fontSize: 32, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em' }}>
              {formatRp(walletData?.available ?? user?.wallet?.balance)}
            </span>
          </div>
          {(walletData?.locked_balance ?? user?.wallet?.locked_balance) > 0 && (
            <p style={{ color: 'var(--k-wallet-fg)', opacity: 0.65, fontSize: 11, marginBottom: 4 }}>
              🔒 Terkunci: Rp {formatRp(walletData?.locked_balance ?? user?.wallet?.locked_balance)}
            </p>
          )}

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: 9, marginTop: 18 }}>
            <Link to="/topup" style={{
              flex: 1, textAlign: 'center', padding: '9px 7px',
              background: 'var(--k-primary)', borderRadius: 999,
              color: '#fff', fontWeight: 700, fontSize: 12, textDecoration: 'none',
              boxShadow: '0 4px 10px -2px rgba(30,40,55,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}>Top Up</Link>
            {isMitra && (
              <Link to="/withdraw" style={{
                flex: 1, textAlign: 'center', padding: '9px 7px',
                background: 'var(--k-surface)', borderRadius: 999,
                color: 'var(--k-wallet-fg)', fontWeight: 700, fontSize: 12, textDecoration: 'none',
                boxShadow: '0 3px 8px rgba(122,74,34,0.18), inset 0 1px 0 rgba(255,255,255,0.7)',
              }}>Withdraw</Link>
            )}
            <Link to="/wallet" style={{
              flex: 1, textAlign: 'center', padding: '9px 7px',
              background: 'var(--k-surface)', borderRadius: 999,
              color: 'var(--k-wallet-fg)', fontWeight: 700, fontSize: 12, textDecoration: 'none',
              boxShadow: '0 3px 8px rgba(122,74,34,0.18), inset 0 1px 0 rgba(255,255,255,0.7)',
            }}>Riwayat</Link>
          </div>
          </div>
        </div>

        {/* ── Aksi Utama Mitra ─────────────────────── */}
        {isMitra && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--k-muted)',
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              Menu Utama
            </p>

            {/* Card order tersedia — semua modul digabung */}
            <MitraAvailableOrdersCard orders={availableOrders} />

            {/* Shortcut ke masing-masing halaman mitra */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <Link to="/mitra/orders" style={{ flex: 1, minWidth: 80, textDecoration: 'none' }}>
                <div style={{ background: 'var(--k-zasago-bg)', borderRadius: 14, padding: '11px 9px', textAlign: 'center', boxShadow: svcShadow(SVC.zasago.rgb) }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>🛵</div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--k-zasago-fg)' }}>ZasaGo</p>
                </div>
              </Link>
              {feat.zasafood !== false && (
                <Link to="/mitra/food/orders" style={{ flex: 1, minWidth: 80, textDecoration: 'none' }}>
                  <div style={{ background: 'var(--k-zasafood-bg)', borderRadius: 14, padding: '11px 9px', textAlign: 'center', boxShadow: svcShadow(SVC.zasafood.rgb) }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>🍜</div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--k-zasafood-fg)' }}>ZasaFood</p>
                  </div>
                </Link>
              )}
              {feat.zasamart !== false && (
                <Link to="/mitra/mart/orders" style={{ flex: 1, minWidth: 80, textDecoration: 'none' }}>
                  <div style={{ background: 'var(--k-zasashop-bg)', borderRadius: 14, padding: '11px 9px', textAlign: 'center', boxShadow: svcShadow(SVC.zasashop.rgb) }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>🛒</div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--k-zasashop-fg)' }}>ZasaShop</p>
                  </div>
                </Link>
              )}
              {feat.zasaride === true && (
                <Link to="/mitra/ride" style={{ flex: 1, minWidth: 80, textDecoration: 'none' }}>
                  <div style={{ background: 'var(--k-zasaride-bg)', borderRadius: 14, padding: '11px 9px', textAlign: 'center', boxShadow: svcShadow(SVC.zasaride.rgb) }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>🚗</div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--k-zasaride-fg)' }}>ZasaRide</p>
                  </div>
                </Link>
              )}
              <Link to="/mitra/gps" style={{ flex: 1, minWidth: 80, textDecoration: 'none' }}>
                <div style={{ background: 'var(--k-zasago-bg)', borderRadius: 14, padding: '11px 9px', textAlign: 'center', boxShadow: svcShadow(SVC.zasago.rgb) }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>📍</div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--k-zasago-fg)' }}>GPS</p>
                </div>
              </Link>
            </div>
          </>
        )}

        {/* ── Pesanan Aktif Pelanggan ──────────────── */}
        {!isMitra && <ActiveOrdersCard orders={activeOrders} />}

        {/* ── Aksi Utama Pelanggan ─────────────────── */}
        {!isMitra && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--k-muted)',
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              Menu Utama
            </p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <MainCard
                to="/orders/create"
                emoji="🚀"
                title="Kirim Sekarang"
                desc="Buat order pengiriman baru"
                svc={SVC.zasago}
              />
              <MainCard
                to="/orders"
                emoji="📋"
                title="Order Saya"
                desc="Lacak status pengiriman"
                svc={SVC.zasago}
              />
            </div>
          </>
        )}

        {/* ── Layanan ZasaQu ───────────────────────── */}
        {!isMitra && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--k-muted)',
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              Layanan ZasaQu
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>

              {/* Jastip */}
              <ServiceCard
                to={feat.zasago ? '/jastip' : null}
                emoji="🛍️"
                title="Jastip" desc="Titip beli barang"
                badge={feat.zasago ? 'AKTIF' : 'SEGERA'}
                badgeActive={feat.zasago !== false}
                svc={SVC.jastip}
                active={feat.zasago !== false}
              />

              {/* ZasaFood */}
              <ServiceCard
                to={feat.zasafood ? '/food' : null}
                emoji="🍜"
                title="ZasaFood" desc="Makanan & minuman"
                badge={feat.zasafood ? 'AKTIF' : 'SEGERA'}
                badgeActive={feat.zasafood !== false}
                svc={SVC.zasafood}
                active={feat.zasafood !== false}
              />

              {/* ZasaHome */}
              <ServiceCard
                to={feat.zasahome ? '/home' : null}
                emoji="🏠"
                title="ZasaHome" desc="Laundry & jasa rumah"
                badge={feat.zasahome ? 'AKTIF' : 'SEGERA'}
                badgeActive={feat.zasahome !== false}
                svc={SVC.zasahome}
                active={feat.zasahome !== false}
              />

              {/* ZasaShop */}
              <ServiceCard
                to={feat.zasamart ? '/mart' : null}
                emoji="🛒"
                title="ZasaShop" desc="Produk UMKM lokal"
                badge={feat.zasamart ? 'AKTIF' : 'SEGERA'}
                badgeActive={feat.zasamart !== false}
                svc={SVC.zasashop}
                active={feat.zasamart !== false}
              />

              {/* ZasaRide */}
              <ServiceCard
                to={feat.zasaride ? '/ride' : null}
                emoji="🛵"
                title="ZasaRide" desc="Ojek & antar jemput"
                badge={feat.zasaride ? 'AKTIF' : 'SEGERA'}
                badgeActive={feat.zasaride === true}
                svc={SVC.zasaride}
                active={feat.zasaride === true}
              />

              {/* ZasaServ */}
              <ServiceCard
                to={feat.zasaserv ? '/serv' : null}
                emoji="🔧"
                title="ZasaServis" desc="Servis & perbaikan"
                badge={feat.zasaserv ? 'AKTIF' : 'SEGERA'}
                badgeActive={feat.zasaserv === true}
                svc={SVC.zasaserv}
                active={feat.zasaserv === true}
              />
            </div>
          </>
        )}

      </div>

      <BottomNav />
    </div>
  )
}
