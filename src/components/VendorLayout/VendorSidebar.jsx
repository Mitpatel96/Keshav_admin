import { Link } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package,
  ShoppingBag, 
  Settings,
  Menu,
  X,
  CheckCircle,
  AlertTriangle,
  ClipboardCheck,
  ShoppingCart
} from 'lucide-react'
import { useState } from 'react'

const VendorSidebar = ({ currentPath }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const menuItems = [
    { path: '/vendor', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/vendor/inventory', icon: Package, label: 'My Inventory' },
    { path: '/vendor/delivery-confirmation', icon: CheckCircle, label: 'Delivery Confirmation' },
    { path: '/vendor/damage-ticket', icon: AlertTriangle, label: 'Damage Tickets' },
    { path: '/vendor/orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/vendor/order-confirmation', icon: ClipboardCheck, label: 'Confirm Order' },
    { path: '/vendor/walk-in-order', icon: ShoppingCart, label: 'Walk-in Order' },
    { path: '/vendor/settings', icon: Settings, label: 'Settings' },
  ]

  const isActive = (path) => {
    if (path === '/vendor') return currentPath === '/vendor'
    return currentPath.startsWith(path)
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-green-500"
        aria-label="Toggle navigation menu"
        aria-expanded={isMobileOpen}
        aria-controls="vendor-sidebar"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        id="vendor-sidebar"
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
            <h1 className="text-2xl font-bold text-green-600">Vendor Portal</h1>
            <p className="text-xs text-gray-500 mt-1">V0001 - Tech Solutions</p>
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
                      ? 'bg-green-600 text-white'
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

export default VendorSidebar

