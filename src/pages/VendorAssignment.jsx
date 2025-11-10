import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Search, Package, Users, Check, Loader2 } from 'lucide-react'
import Input from '../components/Form/Input'
import Select from '../components/Form/Select'
import { formatCurrency } from '../utils/helpers'
import { getAllInventoryAPI, getAllVendorsAPI, transferInventoryToVendorAPI } from '../utils/api'

const VendorAssignment = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [inventory, setInventory] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [vendorsLoading, setVendorsLoading] = useState(true)

  // Fetch inventory and vendors on component mount
  useEffect(() => {
    fetchInventory()
    fetchVendors()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const response = await getAllInventoryAPI(1, 100)
      if (response?.data) {
        // Filter only admin inventory (vendor is null)
        const adminInventory = response.data.filter(inv => inv.vendor === null && inv.admin !== null)
        setInventory(adminInventory)
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
      alert('Failed to fetch inventory')
    } finally {
      setLoading(false)
    }
  }

  const fetchVendors = async () => {
    try {
      setVendorsLoading(true)
      const response = await getAllVendorsAPI(1, 100)
      if (response?.data) {
        setVendors(response.data)
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
      alert('Failed to fetch vendors')
    } finally {
      setVendorsLoading(false)
    }
  }

  const [selectedSKU, setSelectedSKU] = useState(null)
  const [assignmentData, setAssignmentData] = useState({
    selectedVendors: [],
    quantities: {},
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Check if SKU was passed from navigation state
  useEffect(() => {
    if (location.state?.sku) {
      // Find the inventory item for this SKU
      const inventoryItem = inventory.find(inv => inv.sku?._id === location.state.sku._id || inv.sku === location.state.sku._id)
      if (inventoryItem) {
        setSelectedSKU(inventoryItem)
      }
    }
  }, [inventory, location.state])

  const filteredInventory = inventory.filter((item) =>
    item.sku?.skuId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item._id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectSKU = (item) => {
    setSelectedSKU(item)
    setAssignmentData({
      selectedVendors: [],
      quantities: {},
    })
  }

  const handleVendorChange = (vendorId, checked) => {
    if (checked) {
      setAssignmentData((prev) => ({
        ...prev,
        selectedVendors: [...prev.selectedVendors, vendorId],
        quantities: { ...prev.quantities, [vendorId]: '' },
      }))
    } else {
      setAssignmentData((prev) => {
        const newQuantities = { ...prev.quantities }
        delete newQuantities[vendorId]
        return {
          selectedVendors: prev.selectedVendors.filter((id) => id !== vendorId),
          quantities: newQuantities,
        }
      })
    }
  }

  const handleQuantityChange = (vendorId, value) => {
    setAssignmentData((prev) => ({
      ...prev,
      quantities: { ...prev.quantities, [vendorId]: value },
    }))
  }

  const validateAssignment = () => {
    if (!selectedSKU) {
      alert('Please select an inventory item first')
      return false
    }
    if (assignmentData.selectedVendors.length === 0) {
      alert('Please select at least one vendor')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateAssignment()) return

    try {
      setSubmitting(true)

      // Check if all vendors have quantities assigned
      const transferPromises = []
      for (const vendorId of assignmentData.selectedVendors) {
        const qty = parseInt(assignmentData.quantities[vendorId] || 0)
        if (qty <= 0) {
          alert(`Please enter quantity for ${vendors.find((v) => (v._id === vendorId || v.vendorId === vendorId))?.name}`)
          setSubmitting(false)
          return
        }

        // API accepts one vendorId with multiple inventory transfers
        // For each vendor, create a transfer request
        const skuId = selectedSKU.sku?._id || selectedSKU.sku
        if (!skuId) {
          alert('SKU ID not found for selected inventory item')
          setSubmitting(false)
          return
        }
        
        const payload = {
          vendorId: vendorId,
          transfers: [
            {
              skuId: skuId,
              quantity: qty,
            },
          ],
        }
        transferPromises.push(transferInventoryToVendorAPI(payload))
      }

      // Execute all transfers
      const results = await Promise.all(transferPromises)
      
      // Check results for success/failure
      let successCount = 0
      let failureCount = 0
      results.forEach((response) => {
        if (response?.results && response.results.length > 0) {
          response.results.forEach((result) => {
            if (result.status === 'success') {
              successCount++
            } else {
              failureCount++
            }
          })
        } else {
          successCount++
        }
      })
      
      if (failureCount > 0) {
        alert(`Transfer initiated: ${successCount} successful, ${failureCount} failed. Please check the details.`)
      } else {
        alert(`Inventory transfer initiated successfully to all selected vendors! ${successCount} transfer(s) pending.`)
      }
      
      setAssignmentData({
        selectedVendors: [],
        quantities: {},
      })
      setSelectedSKU(null)
      fetchInventory() // Refresh inventory
      navigate('/inventory')
    } catch (error) {
      alert(error.message || 'Failed to transfer inventory. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/inventory')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Assign Inventory to Vendors</h1>
        </div>
      </div>

      {/* Step 1: Select Inventory */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Package size={24} className="text-primary-600" />
          Step 1: Select Inventory Item
        </h2>

        <div className="mb-4">
          <div className="flex items-center gap-2 border rounded-lg px-4 py-2 max-w-md">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="text-primary-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading inventory...</span>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {inventory.length === 0 ? 'No inventory found' : 'No items match your search'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInventory.map((item) => (
              <div
                key={item._id}
                onClick={() => handleSelectSKU(item)}
                className={`
                  p-4 border-2 rounded-lg cursor-pointer transition-all
                  ${
                    selectedSKU?._id === item._id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{item.sku?.title || item.sku?.skuId || 'N/A'}</h3>
                    <p className="text-sm text-gray-600 mt-1 font-mono">{item.sku?.skuId || 'N/A'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.sku?.category?.name || typeof item.sku?.category === 'string' ? item.sku?.category : 'N/A'}
                    </p>
                  </div>
                  {selectedSKU?._id === item._id && (
                    <Check size={20} className="text-primary-600" />
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Available:</span>
                    <span className="font-semibold">{item.quantity || 0} units</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">MRP:</span>
                    <span className="font-semibold">{formatCurrency(item.sku?.mrp || 0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Assign to Vendors */}
      {selectedSKU && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users size={24} className="text-green-600" />
            Step 2: Assign to Vendors
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {vendorsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="text-primary-600 animate-spin" />
                <span className="ml-2 text-gray-600">Loading vendors...</span>
              </div>
            ) : vendors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No vendors available</div>
            ) : (
              <div className="space-y-4">
                {vendors.map((vendor) => {
                  const vendorId = vendor._id || vendor.vendorId
                  return (
                    <div
                      key={vendorId}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          id={`vendor-${vendorId}`}
                          checked={assignmentData.selectedVendors.includes(vendorId)}
                          onChange={(e) => handleVendorChange(vendorId, e.target.checked)}
                          className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`vendor-${vendorId}`}
                            className="cursor-pointer flex-1"
                          >
                            <div className="font-semibold text-gray-800">{vendor.name}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              ID: {vendor.vendorId || vendor.permanentId || vendorId}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {vendor.area && `Area: ${vendor.area}`}
                              {vendor.city && `, ${vendor.city}`}
                              {vendor.state && `, ${vendor.state}`}
                            </div>
                          </label>
                          {assignmentData.selectedVendors.includes(vendorId) && (
                            <div className="mt-3">
                              <Input
                                label="Quantity to Assign"
                                name={`qty-${vendorId}`}
                                type="number"
                                value={assignmentData.quantities[vendorId] || ''}
                                onChange={(e) => handleQuantityChange(vendorId, e.target.value)}
                                errors={{}}
                                required
                                min={1}
                                max={selectedSKU?.quantity || 0}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {assignmentData.selectedVendors.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-700 mb-2">
                  <strong>Selected Item:</strong> {selectedSKU?.sku?.title || selectedSKU?.sku?.skuId || 'N/A'}
                </div>
                <div className="text-sm text-gray-700 mb-2">
                  <strong>Available Stock:</strong> {selectedSKU?.quantity || 0} units
                </div>
                <div className="text-sm text-gray-700">
                  <strong>Total Assigned:</strong>{' '}
                  <span className="font-semibold">
                    {assignmentData.selectedVendors.reduce(
                      (sum, vid) =>
                        sum + parseInt(assignmentData.quantities[vid] || 0),
                      0
                    )}{' '}
                    units
                  </span>
                  {' / '}
                  {selectedSKU?.quantity || 0} units
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Transferring...' : 'Transfer to Vendor'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/inventory')}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default VendorAssignment

