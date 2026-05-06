import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import useAuthStore from '../../stores/authStore'
import LoadingSpinner from '../../components/LoadingSpinner'

const SERVICE_ROUTE = {
  ojek:         '/mitra/ojek/dashboard',
  urut:         '/mitra/urut/dashboard',
  laundry:      '/mitra/laundry/dashboard',
  catering:     '/mitra/catering/dashboard',
  kebersihan:   '/mitra/kebersihan/dashboard',
  antar_barang: '/mitra/antar/dashboard',
}

export default function MitraDashboard() {
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/profil').then((r) => {
      setUser(r.data)
      const serviceType = r.data.mitra_profile?.service_type ?? 'ojek'
      const route = SERVICE_ROUTE[serviceType] ?? '/mitra/ojek/dashboard'
      navigate(route, { replace: true })
    }).catch(() => navigate('/mitra/ojek/dashboard', { replace: true }))
  }, [])

  return <LoadingSpinner />
}
