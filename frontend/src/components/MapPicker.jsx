import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { Search, MapPin, Navigation } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default leaflet icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function DraggableMarker({ position, onMove }) {
  useMapEvents({
    click(e) { onMove(e.latlng) },
  })
  if (!position) return null
  return (
    <Marker
      draggable
      position={position}
      eventHandlers={{ dragend: (e) => onMove(e.target.getLatLng()) }}
    />
  )
}

export default function MapPicker({ label = 'Pilih Lokasi', value, onChange }) {
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [position, setPosition] = useState(value ? [value.lat, value.lng] : null)
  const [center, setCenter] = useState(value ? [value.lat, value.lng] : [-7.250445, 112.768845])
  const mapRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (value?.lat && value?.lng) {
      setPosition([value.lat, value.lng])
      setCenter([value.lat, value.lng])
    }
  }, [value?.lat, value?.lng])

  const handleSearch = (q) => {
    setSearch(q)
    clearTimeout(debounceRef.current)
    if (!q || q.length < 3) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=id`)
        const data = await res.json()
        setSuggestions(data)
      } catch (_) {}
    }, 400)
  }

  const selectSuggestion = (item) => {
    const lat = parseFloat(item.lat)
    const lng = parseFloat(item.lon)
    setPosition([lat, lng])
    setCenter([lat, lng])
    setSearch(item.display_name)
    setSuggestions([])
    mapRef.current?.flyTo([lat, lng], 16)
    onChange?.({ lat, lng, address: item.display_name })
  }

  const handleMove = (latlng) => {
    setPosition([latlng.lat, latlng.lng])
    setSearch('Memuat alamat...')
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json`)
      .then((r) => r.json())
      .then((d) => {
        const addr = d.display_name || `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`
        setSearch(addr)
        onChange?.({ lat: latlng.lat, lng: latlng.lng, address: addr })
      })
      .catch(() => {
        const addr = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`
        setSearch(addr)
        onChange?.({ lat: latlng.lat, lng: latlng.lng, address: addr })
      })
  }

  const handleGPS = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      handleMove({ lat, lng })
      mapRef.current?.flyTo([lat, lng], 16)
    })
  }

  return (
    <div className="space-y-2">
      <label className="label">{label}</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          className="input-field pl-9 pr-10 text-sm"
          placeholder="Cari lokasi..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <button type="button" onClick={handleGPS} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-primary-600 hover:text-primary-800">
          <Navigation className="w-4 h-4" />
        </button>
        {suggestions.length > 0 && (
          <ul className="absolute z-[9999] left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((s) => (
              <li key={s.place_id}>
                <button type="button" onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-primary-50 flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary-400 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{s.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 220 }}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <DraggableMarker position={position} onMove={handleMove} />
        </MapContainer>
      </div>
      {position && (
        <p className="text-[10px] text-gray-400">
          {position[0].toFixed(6)}, {position[1].toFixed(6)}
        </p>
      )}
    </div>
  )
}
