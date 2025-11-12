import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Settings,
  Package,
  ShoppingBag,
  Users,
  UserCheck,
  Menu,
  X,
  AlertTriangle,
  History,
  XCircle,
  LayoutGrid,
  Ticket,
} from 'lucide-react'
import { useState } from 'react'

const Sidebar = ({ currentPath }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/inventory', icon: Package, label: 'Inventory' },
    { path: '/products', icon: ShoppingBag, label: 'Products' },
    { path: '/vendors', icon: Users, label: 'Vendors' },
    { path: '/users', icon: UserCheck, label: 'All Users' },
    { path: '/damage-tickets', icon: AlertTriangle, label: 'Damage Tickets' },
    { path: '/inventory-history', icon: History, label: 'Inventory History' },
    { path: '/partially-rejected-orders', icon: XCircle, label: 'Rejected Orders' },
    { path: '/website-sections', icon: LayoutGrid, label: 'Website Sections' },
    { path: '/promos', icon: Ticket, label: 'Promos' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  const isActive = (path) => {
    if (path === '/') return currentPath === '/'
    return currentPath.startsWith(path)
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label="Toggle navigation menu"
        aria-expanded={isMobileOpen}
        aria-controls="admin-sidebar"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 sm:w-72 bg-white shadow-lg
          transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 transition-transform duration-300 ease-in-out
          flex-shrink-0
        `}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-primary-600">Keshav Admin</h1>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors duration-200
                    ${isActive(item.path)
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  )
}

export default Sidebar

