/* ── Sistem desain soft-UI hangat ZasaQu ────────
   Palet warna per layanan + shadow neumorphic +
   highlight glossy — dipakai KONSISTEN di semua
   halaman/komponen. Jangan duplikasi definisi ini
   di file lain, import dari sini. */

export const SVC = {
  zasago:   { bg: 'var(--k-zasago-bg)',   fg: 'var(--k-zasago-fg)',   rgb: '27,72,101' },
  zasafood: { bg: 'var(--k-zasafood-bg)', fg: 'var(--k-zasafood-fg)', rgb: '33,96,70' },
  jastip:   { bg: 'var(--k-jastip-bg)',   fg: 'var(--k-jastip-fg)',   rgb: '130,45,79' },
  zasashop: { bg: 'var(--k-zasashop-bg)', fg: 'var(--k-zasashop-fg)', rgb: '130,71,7' },
  zasahome: { bg: 'var(--k-zasahome-bg)', fg: 'var(--k-zasahome-fg)', rgb: '72,46,111' },
  zasaride: { bg: 'var(--k-zasaride-bg)', fg: 'var(--k-zasaride-fg)', rgb: '22,86,89' },
  zasaserv: { bg: 'var(--k-zasaserv-bg)', fg: 'var(--k-zasaserv-fg)', rgb: '108,82,16' },
  wallet:   { bg: 'var(--k-wallet-bg)',   fg: 'var(--k-wallet-fg)',   rgb: '98,58,24' },
}

/* Shadow neumorphic — [kontak] + [ambient menyebar,
   bikin kartu MELAYANG] + [sorot atas & cekung bawah,
   bikin kartu kerasa EMBOS/timbul]. */
export function svcShadow(rgb, strong = false) {
  return strong
    ? `0 6px 14px rgba(${rgb},0.24), 0 28px 46px -12px rgba(${rgb},0.42), inset 0 1.5px 0 rgba(255,255,255,0.7), inset 0 -8px 14px -10px rgba(${rgb},0.35)`
    : `0 5px 12px rgba(${rgb},0.18), 0 22px 36px -12px rgba(${rgb},0.34), inset 0 1.5px 0 rgba(255,255,255,0.65), inset 0 -6px 11px -8px rgba(${rgb},0.32)`
}

/* Highlight glossy — sorot lembut di atas (tetap di
   dark mode) + garis kilat diagonal (khusus light mode
   — disembunyikan otomatis di dark via CSS .gloss-streak). */
export function Gloss() {
  return (
    <>
      <div style={{
        position: 'absolute', left: '-10%', top: '-45%', width: '120%', height: '70%',
        background: 'radial-gradient(60% 100% at 50% 0%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.14) 45%, rgba(255,255,255,0) 75%)',
        pointerEvents: 'none',
      }} />
      <div className="gloss-streak" style={{
        position: 'absolute', top: '-40%', left: '-15%', width: '55%', height: '200%',
        background: 'linear-gradient(75deg, rgba(255,255,255,0) 25%, rgba(255,255,255,0.55) 45%, rgba(255,255,255,0.15) 56%, rgba(255,255,255,0) 68%)',
        pointerEvents: 'none',
      }} />
    </>
  )
}
