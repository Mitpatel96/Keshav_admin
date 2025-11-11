import { useState, useEffect } from 'react'
import { Plus, Check, X, Search, Loader2, AlertTriangle, Filter } from 'lucide-react'
import Input from '../components/Form/Input'
import Select from '../components/Form/Select'
import { getAllDamageTicketsAPI, createDamageTicketAPI, approveDamageTicketAPI, rejectDamageTicketAPI, getAllInventoryAPI, getAllVendorsAPI } from '../utils/api'

const DamageTickets = () => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [inventory, setInventory] = useState([])
  const [vendors, setVendors] = useState([])
  const [inventoryLoading, setInventoryLoading] = useState(true)
  const [vendorsLoading, setVendorsLoading] = useState(true)
  const [formData, setFormData] = useState({
    inventoryId: '',
    vendorId: '',
    skuId: '',
    quantity: '',
    type: 'damage',
    reason: '',
  })
  const [errors, setErrors] = useState({})
  const [submitLoading, setSubmitLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    fetchTickets()
    fetchInventory()
    fetchVendors()
  }, [])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await getAllDamageTicketsAPI(1, 100)
      if (response?.data) {
        setTickets(response.data)
      }
    } catch (error) {
      console.error('Error fetching damage tickets:', error)
      alert('Failed to fetch damage tickets')
    } finally {
      setLoading(false)
    }
  }

  const fetchInventory = async () => {
    try {
      setInventoryLoading(true)
      const response = await getAllInventoryAPI(1, 100)
      if (response?.data) {
        setInventory(response.data)
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setInventoryLoading(false)
    }
  }

  const fetchVendors = async () => {
    try {
      setVendorsLoading(true)
      const response = await getAllVendorsAPI(1, 100)
      if (response?.data) {
        setVendors(response.data)
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
    } finally {
      setVendorsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    // If inventory is selected, update skuId
    if (name === 'inventoryId') {
      const selectedInventory = inventory.find(inv => inv._id === value)
      if (selectedInventory) {
        setFormData((prev) => ({ ...prev, skuId: selectedInventory.sku?._id || selectedInventory.sku || '' }))
      }
    }
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.inventoryId) {
      newErrors.inventoryId = 'Please select inventory'
    }
    if (!formData.vendorId) {
      newErrors.vendorId = 'Please select vendor'
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = 'Please enter a valid quantity'
    }
    const selectedInventory = inventory.find(inv => inv._id === formData.inventoryId)
    if (selectedInventory && parseInt(formData.quantity) > selectedInventory.quantity) {
      newErrors.quantity = `Quantity cannot exceed available stock (${selectedInventory.quantity})`
    }
    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setSubmitLoading(true)
      const payload = {
        inventoryId: formData.inventoryId,
        vendorId: formData.vendorId,
        skuId: formData.skuId,
        quantity: parseInt(formData.quantity),
        type: formData.type,
        reason: formData.reason.trim(),
      }

      await createDamageTicketAPI(payload)
      alert('Damage ticket created successfully!')
      setFormData({
        inventoryId: '',
        vendorId: '',
        skuId: '',
        quantity: '',
        type: 'damage',
        reason: '',
      })
      setErrors({})
      setShowForm(false)
      fetchTickets()
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to create damage ticket. Please try again.' })
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleApprove = async (ticketId) => {
    try {
      setActionLoading(prev => ({ ...prev, [ticketId]: true }))
      await approveDamageTicketAPI(ticketId)
      alert('Ticket approved successfully!')
      fetchTickets()
    } catch (error) {
      alert(error.message || 'Failed to approve ticket')
    } finally {
      setActionLoading(prev => ({ ...prev, [ticketId]: false }))
    }
  }

  const handleReject = async (ticketId) => {
    try {
      setActionLoading(prev => ({ ...prev, [ticketId]: true }))
      await rejectDamageTicketAPI(ticketId)
      alert('Ticket rejected successfully!')
      fetchTickets()
    } catch (error) {
      alert(error.message || 'Failed to reject ticket')
    } finally {
      setActionLoading(prev => ({ ...prev, [ticketId]: false }))
    }
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchSearch =
      ticket.sku?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.sku?.skuId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket._id?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === 'all' || ticket.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="text-3xl font-bold text-gray-800">Damage Tickets</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="responsive-button px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus size={20} />
          Create Damage Ticket
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-6">Create Damage Ticket</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {errors.submit}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Select Vendor"
                name="vendorId"
                value={formData.vendorId}
                onChange={handleChange}
                errors={errors}
                required
                disabled={vendorsLoading}
                options={vendors.map(v => ({
                  value: v._id || v.vendorId,
                  label: `${v.name} (${v.vendorId || v.permanentId || ''})`,
                }))}
              />
              <Select
                label="Select Inventory"
                name="inventoryId"
                value={formData.inventoryId}
                onChange={handleChange}
                errors={errors}
                required
                disabled={inventoryLoading}
                options={inventory.map(inv => ({
                  value: inv._id,
                  label: `${inv.sku?.title || 'N/A'} (SKU: ${inv.sku?.skuId || 'N/A'}) - Qty: ${inv.quantity}`,
                }))}
              />
              <Input
                label="Quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                errors={errors}
                required
                min={1}
                placeholder="Enter damaged quantity"
              />
              <Select
                label="Type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                errors={errors}
                required
                options={[
                  { value: 'damage', label: 'Damage' },
                  { value: 'lost', label: 'Lost' },
                ]}
              />
            </div>

            <div>
              <Input
                label="Reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                errors={errors}
                required
                placeholder="Enter reason for damage/loss"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitLoading || inventoryLoading || vendorsLoading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {submitLoading ? 'Creating...' : 'Create Ticket'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    inventoryId: '',
                    vendorId: '',
                    skuId: '',
                    quantity: '',
                    type: 'damage',
                    reason: '',
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
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b page-header gap-4">
          <div className="flex items-center gap-2 border rounded-lg px-4 py-2 w-full max-w-md flex-1">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by SKU, vendor, ticket ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none"
            />
          </div>
          <Select
            name="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
            className="w-48"
          />
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="text-primary-600 animate-spin" />
              <span className="ml-3 text-gray-600">Loading tickets...</span>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {tickets.length === 0 ? 'No damage tickets found' : 'No tickets match your search'}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket._id}>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                      {ticket._id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{ticket.sku?.title || 'N/A'}</p>
                        <p className="text-xs text-gray-500 font-mono">{ticket.sku?.skuId || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {ticket.vendor?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold">{ticket.quantity || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        {ticket.type || 'damage'}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" title={ticket.reason}>
                      {ticket.reason || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          ticket.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : ticket.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {ticket.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {ticket.createdAt
                        ? new Date(ticket.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ticket.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(ticket._id)}
                            disabled={actionLoading[ticket._id]}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                            title="Approve"
                          >
                            {actionLoading[ticket._id] ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Check size={14} />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(ticket._id)}
                            disabled={actionLoading[ticket._id]}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                            title="Reject"
                          >
                            {actionLoading[ticket._id] ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <X size={14} />
                            )}
                            Reject
                          </button>
                        </div>
                      )}
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

export default DamageTickets

