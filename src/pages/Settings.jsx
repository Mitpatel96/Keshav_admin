import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Lock, UserPlus, X } from 'lucide-react'
import Input from '../components/Form/Input'
import Select from '../components/Form/Select'
import Textarea from '../components/Form/Textarea'
import Checkbox from '../components/Form/Checkbox'
import FileUpload from '../components/Form/FileUpload'
import { validatePassword, validateEmail, validatePhone } from '../utils/validation'
import { createCategoryAPI, getAllCategoriesAPI } from '../utils/api'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('category')
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const tabs = [
    { id: 'category', label: 'Categories' },
    { id: 'vendors', label: 'Vendor Management' },
    { id: 'users', label: 'User/Admin Management' },
    { id: 'password', label: 'Change Password' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Settings</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
        {activeTab === 'category' && <CategoryManagement />}
        {activeTab === 'vendors' && <VendorManagementSettings />}
        {activeTab === 'users' && <UserAdminManagement />}
        {activeTab === 'password' && <ChangePassword showPassword={showPassword} setShowPassword={setShowPassword} />}
      </div>
    </div>
  )
}

// Category Management Component
const CategoryManagement = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [errors, setErrors] = useState({})

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await getAllCategoriesAPI(1, 100)
      if (response?.data) {
        setCategories(response.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      alert('Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required'
    } else if (formData.name.length < 3) {
      newErrors.name = 'Minimum 3 characters'
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
        name: formData.name.trim(),
        description: formData.description.trim() || '',
      }
      await createCategoryAPI(payload)
      setFormData({ name: '', description: '' })
      setErrors({})
      setShowForm(false)
      alert('Category added successfully!')
      fetchCategories() // Refresh the list
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to add category. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Category Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Add New Category</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.submit && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {errors.submit}
              </div>
            )}
            <Input
              label="Category Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              errors={errors}
              required
            />
            <Textarea
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              errors={errors}
              placeholder="Optional description for the category"
            />
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({ name: '', description: '' })
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

      {/* Category List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 border rounded-lg px-4 py-2 max-w-md">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    Loading categories...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No categories found
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category._id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{category.name}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {category.description || 'No description'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.createdAt
                        ? new Date(category.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button className="text-primary-600 hover:text-primary-700">
                          <Edit size={18} />
                        </button>
                        <button className="text-red-600 hover:text-red-700">
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
    </div>
  )
}

// Vendor Management Settings Component
const VendorManagementSettings = () => {
  const [vendors, setVendors] = useState([
    {
      id: 'V0001',
      name: 'Tech Solutions Pvt Ltd',
      contact: '9876543210',
      email: 'vendor1@example.com',
      location: 'Satellite Road',
      skus: 45,
      stockValue: 2450000,
      status: 'Active',
    },
    {
      id: 'V0002',
      name: 'Audio Store',
      contact: '9876543211',
      email: 'vendor2@example.com',
      location: 'Vastrapur Point',
      skus: 28,
      stockValue: 1200000,
      status: 'Active',
    },
  ])
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterLocation, setFilterLocation] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredVendors = vendors.filter((vendor) => {
    const matchStatus = filterStatus === 'all' || vendor.status.toLowerCase() === filterStatus.toLowerCase()
    const matchLocation = filterLocation === 'all' || vendor.location === filterLocation
    const matchSearch =
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contact.includes(searchTerm)

    return matchStatus && matchLocation && matchSearch
  })

  const toggleVendorStatus = (id) => {
    setVendors(
      vendors.map((vendor) =>
        vendor.id === id
          ? { ...vendor, status: vendor.status === 'Active' ? 'Inactive' : 'Active' }
          : vendor
      )
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">All Vendor Management</h2>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 border rounded-lg px-4 py-2">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or phone..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Locations</option>
            <option value="Satellite Road">Satellite Road</option>
            <option value="Vastrapur Point">Vastrapur Point</option>
          </select>
        </div>
      </div>

      {/* Vendor List */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pickup Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total SKUs</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredVendors.map((vendor) => (
              <tr key={vendor.id}>
                <td className="px-6 py-4 whitespace-nowrap">{vendor.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{vendor.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{vendor.contact}</td>
                <td className="px-6 py-4 whitespace-nowrap">{vendor.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{vendor.location}</td>
                <td className="px-6 py-4 whitespace-nowrap">{vendor.skus}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ₹{vendor.stockValue.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      vendor.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {vendor.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleVendorStatus(vendor.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        vendor.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          vendor.status === 'Active' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <button className="text-primary-600 hover:text-primary-700">
                      <Eye size={18} />
                    </button>
                    <button className="text-primary-600 hover:text-primary-700">
                      <Edit size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// User/Admin Management Component
const UserAdminManagement = () => {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    password: '',
    confirmPassword: '',
    role: 'user', // 'user' or 'admin'
    addresses: [''],
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  })

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
    const newAddresses = [...formData.addresses]
    newAddresses[index] = value
    setFormData((prev) => ({ ...prev, addresses: newAddresses }))
  }

  const addAddressField = () => {
    setFormData((prev) => ({ ...prev, addresses: [...prev.addresses, ''] }))
  }

  const removeAddressField = (index) => {
    if (formData.addresses.length > 1) {
      const newAddresses = formData.addresses.filter((_, i) => i !== index)
      setFormData((prev) => ({ ...prev, addresses: newAddresses }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required'
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/[\s-()]/g, ''))) {
      newErrors.phone = 'Invalid phone number format'
    }

    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required'
    } else {
      const dobDate = new Date(formData.dob)
      const today = new Date()
      if (dobDate > today) {
        newErrors.dob = 'Date of birth cannot be in the future'
      }
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required'
    } else {
      const passwordValidation = validatePassword(formData.password)
      if (!passwordValidation.isValid) {
        newErrors.password = 'Password must contain 1 uppercase, 1 number, and 1 special character'
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    // Validate addresses - at least one non-empty address
    const validAddresses = formData.addresses.filter((addr) => addr.trim() !== '')
    if (validAddresses.length === 0) {
      newErrors.addresses = 'At least one address is required'
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
      // Prepare payload
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        dob: new Date(formData.dob).toISOString(),
        password: formData.password,
        address: formData.addresses.filter((addr) => addr.trim() !== ''),
      }

      // Add role only if creating admin
      if (formData.role === 'admin') {
        payload.role = 'admin'
      }

      await registerUserAPI(payload)

      setSuccess(`${formData.role === 'admin' ? 'Admin' : 'User'} created successfully!`)
      setFormData({
        name: '',
        email: '',
        phone: '',
        dob: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        addresses: [''],
      })
      setErrors({})
      
      // Hide form after 2 seconds
      setTimeout(() => {
        setShowForm(false)
        setSuccess('')
      }, 2000)
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to create user. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const passwordValidation = formData.password ? validatePassword(formData.password) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">User/Admin Management</h2>
        <button
          onClick={() => {
            setShowForm(!showForm)
            if (!showForm) {
              setFormData({
                name: '',
                email: '',
                phone: '',
                dob: '',
                password: '',
                confirmPassword: '',
                role: 'user',
                addresses: [''],
              })
              setErrors({})
              setSuccess('')
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <UserPlus size={20} />
          {showForm ? 'Cancel' : 'Create User/Admin'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Create New {formData.role === 'admin' ? 'Admin' : 'User'}</h3>
          
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <label className="text-sm font-medium text-gray-700">Create as:</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={formData.role === 'user'}
                    onChange={handleChange}
                    className="text-primary-600"
                  />
                  <span>User</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={formData.role === 'admin'}
                    onChange={handleChange}
                    className="text-primary-600"
                  />
                  <span>Admin</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                errors={errors}
                required
                placeholder="Enter full name"
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                errors={errors}
                required
                placeholder="user@example.com"
              />
              <Input
                label="Phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                errors={errors}
                required
                placeholder="+911234567890"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label="Password"
                  name="password"
                  type={showPassword.password ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  errors={errors}
                  required
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => ({ ...prev, password: !prev.password }))}
                  className="absolute right-4 top-9 text-gray-500 hover:text-gray-700"
                >
                  {showPassword.password ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {passwordValidation && (
                  <div className="mt-1">
                    <div className="text-xs text-gray-600">
                      Password Strength:{' '}
                      <span
                        className={`font-semibold ${
                          passwordValidation.strength === 'Strong'
                            ? 'text-green-600'
                            : passwordValidation.strength === 'Medium'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {passwordValidation.strength}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showPassword.confirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  errors={errors}
                  required
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => ({
                      ...prev,
                      confirmPassword: !prev.confirmPassword,
                    }))
                  }
                  className="absolute right-4 top-9 text-gray-500 hover:text-gray-700"
                >
                  {showPassword.confirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Address Fields */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Address {errors.addresses && <span className="text-red-500 ml-1">*</span>}
              </label>
              {formData.addresses.map((address, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    name={`address-${index}`}
                    value={address}
                    onChange={(e) => handleAddressChange(index, e.target.value)}
                    placeholder={`Address ${index + 1}`}
                    className="flex-1"
                  />
                  {formData.addresses.length > 1 && (
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
              {errors.addresses && (
                <span className="text-sm text-red-500">{errors.addresses}</span>
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

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : `Create ${formData.role === 'admin' ? 'Admin' : 'User'}`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    dob: '',
                    password: '',
                    confirmPassword: '',
                    role: 'user',
                    addresses: [''],
                  })
                  setErrors({})
                  setSuccess('')
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
    </div>
  )
}

// Change Password Component
const ChangePassword = ({ showPassword, setShowPassword }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const passwordValidation = formData.newPassword ? validatePassword(formData.newPassword) : null

  const validateForm = () => {
    const newErrors = {}
    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required'
    } else if (formData.currentPassword.length < 8) {
      newErrors.currentPassword = 'Minimum 8 characters'
    }
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required'
    } else {
      const validation = validatePassword(formData.newPassword)
      if (!validation.isValid) {
        newErrors.newPassword = 'Password must contain 1 uppercase, 1 number, and 1 special character'
      }
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) return
    alert('Password changed successfully! Please login again.')
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setErrors({})
    localStorage.removeItem('isAuthenticated')
    window.location.href = '/login'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Lock size={24} className="text-primary-600" />
        <h2 className="text-2xl font-semibold">Change Password</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Input
            label="Current Password"
            name="currentPassword"
            type={showPassword.current ? 'text' : 'password'}
            value={formData.currentPassword}
            onChange={handleChange}
            errors={errors}
            required
          />
          <button
            type="button"
            onClick={() =>
              setShowPassword({ ...showPassword, current: !showPassword.current })
            }
            className="absolute right-4 top-9 text-gray-500 hover:text-gray-700"
          >
            {showPassword.current ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="relative">
          <Input
            label="New Password"
            name="newPassword"
            type={showPassword.new ? 'text' : 'password'}
            value={formData.newPassword}
            onChange={handleChange}
            errors={errors}
            required
          />
          <button
            type="button"
            onClick={() =>
              setShowPassword({ ...showPassword, new: !showPassword.new })
            }
            className="absolute right-4 top-9 text-gray-500 hover:text-gray-700"
          >
            {showPassword.new ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          {passwordValidation && (
            <div className="mt-1">
              <div className="text-xs text-gray-600">
                Password Strength:{' '}
                <span
                  className={`font-semibold ${
                    passwordValidation.strength === 'Strong'
                      ? 'text-green-600'
                      : passwordValidation.strength === 'Medium'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {passwordValidation.strength}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type={showPassword.confirm ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            errors={errors}
            required
          />
          <button
            type="button"
            onClick={() =>
              setShowPassword({
                ...showPassword,
                confirm: !showPassword.confirm,
              })
            }
            className="absolute right-4 top-9 text-gray-500 hover:text-gray-700"
          >
            {showPassword.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Change Password
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
              setErrors({})
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

export default Settings

