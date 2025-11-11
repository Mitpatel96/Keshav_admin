import { useState } from 'react'
import { Search, Eye, Package, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatCurrency, formatDate } from '../utils/helpers'

const VendorOrders = () => {
  const [orders, setOrders] = useState([
    {
      id: 'ORD001',
      customer: 'John Doe',
      phone: '9876543210',
      items: [
        { name: 'Samsung Galaxy S24 Ultra', quantity: 1, price: 94999 },
      ],
      totalAmount: 94999,
      status: 'Pending',
      paymentStatus: 'Paid',
      orderDate: '2025-11-03',
      deliveryDate: '2025-11-05',
      pickupLocation: 'Satellite Road Point',
    },
    {
      id: 'ORD002',
      customer: 'Jane Smith',
      phone: '9876543211',
      items: [
        { name: 'iPhone 15 Pro Max', quantity: 1, price: 134900 },
        { name: 'AirPods Pro Gen 3', quantity: 1, price: 24999 },
      ],
      totalAmount: 159899,
      status: 'Processing',
      paymentStatus: 'Paid',
      orderDate: '2025-11-02',
      deliveryDate: '2025-11-04',
      pickupLocation: 'Vastrapur Point',
    },
    {
      id: 'ORD003',
      customer: 'Bob Johnson',
      phone: '9876543212',
      items: [
        { name: 'MacBook Air M2', quantity: 1, price: 89999 },
      ],
      totalAmount: 89999,
      status: 'Completed',
      paymentStatus: 'Paid',
      orderDate: '2025-11-01',
      deliveryDate: '2025-11-03',
      pickupLocation: 'Satellite Road Point',
    },
    {
      id: 'ORD004',
      customer: 'Alice Williams',
      phone: '9876543213',
      items: [
        { name: 'Samsung Galaxy S24', quantity: 2, price: 79999 },
      ],
      totalAmount: 159998,
      status: 'Cancelled',
      paymentStatus: 'Refunded',
      orderDate: '2025-10-30',
      deliveryDate: null,
      pickupLocation: 'Maninagar',
    },
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)

  const filteredOrders = orders.filter((order) => {
    const matchSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm)
    const matchStatus = filterStatus === 'all' || order.status.toLowerCase() === filterStatus.toLowerCase()
    return matchSearch && matchStatus
  })

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    )
    alert(`Order ${orderId} status updated to ${newStatus}`)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle size={18} className="text-green-600" />
      case 'Cancelled':
        return <XCircle size={18} className="text-red-600" />
      case 'Processing':
        return <Clock size={18} className="text-yellow-600" />
      default:
        return <Clock size={18} className="text-gray-600" />
    }
  }

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'Pending').length,
    processing: orders.filter((o) => o.status === 'Processing').length,
    completed: orders.filter((o) => o.status === 'Completed').length,
    cancelled: orders.filter((o) => o.status === 'Cancelled').length,
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="text-3xl font-bold text-gray-800">My Orders</h1>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{statusCounts.all}</p>
          <p className="text-xs text-gray-600 mt-1">Total Orders</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4 text-center border border-yellow-200">
          <p className="text-2xl font-bold text-yellow-700">{statusCounts.pending}</p>
          <p className="text-xs text-yellow-600 mt-1">Pending</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 text-center border border-blue-200">
          <p className="text-2xl font-bold text-blue-700">{statusCounts.processing}</p>
          <p className="text-xs text-blue-600 mt-1">Processing</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 text-center border border-green-200">
          <p className="text-2xl font-bold text-green-700">{statusCounts.completed}</p>
          <p className="text-xs text-green-600 mt-1">Completed</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4 text-center border border-red-200">
          <p className="text-2xl font-bold text-red-700">{statusCounts.cancelled}</p>
          <p className="text-xs text-red-600 mt-1">Cancelled</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 border rounded-lg px-4 py-2 w-full">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID, customer name, or phone..."
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
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pickup Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap font-mono">{order.id}</td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium">{order.customer}</p>
                    <p className="text-sm text-gray-500">{order.phone}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    {order.items.map((item, idx) => (
                      <p key={idx}>
                        {item.quantity}x {item.name}
                      </p>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold">
                  {formatCurrency(order.totalAmount)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'Processing'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'Cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      order.paymentStatus === 'Paid'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatDate(order.orderDate)}
                </td>
                <td className="px-6 py-4 text-sm">{order.pickupLocation}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-primary-600 hover:text-primary-700"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    {order.status === 'Pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'Processing')}
                        className="text-green-600 hover:text-green-700 text-xs px-2 py-1 border border-green-300 rounded"
                      >
                        Accept
                      </button>
                    )}
                    {order.status === 'Processing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'Completed')}
                        className="text-blue-600 hover:text-blue-700 text-xs px-2 py-1 border border-blue-300 rounded"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  )
}

// Order Details Modal
const OrderDetailsModal = ({ order, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="page-header mb-4">
          <h2 className="text-2xl font-semibold">Order Details - {order.id}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <span className="text-2xl">×</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Customer Information</h3>
              <p className="text-sm text-gray-600">Name: {order.customer}</p>
              <p className="text-sm text-gray-600">Phone: {order.phone}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Order Information</h3>
              <p className="text-sm text-gray-600">Order Date: {formatDate(order.orderDate)}</p>
              <p className="text-sm text-gray-600">
                Delivery Date: {order.deliveryDate ? formatDate(order.deliveryDate) : 'N/A'}
              </p>
              <p className="text-sm text-gray-600">Pickup Location: {order.pickupLocation}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Items</h3>
            <div className="border rounded-lg p-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
              <div className="flex justify-between pt-2 mt-2 border-t">
                <p className="font-bold">Total Amount</p>
                <p className="font-bold text-green-600">{formatCurrency(order.totalAmount)}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              Status: {order.status}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                order.paymentStatus === 'Paid'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              Payment: {order.paymentStatus}
            </span>
          </div>
        </div>

        <div className="mt-6">
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

export default VendorOrders

