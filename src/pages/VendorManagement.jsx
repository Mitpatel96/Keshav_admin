import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Eye, Users, MapPin, Phone, Mail, X, Loader2 } from 'lucide-react'
import Input from '../components/Form/Input'
import Select from '../components/Form/Select'
import Textarea from '../components/Form/Textarea'
import Checkbox from '../components/Form/Checkbox'
import FileUpload from '../components/Form/FileUpload'
import { validateEmail, validatePhone } from '../utils/validation'
import { formatCurrency } from '../utils/helpers'
import { addVendorAPI, getAllVendorsAPI, getVendorByIdAPI, updateVendorAPI, deactivateVendorAPI } from '../utils/api'

const VendorManagement = () => {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(null)
  const [showViewModal, setShowViewModal] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    state: 'all',
  })

  // Fetch vendors from API
  const fetchVendors = async (page = 1, limit = 100) => {
    try {
      setLoading(true)
      setError(null)
      const response = await getAllVendorsAPI(page, limit)
      if (response?.data) {
        setVendors(response.data)
        setPagination(response.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCount: response.data.length,
          hasNextPage: false,
          hasPrevPage: false,
        })
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch vendors')
      console.error('Error fetching vendors:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [])

  // Handle delete/deactivate vendor
  const handleDeleteVendor = async (vendor) => {
    if (!window.confirm(`Are you sure you want to deactivate ${vendor.name}?`)) {
      return
    }

    try {
      const vendorId = vendor._id || vendor.vendorId
      await deactivateVendorAPI(vendorId)
      alert('Vendor deactivated successfully!')
      fetchVendors() // Refresh the list
    } catch (error) {
      alert(error.message || 'Failed to deactivate vendor')
    }
  }

  // Get unique locations from vendors for filter
  const uniqueLocations = [...new Set(vendors.flatMap(v => v.area || []))]

  const filteredVendors = vendors.filter((vendor) => {
    const matchSearch =
      vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.vendorId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.permanentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.phone?.includes(searchTerm) ||
      vendor.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchStatus = 
      filters.status === 'all' || 
      (filters.status === 'active' && vendor.active === true) ||
      (filters.status === 'inactive' && vendor.active === false)
    
    const matchState =
      filters.state === 'all' || 
      vendor.state === filters.state

    return matchSearch && matchStatus && matchState
  })

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="text-3xl font-bold text-gray-800">Vendor Management</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="responsive-button px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus size={20} />
          Add Vendor
        </button>
      </div>

      {showAddForm && (
        <AddVendorForm
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false)
            fetchVendors() // Refresh vendor list
          }}
        />
      )}

      {showEditForm && (
        <EditVendorForm
          vendor={showEditForm}
          onClose={() => setShowEditForm(null)}
          onSuccess={() => {
            setShowEditForm(null)
            fetchVendors() // Refresh vendor list
          }}
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 border rounded-lg px-4 py-2 w-full">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID, phone, or email..."
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
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={filters.state}
            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All States</option>
            {[...new Set(vendors.map(v => v.state).filter(Boolean))].map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Vendor List */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="text-primary-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading vendors...</span>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {vendors.length === 0 ? 'No vendors found' : 'No vendors match your filters'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVendors.map((vendor) => (
                <tr key={vendor._id || vendor.vendorId}>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                    {vendor.vendorId || vendor.permanentId}
                  </td>
                  <td className="px-6 py-4 font-medium">{vendor.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />
                      <span>{vendor.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      <span className="text-sm">{vendor.email || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">{vendor.area || 'N/A'}</span>
                      <span className="text-xs text-gray-500">{vendor.city}, {vendor.state}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        vendor.active === true
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {vendor.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {vendor.createdAt 
                      ? new Date(vendor.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                    <button
                      onClick={() => setShowViewModal(vendor)}
                      className="text-primary-600 hover:text-primary-700"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => setShowEditForm(vendor)}
                      className="text-primary-600 hover:text-primary-700"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteVendor(vendor)}
                      className="text-red-600 hover:text-red-700"
                      title="Deactivate"
                    >
                      <Trash2 size={18} />
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t page-header">
            <div className="text-sm text-gray-600">
              Showing {filteredVendors.length} of {pagination.totalCount} vendors
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchVendors(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchVendors(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Vendor Details Modal */}
      {showViewModal && (
        <ViewVendorModal vendor={showViewModal} onClose={() => setShowViewModal(null)} />
      )}
    </div>
  )
}

// Add Vendor Form Component
const AddVendorForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    dob: '',
    address: [''],
    documents: [],
    state: '',
    city: '',
    area: '',
    location: {
      type: 'Point',
      coordinates: [0, 0],
    },
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const states = [
    { value: 'Rajasthan', label: 'Rajasthan' },
    { value: 'Gujarat', label: 'Gujarat' },
    { value: 'Maharashtra', label: 'Maharashtra' },
    { value: 'Delhi', label: 'Delhi' },
  ]

  const cities = [
    { value: 'Udaypur', label: 'Udaypur' },
    { value: 'Ahmedabad', label: 'Ahmedabad' },
    { value: 'Mumbai', label: 'Mumbai' },
    { value: 'Delhi', label: 'Delhi' },
  ]

  const areas = [
    { value: 'Gomti Nagar 1', label: 'Gomti Nagar 1' },
    { value: 'Satellite', label: 'Satellite' },
    { value: 'Vastrapur', label: 'Vastrapur' },
    { value: 'Maninagar', label: 'Maninagar' },
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (success) {
      setSuccess('')
    }
  }

  const handleAddressChange = (index, value) => {
    const newAddresses = [...formData.address]
    newAddresses[index] = value
    setFormData((prev) => ({ ...prev, address: newAddresses }))
  }

  const addAddressField = () => {
    setFormData((prev) => ({ ...prev, address: [...prev.address, ''] }))
  }

  const removeAddressField = (index) => {
    if (formData.address.length > 1) {
      const newAddresses = formData.address.filter((_, i) => i !== index)
      setFormData((prev) => ({ ...prev, address: newAddresses }))
    }
  }

  const handleLocationChange = (field, coordinates) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        coordinates: coordinates,
      },
    }))
  }


  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Vendor name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required'
    } else if (!/^\+?[0-9-]{10,15}$/.test(formData.phone.replace(/[\s-()]/g, ''))) {
      newErrors.phone = 'Invalid phone number format'
    }

    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required'
    }

    const validAddresses = formData.address.filter((addr) => addr.trim() !== '')
    if (validAddresses.length === 0) {
      newErrors.address = 'At least one address is required'
    }

    if (!formData.state) {
      newErrors.state = 'State is required'
    }

    if (!formData.city) {
      newErrors.city = 'City is required'
    }

    if (!formData.area) {
      newErrors.area = 'Area is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setSuccess('')
    setErrors({})

    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        dob: new Date(formData.dob).toISOString(),
        address: formData.address.filter((addr) => addr.trim() !== ''),
        documents: formData.documents,
        state: formData.state,
        city: formData.city,
        area: formData.area,
        location: {
          type: 'Point',
          coordinates: [formData.location.coordinates[0], formData.location.coordinates[1]],
        },
      }

      const response = await addVendorAPI(payload)

      setSuccess('Vendor added successfully!')
      setFormData({
        name: '',
        phone: '',
        email: '',
        dob: '',
        address: [''],
        documents: [],
        state: '',
        city: '',
        area: '',
        location: {
          type: 'Point',
          coordinates: [0, 0],
        },
      })
      setErrors({})

      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to add vendor. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="page-header mb-6">
        <h2 className="text-2xl font-semibold">Add New Vendor</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {errors.submit && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">Vendor Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Vendor ID</label>
              <input
                type="text"
                value="Auto-generated"
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <Input
              label="Business/Vendor Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              errors={errors}
              required
              placeholder="Enter vendor name"
            />
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              errors={errors}
              required
              placeholder="vendor@example.com"
            />
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              errors={errors}
              required
              placeholder="+91-90904233290"
            />
            <Input
              label="Date of Birth"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleChange}
              errors={errors}
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">Location Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="State"
              name="state"
              value={formData.state}
              onChange={handleChange}
              errors={errors}
              options={states}
              required
            />
            <Select
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              errors={errors}
              options={cities}
              required
            />
            <Select
              label="Area"
              name="area"
              value={formData.area}
              onChange={handleChange}
              errors={errors}
              options={areas}
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.location.coordinates[0] || ''}
                  onChange={(e) =>
                    handleLocationChange('coordinates', [
                      parseFloat(e.target.value) || 0,
                      formData.location.coordinates[1],
                    ])
                  }
                  placeholder="77.0287242"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.location.coordinates[1] || ''}
                  onChange={(e) =>
                    handleLocationChange('coordinates', [
                      formData.location.coordinates[0],
                      parseFloat(e.target.value) || 0,
                    ])
                  }
                  placeholder="28.9846528"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address Fields */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">Address</h3>
          {formData.address.map((address, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <Input
                name={`address-${index}`}
                value={address}
                onChange={(e) => handleAddressChange(index, e.target.value)}
                placeholder={`Address ${index + 1}`}
                className="flex-1"
              />
              {formData.address.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAddressField(index)}
                  className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          ))}
          {errors.address && (
            <span className="text-sm text-red-500">{errors.address}</span>
          )}
          <button
            type="button"
            onClick={addAddressField}
            className="mt-2 flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
          >
            <Plus size={16} />
            Add Another Address
          </button>
        </div>

        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">Documents</h3>
          <FileUpload
            label="Upload Documents (GST Certificate, PAN Card, Address Proof)"
            name="documents"
            onChange={(e) => {
              // FileUpload component returns paths in e.target.value
              const paths = Array.isArray(e.target.value) ? e.target.value : [e.target.value].filter(Boolean)
              setFormData((prev) => ({ ...prev, documents: paths }))
              if (errors.documents) {
                setErrors((prev) => ({ ...prev, documents: '' }))
              }
            }}
            errors={errors}
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
            multiple
            maxSizeMB={10}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding Vendor...' : 'Add Vendor'}
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({
                name: '',
                phone: '',
                email: '',
                dob: '',
                address: [''],
                documents: [],
                state: '',
                city: '',
                area: '',
                location: {
                  type: 'Point',
                  coordinates: [0, 0],
                },
              })
              setErrors({})
              setSuccess('')
              onClose()
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

