import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { clearAuthData } from '../../utils/api'

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    clearAuthData()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPath={location.pathname} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout

