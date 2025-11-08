import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import VendorLayout from './components/VendorLayout/VendorLayout'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import AddInventory from './pages/AddInventory'
import VendorAssignment from './pages/VendorAssignment'
import ProductManagement from './pages/ProductManagement'
import VendorManagement from './pages/VendorManagement'
import AllUsers from './pages/AllUsers'
import Login from './pages/Login'
import VendorLogin from './pages/VendorLogin'
import VendorDashboard from './pages/VendorDashboard'
import VendorInventory from './pages/VendorInventory'
import VendorOrders from './pages/VendorOrders'
import VendorSettings from './pages/VendorSettings'
import VendorDeliveryConfirmation from './pages/VendorDeliveryConfirmation'
import VendorDamageTicket from './pages/VendorDamageTicket'
import VendorOrderConfirmation from './pages/VendorOrderConfirmation'
import VendorWalkInOrder from './pages/VendorWalkInOrder'
import DamageTickets from './pages/DamageTickets'
import InventoryHistory from './pages/InventoryHistory'
import PartiallyRejectedOrders from './pages/PartiallyRejectedOrders'
import { getUserData, getAuthToken } from './utils/api'

// Protected Route Component for Admin
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
  const token = getAuthToken()
  const userData = getUserData()
  const location = useLocation()

  // Redirect to login if not authenticated or no token
  if (!isAuthenticated || !token || !userData) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Redirect vendors to vendor portal
  if (userData.role === 'vendor') {
    return <Navigate to="/vendor" state={{ from: location }} replace />
  }

  // Only allow admin users
  if (userData.role !== 'admin') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

// Protected Route Component for Vendor
const VendorProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
  const token = getAuthToken()
  const userData = getUserData()
  const location = useLocation()

  // Redirect to login if not authenticated or no token
  if (!isAuthenticated || !token || !userData) {
    return <Navigate to="/vendor/login" state={{ from: location }} replace />
  }

  // Redirect admins to admin portal
  if (userData.role === 'admin') {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  // Only allow vendor users
  if (userData.role !== 'vendor') {
    return <Navigate to="/vendor/login" state={{ from: location }} replace />
  }

  return children
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
          <Route path="inventory" element={<AddInventory />} />
          <Route path="inventory/assign-vendor" element={<VendorAssignment />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="vendors" element={<VendorManagement />} />
          <Route path="users" element={<AllUsers />} />
          <Route path="damage-tickets" element={<DamageTickets />} />
          <Route path="inventory-history" element={<InventoryHistory />} />
          <Route path="partially-rejected-orders" element={<PartiallyRejectedOrders />} />
        </Route>

        {/* Vendor Routes */}
        <Route path="/vendor/login" element={<VendorLogin />} />
        <Route
          path="/vendor"
          element={
            <VendorProtectedRoute>
              <VendorLayout />
            </VendorProtectedRoute>
          }
        >
          <Route index element={<VendorDashboard />} />
          <Route path="inventory" element={<VendorInventory />} />
          <Route path="delivery-confirmation" element={<VendorDeliveryConfirmation />} />
          <Route path="damage-ticket" element={<VendorDamageTicket />} />
          <Route path="orders" element={<VendorOrders />} />
          <Route path="order-confirmation" element={<VendorOrderConfirmation />} />
          <Route path="walk-in-order" element={<VendorWalkInOrder />} />
          <Route path="settings" element={<VendorSettings />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App

