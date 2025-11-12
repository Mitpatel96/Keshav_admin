// API utility functions using Axios

import axios from 'axios'

const API_BASE_URL = 'https://dev.api.keshavtraders.com.au/api'

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    // Handle error response
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.message || error.response.data?.error || 'API request failed'
      return Promise.reject(new Error(errorMessage))
    } else if (error.request) {
      // Request was made but no response received
      return Promise.reject(new Error('Network error. Please check your connection.'))
    } else {
      // Something else happened
      return Promise.reject(error)
    }
  }
)

// Get auth token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem('authToken')
}

// Get user data from localStorage
export const getUserData = () => {
  const userData = localStorage.getItem('userData')
  return userData ? JSON.parse(userData) : null
}

// Set auth token and user data
export const setAuthData = (token, userData) => {
  localStorage.setItem('authToken', token)
  localStorage.setItem('userData', JSON.stringify(userData))
  localStorage.setItem('isAuthenticated', 'true')
  localStorage.setItem('userType', userData.role === 'admin' ? 'admin' : 'vendor')
}

// Clear auth data
export const clearAuthData = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('userData')
  localStorage.removeItem('isAuthenticated')
  localStorage.removeItem('userType')
  localStorage.removeItem('vendorId')
}

// API request helper (for backward compatibility, but uses axios instance internally)
export const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await axiosInstance({
      url: endpoint,
      method: options.method || 'GET',
      data: options.body ? JSON.parse(options.body) : options.data,
      params: options.params,
      headers: options.headers,
    })
    return response
  } catch (error) {
    throw error
  }
}

