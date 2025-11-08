import { useState } from 'react'
// import { useForm } from 'react-hook-form' // Removed - using useState
import { Eye, EyeOff, Lock, User, Building, MapPin, Phone, Mail } from 'lucide-react'
import Input from '../components/Form/Input'
import Textarea from '../components/Form/Textarea'
import Checkbox from '../components/Form/Checkbox'
import { validateEmail, validatePhone, validatePassword } from '../utils/validation'

const VendorSettings = () => {
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Change Password', icon: Lock },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Settings</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'profile' && <VendorProfile />}
        {activeTab === 'password' && (
          <ChangeVendorPassword showPassword={showPassword} setShowPassword={setShowPassword} />
        )}
      </div>
    </div>
  )
}

// Vendor Profile Component
const VendorProfile = () => {
  const [formData, setFormData] = useState({
    vendorId: 'V0001',
    businessName: 'Tech Solutions Pvt Ltd',
    contactPerson: 'Rajesh Kumar',
    email: 'vendor@gmail.com',
    phone: '9876543210',
    alternatePhone: '9123456789',
    addressLine1: 'Shop 12, Tech Park',
    addressLine2: 'Near City Mall',
    area: 'Satellite',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pinCode: '380015',
    gstNumber: '24ABCDE1234F1Z5',
    panNumber: 'ABCDE1234F',
    bankName: 'HDFC Bank',
    accountNumber: '12345678901234',
    ifscCode: 'HDFC0001234',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required'
    }

    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Contact person name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required'
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Must be exactly 10 digits'
    }

    if (formData.alternatePhone && !validatePhone(formData.alternatePhone)) {
      newErrors.alternatePhone = 'Must be exactly 10 digits'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) return
    alert('Profile updated successfully!')
    // In real app, save to backend
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Building size={24} className="text-green-600" />
        <h2 className="text-2xl font-semibold">Vendor Profile</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vendor Details */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">Business Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Vendor ID</label>
              <input
                type="text"
                value={formData.vendorId}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 mt-1"
              />
            </div>
            <Input
              label="Business/Vendor Name"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              errors={errors}
              required
            />
            <Input
              label="Contact Person Name"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              errors={errors}
              required
            />
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              errors={errors}
              required
            />
            <Input
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              errors={errors}
              required
            />
            <Input
              label="Alternate Phone"
              name="alternatePhone"
              value={formData.alternatePhone}
              onChange={handleChange}
              errors={errors}
            />
          </div>
        </div>

        {/* Address Details */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">Address Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Address Line 1"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleChange}
              errors={errors}
              required
            />
            <Input
              label="Address Line 2"
              name="addressLine2"
              value={formData.addressLine2}
              onChange={handleChange}
              errors={errors}
            />
            <Input
              label="Area"
              name="area"
              value={formData.area}
              onChange={handleChange}
              errors={errors}
              required
            />
            <Input
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              errors={errors}
              required
            />
            <Input
              label="State"
              name="state"
              value={formData.state}
              onChange={handleChange}
              errors={errors}
              required
            />
            <Input
              label="PIN Code"
              name="pinCode"
              value={formData.pinCode}
              onChange={handleChange}
              errors={errors}
              required
            />
          </div>
        </div>

        {/* Financial Details */}
        <div className="pb-6">
          <h3 className="text-lg font-semibold mb-4">Financial Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="GST Number"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleChange}
              errors={errors}
            />
            <Input
              label="PAN Number"
              name="panNumber"
              value={formData.panNumber}
              onChange={handleChange}
              errors={errors}
            />
            <Input
              label="Bank Name"
              name="bankName"
              value={formData.bankName}
              onChange={handleChange}
              errors={errors}
            />
            <Input
              label="Account Number"
              name="accountNumber"
              type="number"
              value={formData.accountNumber}
              onChange={handleChange}
              errors={errors}
            />
            <Input
              label="IFSC Code"
              name="ifscCode"
              value={formData.ifscCode}
              onChange={handleChange}
              errors={errors}
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Update Profile
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({
                vendorId: 'V0001',
                businessName: 'Tech Solutions Pvt Ltd',
                contactPerson: 'Rajesh Kumar',
                email: 'vendor@gmail.com',
                phone: '9876543210',
                alternatePhone: '9123456789',
                addressLine1: 'Shop 12, Tech Park',
                addressLine2: 'Near City Mall',
                area: 'Satellite',
                city: 'Ahmedabad',
                state: 'Gujarat',
                pinCode: '380015',
                gstNumber: '24ABCDE1234F1Z5',
                panNumber: 'ABCDE1234F',
                bankName: 'HDFC Bank',
                accountNumber: '12345678901234',
                ifscCode: 'HDFC0001234',
              })
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

// Change Password Component
const ChangeVendorPassword = ({ showPassword, setShowPassword }) => {
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
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setErrors({})
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('userType')
    window.location.href = '/vendor/login'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Lock size={24} className="text-green-600" />
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
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Change Password
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              })
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

export default VendorSettings

