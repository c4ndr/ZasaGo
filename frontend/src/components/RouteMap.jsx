import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function FitBounds({ coords }) {
  const map = useMap()
  useEffect(() => {
    if (coords.length >= 2) {
      map.fitBounds(L.latLngBounds(coords), { padding: [30, 30] })
    }
  }, [coords])
  return null
}

export default function RouteMap({ pickup, destination, onRoute }) {
  const [route, setRoute] = useState(null)

  useEffect(() => {
    if (!pickup?.lat || !destination?.lat) { setRoute(null); return }
    const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.routes?.[0]) {
          const r = data.routes[0]
          const coords = r.geometry.coordinates.map(([lng, lat]) => [lat, lng])
          const distKm = r.distance / 1000
          const durMin = Math.ceil(r.duration / 60)
          setRoute({ coords, distKm, durMin })
          onRoute?.({ distKm, durMin })
        }
      })
      .catch(console.error)
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng])

  const markers = [
    pickup?.lat      ? [pickup.lat, pickup.lng]           : null,
    destination?.lat ? [destination.lat, destination.lng] : null,
  ].filter(Boolean)

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 200 }}>
      <MapContainer center={[-7.250445, 112.768845]} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((pos, i) => <Marker key={i} position={pos} />)}
        {route && <Polyline positions={route.coords} color="#4C3BCF" weight={4} opacity={0.8} />}
        {markers.length >= 2 && <FitBounds coords={markers} />}
      </MapContainer>
    </div>
  )
}
