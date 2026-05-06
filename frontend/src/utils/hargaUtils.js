export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export function hitungTarifOjek(distanceKm, settings) {
  const dasar = parseFloat(settings?.tarif_dasar_ojek ?? 5000)
  const perKm = parseFloat(settings?.tarif_per_km_ojek ?? 3000)
  return dasar + distanceKm * perKm
}

export function hitungTarifAntar(distanceKm, settings) {
  const dasar = parseFloat(settings?.tarif_dasar_antar ?? 8000)
  const perKm = parseFloat(settings?.tarif_per_km_antar ?? 4000)
  return dasar + distanceKm * perKm
}

export function hitungKomisi(total, persen) {
  return total * parseFloat(persen ?? 10) / 100
}

export function hitungTarifJastip(distanceKm, settings) {
  const dasar = parseFloat(settings?.tarif_titipan_dasar ?? 5000)
  const perKm = parseFloat(settings?.tarif_titipan_per_km ?? 2000)
  const diskon = parseFloat(settings?.diskon_titipjalan_persen ?? 2)
  const hargaAsli = dasar + distanceKm * perKm
  return hargaAsli * (1 - diskon / 100)
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
