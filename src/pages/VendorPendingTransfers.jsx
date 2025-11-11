import { useState, useEffect } from 'react'
import { Search, Package, Loader2, Eye, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatCurrency } from '../utils/helpers'
import { getPendingTransfersAPI, respondToPendingTransferAPI } from '../utils/api'

const VendorPendingTransfers = () => {
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionLoading, setActionLoading] = useState({})
  const [selectedTransfer, setSelectedTransfer] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingTransferId, setRejectingTransferId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  })

  useEffect(() => {
    fetchPendingTransfers(1)
  }, [])

  const fetchPendingTransfers = async (page = 1) => {
    try {
      setLoading(true)
      const response = await getPendingTransfersAPI(page, 100)
      
      let transfersData = []
      let paginationData = null
      
      if (Array.isArray(response)) {
        transfersData = response
      } else if (response?.data && Array.isArray(response.data)) {
        transfersData = response.data
        paginationData = response.pagination
      } else if (response && typeof response === 'object') {
        transfersData = response.data || []
        paginationData = response.pagination
      }
      
      setTransfers(transfersData)
      if (paginationData) {
        setPagination({
          currentPage: paginationData.currentPage || page,
          totalPages: paginationData.totalPages || 1,
          totalCount: paginationData.totalCount || transfersData.length,
        })
      }
    } catch (error) {
      console.error('Error fetching pending transfers:', error)
      alert('Failed to fetch pending transfers: ' + (error.message || 'Unknown error'))
      setTransfers([])
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (transferId) => {
    try {
      setActionLoading(prev => ({ ...prev, [transferId]: true }))
      const response = await respondToPendingTransferAPI(transferId, 'accept')
      alert(response?.message || 'Transfer accepted successfully!')
      fetchPendingTransfers(pagination.currentPage)
      setSelectedTransfer(null)
    } catch (error) {
      alert(error.message || 'Failed to accept transfer')
    } finally {
      setActionLoading(prev => ({ ...prev, [transferId]: false }))
    }
  }

  const handleRejectClick = (transferId) => {
    setRejectingTransferId(transferId)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  const handleRejectConfirm = async () => {
    if (!rejectingTransferId) return

    try {
      setActionLoading(prev => ({ ...prev, [rejectingTransferId]: true }))
      const response = await respondToPendingTransferAPI(
        rejectingTransferId,
        'reject',
        rejectionReason || undefined
      )
      alert(response?.message || 'Transfer rejected successfully!')
      fetchPendingTransfers(pagination.currentPage)
      setSelectedTransfer(null)
      setShowRejectModal(false)
      setRejectingTransferId(null)
      setRejectionReason('')
    } catch (error) {
      alert(error.message || 'Failed to reject transfer')
    } finally {
      setActionLoading(prev => ({ ...prev, [rejectingTransferId]: false }))
    }
  }

  const handleViewDetails = (transfer) => {
    setSelectedTransfer(transfer)
  }

  const filteredTransfers = transfers.filter((transfer) =>
    transfer.sku?.skuId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.sku?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.sku?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer._id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Clock size={12} />
            Pending
          </span>
        )
      case 'accepted':
      case 'confirmed':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle size={12} />
            Accepted
          </span>
        )
      case 'rejected':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle size={12} />
            Rejected
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            {status || 'Unknown'}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Delivery Confirmation</h1>
          <p className="text-gray-600 mt-1">Review and approve inventory transfers from admin</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="page-header">
            <div>
              <p className="text-sm text-gray-600">Total Pending</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {transfers.filter(t => t.status === 'pending').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock size={24} className="text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="page-header">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {transfers.reduce((sum, t) => sum + (t.quantity || 0), 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Package size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="page-header">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {formatCurrency(
                  transfers.reduce(
                    (sum, t) => sum + (t.quantity || 0) * (t.sku?.mrp || 0),
                    0
                  )
                )}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Package size={24} className="text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-2 border rounded-lg px-4 py-2 w-full">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by SKU ID, title, or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="text-green-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading pending transfers...</span>
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {transfers.length === 0 ? 'No pending transfers found' : 'No transfers match your search'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transfer ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MRP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transferred At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransfers.map((transfer) => {
                  const totalValue = (transfer.quantity || 0) * (transfer.sku?.mrp || 0)
                  return (
                    <tr key={transfer._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                        {transfer._id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                        {transfer.sku?.skuId || 'N/A'}
                      </td>
                      <td className="px-6 py-4">{transfer.sku?.title || 'N/A'}</td>
                      <td className="px-6 py-4">{transfer.sku?.brand || 'N/A'}</td>
                      <td className="px-6 py-4">₹{(transfer.sku?.mrp || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 font-semibold">{transfer.quantity || 0}</td>
                      <td className="px-6 py-4 font-semibold">{formatCurrency(totalValue)}</td>
                      <td className="px-6 py-4">{getStatusBadge(transfer.status)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {transfer.transferredAt
                          ? new Date(transfer.transferredAt).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(transfer)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <Eye size={16} />
                            View
                          </button>
                          {transfer.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAccept(transfer._id)}
                                disabled={actionLoading[transfer._id]}
                                className="px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading[transfer._id] ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <CheckCircle size={16} />
                                )}
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectClick(transfer._id)}
                                disabled={actionLoading[transfer._id]}
                                className="px-2 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading[transfer._id] ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <XCircle size={14} />
                                )}
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 page-header border-t">
            <div className="text-sm text-gray-700">
              Showing page {pagination.currentPage} of {pagination.totalPages} (
              {pagination.totalCount} total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchPendingTransfers(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              <button
                onClick={() => fetchPendingTransfers(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {selectedTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="page-header p-6 border-b">
              <h2 className="text-xl font-semibold">Transfer Details</h2>
              <button
                onClick={() => setSelectedTransfer(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Transfer ID</label>
                  <p className="text-sm text-gray-800 font-mono">{selectedTransfer._id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedTransfer.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">SKU ID</label>
                  <p className="text-sm text-gray-800 font-mono">
                    {selectedTransfer.sku?.skuId || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Product Title</label>
                  <p className="text-sm text-gray-800">{selectedTransfer.sku?.title || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Brand</label>
                  <p className="text-sm text-gray-800">{selectedTransfer.sku?.brand || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">MRP</label>
                  <p className="text-sm text-gray-800">
                    ₹{(selectedTransfer.sku?.mrp || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Quantity</label>
                  <p className="text-sm text-gray-800 font-semibold">
                    {selectedTransfer.quantity || 0} units
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Value</label>
                  <p className="text-sm text-gray-800 font-semibold">
                    {formatCurrency(
                      (selectedTransfer.quantity || 0) * (selectedTransfer.sku?.mrp || 0)
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Admin</label>
                  <p className="text-sm text-gray-800">
                    {selectedTransfer.admin?.name || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedTransfer.admin?.email || ''}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Transferred At</label>
                  <p className="text-sm text-gray-800">
                    {selectedTransfer.transferredAt
                      ? new Date(selectedTransfer.transferredAt).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {selectedTransfer.sku?.images && selectedTransfer.sku.images.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Product Images</label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    {selectedTransfer.sku.images.map((img, idx) => (
                      img && (
                        <img
                          key={idx}
                          src={img}
                          alt={`${selectedTransfer.sku.title} ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150'
                          }}
                        />
                      )
                    ))}
                  </div>
                </div>
              )}

              {selectedTransfer.status === 'pending' && (
                <div className="flex gap-4 pt-4 border-t">
                  <button
                    onClick={() => handleAccept(selectedTransfer._id)}
                    disabled={actionLoading[selectedTransfer._id]}
                    className="flex-[1.2] px-6 py-3 text-base font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading[selectedTransfer._id] ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Accept Transfer
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectModal(true)
                      setRejectingTransferId(selectedTransfer._id)
                      setRejectionReason('')
                    }}
                    disabled={actionLoading[selectedTransfer._id]}
                    className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              )}

              {selectedTransfer.rejectionReason && (
                <div className="pt-4 border-t">
                  <label className="text-sm font-medium text-gray-600">Rejection Reason</label>
                  <p className="text-sm text-gray-800 mt-1">{selectedTransfer.rejectionReason}</p>
                </div>
              )}

              {selectedTransfer.respondedAt && (
                <div className="pt-2">
                  <label className="text-sm font-medium text-gray-600">Responded At</label>
                  <p className="text-sm text-gray-800 mt-1">
                    {new Date(selectedTransfer.respondedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="page-header p-6 border-b">
              <h2 className="text-xl font-semibold">Reject Transfer</h2>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectingTransferId(null)
                  setRejectionReason('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (Optional)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleRejectConfirm}
                  disabled={actionLoading[rejectingTransferId]}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading[rejectingTransferId] ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <XCircle size={16} />
                      Confirm Reject
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectingTransferId(null)
                    setRejectionReason('')
                  }}
                  disabled={actionLoading[rejectingTransferId]}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorPendingTransfers

