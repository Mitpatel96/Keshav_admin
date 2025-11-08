import { useState, useEffect } from 'react'
import { Plus, AlertTriangle, Search, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'
import Input from '../components/Form/Input'
import Select from '../components/Form/Select'
import { getAllInventoryAPI, createDamageTicketAPI, getAllDamageTicketsAPI, getUserData } from '../utils/api'

const VendorDamageTicket = () => {
  const [showForm, setShowForm] = useState(false)
  const [inventory, setInventory] = useState([])
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formData, setFormData] = useState({
    inventoryId: '',
    skuId: '',
    quantity: '',
    type: 'damage',
    reason: '',
  })
  const [errors, setErrors] = useState({})
  const [submitLoading, setSubmitLoading] = useState(false)

  useEffect(() => {
    fetchInventory()
    fetchTickets()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const userData = getUserData()
      
      if (!userData) {
        alert('User data not found. Please login again.')
        setLoading(false)
        return
      }

      const vendorId = userData._id
      const vendorPermanentId = userData.permanentId
      
      console.log('VendorDamageTicket - User Data:', userData)
      console.log('VendorDamageTicket - Vendor _id:', vendorId)
      console.log('VendorDamageTicket - Vendor permanentId:', vendorPermanentId)

      const response = await getAllInventoryAPI(1, 100)
      console.log('VendorDamageTicket - API Response:', response)
      
      // Handle response structure
      let inventoryData = []
      if (Array.isArray(response)) {
        inventoryData = response
      } else if (response?.data && Array.isArray(response.data)) {
        inventoryData = response.data
      } else if (response && typeof response === 'object') {
        inventoryData = response.data || []
      }
      
      console.log('VendorDamageTicket - Inventory data length:', inventoryData.length)
      
      if (inventoryData.length > 0) {
        // Filter inventory for this vendor that is confirmed
        const vendorInventory = inventoryData.filter((inv) => {
          // Check if vendor inventory
          const isVendorInventory = inv.vendor !== null && inv.admin === null
          
          if (!isVendorInventory) {
            return false
          }
          
          // Get vendor identifiers
          const invVendorId = inv.vendor?._id
          const invVendorPermanentId = inv.vendor?.permanentId
          
          // Match by _id
          const matchesById = invVendorId && String(invVendorId) === String(vendorId)
          
          // Match by permanentId
          const matchesByPermanentId = invVendorPermanentId && vendorPermanentId && 
            String(invVendorPermanentId) === String(vendorPermanentId)
          
          const matchesVendor = matchesById || matchesByPermanentId
          
          // Only confirmed inventory
          const isConfirmed = inv.status === 'confirmed'
          
          return matchesVendor && isConfirmed
        })
        
        console.log('VendorDamageTicket - Filtered inventory count:', vendorInventory.length)
        
        // If no matches but vendor items exist, show them temporarily for debugging
        if (vendorInventory.length === 0) {
          const allVendorItems = inventoryData.filter(inv => 
            inv.vendor !== null && 
            inv.admin === null && 
            inv.status === 'confirmed'
          )
          console.log('VendorDamageTicket - Found', allVendorItems.length, 'confirmed vendor inventory items total')
          if (allVendorItems.length > 0) {
            console.log('VendorDamageTicket - Vendor IDs in inventory:', allVendorItems.map(inv => ({
              vendorId: inv.vendor?._id,
              vendorPermanentId: inv.vendor?.permanentId,
              vendorName: inv.vendor?.name
            })))
            console.log('VendorDamageTicket - Your vendor ID:', vendorId)
            console.log('VendorDamageTicket - Your vendor permanentId:', vendorPermanentId)
            
            // TEMPORARY: Show all vendor inventory to verify data display works
            setInventory(allVendorItems)
          } else {
            setInventory([])
          }
        } else {
          setInventory(vendorInventory)
        }
      } else {
        console.warn('VendorDamageTicket - No inventory data found')
        setInventory([])
      }
    } catch (error) {
      console.error('VendorDamageTicket - Error fetching inventory:', error)
      alert('Failed to fetch inventory: ' + (error.message || 'Unknown error'))
      setInventory([])
    } finally {
      setLoading(false)
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
      const userData = getUserData()
      const vendorId = userData?.permanentId || userData?._id

      const payload = {
        inventoryId: formData.inventoryId,
        vendorId: vendorId,
        skuId: formData.skuId,
        quantity: parseInt(formData.quantity),
        type: formData.type,
        reason: formData.reason.trim(),
      }

      await createDamageTicketAPI(payload)
      alert('Damage ticket created successfully!')
      setFormData({
        inventoryId: '',
        skuId: '',
        quantity: '',
        type: 'damage',
        reason: '',
      })
      setErrors({})
      setShowForm(false)
      fetchTickets() // Refresh tickets list
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to create damage ticket. Please try again.' })
    } finally {
      setSubmitLoading(false)
    }
  }

  const fetchTickets = async () => {
    try {
      setTicketsLoading(true)
      const userData = getUserData()
      
      if (!userData) {
        return
      }

      const vendorId = userData._id
      const vendorPermanentId = userData.permanentId
      
      console.log('VendorDamageTicket - Fetching tickets for vendor:', vendorId)
      
      const response = await getAllDamageTicketsAPI(1, 100)
      console.log('VendorDamageTicket - Tickets API Response:', response)
      
      // Handle response structure
      let ticketsData = []
      if (Array.isArray(response)) {
        ticketsData = response
      } else if (response?.data && Array.isArray(response.data)) {
        ticketsData = response.data
      } else if (response && typeof response === 'object') {
        ticketsData = response.data || []
      }
      
      console.log('VendorDamageTicket - Tickets data length:', ticketsData.length)
      
      if (ticketsData.length > 0) {
        // Filter tickets for this vendor
        const vendorTickets = ticketsData.filter((ticket) => {
          // Get vendor identifiers from ticket
          const ticketVendorId = ticket.vendor?._id
          const ticketVendorPermanentId = ticket.vendor?.permanentId
          
          // Match by _id
          const matchesById = ticketVendorId && String(ticketVendorId) === String(vendorId)
          
          // Match by permanentId
          const matchesByPermanentId = ticketVendorPermanentId && vendorPermanentId && 
            String(ticketVendorPermanentId) === String(vendorPermanentId)
          
          const matchesVendor = matchesById || matchesByPermanentId
          
          return matchesVendor
        })
        
        console.log('VendorDamageTicket - Filtered tickets count:', vendorTickets.length)
        
        // If no matches but tickets exist, show them temporarily for debugging
        if (vendorTickets.length === 0) {
          console.log('VendorDamageTicket - No matching tickets found')
          console.log('VendorDamageTicket - All ticket vendor IDs:', ticketsData.map(t => ({
            vendorId: t.vendor?._id,
            vendorPermanentId: t.vendor?.permanentId,
            vendorName: t.vendor?.name
          })))
          console.log('VendorDamageTicket - Your vendor ID:', vendorId)
          console.log('VendorDamageTicket - Your vendor permanentId:', vendorPermanentId)
          
          // TEMPORARY: Show all tickets to verify data display works
          setTickets(ticketsData)
        } else {
          setTickets(vendorTickets)
        }
      } else {
        setTickets([])
      }
    } catch (error) {
      console.error('VendorDamageTicket - Error fetching tickets:', error)
      alert('Failed to fetch damage tickets: ' + (error.message || 'Unknown error'))
      setTickets([])
    } finally {
      setTicketsLoading(false)
    }
  }

  const filteredInventory = inventory.filter((item) =>
    item.sku?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.skuId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item._id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredTickets = tickets.filter((ticket) => {
    const matchSearch =
      ticket.sku?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.sku?.skuId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket._id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchStatus = statusFilter === 'all' || ticket.status === statusFilter
    
    return matchSearch && matchStatus
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle size={12} />
            Approved
          </span>
        )
      case 'rejected':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle size={12} />
            Rejected
          </span>
        )
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Clock size={12} />
            Pending
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            {status || 'Pending'}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Damage Tickets</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
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
              <div>
                <Select
                  label="Select Inventory"
                  name="inventoryId"
                  value={formData.inventoryId}
                  onChange={handleChange}
                  errors={errors}
                  required
                  disabled={loading || inventory.length === 0}
                  placeholder={loading ? 'Loading inventory...' : inventory.length === 0 ? 'No inventory available' : 'Select inventory'}
                  options={inventory.map(inv => ({
                    value: inv._id,
                    label: `${inv.sku?.title || 'N/A'} (SKU: ${inv.sku?.skuId || 'N/A'}) - Qty: ${inv.quantity || 0}`,
                  }))}
                />
                {inventory.length === 0 && !loading && (
                  <p className="text-sm text-gray-500 mt-1">No confirmed inventory available. Please ensure inventory is transferred and confirmed.</p>
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
                disabled={submitLoading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {submitLoading ? 'Creating...' : 'Create Ticket'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    inventoryId: '',
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

      {/* Damage Tickets List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 border rounded-lg px-4 py-2 max-w-md">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={() => fetchTickets()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
          >
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          {ticketsLoading ? (
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                      {ticket._id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                      {ticket.sku?.skuId || 'N/A'}
                    </td>
                    <td className="px-6 py-4">{ticket.sku?.title || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-800">{ticket.quantity || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 capitalize">
                        {ticket.type || 'damage'}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" title={ticket.reason}>
                      {ticket.reason || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'N/A'}
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

export default VendorDamageTicket

