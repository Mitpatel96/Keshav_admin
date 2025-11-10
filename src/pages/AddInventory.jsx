import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Package, Filter, Loader2, Eye, Truck, X } from 'lucide-react'
import Input from '../components/Form/Input'
import Select from '../components/Form/Select'
import FileUpload from '../components/Form/FileUpload'
import { getAllCategoriesAPI, createSKUAPI, getAllSKUsAPI, updateSKUAPI, createInventoryAPI, getAllInventoryAPI, getInventoryByIdAPI, updateInventoryAPI, getAllVendorsAPI, transferInventoryToVendorAPI } from '../utils/api'

const AddInventory = () => {
  const navigate = useNavigate()
  const [inventory, setInventory] = useState([])
  const [skus, setSkus] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showUpdateModal, setShowUpdateModal] = useState(null)
  const [showStockModal, setShowStockModal] = useState(null)
  const [showViewModal, setShowViewModal] = useState(null)
  const [showTransferModal, setShowTransferModal] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    brand: '',
    mrp: '',
    images: [],
  })
  const [errors, setErrors] = useState({})

  // Fetch categories and inventory on component mount
  useEffect(() => {
    fetchCategories()
    fetchInventory()
    fetchSKUs()
  }, [])

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true)
      const response = await getAllCategoriesAPI(1, 100)
      if (response?.data) {
        setCategories(response.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      alert('Failed to fetch categories')
    } finally {
      setCategoriesLoading(false)
    }
  }

  const fetchSKUs = async () => {
    try {
      const response = await getAllSKUsAPI(1, 100)
      if (response?.data) {
        setSkus(response.data)
      }
    } catch (error) {
      console.error('Error fetching SKUs:', error)
    }
  }

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleImageChange = (e) => {
    const paths = Array.isArray(e.target.value) ? e.target.value : [e.target.value].filter(Boolean)
    setFormData((prev) => ({ ...prev, images: paths }))
    if (errors.images) {
      setErrors((prev) => ({ ...prev, images: '' }))
    }
  }


  const [submitLoading, setSubmitLoading] = useState(false)

  const validateForm = () => {
    const newErrors = {}
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length < 3) {
      newErrors.title = 'Minimum 3 characters'
    }
    if (!formData.category) {
      newErrors.category = 'Category is required'
    }
    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required'
    }
    if (!formData.mrp || parseFloat(formData.mrp) < 1) {
      newErrors.mrp = 'MRP must be at least ₹1'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setSubmitLoading(true)
      const payload = {
        title: formData.title.trim(),
        brand: formData.brand.trim(),
        category: formData.category, // This should be category _id
        images: formData.images,
        mrp: parseFloat(formData.mrp),
      }

      const skuResponse = await createSKUAPI(payload)
      
      // After SKU creation, show modal to add stock
      if (skuResponse?._id) {
        setShowStockModal(skuResponse)
      }
      
      setFormData({
        title: '',
        category: '',
        brand: '',
        mrp: '',
        images: [],
      })
      setErrors({})
      setShowForm(false)
      fetchSKUs() // Refresh SKUs list
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to add SKU. Please try again.' })
    } finally {
      setSubmitLoading(false)
    }
  }

  const filteredInventory = inventory.filter((item) =>
    item.sku?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.skuId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item._id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleViewInventory = async (inventoryId) => {
    try {
      const response = await getInventoryByIdAPI(inventoryId)
      setShowViewModal(response)
    } catch (error) {
      alert(error.message || 'Failed to fetch inventory details')
    }
  }

  const handleRestock = (item) => {
    setShowUpdateModal(item)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Inventory Management</h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/inventory/assign-vendor')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Package size={20} />
            Assign to Vendor
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus size={20} />
            Add Inventory
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-6">Add New Inventory</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Select Category */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-4">Step 1: Select Category</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoriesLoading ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 size={16} className="animate-spin" />
                    Loading categories...
                  </div>
                ) : (
                  <Select
                    label="Category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    errors={errors}
                    required
                    options={categories.map(cat => ({
                      value: cat._id,
                      label: cat.name,
                    }))}
                  />
                )}
              </div>
            </div>

            {/* Step 2: Add SKU Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Step 2: Add SKU Details</h3>
              {errors.submit && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {errors.submit}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  errors={errors}
                  required
                  placeholder="Enter product title"
                />
                <Input
                  label="Brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  errors={errors}
                  required
                  placeholder="Enter brand name"
                />
                <Input
                  label="MRP (₹)"
                  name="mrp"
                  type="number"
                  value={formData.mrp}
                  onChange={handleChange}
                  errors={errors}
                  required
                  placeholder="Enter MRP"
                />
              </div>
              
              <div className="mt-4">
                <FileUpload
                  label="Product Images"
                  name="images"
                  onChange={handleImageChange}
                  errors={errors}
                  accept="image/*"
                  multiple
                  maxSizeMB={5}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitLoading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {submitLoading ? 'Adding...' : 'Add Inventory'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    title: '',
                    category: '',
                    brand: '',
                    mrp: '',
                    images: [],
                  })
                  setErrors({})
                  setShowForm(false)
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inventory List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 border rounded-lg px-4 py-2 max-w-md">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, SKU ID, brand..."
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
              <span className="ml-3 text-gray-600">Loading inventory...</span>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {inventory.length === 0 ? 'No inventory found' : 'No items match your search'}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
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
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {item.status || 'confirmed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewInventory(item._id)}
                          className="text-blue-600 hover:text-blue-700"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleRestock(item)}
                          className="text-primary-600 hover:text-primary-700"
                          title="Restock"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => setShowTransferModal(item)}
                          className="text-green-600 hover:text-green-700"
                          title="Transfer to Vendor"
                        >
                          <Truck size={18} />
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

      {/* Add Stock Modal - shown after SKU creation */}
      {showStockModal && (
        <AddStockModal
          sku={showStockModal}
          onClose={() => {
            setShowStockModal(null)
            fetchInventory()
          }}
        />
      )}

      {/* Update/Restock Inventory Modal */}
      {showUpdateModal && (
        <RestockInventoryModal
          inventory={showUpdateModal}
          onClose={() => setShowUpdateModal(null)}
          onUpdate={() => {
            setShowUpdateModal(null)
            fetchInventory()
          }}
        />
      )}

      {/* View Inventory Details Modal */}
      {showViewModal && (
        <ViewInventoryModal
          inventory={showViewModal}
          onClose={() => setShowViewModal(null)}
        />
      )}

      {/* Transfer Inventory Modal */}
      {showTransferModal && (
        <TransferInventoryModal
          inventory={showTransferModal}
          onClose={() => {
            setShowTransferModal(null)
            fetchInventory()
          }}
        />
      )}
    </div>
  )
}

