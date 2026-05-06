import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import useAuthStore from '../stores/authStore'

export default function Layout() {
  const { user } = useAuthStore()
  const role = user?.role

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} />

      {/* Konten Utama */}
      <main className="flex-1 md:ml-60 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-5 md:py-6">
          <Outlet />
        </div>
      </main>

      <BottomNav role={role} />
    </div>
  )
}
