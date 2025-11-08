import { useState, useEffect } from 'react'
import { Search, Loader2, Package, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { getInventoryHistoryAPI } from '../utils/api'

const InventoryHistory = () => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const response = await getInventoryHistoryAPI(1, 100)
      if (response?.data) {
        setHistory(response.data)
      }
    } catch (error) {
      console.error('Error fetching inventory history:', error)
      alert('Failed to fetch inventory history')
    } finally {
      setLoading(false)
    }
  }

  const getTypeLabel = (type) => {
    const labels = {
      'transfer_to_vendor': 'Transfer to Vendor',
      'deduct_damage': 'Damage Deduction',
      'deduct_from_order': 'Order Sale',
    }
    return labels[type] || type
  }

  const getTypeIcon = (type) => {
    if (type === 'transfer_to_vendor') return <TrendingDown className="text-blue-500" size={16} />
    if (type === 'deduct_damage') return <Package className="text-red-500" size={16} />
    if (type === 'deduct_from_order') return <TrendingUp className="text-green-500" size={16} />
    return <Package className="text-gray-500" size={16} />
  }

  const filteredHistory = history.filter((item) => {
    const matchSearch =
      item.sku?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.skuId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item._id?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchType = typeFilter === 'all' || item.type === typeFilter
    return matchSearch && matchType
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Inventory History</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 border rounded-lg px-4 py-2 max-w-md flex-1">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by SKU, reason, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg outline-none"
          >
            <option value="all">All Types</option>
            <option value="transfer_to_vendor">Transfer to Vendor</option>
            <option value="deduct_damage">Damage Deduction</option>
            <option value="deduct_from_order">Order Sale</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="text-primary-600 animate-spin" />
              <span className="ml-3 text-gray-600">Loading history...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {history.length === 0 ? 'No inventory history found' : 'No items match your search'}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">History ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredHistory.map((item) => (
                  <tr key={item._id}>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                      {item._id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{item.sku?.title || 'N/A'}</p>
                        <p className="text-xs text-gray-500 font-mono">{item.sku?.skuId || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="text-sm">{getTypeLabel(item.type)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-800">{item.quantity || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      {item.fromAdmin ? (
                        <span className="text-sm">Admin: {item.fromAdmin.name || 'N/A'}</span>
                      ) : item.fromVendor ? (
                        <span className="text-sm">Vendor: {item.fromVendor.name || 'N/A'}</span>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.toVendor ? (
                        <span className="text-sm">Vendor: {item.toVendor.name || 'N/A'}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" title={item.reason}>
                      {item.reason || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default InventoryHistory

