import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { clearAuthData } from '../../utils/api'
import { useSocket } from '../../contexts/SocketContext'

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { disconnectSocket } = useSocket()

  const handleLogout = () => {
    // Disconnect socket before clearing auth data
    if (disconnectSocket) {
      disconnectSocket()
    }
    clearAuthData()
    navigate('/login')
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <Sidebar currentPath={location.pathname} />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout

