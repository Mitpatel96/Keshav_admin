import { useState } from 'react'
import { Search, CheckCircle, XCircle, Loader2, User, Phone, Mail, MapPin, Package, CreditCard, Calendar } from 'lucide-react'
import Input from '../components/Form/Input'
import { verifyOrderVFCAPI, confirmComboOrderAPI } from '../utils/api'
import { formatCurrency, formatDate } from '../utils/helpers'

const VendorOrderConfirmation = () => {
  const [orderVFC, setOrderVFC] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!orderVFC.trim()) {
      setError('Please enter order VFC code')
      return
    }

    try {
      setLoading(true)
      setError('')
      setOrder(null)
      const response = await verifyOrderVFCAPI(orderVFC.trim().toUpperCase())
      if (response?.order) {
        setOrder(response.order)
      } else {
        setError('Invalid order code or order not found')
      }
    } catch (err) {
      setError(err.message || 'Failed to verify order. Please check the code and try again.')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!order) return

    try {
      setConfirming(true)
      await confirmComboOrderAPI(order._id, 'confirmed')
      alert('Order confirmed successfully!')
      // Reset form after confirmation
      setOrder(null)
      setOrderVFC('')
      setError('')
    } catch (err) {
      alert(err.message || 'Failed to confirm order. Please try again.')
    } finally {
      setConfirming(false)
    }
  }

  const handleReject = async () => {
    if (!order) return

    if (!confirm('Are you sure you want to reject this order?')) {
      return
    }

    try {
      setRejecting(true)
      await confirmComboOrderAPI(order._id, 'partially_rejected')
      alert('Order rejected successfully!')
      // Reset form after rejection
      setOrder(null)
      setOrderVFC('')
      setError('')
    } catch (err) {
      alert(err.message || 'Failed to reject order. Please try again.')
    } finally {
      setRejecting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Confirm Order</h1>
      </div>

      {/* Verify Order Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Enter Order VFC Code</h2>
        <form onSubmit={handleVerify} className="flex gap-4">
          <div className="flex-1">
            <Input
              label="Order VFC Code"
              name="orderVFC"
              value={orderVFC}
              onChange={(e) => {
                setOrderVFC(e.target.value.toUpperCase())
                setError('')
                setOrder(null)
              }}
              placeholder="Enter order VFC code (e.g., W3VNRE)"
              required
              disabled={loading}
            />
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading || !orderVFC.trim()}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Verify Order
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Order Details */}
      {order && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Order Details</h2>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-xs rounded-full ${
                order.status === 'confirmed' 
                  ? 'bg-green-100 text-green-800' 
                  : order.status === 'pending_verification'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {order.status === 'pending_verification' ? 'Pending Verification' : order.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <User size={20} />
                Customer Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="text-gray-600">{order.user?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-gray-500" />
                  <span className="text-gray-600">{order.user?.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-500" />
                  <span className="text-gray-600">{order.user?.email || 'N/A'}</span>
                </div>
                {order.user?.address && order.user.address.length > 0 && (
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-gray-500 mt-1" />
                    <div className="text-gray-600">
                      {order.user.address.map((addr, idx) => (
                        <div key={idx}>{addr}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Package size={20} />
                Order Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Order Code:</span>
                  <span className="text-gray-600 font-mono">{order.orderCode || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Order VFC:</span>
                  <span className="text-gray-600 font-mono">{order.orderVFC || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-500" />
                  <span className="text-gray-600">
                    {order.createdAt ? formatDate(order.createdAt) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-gray-500" />
                  <span className="text-gray-600 capitalize">{order.paymentMethod || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Order Type:</span>
                  <span className="text-gray-600 capitalize">{order.orderType || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package size={20} />
              Order Items
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-mono text-sm">
                          {item.sku || 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          {item.skuName || 'N/A'}
                        </td>
                        <td className="px-4 py-3">{item.quantity || 0}</td>
                        <td className="px-4 py-3">
                          {item.price ? formatCurrency(item.price) : 'N/A'}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {item.quantity && item.price 
                            ? formatCurrency(item.quantity * item.price) 
                            : 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="4" className="px-4 py-3 text-right font-semibold text-gray-700">
                      Total Amount:
                    </td>
                    <td className="px-4 py-3 font-bold text-lg text-green-600">
                      {order.totalAmount ? formatCurrency(order.totalAmount) : 'N/A'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          {order.status === 'pending_verification' && (
            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <button
                onClick={handleReject}
                disabled={rejecting || confirming}
                className="px-6 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                {rejecting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle size={16} />
                    Reject
                  </>
                )}
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming || rejecting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {confirming ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Confirm Order
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default VendorOrderConfirmation