// Login API (doesn't require auth token - using plain axios without interceptor)
export const loginAPI = async (email, password) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/users/login`,
      { email, password },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    return response.data
  } catch (error) {
    if (error.response) {
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Login failed'
      throw new Error(errorMessage)
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.')
    } else {
      throw error
    }
  }
}

// Register User/Admin API (requires auth token - admin only)
export const registerUserAPI = async (userData) => {
  try {
    const response = await axiosInstance.post('/users/register', userData)
    return response
  } catch (error) {
    throw error
  }
}

// Get all users/admins API (requires auth token - admin only)
export const getAllUsersAPI = async (page = 1, limit = 100) => {
  try {
    const response = await axiosInstance.get('/users', {
      params: {
        page,
        limit,
      },
    })
    return response
  } catch (error) {
    throw error
  }
}

// Get All Vendors API (requires auth token - admin only)
export const getAllVendorsAPI = async (page = 1, limit = 100) => {
  try {
    const response = await axiosInstance.get('/vendors', {
      params: {
        page,
        limit,
      },
    })
    return response
  } catch (error) {
    throw error
  }
}

// Get Vendor By ID API (requires auth token - admin only)
export const getVendorByIdAPI = async (vendorId) => {
  try {
    const response = await axiosInstance.get(`/vendors/${vendorId}`)
    return response
  } catch (error) {
    throw error
  }
}

// Add Vendor API (requires auth token - admin only)
export const addVendorAPI = async (vendorData) => {
  try {
    const response = await axiosInstance.post('/vendors', vendorData)
    return response
  } catch (error) {
    throw error
  }
}

// Update Vendor API (requires auth token - admin only)
export const updateVendorAPI = async (vendorId, vendorData) => {
  try {
    const response = await axiosInstance.put(`/vendors/${vendorId}`, vendorData)
    return response
  } catch (error) {
    throw error
  }
}

// Deactivate Vendor API (requires auth token - admin only)
export const deactivateVendorAPI = async (vendorId) => {
  try {
    const response = await axiosInstance.post(`/vendors/${vendorId}/deactivate`)
    return response
  } catch (error) {
    throw error
  }
}

// Upload Image API
// Defaults to POST /upload/image but can be overridden with options.uploadUrl
export const uploadImageAPI = async (
  file,
  {
    uploadUrl = '/upload/image',
    filePath = '',
    fieldName = 'image',
  } = {}
) => {
  try {
    const formData = new FormData()
    formData.append(fieldName, file)

    const endpoint =
      uploadUrl ||
      (filePath ? `/upload/image/${filePath}` : '/upload/image')

    const response = await axiosInstance.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response
  } catch (error) {
    throw error
  }
}

// Upload File API (for documents)
// POST /upload/upload - for file/document upload
export const uploadFileAPI = async (file) => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await axiosInstance.post('/upload/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response
  } catch (error) {
    throw error
  }
}

// Delete File API
// POST /upload/delete_file - for deleting files
export const deleteFileAPI = async (filePath) => {
  try {
    const response = await axiosInstance.post('/upload/delete_file', { filePath })
    return response
  } catch (error) {
    throw error
  }
}

// Category APIs
// Create Category API
export const createCategoryAPI = async (categoryData) => {
  try {
    const response = await axiosInstance.post('/categories', categoryData)
    return response
  } catch (error) {
    throw error
  }
}

// Get All Categories API
export const getAllCategoriesAPI = async (page = 1, limit = 100) => {
  try {
    const response = await axiosInstance.get('/categories', {
      params: {
        page,
        limit,
      },
    })
    return response
  } catch (error) {
    throw error
  }
}

// SKU/Inventory APIs
// Create SKU API
export const createSKUAPI = async (skuData) => {
  try {
    const response = await axiosInstance.post('/skus', skuData)
    return response
  } catch (error) {
    throw error
  }
}

// Get All SKUs API
export const getAllSKUsAPI = async (page = 1, limit = 100) => {
  try {
    const response = await axiosInstance.get('/skus', {
      params: {
        page,
        limit,
      },
    })
    return response
  } catch (error) {
    throw error
  }
}

// Update SKU API
export const updateSKUAPI = async (skuId, skuData) => {
  try {
    const response = await axiosInstance.put(`/skus/${skuId}`, skuData)
    return response
  } catch (error) {
    throw error
  }
}

// Product APIs
// Create Product API
export const createProductAPI = async (productData) => {
  try {
    const response = await axiosInstance.post('/products', productData)
    return response
  } catch (error) {
    throw error
  }
}

// Get All Products API
export const getAllProductsAPI = async (page = 1, limit = 100) => {
  try {
    const response = await axiosInstance.get('/products', {
      params: {
        page,
        limit,
      },
    })
    return response
  } catch (error) {
    throw error
  }
}

// Update Product API
export const updateProductAPI = async (productId, productData) => {
  try {
    const response = await axiosInstance.put(`/products/${productId}`, productData)
    return response
  } catch (error) {
    throw error
  }
}

// Delete Product API
export const deleteProductAPI = async (productId) => {
  try {
    const response = await axiosInstance.delete(`/products/${productId}`)
    return response
  } catch (error) {
    throw error
  }
}

// Inventory APIs
// Create Inventory API
export const createInventoryAPI = async (inventoryData) => {
  try {
    const response = await axiosInstance.post('/inventory', inventoryData)
    return response
  } catch (error) {
    throw error
  }
}

// Transfer Inventory to Vendor API
export const transferInventoryToVendorAPI = async (transferData) => {
  try {
    const response = await axiosInstance.post('/inventory/transfer-to-vendor', transferData)
    return response
  } catch (error) {
    throw error
  }
}

// Get Pending Transfers API (vendor side)
export const getPendingTransfersAPI = async (page = 1, limit = 100) => {
  try {
    const response = await axiosInstance.get('/inventory/pending-transfers', {
      params: {
        page,
        limit,
      },
    })
    return response
  } catch (error) {
    throw error
  }
}

// Respond to Pending Transfer API (vendor side)
export const respondToPendingTransferAPI = async (transferId, action, rejectionReason = '') => {
  try {
    const response = await axiosInstance.put(`/inventory/pending-transfers/${transferId}/respond`, {
      action, // 'accept' or 'reject'
      rejectionReason, // optional
    })
    return response
  } catch (error) {
    throw error
  }
}

// Get All Inventory API
export const getAllInventoryAPI = async (page = 1, limit = 100) => {
  try {
    const response = await axiosInstance.get('/inventory', {
      params: {
        page,
        limit,
      },
    })
    return response
  } catch (error) {
    throw error
  }
}

// Get Inventory By ID API
export const getInventoryByIdAPI = async (inventoryId) => {
  try {
    const response = await axiosInstance.get(`/inventory/${inventoryId}`)
    return response
  } catch (error) {
    throw error
  }
}

// Update Inventory API
export const updateInventoryAPI = async (inventoryId, inventoryData) => {
  try {
    const response = await axiosInstance.put(`/inventory/${inventoryId}`, inventoryData)
    return response
  } catch (error) {
    throw error
  }
}

// Approve or Reject Inventory API (vendor side)
export const approveOrRejectInventoryAPI = async (inventoryId, status) => {
  try {
    const response = await axiosInstance.put(`/inventory/${inventoryId}/approve-or-reject`, { status })
    return response
  } catch (error) {
    throw error
  }
}

// Damage Ticket APIs
// Create Damage Ticket API
export const createDamageTicketAPI = async (damageData) => {
  try {
    const response = await axiosInstance.post('/damage', damageData)
    return response
  } catch (error) {
    throw error
  }
}

// Approve Damage Ticket API (admin side)
export const approveDamageTicketAPI = async (ticketId) => {
  try {
    const response = await axiosInstance.post(`/damage/${ticketId}/approve`)
    return response
  } catch (error) {
    throw error
  }
}

// Reject Damage Ticket API (admin side)
export const rejectDamageTicketAPI = async (ticketId) => {
  try {
    const response = await axiosInstance.post(`/damage/${ticketId}/reject`)
    return response
  } catch (error) {
    throw error
  }
}

// Get All Damage Tickets API
export const getAllDamageTicketsAPI = async (page = 1, limit = 100) => {
  try {
    const response = await axiosInstance.get('/damage', {
      params: {
        page,
        limit,
      },
    })
    return response
  } catch (error) {
    throw error
  }
}

// Get Inventory History API (admin side only)
export const getInventoryHistoryAPI = async (page = 1, limit = 100) => {
  try {
    const response = await axiosInstance.get('/damage/history', {
      params: {
        page,
        limit,
      },
    })
    return response
  } catch (error) {
    throw error
  }
}

// Order APIs
// Verify Order VFC API (vendor side)
export const verifyOrderVFCAPI = async (orderVFC) => {
  try {
    const response = await axiosInstance.post('/orders/verify-order-vfc', { orderVFC })
    return response
  } catch (error) {
    throw error
  }
}

// Confirm Combo Order API (vendor side)
export const confirmComboOrderAPI = async (orderId, status) => {
  try {
    const response = await axiosInstance.post('/orders/confirm-combo-order', {
      orderId,
      status,
    })
    return response
  } catch (error) {
    throw error
  }
}

// Get Partially Rejected Orders API (admin side)
export const getPartiallyRejectedOrdersAPI = async (page = 1, limit = 100) => {
  try {
    const response = await axiosInstance.get('/orders/partially-rejected', {
      params: {
        page,
        limit,
      },
    })
    return response
  } catch (error) {
    throw error
  }
}

// Admin Update Pickup Address API
export const adminUpdatePickupAPI = async (orderId, vendorId, pickupAddress) => {
  try {
    const response = await axiosInstance.put('/orders/admin-update-pickup', {
      orderId,
      vendorId,
      pickupAddress,
    })
    return response
  } catch (error) {
    throw error
  }
}

// Find Nearest Vendors API
export const findNearestVendorsAPI = async (lat, lng, pincode, skuIds) => {
  try {
    const response = await axiosInstance.post('/location/vendors/nearest', {
      lat,
      lng,
      pincode,
      skuIds,
    })
    return response
  } catch (error) {
    throw error
  }
}

// Walk-in Order APIs (vendor side)
// Create Walk-in Order API
export const createWalkInOrderAPI = async (orderData) => {
  try {
    const response = await axiosInstance.post('/orders/walk-in-order', orderData)
    return response
  } catch (error) {
    throw error
  }
}

// Get Vendor Orders API
export const getVendorOrdersAPI = async (vendorId, page = 1, limit = 100) => {
  try {
    const response = await axiosInstance.get(`/orders/vendor/${vendorId}`, {
      params: {
        page,
        limit,
      },
    })
    return response
  } catch (error) {
    throw error
  }
}

// Traders API
export const getTradersAPI = async (page = 1, limit = 100) => {
  try {
    const response = await axiosInstance.get('/traders', {
      params: { page, limit },
    })
    return response
  } catch (error) {
    throw error
  }
}

// Website Sections APIs
export const getWebsiteSectionsAPI = async (sectionType, traderId, page = 1, limit = 100) => {
  try {
    const response = await axiosInstance.get('/website-sections', {
      params: {
        sectionType,
        trader: traderId,
        page,
        limit,
      },
    })
    return response
  } catch (error) {
    throw error
  }
}

export const createWebsiteSectionAPI = async (sectionData) => {
  try {
    const response = await axiosInstance.post('/website-sections', sectionData)
    return response
  } catch (error) {
    throw error
  }
}

export const updateWebsiteSectionAPI = async (sectionId, sectionData) => {
  try {
    const response = await axiosInstance.put(`/website-sections/${sectionId}`, sectionData)
    return response
  } catch (error) {
    throw error
  }
}

export const deleteWebsiteSectionAPI = async (sectionId) => {
  try {
    const response = await axiosInstance.delete(`/website-sections/${sectionId}`)
    return response
  } catch (error) {
    throw error
  }
}

// Generate Bill API
export const generateBillAPI = async (orderId, cashAmount) => {
  try {
    const response = await axiosInstance.post('/orders/generate-bill', {
      orderId,
      cashAmount,
    })
    return response
  } catch (error) {
    throw error
  }
}

