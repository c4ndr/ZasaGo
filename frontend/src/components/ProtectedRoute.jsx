import { Navigate } from 'react-router-dom'
import useAuthStore from '../stores/authStore'

export default function ProtectedRoute({ children, roles }) {
  const { user, token } = useAuthStore()

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  const isMitraRole = (role) => role?.startsWith('mitra')

  if (roles) {
    const hasAccess = roles.some(r =>
      r === user.role || (r === 'mitra' && isMitraRole(user.role))
    )
    if (!hasAccess) {
      const getRedirect = (role) => {
        if (role === 'admin') return '/admin/dashboard'
        if (role === 'pelanggan') return '/pelanggan/dashboard'
        if (role === 'penjual') return '/penjual/dashboard'
        if (isMitraRole(role)) return '/mitra/dashboard'
        return '/login'
      }
      return <Navigate to={getRedirect(user.role)} replace />
    }
  }

  return children
}
