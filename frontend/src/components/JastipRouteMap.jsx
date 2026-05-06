import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Custom icons
const iconAsal = L.divIcon({
  html: `<div style="
    width:28px;height:28px;border-radius:50%;
    background:#16a34a;border:3px solid #fff;
    box-shadow:0 2px 6px rgba(0,0,0,.35);
    display:flex;align-items:center;justify-content:center;
    font-size:13px;line-height:1;color:#fff;font-weight:700;
  ">A</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

const iconTujuan = L.divIcon({
  html: `<div style="
    width:28px;height:28px;border-radius:50%;
    background:#dc2626;border:3px solid #fff;
    box-shadow:0 2px 6px rgba(0,0,0,.35);
    display:flex;align-items:center;justify-content:center;
    font-size:13px;line-height:1;color:#fff;font-weight:700;
  ">B</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

function FitBounds({ coords }) {
  const map = useMap()
  useEffect(() => {
    if (coords.length >= 2) {
      map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] })
    }
  }, [coords.length])
  return null
}

// Haversine jarak antara dua titik (meter)
function haversineM([lat1, lng1], [lat2, lng2]) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Sampel titik-titik setiap `step` meter sepanjang polyline
function samplePolyline(coords, stepM) {
  const result = [coords[0]]
  let accumulated = 0
  for (let i = 1; i < coords.length; i++) {
    const d = haversineM(coords[i - 1], coords[i])
    accumulated += d
    if (accumulated >= stepM) {
      result.push(coords[i])
      accumulated = 0
    }
  }
  if (result[result.length - 1] !== coords[coords.length - 1]) {
    result.push(coords[coords.length - 1])
  }
  return result
}

export default function JastipRouteMap({ asalLat, asalLng, tujuanLat, tujuanLng, radiusMeter = 300 }) {
  const [routeCoords, setRouteCoords] = useState(null)

  useEffect(() => {
    if (!asalLat || !tujuanLat) return
    const url = `https://router.project-osrm.org/route/v1/driving/${asalLng},${asalLat};${tujuanLng},${tujuanLat}?overview=full&geometries=geojson`
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.routes?.[0]) {
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
          setRouteCoords(coords)
        }
      })
      .catch(() => {
        // Fallback: garis lurus jika OSRM tidak tersedia
        setRouteCoords([[asalLat, asalLng], [tujuanLat, tujuanLng]])
      })
  }, [asalLat, asalLng, tujuanLat, tujuanLng])

  const asalPos   = [asalLat, asalLng]
  const tujuanPos = [tujuanLat, tujuanLng]

  // Titik-titik untuk koridor — sampel setiap (radius/1.5) meter
  const corridorPoints = routeCoords
    ? samplePolyline(routeCoords, Math.max(radiusMeter / 1.5, 50))
    : []

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 220 }}>
      <MapContainer
        center={asalPos}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Koridor (lingkaran transparan di setiap sampel titik rute) */}
        {corridorPoints.map((pos, i) => (
          <Circle
            key={i}
            center={pos}
            radius={radiusMeter}
            pathOptions={{ color: '#a21caf', fillColor: '#d946ef', fillOpacity: 0.08, weight: 0 }}
          />
        ))}

        {/* Garis rute */}
        {routeCoords && (
          <Polyline
            positions={routeCoords}
            pathOptions={{ color: '#a21caf', weight: 4, opacity: 0.85 }}
          />
        )}

        {/* Marker asal dan tujuan */}
        <Marker position={asalPos}   icon={iconAsal} />
        <Marker position={tujuanPos} icon={iconTujuan} />

        {/* Fit ke rute */}
        {routeCoords && <FitBounds coords={routeCoords} />}
      </MapContainer>
    </div>
  )
}
