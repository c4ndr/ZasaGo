/* ── Sistem desain soft-UI hangat ZasaQu ────────
   Palet warna per layanan + shadow neumorphic +
   highlight glossy — dipakai KONSISTEN di semua
   halaman/komponen. Jangan duplikasi definisi ini
   di file lain, import dari sini. */

/* `rgb` di sini sengaja referensi var(--k-x-rgb) (bukan angka
   statis) supaya rgba(${SVC.x.rgb},alpha) yang dipakai svcShadow()
   dkk ikut berubah otomatis pas dark mode — dulu statis jadi
   shadow/glow kartu kebawa gelap terus walau kartunya sudah
   berubah warna. */
export const SVC = {
  zasago:   { bg: 'var(--k-zasago-bg)',   fg: 'var(--k-zasago-fg)',   rgb: 'var(--k-zasago-rgb)' },
  zasafood: { bg: 'var(--k-zasafood-bg)', fg: 'var(--k-zasafood-fg)', rgb: 'var(--k-zasafood-rgb)' },
  jastip:   { bg: 'var(--k-jastip-bg)',   fg: 'var(--k-jastip-fg)',   rgb: 'var(--k-jastip-rgb)' },
  zasashop: { bg: 'var(--k-zasashop-bg)', fg: 'var(--k-zasashop-fg)', rgb: 'var(--k-zasashop-rgb)' },
  zasahome: { bg: 'var(--k-zasahome-bg)', fg: 'var(--k-zasahome-fg)', rgb: 'var(--k-zasahome-rgb)' },
  zasaride: { bg: 'var(--k-zasaride-bg)', fg: 'var(--k-zasaride-fg)', rgb: 'var(--k-zasaride-rgb)' },
  zasaserv: { bg: 'var(--k-zasaserv-bg)', fg: 'var(--k-zasaserv-fg)', rgb: 'var(--k-zasaserv-rgb)' },
  wallet:   { bg: 'var(--k-wallet-bg)',   fg: 'var(--k-wallet-fg)',   rgb: 'var(--k-wallet-rgb)' },
}

/* Shadow neumorphic — [kontak] + [ambient menyebar,
   bikin kartu MELAYANG] + [sorot atas & cekung bawah,
   bikin kartu kerasa EMBOS/timbul]. */
export function svcShadow(rgb, strong = false) {
  return strong
    ? `0 6px 14px rgba(${rgb},0.24), 0 28px 46px -12px rgba(${rgb},0.42), inset 0 1.5px 0 rgba(255,255,255,0.7), inset 0 -8px 14px -10px rgba(${rgb},0.35)`
    : `0 5px 12px rgba(${rgb},0.18), 0 22px 36px -12px rgba(${rgb},0.34), inset 0 1.5px 0 rgba(255,255,255,0.65), inset 0 -6px 11px -8px rgba(${rgb},0.32)`
}

/* Dulu ada highlight glossy (sorot atas + garis kilat
   diagonal) di sini, tapi kesannya kelewat "berkilap"
   di atas kartu berwarna — dihapus. Dipertahankan sebagai
   komponen kosong supaya semua pemanggil `<Gloss />` yang
   sudah tersebar di banyak halaman tetap valid tanpa perlu
   diubah satu-satu. */
export function Gloss() {
  return null
}