// Add Stock Modal - shown after SKU creation
const AddStockModal = ({ sku, onClose }) => {
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!quantity || parseInt(quantity) <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    try {
      setLoading(true)
      setError('')
      await createInventoryAPI({
        skuId: sku._id,
        quantity: parseInt(quantity),
      })
      alert('Stock added successfully!')
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to add stock. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Add Stock to SKU</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU: {sku.skuId || sku._id}
            </label>
            <p className="text-sm text-gray-600 mb-4">{sku.title}</p>
          </div>
          <div>
            <Input
              label="Quantity"
              name="quantity"
              type="number"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value)
                setError('')
              }}
              errors={error ? { quantity: error } : {}}
              required
              min={1}
              placeholder="Enter quantity to add"
            />
          </div>
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Stock'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Skip for Now
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Restock Inventory Modal - for updating quantity
const RestockInventoryModal = ({ inventory, onClose, onUpdate }) => {
  const [quantity, setQuantity] = useState(inventory?.quantity?.toString() || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!quantity || parseInt(quantity) < 0) {
      setError('Please enter a valid quantity')
      return
    }

    try {
      setLoading(true)
      setError('')
      await updateInventoryAPI(inventory._id, {
        quantity: parseInt(quantity),
      })
      alert('Inventory updated successfully!')
      onUpdate()
    } catch (err) {
      setError(err.message || 'Failed to update inventory. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Restock Inventory</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU: {inventory?.sku?.skuId || 'N/A'}
            </label>
            <p className="text-sm text-gray-600 mb-4">{inventory?.sku?.title || 'N/A'}</p>
            <p className="text-xs text-gray-500">Current Quantity: {inventory?.quantity || 0}</p>
          </div>
          <div>
            <Input
              label="New Quantity"
              name="quantity"
              type="number"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value)
                setError('')
              }}
              errors={error ? { quantity: error } : {}}
              required
              min={0}
              placeholder="Enter new quantity"
            />
          </div>
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Inventory'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// View Inventory Details Modal
const ViewInventoryModal = ({ inventory, onClose }) => {
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
                  inventory?.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {inventory?.status || 'N/A'}
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
            {inventory?.admin && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-600">Admin</label>
                <p className="text-sm text-gray-800">
                  {typeof inventory.admin === 'object' ? inventory.admin.name : inventory.admin}
                </p>
              </div>
            )}
          </div>
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

