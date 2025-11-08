import { useState, useEffect } from 'react'
import { Check, X, Search, Loader2, Package, CheckCircle, XCircle } from 'lucide-react'
import { getAllInventoryAPI, approveOrRejectInventoryAPI, getUserData } from '../utils/api'

const VendorDeliveryConfirmation = () => {
  const [pendingInventory, setPendingInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    fetchPendingInventory()
  }, [])

  const fetchPendingInventory = async () => {
    try {
      setLoading(true)
      const userData = getUserData()
      
      // Try multiple possible vendor ID fields
      const vendorId = userData?.permanentId || userData?.vendorId || userData?._id

      const response = await getAllInventoryAPI(1, 100)
      
      if (response?.data) {
        // Filter inventory pending approval for this vendor
        // Show inventory where vendor matches and status is not confirmed
        const vendorInventory = response.data.filter((inv) => {
          // Get vendor ID from inventory (could be object or string)
          const invVendorId = typeof inv.vendor === 'object' 
            ? (inv.vendor._id || inv.vendor.vendorId || inv.vendor.permanentId)
            : inv.vendor
          
          // Check if this inventory belongs to the vendor
          const isVendorInventory = inv.vendor !== null && inv.admin === null
          const matchesVendor = invVendorId === vendorId || 
                               invVendorId === userData?._id ||
                               invVendorId === userData?.permanentId ||
                               invVendorId === userData?.vendorId
          
          // Show inventory that needs approval - status should not be confirmed
          // Include: pending, rejected, undefined, null, or any status except "confirmed"
          const needsApproval = inv.status !== 'confirmed'
          
          return isVendorInventory && matchesVendor && needsApproval
        })
        
        setPendingInventory(vendorInventory)
      }
    } catch (error) {
      console.error('Error fetching pending inventory:', error)
      alert('Failed to fetch pending inventory: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleApproveReject = async (inventoryId, status) => {
    try {
      setActionLoading(prev => ({ ...prev, [inventoryId]: true }))
      await approveOrRejectInventoryAPI(inventoryId, status)
      alert(`Inventory ${status === 'confirmed' ? 'confirmed' : 'rejected'} successfully!`)
      fetchPendingInventory()
    } catch (error) {
      alert(error.message || 'Failed to update inventory status')
    } finally {
      setActionLoading(prev => ({ ...prev, [inventoryId]: false }))
    }
  }

  const filteredInventory = pendingInventory.filter((item) =>
    item.sku?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.skuId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item._id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Delivery Confirmation</h1>
        <button
          onClick={fetchPendingInventory}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
        >
          Refresh
        </button>
      </div>


      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 border rounded-lg px-4 py-2 max-w-md">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, SKU ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="text-primary-600 animate-spin" />
              <span className="ml-3 text-gray-600">Loading pending deliveries...</span>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {pendingInventory.length === 0 ? 'No pending deliveries found' : 'No items match your search'}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inventory ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">MRP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInventory.map((item) => (
                  <tr key={item._id}>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                      {item._id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                      {item.sku?.skuId || 'N/A'}
                    </td>
                    <td className="px-6 py-4">{item.sku?.title || 'N/A'}</td>
                    <td className="px-6 py-4">{item.sku?.brand || 'N/A'}</td>
                    <td className="px-6 py-4">₹{item.sku?.mrp?.toLocaleString() || '0'}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-800">{item.quantity || 0}</span>
                    </td>
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
                          onClick={() => handleApproveReject(item._id, 'confirmed')}
                          disabled={actionLoading[item._id]}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                          title="Confirm Delivery"
                        >
                          {actionLoading[item._id] ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <CheckCircle size={16} />
                          )}
                          Confirm
                        </button>
                        <button
                          onClick={() => handleApproveReject(item._id, 'rejected')}
                          disabled={actionLoading[item._id]}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                          title="Reject Delivery"
                        >
                          {actionLoading[item._id] ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <XCircle size={16} />
                          )}
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default VendorDeliveryConfirmation

