const statusConfig = {
  // Ojek
  mencari_driver:     { label: 'Mencari Driver',      color: 'bg-amber-100 text-amber-700' },
  driver_ditemukan:   { label: 'Driver Ditemukan',    color: 'bg-blue-100 text-blue-700' },
  menuju_pickup:      { label: 'Menuju Pickup',       color: 'bg-blue-100 text-blue-700' },
  pelanggan_dijemput: { label: 'Dijemput',            color: 'bg-indigo-100 text-indigo-700' },
  dalam_perjalanan:   { label: 'Dalam Perjalanan',    color: 'bg-violet-100 text-violet-700' },
  // Urut
  menunggu:           { label: 'Menunggu',            color: 'bg-amber-100 text-amber-700' },
  diterima:           { label: 'Diterima',            color: 'bg-blue-100 text-blue-700' },
  menuju_lokasi:      { label: 'Menuju Lokasi',       color: 'bg-indigo-100 text-indigo-700' },
  sedang_berlangsung: { label: 'Berlangsung',         color: 'bg-violet-100 text-violet-700' },
  // Produk
  menunggu_pembayaran:     { label: 'Menunggu Bayar',     color: 'bg-amber-100 text-amber-700' },
  pembayaran_dikonfirmasi: { label: 'Bayar Dikonfirmasi', color: 'bg-blue-100 text-blue-700' },
  diproses:           { label: 'Diproses',            color: 'bg-indigo-100 text-indigo-700' },
  dikirim:            { label: 'Dikirim',             color: 'bg-violet-100 text-violet-700' },
  // Jastip
  dijemput:           { label: 'Dijemput',            color: 'bg-amber-100 text-amber-700' },
  diantar:            { label: 'Diantar',             color: 'bg-indigo-100 text-indigo-700' },
  // Universal
  selesai:            { label: 'Selesai',             color: 'bg-emerald-100 text-emerald-700' },
  dibatalkan:         { label: 'Dibatalkan',          color: 'bg-red-100 text-red-700' },
  refund:             { label: 'Refund',              color: 'bg-orange-100 text-orange-700' },
  // User roles
  admin:              { label: 'Admin',               color: 'bg-purple-100 text-purple-700' },
  mitra:              { label: 'Mitra Ojek',          color: 'bg-orange-100 text-orange-700' },
  mitra_urut:         { label: 'Mitra Urut',          color: 'bg-pink-100 text-pink-700' },
  mitra_laundry:      { label: 'Mitra Laundry',       color: 'bg-sky-100 text-sky-700' },
  mitra_catering:     { label: 'Mitra Catering',      color: 'bg-emerald-100 text-emerald-700' },
  mitra_kebersihan:   { label: 'Mitra Kebersihan',    color: 'bg-violet-100 text-violet-700' },
  mitra_antar_barang: { label: 'Mitra Antar',         color: 'bg-amber-100 text-amber-700' },
  pelanggan:          { label: 'Pelanggan',           color: 'bg-indigo-100 text-indigo-700' },
  penjual:            { label: 'Pedagang',            color: 'bg-fuchsia-100 text-fuchsia-700' },
  // Verifikasi
  pending:            { label: 'Pending',             color: 'bg-amber-100 text-amber-700' },
  disetujui:          { label: 'Disetujui',           color: 'bg-emerald-100 text-emerald-700' },
  ditolak:            { label: 'Ditolak',             color: 'bg-red-100 text-red-700' },
}

export default function StatusBadge({ status }) {
  const cfg = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-600' }
  return <span className={`badge ${cfg.color}`}>{cfg.label}</span>
}
