import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Eye, Package, ShoppingBag, X, Loader2 } from 'lucide-react'
import Input from '../components/Form/Input'
import Select from '../components/Form/Select'
import Textarea from '../components/Form/Textarea'
import Checkbox from '../components/Form/Checkbox'
import FileUpload from '../components/Form/FileUpload'
import { generateProductCode, calculateSavings } from '../utils/helpers'
import { formatCurrency } from '../utils/helpers'
import { createProductAPI, getAllProductsAPI, updateProductAPI, deleteProductAPI, getAllSKUsAPI } from '../utils/api'

const ProductManagement = () => {
  const [activeTab, setActiveTab] = useState('list')
  const [products, setProducts] = useState([])
  const [skus, setSkus] = useState([])
  const [loading, setLoading] = useState(true)
  const [skusLoading, setSkusLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showComboForm, setShowComboForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    stockStatus: 'all',
  })

  // Fetch products and SKUs on component mount
  useEffect(() => {
    fetchProducts()
    fetchSKUs()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await getAllProductsAPI(1, 100)
      if (response?.data) {
        setProducts(response.data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      alert('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const fetchSKUs = async () => {
    try {
      setSkusLoading(true)
      const response = await getAllSKUsAPI(1, 100)
      if (response?.data) {
        setSkus(response.data)
      }
    } catch (error) {
      console.error('Error fetching SKUs:', error)
      alert('Failed to fetch SKUs')
    } finally {
      setSkusLoading(false)
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      await deleteProductAPI(productId)
      alert('Product deleted successfully!')
      fetchProducts() // Refresh the list
    } catch (error) {
      alert(error.message || 'Failed to delete product')
    }
  }

  const tabs = [
    { id: 'list', label: 'Product List' },
    { id: 'add', label: 'Add Product' },
    { id: 'combo', label: 'Add Combo Product' },
  ]

  const filteredProducts = products.filter((product) => {
    const matchSearch =
      product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product._id?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filters.status === 'all' || (product.active === true ? 'active' : 'inactive') === filters.status.toLowerCase()
    const matchCategory = filters.category === 'all' || product.category === filters.category
    const matchStock =
      filters.stockStatus === 'all' ||
      (filters.stockStatus === 'in-stock' && product.quantity > 20) ||
      (filters.stockStatus === 'low-stock' && product.quantity >= 5 && product.quantity <= 20) ||
      (filters.stockStatus === 'out-of-stock' && product.quantity < 5)

    return matchSearch && matchStatus && matchCategory && matchStock
  })

  const toggleOutOfStock = async (productId) => {
    try {
      const product = products.find(p => p._id === productId)
      if (!product) return

      const updatedData = {
        title: product.title,
        description: product.description,
        isCombo: product.isCombo,
        skus: product.skus.map(s => ({ sku: typeof s.sku === 'object' ? s.sku._id : s.sku })),
        price: product.price,
      }

      await updateProductAPI(productId, updatedData)
      fetchProducts() // Refresh the list
    } catch (error) {
      alert(error.message || 'Failed to update product status')
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="text-3xl font-bold text-gray-800">Product Management</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setShowAddForm(false)
                setShowComboForm(false)
              }}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'list' && (
          <ProductList
            products={filteredProducts}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filters={filters}
            setFilters={setFilters}
            loading={loading}
            onToggleOutOfStock={toggleOutOfStock}
            onDelete={handleDeleteProduct}
            onRefresh={fetchProducts}
          />
        )}
        {activeTab === 'add' && (
          <AddProduct
            showForm={showAddForm}
            setShowForm={setShowAddForm}
            skus={skus}
            skusLoading={skusLoading}
            onSuccess={() => {
              setShowAddForm(false)
              fetchProducts() // Refresh the list
            }}
          />
        )}
        {activeTab === 'combo' && (
          <AddComboProduct
            showForm={showComboForm}
            setShowForm={setShowComboForm}
            skus={skus}
            skusLoading={skusLoading}
            onSuccess={() => {
              setShowComboForm(false)
              fetchProducts() // Refresh the list
            }}
          />
        )}
      </div>
    </div>
  )
}

// Product List Component
const ProductList = ({ products, searchTerm, setSearchTerm, filters, setFilters, loading, onToggleOutOfStock, onDelete, onRefresh }) => {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 border rounded-lg px-4 py-2 w-full">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="out of stock">Out of Stock</option>
            <option value="draft">Draft</option>
          </select>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Categories</option>
            <option value="smartphones">Smartphones</option>
            <option value="laptops">Laptops</option>
            <option value="combo">Combo</option>
          </select>
          <select
            value={filters.stockStatus}
            onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Stock Status</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Combo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="9" className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={20} className="animate-spin text-primary-600" />
                    <span className="text-gray-600">Loading products...</span>
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product._id}>
                  <td className="px-6 py-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      {product.skus?.[0]?.sku?.images?.[0] ? (
                        <img
                          src={product.skus[0].sku.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package size={24} className="text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">{product.title}</td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-600">{product._id}</td>
                  <td className="px-6 py-4">
                    {product.skus?.[0]?.sku?.category?.name || product.skus?.[0]?.sku?.category || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold">{formatCurrency(product.price)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        product.quantity > 20
                          ? 'text-green-600 font-semibold'
                          : product.quantity >= 5
                          ? 'text-yellow-600 font-semibold'
                          : 'text-red-600 font-semibold'
                      }
                    >
                      {product.quantity || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        product.active === true
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {product.isCombo ? (
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                        Yes
                      </span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onToggleOutOfStock(product._id)}
                        className={`text-sm px-2 py-1 rounded ${
                          product.active === false
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {product.active === false ? 'Activate' : 'Deactivate'}
                      </button>
                      <button className="text-primary-600 hover:text-primary-700">
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(product._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Add Product Component
const AddProduct = ({ showForm, setShowForm, skus, skusLoading, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isCombo: false,
    skus: [],
    price: '',
    strikeThroughPrice: '',
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

  const handleSKUChange = (e) => {
    const { value } = e.target
    const selectedSKUs = Array.from(e.target.selectedOptions, option => option.value)
    setFormData((prev) => ({
      ...prev,
      skus: selectedSKUs.map(skuId => ({ sku: skuId })),
    }))
    if (errors.skus) {
      setErrors((prev) => ({ ...prev, skus: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Product title is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.price || parseFloat(formData.price) < 1) {
      newErrors.price = 'Price must be at least ₹1'
    }

    if (!formData.skus || formData.skus.length === 0) {
      newErrors.skus = 'At least one SKU is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setLoading(true)
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        isCombo: false,
        skus: formData.skus,
        price: parseFloat(formData.price),
        ...(formData.strikeThroughPrice && { strikeThroughPrice: parseFloat(formData.strikeThroughPrice) }),
      }

      await createProductAPI(payload)
      alert('Product added successfully!')
      setFormData({
        title: '',
        description: '',
        isCombo: false,
        skus: [],
        price: '',
        strikeThroughPrice: '',
      })
      setErrors({})
      onSuccess()
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to add product. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="page-header mb-6">
        <h2 className="text-2xl font-semibold">Add New Product</h2>
        <button onClick={() => setShowForm(!showForm)}>
          <X size={24} />
        </button>
      </div>

      {errors.submit && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Product Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            errors={errors}
            required
            placeholder="Enter product title"
          />
          <Input
            label="Price (₹)"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            errors={errors}
            required
            placeholder="Enter product price"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Strike Through Price (₹)"
            name="strikeThroughPrice"
            type="number"
            value={formData.strikeThroughPrice}
            onChange={handleChange}
            errors={errors}
            placeholder="Enter strike through price (optional)"
          />
        </div>

        <Textarea
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          errors={errors}
          required
          placeholder="Enter product description"
          rows={4}
        />

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Select SKUs <span className="text-red-500">*</span>
          </label>
          {skusLoading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 size={16} className="animate-spin" />
              Loading SKUs...
            </div>
          ) : (
            <select
              name="skus"
              multiple
              value={formData.skus.map(s => s.sku)}
              onChange={handleSKUChange}
              className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 h-32 ${
                errors.skus ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {skus.map((sku) => (
                <option key={sku._id} value={sku._id}>
                  {sku.skuId} - {sku.title} ({sku.brand})
                </option>
              ))}
            </select>
          )}
          {errors.skus && (
            <span className="text-sm text-red-500 mt-1">{errors.skus}</span>
          )}
          <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple SKUs</p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Product'}
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({
                title: '',
                description: '',
                isCombo: false,
                skus: [],
                price: '',
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
  )
}

// Add Combo Product Component
const AddComboProduct = ({ showForm, setShowForm, skus, skusLoading, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isCombo: true,
    skus: [],
    price: '',
    strikeThroughPrice: '',
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

  const handleSKUChange = (e) => {
    const selectedSKUs = Array.from(e.target.selectedOptions, option => option.value)
    setFormData((prev) => ({
      ...prev,
      skus: selectedSKUs.map(skuId => ({ sku: skuId })),
    }))
    if (errors.skus) {
      setErrors((prev) => ({ ...prev, skus: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Combo title is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.price || parseFloat(formData.price) < 1) {
      newErrors.price = 'Price must be at least ₹1'
    }

    if (!formData.skus || formData.skus.length < 2) {
      newErrors.skus = 'At least 2 SKUs are required for combo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setLoading(true)
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        isCombo: true,
        skus: formData.skus,
        price: parseFloat(formData.price),
        ...(formData.strikeThroughPrice && { strikeThroughPrice: parseFloat(formData.strikeThroughPrice) }),
      }

      await createProductAPI(payload)
      alert('Combo product created successfully!')
      setFormData({
        title: '',
        description: '',
        isCombo: true,
        skus: [],
        price: '',
        strikeThroughPrice: '',
      })
      setErrors({})
      onSuccess()
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to create combo product. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="page-header mb-6">
        <h2 className="text-2xl font-semibold">Add Combo Product</h2>
        <button onClick={() => setShowForm(!showForm)}>
          <X size={24} />
        </button>
      </div>

      {errors.submit && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Combo Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            errors={errors}
            required
            placeholder="Enter combo title"
          />
          <Input
            label="Combo Price (₹)"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            errors={errors}
            required
            placeholder="Enter combo price"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Strike Through Price (₹)"
            name="strikeThroughPrice"
            type="number"
            value={formData.strikeThroughPrice}
            onChange={handleChange}
            errors={errors}
            placeholder="Enter strike through price (optional)"
          />
        </div>

        <Textarea
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          errors={errors}
          required
          placeholder="Enter combo description"
          rows={4}
        />

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Select SKUs (Minimum 2) <span className="text-red-500">*</span>
          </label>
          {skusLoading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 size={16} className="animate-spin" />
              Loading SKUs...
            </div>
          ) : (
            <select
              name="skus"
              multiple
              value={formData.skus.map(s => s.sku)}
              onChange={handleSKUChange}
              className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 h-32 ${
                errors.skus ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {skus.map((sku) => (
                <option key={sku._id} value={sku._id}>
                  {sku.skuId} - {sku.title} ({sku.brand})
                </option>
              ))}
            </select>
          )}
          {errors.skus && (
            <span className="text-sm text-red-500 mt-1">{errors.skus}</span>
          )}
          <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple SKUs</p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Combo'}
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({
                title: '',
                description: '',
                isCombo: true,
                skus: [],
                price: '',
                strikeThroughPrice: '',
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
  )
}

export default ProductManagement