// Transfer Inventory Modal
const TransferInventoryModal = ({ inventory, onClose }) => {
  const [vendors, setVendors] = useState([])
  const [selectedVendor, setSelectedVendor] = useState('')
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(false)
  const [vendorsLoading, setVendorsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchVendors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchVendors = async () => {
    try {
      setVendorsLoading(true)
      const response = await getAllVendorsAPI(1, 100)
      if (response?.data) {
        setVendors(response.data)
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
    } finally {
      setVendorsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedVendor) {
      setError('Please select a vendor')
      return
    }
    if (!quantity || parseInt(quantity) <= 0) {
      setError('Please enter a valid quantity')
      return
    }
    if (parseInt(quantity) > inventory.quantity) {
      setError(`Quantity cannot exceed available stock (${inventory.quantity})`)
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const skuId = inventory.sku?._id || inventory.sku
      if (!skuId) {
        setError('SKU ID not found for this inventory item')
        setLoading(false)
        return
      }
      
      const response = await transferInventoryToVendorAPI({
        vendorId: selectedVendor,
        transfers: [
          {
            skuId: skuId,
            quantity: parseInt(quantity),
          },
        ],
      })
      
      // Handle response with results
      if (response?.results && response.results.length > 0) {
        const successCount = response.results.filter(r => r.status === 'success').length
        if (successCount > 0) {
          alert(`Inventory transfer initiated successfully! ${successCount} transfer(s) pending.`)
        } else {
          alert('Transfer initiated but some items failed. Please check the details.')
        }
      } else {
        alert('Inventory transferred successfully!')
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to transfer inventory. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Transfer to Vendor</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU: {inventory?.sku?.skuId || 'N/A'}
            </label>
            <p className="text-sm text-gray-600 mb-2">{inventory?.sku?.title || 'N/A'}</p>
            <p className="text-xs text-gray-500">Available Quantity: {inventory?.quantity || 0}</p>
          </div>
          <div>
            <Select
              label="Select Vendor"
              name="vendor"
              value={selectedVendor}
              onChange={(e) => {
                setSelectedVendor(e.target.value)
                setError('')
              }}
              errors={error && error.includes('vendor') ? { vendor: error } : {}}
              required
              options={vendors.map(v => ({
                value: v._id || v.vendorId,
                label: `${v.name} (${v.vendorId || v.permanentId || ''})`,
              }))}
              disabled={vendorsLoading}
            />
            {vendorsLoading && (
              <p className="text-xs text-gray-500 mt-1">Loading vendors...</p>
            )}
          </div>
          <div>
            <Input
              label="Quantity to Transfer"
              name="quantity"
              type="number"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value)
                setError('')
              }}
              errors={error && !error.includes('vendor') ? { quantity: error } : {}}
              required
              min={1}
              max={inventory?.quantity || 0}
              placeholder="Enter quantity"
            />
          </div>
          {error && !error.includes('vendor') && !error.includes('quantity') && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || vendorsLoading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Transferring...' : 'Transfer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Update SKU Modal Component (keep for SKU updates)
const UpdateInventoryModal = ({ inventory, categories, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    title: inventory.title || '',
    brand: inventory.brand || '',
    category: typeof inventory.category === 'object' ? inventory.category._id : inventory.category || '',
    mrp: inventory.mrp || '',
    images: inventory.images || [],
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleImageChange = (e) => {
    const paths = Array.isArray(e.target.value) ? e.target.value : [e.target.value].filter(Boolean)
    setFormData((prev) => ({ ...prev, images: paths }))
    if (errors.images) {
      setErrors((prev) => ({ ...prev, images: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required'
    }
    if (!formData.category) {
      newErrors.category = 'Category is required'
    }
    if (!formData.mrp || parseFloat(formData.mrp) < 1) {
      newErrors.mrp = 'MRP must be at least ₹1'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setLoading(true)
      const skuId = inventory._id
      const payload = {
        title: formData.title.trim(),
        brand: formData.brand.trim(),
        category: formData.category,
        images: formData.images,
        mrp: parseFloat(formData.mrp),
      }

      await updateSKUAPI(skuId, payload)
      alert('Inventory updated successfully!')
      onUpdate()
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to update inventory. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Update Inventory</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        
        {errors.submit && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              errors={errors}
              required
              placeholder="Enter product title"
            />
            <Input
              label="Brand"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              errors={errors}
              required
              placeholder="Enter brand name"
            />
            <Select
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              errors={errors}
              required
              options={categories.map(cat => ({
                value: cat._id,
                label: cat.name,
              }))}
            />
            <Input
              label="MRP (₹)"
              name="mrp"
              type="number"
              value={formData.mrp}
              onChange={handleChange}
              errors={errors}
              required
              placeholder="Enter MRP"
            />
          </div>
          
          <div className="mt-4">
            <FileUpload
              label="Product Images"
              name="images"
              onChange={handleImageChange}
              errors={errors}
              accept="image/*"
              multiple
              maxSizeMB={5}
            />
            {formData.images.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">Current images:</p>
                <ul className="list-disc list-inside text-xs text-gray-500">
                  {formData.images.map((img, idx) => (
                    <li key={idx}>{img}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update'}
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

export default AddInventory

