import { useState, useEffect } from 'react'
import { Plus, ShoppingCart, Receipt, Printer, Loader2, User, Phone, Calendar, Package, Search, X, CheckCircle } from 'lucide-react'
import Input from '../components/Form/Input'
import Select from '../components/Form/Select'
import { createWalkInOrderAPI, getVendorOrdersAPI, generateBillAPI, getAllProductsAPI, getUserData } from '../utils/api'
import { formatCurrency, formatDate } from '../utils/helpers'

const VendorWalkInOrder = () => {
  const [showForm, setShowForm] = useState(false)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showBillModal, setShowBillModal] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dob: '',
    productId: '',
    quantity: 1,
  })
  const [errors, setErrors] = useState({})

  const userData = getUserData()
  const vendorId = userData?._id

  useEffect(() => {
    if (vendorId) {
      fetchOrders()
      fetchProducts()
    }
  }, [vendorId])

  const fetchOrders = async () => {
    if (!vendorId) return
    try {
      setLoading(true)
      const response = await getVendorOrdersAPI(vendorId, 1, 100)
      
      let ordersData = []
      if (Array.isArray(response)) {
        ordersData = response
      } else if (response?.data && Array.isArray(response.data)) {
        ordersData = response.data
      } else if (response && typeof response === 'object') {
        ordersData = response.data || []
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

  const fetchProducts = async () => {
    try {
      setProductsLoading(true)
      const response = await getAllProductsAPI(1, 100)
      
      let productsData = []
      if (Array.isArray(response)) {
        productsData = response
      } else if (response?.data && Array.isArray(response.data)) {
        productsData = response.data
      } else if (response && typeof response === 'object') {
        productsData = response.data || []
      }
      
      setProducts(productsData)
    } catch (error) {
      console.error('Error fetching products:', error)
      alert('Failed to fetch products: ' + (error.message || 'Unknown error'))
      setProducts([])
    } finally {
      setProductsLoading(false)
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
      newErrors.name = 'Customer name is required'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number'
    }
    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required'
    }
    if (!formData.productId) {
      newErrors.productId = 'Please select a product'
    }
    if (!formData.quantity || parseInt(formData.quantity) < 1) {
      newErrors.quantity = 'Quantity must be at least 1'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setSubmitting(true)
      
      // Format DOB to ISO string
      const dobDate = new Date(formData.dob)
      const dobISO = dobDate.toISOString()

      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        dob: dobISO,
        vendorId: vendorId,
        productId: formData.productId,
        quantity: parseInt(formData.quantity),
      }

      const response = await createWalkInOrderAPI(payload)
      
      if (response?.order) {
        alert('Walk-in order created successfully!')
        setFormData({
          name: '',
          phone: '',
          dob: '',
          productId: '',
          quantity: 1,
        })
        setErrors({})
        setShowForm(false)
        fetchOrders()
      }
    } catch (error) {
      alert('Failed to create order: ' + (error.message || 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleGenerateBill = async (order) => {
    const cashAmount = prompt(`Enter cash amount received for Order ${order.orderCode}:\nTotal Amount: ${formatCurrency(order.totalAmount)}`)
    
    if (!cashAmount) return
    
    const amount = parseFloat(cashAmount)
    if (isNaN(amount) || amount < order.totalAmount) {
      alert(`Cash amount must be at least ${formatCurrency(order.totalAmount)}`)
      return
    }

    try {
      const response = await generateBillAPI(order._id, amount)
      if (response?.order && response?.cashEntry) {
        setShowBillModal(response)
        fetchOrders()
      }
    } catch (error) {
      alert('Failed to generate bill: ' + (error.message || 'Unknown error'))
    }
  }

  const handlePrintBill = () => {
    const printContent = document.getElementById('bill-content')
    const originalContents = document.body.innerHTML
    const printWindow = window.open('', '_blank')
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill - ${showBillModal?.order?.orderCode || 'Invoice'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bg-gray-50 { background-color: #f9fafb; }
            .font-bold { font-weight: bold; }
            .text-lg { font-size: 1.125rem; }
            .text-green-600 { color: #059669; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const filteredOrders = orders.filter((order) => {
    const matchSearch =
      order.orderCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.phone?.includes(searchTerm) ||
      order.orderType?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchSearch
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Confirmed</span>
      case 'pending_verification':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Walk-in Orders</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus size={20} />
          New Walk-in Order
        </button>
      </div>

      {/* Create Order Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Create Walk-in Order</h2>
            <button
              onClick={() => {
                setShowForm(false)
                setFormData({
                  name: '',
                  phone: '',
                  dob: '',
                  productId: '',
                  quantity: 1,
                })
                setErrors({})
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Customer Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                errors={errors}
                required
                placeholder="Enter customer name"
              />
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                errors={errors}
                required
                placeholder="Enter 10-digit phone number"
              />
              <Input
                label="Date of Birth"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
                errors={errors}
                required
              />
              <div>
                <Select
                  label="Select Product"
                  name="productId"
                  value={formData.productId}
                  onChange={handleChange}
                  errors={errors}
                  required
                  disabled={productsLoading}
                  placeholder={productsLoading ? 'Loading products...' : 'Select a product'}
                  options={products.map(product => ({
                    value: product._id,
                    label: `${product.title || 'N/A'} ${product.price ? `- ${formatCurrency(product.price)}` : ''}`,
                  }))}
                />
                {products.length === 0 && !productsLoading && (
                  <p className="text-sm text-gray-500 mt-1">No products available</p>
                )}
              </div>
              <Input
                label="Quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                errors={errors}
                required
                min={1}
                placeholder="Enter quantity"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} />
                    Create Order
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setFormData({
                    name: '',
                    phone: '',
                    dob: '',
                    productId: '',
                    quantity: 1,
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
      )}

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 border rounded-lg px-4 py-2 max-w-md">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none"
            />
          </div>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm flex items-center gap-2"
          >
            <Loader2 size={16} />
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="text-primary-600 animate-spin" />
              <span className="ml-3 text-gray-600">Loading orders...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {orders.length === 0 ? 'No walk-in orders found' : 'No orders match your search'}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                      {order.orderCode || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{order.user?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-500">{order.user?.phone || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {order.items?.map((item, idx) => (
                          <p key={idx} className="text-xs">
                            {typeof item.sku === 'object' ? item.sku?.title : item.skuName || 'N/A'} (Qty: {item.quantity || 0})
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {order.totalAmount ? formatCurrency(order.totalAmount) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 capitalize">
                      {order.paymentMethod || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.createdAt ? formatDate(order.createdAt) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.status === 'pending_verification' && (
                        <button
                          onClick={() => handleGenerateBill(order)}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-1"
                        >
                          <Receipt size={14} />
                          Generate Bill
                        </button>
                      )}
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => {
                            // Find order with bill data
                            const orderWithBill = orders.find(o => o._id === order._id)
                            if (orderWithBill) {
                              setShowBillModal({ order: orderWithBill })
                            }
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
                        >
                          <Receipt size={14} />
                          View Bill
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Bill Modal */}
      {showBillModal && (
        <BillModal
          billData={showBillModal}
          onClose={() => setShowBillModal(null)}
          onPrint={handlePrintBill}
        />
      )}
    </div>
  )
}

// Bill Modal Component
const BillModal = ({ billData, onClose, onPrint }) => {
  const order = billData.order
  const cashEntry = billData.cashEntry

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Bill Content - Print Friendly */}
        <div id="bill-content" className="p-8">
          {/* Header */}
          <div className="text-center border-b pb-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">INVOICE</h1>
            <p className="text-gray-600">Walk-in Order Receipt</p>
          </div>

          {/* Vendor Info */}
          {order.vendor && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Vendor Details</h3>
              <p className="text-sm text-gray-600"><strong>Name:</strong> {order.vendor.name || 'N/A'}</p>
              <p className="text-sm text-gray-600"><strong>ID:</strong> {order.vendor.vendorId || order.vendor.permanentId || 'N/A'}</p>
              {order.vendor.address && order.vendor.address.length > 0 && (
                <p className="text-sm text-gray-600"><strong>Address:</strong> {order.vendor.address[0]}</p>
              )}
              <p className="text-sm text-gray-600"><strong>Phone:</strong> {order.vendor.phone || 'N/A'}</p>
            </div>
          )}

          {/* Order Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Order Information</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Order Code:</strong> {order.orderCode || 'N/A'}</p>
                <p><strong>Order Type:</strong> {order.orderType || 'N/A'}</p>
                <p><strong>Date:</strong> {order.createdAt ? formatDate(order.createdAt) : 'N/A'}</p>
                <p><strong>Status:</strong> 
                  <span className="ml-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    {order.status || 'N/A'}
                  </span>
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Customer Information</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Name:</strong> {order.user?.name || 'N/A'}</p>
                <p><strong>Phone:</strong> {order.user?.phone || 'N/A'}</p>
                {order.user?.dob && (
                  <p><strong>DOB:</strong> {formatDate(order.user.dob)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Order Items</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Item</th>
                  <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold">Quantity</th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Unit Price</th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      {typeof item.sku === 'object' ? item.sku?.title : item.skuName || 'N/A'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                      {item.quantity || 0}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right text-sm">
                      {item.price ? formatCurrency(item.price) : 'N/A'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">
                      {item.quantity && item.price 
                        ? formatCurrency(item.quantity * item.price) 
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="3" className="border border-gray-300 px-4 py-3 text-right font-bold text-lg">
                    Total Amount:
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-bold text-lg text-green-600">
                    {order.totalAmount ? formatCurrency(order.totalAmount) : 'N/A'}
                  </td>
                </tr>
                {cashEntry && (
                  <>
                    <tr>
                      <td colSpan="3" className="border border-gray-300 px-4 py-2 text-right">
                        Cash Received:
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                        {formatCurrency(cashEntry.cashAmount)}
                      </td>
                    </tr>
                    {cashEntry.cashAmount > order.totalAmount && (
                      <tr>
                        <td colSpan="3" className="border border-gray-300 px-4 py-2 text-right">
                          Change:
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right font-semibold text-green-600">
                          {formatCurrency(cashEntry.cashAmount - order.totalAmount)}
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tfoot>
            </table>
          </div>

          {/* Payment Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600"><strong>Payment Method:</strong> {order.paymentMethod || 'Cash'}</p>
            {cashEntry && (
              <p className="text-sm text-gray-600 mt-1">
                <strong>Bill Generated:</strong> {cashEntry.billGeneratedAt ? formatDate(cashEntry.billGeneratedAt) : 'N/A'}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500 border-t pt-4">
            <p>Thank you for your purchase!</p>
            <p className="mt-1">For any queries, please contact the vendor.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t flex gap-4 print:hidden">
          <button
            onClick={onPrint}
            className="flex-1 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2"
          >
            <Printer size={18} />
            Print Bill
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
  )
}

export default VendorWalkInOrder

