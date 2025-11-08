import { useState, useEffect } from 'react'
import { Search, Package, AlertTriangle, TrendingUp, Eye, Loader2, X, CheckCircle, XCircle } from 'lucide-react'
import { formatCurrency } from '../utils/helpers'
import { getAllInventoryAPI, getInventoryByIdAPI, approveOrRejectInventoryAPI, getUserData } from '../utils/api'

const VendorInventory = () => {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showViewModal, setShowViewModal] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState({})
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  })

  useEffect(() => {
    fetchInventory(1)
  }, [])

  const fetchInventory = async (page = 1) => {
    try {
      setLoading(true)
      const userData = getUserData()
      
      if (!userData) {
        alert('User data not found. Please login again.')
        setLoading(false)
        return
      }

      const vendorId = userData._id
      const vendorPermanentId = userData.permanentId
      
      console.log('=== VendorInventory Debug ===')
      console.log('User Data:', userData)
      console.log('Vendor _id:', vendorId)
      console.log('Vendor permanentId:', vendorPermanentId)
      
      const response = await getAllInventoryAPI(page, 100)
      console.log('Raw API Response:', response)
      console.log('Response type:', typeof response)
      console.log('Response.data:', response?.data)
      console.log('Is Array?:', Array.isArray(response))
      
      // Handle response structure
      // API returns: { data: [...], pagination: {...} }
      // But axios interceptor already extracts response.data, so response IS the data object
      let inventoryData = []
      let paginationData = null
      
      if (Array.isArray(response)) {
        // If response is directly an array
        inventoryData = response
      } else if (response?.data && Array.isArray(response.data)) {
        // If response has data property
        inventoryData = response.data
        paginationData = response.pagination
      } else if (response && typeof response === 'object') {
        // Check if response itself is the data array wrapped
        inventoryData = response.data || []
        paginationData = response.pagination
      }
      
      console.log('Extracted inventoryData length:', inventoryData.length)
      console.log('Extracted paginationData:', paginationData)
      
      if (inventoryData.length > 0) {
        console.log('First item sample:', {
          id: inventoryData[0]._id,
          vendor: inventoryData[0].vendor,
          admin: inventoryData[0].admin,
          vendorId: inventoryData[0].vendor?._id,
          vendorName: inventoryData[0].vendor?.name
        })
        
        // Filter inventory for this vendor (vendor !== null && admin === null)
        const vendorInventory = inventoryData.filter((inv) => {
          // Check if vendor inventory
          const isVendorInventory = inv.vendor !== null && inv.admin === null
          
          if (!isVendorInventory) {
            return false
          }
          
          // Get vendor identifiers
          const invVendorId = inv.vendor?._id
          const invVendorPermanentId = inv.vendor?.permanentId
          
          // Match by _id
          const matchesById = invVendorId && String(invVendorId) === String(vendorId)
          
          // Match by permanentId
          const matchesByPermanentId = invVendorPermanentId && vendorPermanentId && 
            String(invVendorPermanentId) === String(vendorPermanentId)
          
          const matchesVendor = matchesById || matchesByPermanentId
          
          console.log('Checking item:', {
            sku: inv.sku?.title,
            invVendorId,
            invVendorPermanentId,
            myVendorId: vendorId,
            myPermanentId: vendorPermanentId,
            matchesById,
            matchesByPermanentId,
            matchesVendor
          })
          
          return matchesVendor
        })
        
        console.log('Filtered vendor inventory count:', vendorInventory.length)
        console.log('All vendor inventory items (without ID filter):', inventoryData.filter(inv => inv.vendor !== null && inv.admin === null).length)
        
        // If no matches but vendor items exist, show them temporarily for debugging
        if (vendorInventory.length === 0) {
          const allVendorItems = inventoryData.filter(inv => inv.vendor !== null && inv.admin === null)
          console.warn('⚠️ No matching vendor inventory found!')
          console.log('All vendor inventory IDs:', allVendorItems.map(inv => ({
            vendorId: inv.vendor?._id,
            vendorPermanentId: inv.vendor?.permanentId,
            vendorName: inv.vendor?.name
          })))
          console.log('Your vendor ID:', vendorId)
          console.log('Your vendor permanentId:', vendorPermanentId)
          
          // TEMPORARY: Show all vendor inventory to verify data display works
          // Remove this after fixing ID matching
          setInventory(allVendorItems)
        } else {
          setInventory(vendorInventory)
        }
        
        setPagination(paginationData || {
          currentPage: page,
          totalPages: 1,
          totalCount: vendorInventory.length || inventoryData.filter(inv => inv.vendor !== null && inv.admin === null).length,
        })
      } else {
        console.warn('No inventory data found')
        setInventory([])
        setPagination({
          currentPage: page,
          totalPages: 1,
          totalCount: 0,
        })
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
      alert('Failed to fetch inventory: ' + (error.message || 'Unknown error'))
      setInventory([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (inventoryId) => {
    try {
      setViewLoading(true)
      const response = await getInventoryByIdAPI(inventoryId)
      setShowViewModal(response)
    } catch (error) {
      alert(error.message || 'Failed to fetch inventory details')
    } finally {
      setViewLoading(false)
    }
  }

  const handleApproveReject = async (inventoryId, status) => {
    try {
      setActionLoading(prev => ({ ...prev, [inventoryId]: true }))
      await approveOrRejectInventoryAPI(inventoryId, status)
      alert(`Inventory ${status === 'confirmed' ? 'confirmed' : 'rejected'} successfully!`)
      fetchInventory(pagination.currentPage)
      // Close modal if open
      if (showViewModal?._id === inventoryId) {
        setShowViewModal(null)
      }
    } catch (error) {
      alert(error.message || 'Failed to update inventory status')
    } finally {
      setActionLoading(prev => ({ ...prev, [inventoryId]: false }))
    }
  }

  const filteredInventory = inventory.filter((item) => {
    const matchSearch =
      item.sku?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.skuId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item._id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchStatus = filterStatus === 'all' || item.status === filterStatus
    
    return matchSearch && matchStatus
  })

  const totalValue = inventory.reduce((sum, item) => {
    const itemValue = (item.quantity || 0) * (item.sku?.mrp || 0)
    return sum + itemValue
  }, 0)

  const confirmedCount = inventory.filter(item => item.status === 'confirmed').length
  const pendingCount = inventory.filter(item => item.status === 'pending' || !item.status).length
  const rejectedCount = inventory.filter(item => item.status === 'rejected').length
  const lowStockCount = inventory.filter((item) => (item.quantity || 0) < 10).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">My Inventory</h1>
        <button
          onClick={() => fetchInventory(pagination.currentPage)}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total SKUs</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{inventory.length}</p>
            </div>
            <Package className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Stock</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {inventory.reduce((sum, item) => sum + (item.quantity || 0), 0)}
              </p>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inventory Value</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {formatCurrency(totalValue)}
              </p>
            </div>
            <Package className="text-purple-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{lowStockCount}</p>
            </div>
            <AlertTriangle className="text-red-500" size={32} />
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Confirmed</p>
              <p className="text-2xl font-bold text-green-800 mt-1">{confirmedCount}</p>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-800 mt-1">{pendingCount}</p>
            </div>
            <AlertTriangle className="text-yellow-500" size={24} />
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Rejected</p>
              <p className="text-2xl font-bold text-red-800 mt-1">{rejectedCount}</p>
            </div>
            <XCircle className="text-red-500" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 border rounded-lg px-4 py-2">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by SKU name, SKU ID, or Inventory ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Inventory List */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="text-primary-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading inventory...</span>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {inventory.length === 0 ? 'No inventory found' : 'No items match your search'}
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">MRP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reserved</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInventory.map((item) => {
                const itemValue = (item.quantity || 0) * (item.sku?.mrp || 0)
                const isLowStock = (item.quantity || 0) < 10
                const isPending = item.status === 'pending' || !item.status
                return (
                  <tr
                    key={item._id}
                    className={isLowStock ? 'bg-red-50' : ''}
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                      {item.sku?.skuId || 'N/A'}
                    </td>
                    <td className="px-6 py-4">{item.sku?.title || 'N/A'}</td>
                    <td className="px-6 py-4">{item.sku?.brand || 'N/A'}</td>
                    <td className="px-6 py-4">₹{(item.sku?.mrp || 0).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span
                        className={
                          isLowStock
                            ? 'text-red-600 font-semibold'
                            : (item.quantity || 0) < 20
                            ? 'text-yellow-600 font-semibold'
                            : 'text-green-600 font-semibold'
                        }
                      >
                        {item.quantity || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{item.reservedQuantity || 0}</td>
                    <td className="px-6 py-4 font-semibold">{formatCurrency(itemValue)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          item.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {item.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(item._id)}
                          disabled={viewLoading}
                          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 disabled:opacity-50"
                          title="View Details"
                        >
                          <Eye size={16} />
                          View
                        </button>
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleApproveReject(item._id, 'confirmed')}
                              disabled={actionLoading[item._id]}
                              className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1 disabled:opacity-50"
                              title="Approve"
                            >
                              <CheckCircle size={16} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveReject(item._id, 'rejected')}
                              disabled={actionLoading[item._id]}
                              className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1 disabled:opacity-50"
                              title="Reject"
                            >
                              <XCircle size={16} />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">
            Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} items)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchInventory(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => fetchInventory(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* View Inventory Details Modal */}
      {showViewModal && (
        <ViewInventoryModal
          inventory={showViewModal}
          onClose={() => setShowViewModal(null)}
          onApproveReject={handleApproveReject}
          actionLoading={actionLoading}
        />
      )}
    </div>
  )
}

// View Inventory Details Modal
const ViewInventoryModal = ({ inventory, onClose, onApproveReject, actionLoading }) => {
  const isPending = inventory?.status === 'pending' || !inventory?.status
  const canApproveReject = isPending && inventory?.vendor !== null && inventory?.admin === null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">Inventory Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Inventory ID</label>
              <p className="text-sm text-gray-800 font-mono">{inventory?._id || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <p className="text-sm text-gray-800">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  inventory?.status === 'confirmed'
                    ? 'bg-green-100 text-green-800'
                    : inventory?.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {inventory?.status || 'pending'}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">SKU ID</label>
              <p className="text-sm text-gray-800 font-mono">{inventory?.sku?.skuId || inventory?.sku?._id || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Quantity</label>
              <p className="text-sm text-gray-800 font-semibold">{inventory?.quantity || 0}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Reserved Quantity</label>
              <p className="text-sm text-gray-800">{inventory?.reservedQuantity || 0}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Available Quantity</label>
              <p className="text-sm text-gray-800 font-semibold text-green-600">
                {(inventory?.quantity || 0) - (inventory?.reservedQuantity || 0)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Title</label>
              <p className="text-sm text-gray-800">{inventory?.sku?.title || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Brand</label>
              <p className="text-sm text-gray-800">{inventory?.sku?.brand || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">MRP</label>
              <p className="text-sm text-gray-800">₹{inventory?.sku?.mrp?.toLocaleString() || '0'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Total Value</label>
              <p className="text-sm text-gray-800 font-semibold">
                {formatCurrency((inventory?.quantity || 0) * (inventory?.sku?.mrp || 0))}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Category</label>
              <p className="text-sm text-gray-800">
                {typeof inventory?.sku?.category === 'object' 
                  ? inventory.sku.category.name 
                  : inventory?.sku?.category || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Created At</label>
              <p className="text-sm text-gray-800">
                {inventory?.createdAt ? new Date(inventory.createdAt).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Updated At</label>
              <p className="text-sm text-gray-800">
                {inventory?.updatedAt ? new Date(inventory.updatedAt).toLocaleString() : 'N/A'}
              </p>
            </div>
            {inventory?.sku?.images && inventory.sku.images.length > 0 && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-600">Images</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {inventory.sku.images.map((img, idx) => (
                    img && (
                      <img
                        key={idx}
                        src={img}
                        alt={`${inventory.sku.title} ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {canApproveReject && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-3">This inventory is pending approval. You can approve or reject it.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => onApproveReject(inventory._id, 'confirmed')}
                  disabled={actionLoading[inventory._id]}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading[inventory._id] ? 'Processing...' : 'Approve'}
                </button>
                <button
                  onClick={() => onApproveReject(inventory._id, 'rejected')}
                  disabled={actionLoading[inventory._id]}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading[inventory._id] ? 'Processing...' : 'Reject'}
                </button>
              </div>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VendorInventory

