import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import VendorSidebar from './VendorSidebar'
import VendorHeader from './VendorHeader'
import { clearAuthData } from '../../utils/api'

const VendorLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    clearAuthData()
    navigate('/vendor/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <VendorSidebar currentPath={location.pathname} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <VendorHeader onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default VendorLayout