// Edit Vendor Form Component
const EditVendorForm = ({ vendor, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: vendor.name || '',
    phone: vendor.phone || '',
    email: vendor.email || '',
    dob: vendor.dob ? new Date(vendor.dob).toISOString().split('T')[0] : '',
    address: vendor.address && vendor.address.length > 0 ? vendor.address : [''],
    documents: vendor.documents || [],
    state: vendor.state || '',
    city: vendor.city || '',
    area: vendor.area || '',
    location: vendor.location || {
      type: 'Point',
      coordinates: [0, 0],
    },
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const states = [
    { value: 'Rajasthan', label: 'Rajasthan' },
    { value: 'Gujarat', label: 'Gujarat' },
    { value: 'Maharashtra', label: 'Maharashtra' },
    { value: 'Delhi', label: 'Delhi' },
    { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
  ]

  const cities = [
    { value: 'Udaypur', label: 'Udaypur' },
    { value: 'Ahmedabad', label: 'Ahmedabad' },
    { value: 'Mumbai', label: 'Mumbai' },
    { value: 'Delhi', label: 'Delhi' },
    { value: 'Lucknow', label: 'Lucknow' },
  ]

  const areas = [
    { value: 'Gomti Nagar 1', label: 'Gomti Nagar 1' },
    { value: 'Satellite', label: 'Satellite' },
    { value: 'Vastrapur', label: 'Vastrapur' },
    { value: 'Maninagar', label: 'Maninagar' },
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (success) {
      setSuccess('')
    }
  }

  const handleAddressChange = (index, value) => {
    const newAddresses = [...formData.address]
    newAddresses[index] = value
    setFormData((prev) => ({ ...prev, address: newAddresses }))
  }

  const addAddressField = () => {
    setFormData((prev) => ({ ...prev, address: [...prev.address, ''] }))
  }

  const removeAddressField = (index) => {
    if (formData.address.length > 1) {
      const newAddresses = formData.address.filter((_, i) => i !== index)
      setFormData((prev) => ({ ...prev, address: newAddresses }))
    }
  }

  const handleLocationChange = (field, coordinates) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        coordinates: coordinates,
      },
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Vendor name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required'
    } else if (!/^\+?[0-9-]{10,15}$/.test(formData.phone.replace(/[\s-()]/g, ''))) {
      newErrors.phone = 'Invalid phone number format'
    }

    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required'
    }

    const validAddresses = formData.address.filter((addr) => addr.trim() !== '')
    if (validAddresses.length === 0) {
      newErrors.address = 'At least one address is required'
    }

    if (!formData.state) {
      newErrors.state = 'State is required'
    }

    if (!formData.city) {
      newErrors.city = 'City is required'
    }

    if (!formData.area) {
      newErrors.area = 'Area is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setSuccess('')
    setErrors({})

    try {
      const vendorId = vendor._id || vendor.vendorId
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        dob: new Date(formData.dob).toISOString(),
        address: formData.address.filter((addr) => addr.trim() !== ''),
        documents: formData.documents,
        state: formData.state,
        city: formData.city,
        area: formData.area,
        location: {
          type: 'Point',
          coordinates: [formData.location.coordinates[0], formData.location.coordinates[1]],
        },
      }

      const response = await updateVendorAPI(vendorId, payload)

      setSuccess('Vendor updated successfully!')
      setErrors({})

      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to update vendor. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="page-header mb-6">
        <h2 className="text-2xl font-semibold">Edit Vendor</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {errors.submit && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">Vendor Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Vendor ID</label>
              <input
                type="text"
                value={vendor.vendorId || vendor.permanentId || 'Auto-generated'}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <Input
              label="Business/Vendor Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              errors={errors}
              required
              placeholder="Enter vendor name"
            />
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              errors={errors}
              required
              placeholder="vendor@example.com"
            />
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              errors={errors}
              required
              placeholder="+91-90904233290"
            />
            <Input
              label="Date of Birth"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleChange}
              errors={errors}
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">Location Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="State"
              name="state"
              value={formData.state}
              onChange={handleChange}
              errors={errors}
              options={states}
              required
            />
            <Select
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              errors={errors}
              options={cities}
              required
            />
            <Select
              label="Area"
              name="area"
              value={formData.area}
              onChange={handleChange}
              errors={errors}
              options={areas}
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.location.coordinates[0] || ''}
                  onChange={(e) =>
                    handleLocationChange('coordinates', [
                      parseFloat(e.target.value) || 0,
                      formData.location.coordinates[1],
                    ])
                  }
                  placeholder="77.0287242"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.location.coordinates[1] || ''}
                  onChange={(e) =>
                    handleLocationChange('coordinates', [
                      formData.location.coordinates[0],
                      parseFloat(e.target.value) || 0,
                    ])
                  }
                  placeholder="28.9846528"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address Fields */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">Address</h3>
          {formData.address.map((address, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <Input
                name={`address-${index}`}
                value={address}
                onChange={(e) => handleAddressChange(index, e.target.value)}
                placeholder={`Address ${index + 1}`}
                className="flex-1"
              />
              {formData.address.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAddressField(index)}
                  className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          ))}
          {errors.address && (
            <span className="text-sm text-red-500">{errors.address}</span>
          )}
          <button
            type="button"
            onClick={addAddressField}
            className="mt-2 flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
          >
            <Plus size={16} />
            Add Another Address
          </button>
        </div>

        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">Documents</h3>
          <FileUpload
            label="Upload Documents (GST Certificate, PAN Card, Address Proof)"
            name="documents"
            onChange={(e) => {
              // FileUpload component returns paths in e.target.value
              const paths = Array.isArray(e.target.value) ? e.target.value : [e.target.value].filter(Boolean)
              setFormData((prev) => ({ ...prev, documents: paths }))
              if (errors.documents) {
                setErrors((prev) => ({ ...prev, documents: '' }))
              }
            }}
            errors={errors}
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
            multiple
            maxSizeMB={10}
          />
          {formData.documents.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 mb-1">Current documents:</p>
              <ul className="list-disc list-inside text-xs text-gray-500">
                {formData.documents.map((doc, idx) => (
                  <li key={idx}>{doc}</li>
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
            {loading ? 'Updating...' : 'Update Vendor'}
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
  )
}

// View Vendor Details Modal
const ViewVendorModal = ({ vendor, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="page-header mb-6">
          <h2 className="text-2xl font-semibold">Vendor Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Vendor ID</h3>
            <p className="text-gray-900 font-mono">{vendor.vendorId || vendor.permanentId}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Business Name</h3>
            <p className="text-gray-900">{vendor.name}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Email</h3>
            <p className="text-gray-900">{vendor.email || 'N/A'}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Phone</h3>
            <p className="text-gray-900">{vendor.phone}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Date of Birth</h3>
            <p className="text-gray-900">
              {vendor.dob ? new Date(vendor.dob).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Status</h3>
            <p className="text-gray-900">
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  vendor.active === true
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {vendor.active ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">State</h3>
            <p className="text-gray-900">{vendor.state || 'N/A'}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">City</h3>
            <p className="text-gray-900">{vendor.city || 'N/A'}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Area</h3>
            <p className="text-gray-900">{vendor.area || 'N/A'}</p>
          </div>
          {vendor.location && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Coordinates</h3>
              <p className="text-gray-900 text-sm">
                Longitude: {vendor.location.coordinates?.[0] || 'N/A'}, 
                Latitude: {vendor.location.coordinates?.[1] || 'N/A'}
              </p>
            </div>
          )}
          <div className="md:col-span-2">
            <h3 className="font-semibold text-gray-700 mb-2">Address</h3>
            {vendor.address && vendor.address.length > 0 ? (
              <ul className="list-disc list-inside text-gray-900">
                {vendor.address.map((addr, idx) => (
                  <li key={idx}>{addr}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-900">N/A</p>
            )}
          </div>
          {vendor.documents && vendor.documents.length > 0 && (
            <div className="md:col-span-2">
              <h3 className="font-semibold text-gray-700 mb-2">Documents</h3>
              <ul className="list-disc list-inside text-gray-900">
                {vendor.documents.map((doc, idx) => (
                  <li key={idx} className="text-sm">{doc}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Created At</h3>
            <p className="text-gray-900 text-sm">
              {vendor.createdAt 
                ? new Date(vendor.createdAt).toLocaleString()
                : 'N/A'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Updated At</h3>
            <p className="text-gray-900 text-sm">
              {vendor.updatedAt 
                ? new Date(vendor.updatedAt).toLocaleString()
                : 'N/A'}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
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

export default VendorManagement

