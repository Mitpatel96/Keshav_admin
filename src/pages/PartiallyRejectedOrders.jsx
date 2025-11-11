import { useState, useEffect } from 'react'
import { Search, Eye, MapPin, RefreshCw, Loader2, CheckCircle, XCircle, Package, User, Phone, Mail, Calendar, CreditCard, AlertCircle } from 'lucide-react'
import { getPartiallyRejectedOrdersAPI, adminUpdatePickupAPI, findNearestVendorsAPI, getAllVendorsAPI } from '../utils/api'
import { formatCurrency, formatDate } from '../utils/helpers'
import Input from '../components/Form/Input'
import Select from '../components/Form/Select'

const PartiallyRejectedOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showNearestVendors, setShowNearestVendors] = useState(false)
  const [nearestVendors, setNearestVendors] = useState([])
  const [findingVendors, setFindingVendors] = useState(false)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  })

  useEffect(() => {
    fetchOrders(1)
  }, [])

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true)
      const response = await getPartiallyRejectedOrdersAPI(page, 100)
      
      let ordersData = []
      if (Array.isArray(response)) {
        ordersData = response
      } else if (response?.data && Array.isArray(response.data)) {
        ordersData = response.data
        setPagination(response.pagination || {
          currentPage: page,
          totalPages: 1,
          totalCount: response.data.length,
        })
      } else if (response && typeof response === 'object') {
        ordersData = response.data || []
        setPagination(response.pagination || {
          currentPage: page,
          totalPages: 1,
          totalCount: ordersData.length,
        })
      }
      
      setOrders(ordersData)
    } catch (error) {
      console.error('Error fetching orders:', error)
      alert('Failed to fetch orders: ' + (error.message || 'Unknown error'))
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleFindNearestVendors = async (order) => {
    try {
      setFindingVendors(true)
      setSelectedOrder(order)
      
      // Get user location from order
      const userLocation = order.user?.location?.coordinates
      if (!userLocation || userLocation.length < 2) {
        alert('User location not available for this order')
        return
      }

      // Extract SKU IDs from order items
      const skuIds = order.items?.map(item => {
        return typeof item.sku === 'object' ? item.sku._id : item.sku
      }).filter(Boolean) || []

      if (skuIds.length === 0) {
        alert('No SKU IDs found in order items')
        return
      }

      // Assuming we need pincode - you might need to get this from user data
      const pincode = order.user?.pincode || '131001' // Default fallback
      
      const response = await findNearestVendorsAPI(
        userLocation[1], // lat
        userLocation[0], // lng
        pincode,
        skuIds
      )

      if (response?.nearest) {
        setNearestVendors(response.nearest)
        setShowNearestVendors(true)
      } else {
        alert('No nearest vendors found')
      }
    } catch (error) {
      console.error('Error finding nearest vendors:', error)
      alert('Failed to find nearest vendors: ' + (error.message || 'Unknown error'))
    } finally {
      setFindingVendors(false)
    }
  }

  const handleUpdatePickup = async (orderId, vendorId, pickupAddress) => {
    try {
      await adminUpdatePickupAPI(orderId, vendorId, pickupAddress)
      alert('Pickup address updated successfully!')
      setShowUpdateModal(false)
      setSelectedOrder(null)
      fetchOrders(pagination.currentPage)
    } catch (error) {
      alert('Failed to update pickup address: ' + (error.message || 'Unknown error'))
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchSearch =
      order.orderCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderVFC?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.phone?.includes(searchTerm) ||
      order.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchSearch
  })

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="text-3xl font-bold text-gray-800">Partially Rejected Orders</h1>
        <button
          onClick={() => fetchOrders(1)}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2 border rounded-lg px-4 py-2 w-full max-w-md">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by order code, VFC, customer name, phone, or vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="text-primary-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {orders.length === 0 ? 'No partially rejected orders found' : 'No orders match your search'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">VFC Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pickup Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                    {order.orderCode || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                    {order.orderVFC || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{order.user?.name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{order.user?.phone || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{order.vendor?.name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{order.vendor?.vendorId || order.vendor?.permanentId || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {order.items?.map((item, idx) => (
                        <p key={idx} className="text-xs">
                          {typeof item.sku === 'object' ? item.sku?.title : 'N/A'} (Qty: {item.quantity || 0})
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold">
                    {order.totalAmount ? formatCurrency(order.totalAmount) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {order.pickupAddress || 'Not set'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {order.createdAt ? formatDate(order.createdAt) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowUpdateModal(true)
                        }}
                        className="text-primary-600 hover:text-primary-700 text-xs px-2 py-1 border border-primary-300 rounded"
                        title="Update Pickup"
                      >
                        <MapPin size={14} className="inline mr-1" />
                        Update Pickup
                      </button>
                      <button
                        onClick={() => handleFindNearestVendors(order)}
                        disabled={findingVendors}
                        className="text-green-600 hover:text-green-700 text-xs px-2 py-1 border border-green-300 rounded disabled:opacity-50"
                        title="Find Nearest Vendors"
                      >
                        {findingVendors ? (
                          <Loader2 size={14} className="inline mr-1 animate-spin" />
                        ) : (
                          <AlertCircle size={14} className="inline mr-1" />
                        )}
                        Nearest
                      </button>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-700"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => fetchOrders(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchOrders(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Update Pickup Modal */}
      {showUpdateModal && selectedOrder && (
        <UpdatePickupModal
          order={selectedOrder}
          onClose={() => {
            setShowUpdateModal(false)
            setSelectedOrder(null)
          }}
          onUpdate={handleUpdatePickup}
        />
      )}

      {/* Nearest Vendors Modal */}
      {showNearestVendors && selectedOrder && nearestVendors.length > 0 && (
        <NearestVendorsModal
          order={selectedOrder}
          vendors={nearestVendors}
          onClose={() => {
            setShowNearestVendors(false)
            setNearestVendors([])
            setSelectedOrder(null)
          }}
          onSelectVendor={(vendor) => {
            handleUpdatePickup(
              selectedOrder._id,
              vendor._id,
              vendor.address?.[0] || 'Address not available'
            )
            setShowNearestVendors(false)
            setNearestVendors([])
            setSelectedOrder(null)
          }}
        />
      )}

      {/* Order Details Modal */}
      {selectedOrder && !showUpdateModal && !showNearestVendors && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdatePickup={() => {
            setShowUpdateModal(true)
          }}
          onFindNearest={() => handleFindNearestVendors(selectedOrder)}
        />
      )}
    </div>
  )
}

