import { LogOut, Bell, User } from 'lucide-react'
import { getUserData } from '../../utils/api'

const VendorHeader = ({ onLogout }) => {
  const userData = getUserData()

  return (
    <header className="bg-white shadow-sm border-b px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Vendor Dashboard</h2>
        <div className="flex items-center gap-3 flex-wrap sm:justify-end">
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <Bell size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm font-medium text-gray-700">{userData?.name || 'Vendor'}</p>
              <p className="text-xs text-gray-500 break-all">{userData?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="responsive-button px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default VendorHeader