// Update Pickup Modal
const UpdatePickupModal = ({ order, onClose, onUpdate }) => {
  const [pickupAddress, setPickupAddress] = useState(order.pickupAddress || '')
  const [vendorId, setVendorId] = useState(order.vendor?._id || '')
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await getAllVendorsAPI(1, 100)
        let vendorsData = []
        if (Array.isArray(response)) {
          vendorsData = response
        } else if (response?.data && Array.isArray(response.data)) {
          vendorsData = response.data
        } else if (response && typeof response === 'object') {
          vendorsData = response.data || []
        }
        setVendors(vendorsData)
      } catch (error) {
        console.error('Error fetching vendors:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchVendors()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!pickupAddress.trim() || !vendorId) {
      alert('Please fill all fields')
      return
    }
    onUpdate(order._id, vendorId, pickupAddress.trim())
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="page-header mb-4">
          <h2 className="text-2xl font-semibold">Update Pickup Address</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Select Vendor</label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : (
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Select Vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor._id} value={vendor._id}>
                    {vendor.name} ({vendor.vendorId || vendor.permanentId})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Pickup Address</label>
            <textarea
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
              placeholder="Enter pickup address"
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex-1"
            >
              Update Pickup
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Nearest Vendors Modal
const NearestVendorsModal = ({ order, vendors, onClose, onSelectVendor }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="page-header mb-4">
          <h2 className="text-2xl font-semibold">Nearest Vendors</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle size={24} />
          </button>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Order:</strong> {order.orderCode} ({order.orderVFC})
          </p>
          <p className="text-sm text-gray-600">
            <strong>Customer:</strong> {order.user?.name} - {order.user?.phone}
          </p>
        </div>

        <div className="space-y-3">
          {vendors.map((vendor, idx) => (
            <div
              key={vendor._id}
              className={`border rounded-lg p-4 ${
                vendor.isStockAvailable ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{vendor.name}</h3>
                    {vendor.isStockAvailable ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center gap-1">
                        <CheckCircle size={12} />
                        Stock Available
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                        <XCircle size={12} />
                        No Stock
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><Phone size={14} className="inline mr-1" />{vendor.phone}</p>
                    <p><Mail size={14} className="inline mr-1" />{vendor.email}</p>
                    {vendor.address && vendor.address.length > 0 && (
                      <p><MapPin size={14} className="inline mr-1" />{vendor.address[0]}</p>
                    )}
                  </div>
                  {vendor.stockData && vendor.stockData.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium text-gray-700 mb-1">Stock Details:</p>
                      {vendor.stockData.map((stock, stockIdx) => (
                        <div key={stockIdx} className="text-xs text-gray-600">
                          {stock.skuName}: {stock.quantity} units
                          {stock.available ? (
                            <span className="ml-2 text-green-600">✓ Available</span>
                          ) : (
                            <span className="ml-2 text-red-600">✗ Not Available</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => onSelectVendor(vendor)}
                    disabled={!vendor.isStockAvailable}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      vendor.isStockAvailable
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Select Vendor
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// Order Details Modal
const OrderDetailsModal = ({ order, onClose, onUpdatePickup, onFindNearest }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="page-header mb-4">
          <h2 className="text-2xl font-semibold">Order Details - {order.orderCode}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <User size={18} />
                Customer Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                <p><strong>Name:</strong> {order.user?.name || 'N/A'}</p>
                <p><strong>Phone:</strong> {order.user?.phone || 'N/A'}</p>
                <p><strong>Email:</strong> {order.user?.email || 'N/A'}</p>
                {order.user?.address && order.user.address.length > 0 && (
                  <div>
                    <strong>Address:</strong>
                    {order.user.address.map((addr, idx) => (
                      <p key={idx} className="ml-2">{addr}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Package size={18} />
                Order Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                <p><strong>Order Code:</strong> {order.orderCode || 'N/A'}</p>
                <p><strong>VFC Code:</strong> {order.orderVFC || 'N/A'}</p>
                <p><strong>Status:</strong> 
                  <span className="ml-2 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                    {order.status}
                  </span>
                </p>
                <p><strong>Payment:</strong> {order.paymentMethod || 'N/A'}</p>
                <p><strong>Order Type:</strong> {order.orderType || 'N/A'}</p>
                <p><strong>Created:</strong> {order.createdAt ? formatDate(order.createdAt) : 'N/A'}</p>
                <p><strong>Pickup Address:</strong> {order.pickupAddress || 'Not set'}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Order Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">SKU ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Price</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 font-mono text-xs">
                        {typeof item.sku === 'object' ? item.sku?.skuId : item.sku || 'N/A'}
                      </td>
                      <td className="px-4 py-2">
                        {typeof item.sku === 'object' ? item.sku?.title : 'N/A'}
                      </td>
                      <td className="px-4 py-2">{item.quantity || 0}</td>
                      <td className="px-4 py-2">
                        {item.price ? formatCurrency(item.price) : 'N/A'}
                      </td>
                      <td className="px-4 py-2 font-semibold">
                        {item.quantity && item.price 
                          ? formatCurrency(item.quantity * item.price) 
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="4" className="px-4 py-2 text-right font-semibold">Total:</td>
                    <td className="px-4 py-2 font-bold text-green-600">
                      {order.totalAmount ? formatCurrency(order.totalAmount) : 'N/A'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {order.vendor && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Current Vendor</h3>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p><strong>Name:</strong> {order.vendor?.name || 'N/A'}</p>
                <p><strong>ID:</strong> {order.vendor?.vendorId || order.vendor?.permanentId || 'N/A'}</p>
                <p><strong>Phone:</strong> {order.vendor?.phone || 'N/A'}</p>
                <p><strong>Email:</strong> {order.vendor?.email || 'N/A'}</p>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t">
            <button
              onClick={onFindNearest}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <AlertCircle size={18} />
              Find Nearest Vendors
            </button>
            <button
              onClick={onUpdatePickup}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
            >
              <MapPin size={18} />
              Update Pickup Address
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PartiallyRejectedOrders

