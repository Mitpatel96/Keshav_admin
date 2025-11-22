import { useState, useEffect } from 'react'
import { Clock, Calendar, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { getUserData } from '../utils/api'
import { getWarehouseTimingsAPI, createWarehouseTimingsAPI } from '../utils/api'

const VendorWarehouseTimings = () => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [existingTimings, setExistingTimings] = useState(null)

  const [formData, setFormData] = useState({
    weekStartDate: '',
    selectedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    defaultTiming: {
      startTime: '09:00',
      endTime: '18:00',
      isOpen: true,
    },
  })

  const [dayTimings, setDayTimings] = useState({})

  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
  ]

  useEffect(() => {
    // Set default week start date to today if not set
    if (!formData.weekStartDate) {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      setFormData(prev => ({
        ...prev,
        weekStartDate: `${year}-${month}-${day}`,
      }))
    }
  }, [])

  // Initialize day timings from default timing
  useEffect(() => {
    const initialTimings = {}
    formData.selectedDays.forEach(day => {
      initialTimings[day] = {
        startTime: formData.defaultTiming.startTime,
        endTime: formData.defaultTiming.endTime,
        isOpen: formData.defaultTiming.isOpen,
      }
    })
    setDayTimings(initialTimings)
  }, [formData.defaultTiming, formData.selectedDays])

  // Fetch existing timings when week start date changes
  useEffect(() => {
    if (formData.weekStartDate) {
      fetchExistingTimings()
    }
  }, [formData.weekStartDate])

  const fetchExistingTimings = async () => {
    try {
      setLoading(true)
      setError('')
      const userData = getUserData()
      if (!userData || !userData._id) {
        setError('User data not found. Please login again.')
        setLoading(false)
        return
      }

      const vendorId = userData._id
      const response = await getWarehouseTimingsAPI(vendorId, formData.weekStartDate)

      if (response && response.timings) {
        setExistingTimings(response)
        
        // Populate form with existing timings
        const timingsMap = {}
        response.timings.forEach(timing => {
          timingsMap[timing.day] = {
            startTime: timing.startTime,
            endTime: timing.endTime,
            isOpen: timing.isOpen,
          }
        })
        setDayTimings(timingsMap)
        
        // Update selected days
        const selectedDays = response.timings.map(t => t.day)
        setFormData(prev => ({
          ...prev,
          selectedDays: selectedDays.length > 0 ? selectedDays : prev.selectedDays,
        }))
      } else {
        setExistingTimings(null)
        // Reset to default if no existing timings
        const initialTimings = {}
        formData.selectedDays.forEach(day => {
          initialTimings[day] = {
            startTime: formData.defaultTiming.startTime,
            endTime: formData.defaultTiming.endTime,
            isOpen: formData.defaultTiming.isOpen,
          }
        })
        setDayTimings(initialTimings)
      }
    } catch (error) {
      console.error('Error fetching warehouse timings:', error)
      // If 404 or no data, that's okay - user can create new timings
      if (error.response?.status !== 404) {
        setError(error.response?.data?.message || 'Failed to fetch existing timings')
      }
      setExistingTimings(null)
    } finally {
      setLoading(false)
    }
  }

  const handleWeekStartDateChange = (e) => {
    setFormData(prev => ({
      ...prev,
      weekStartDate: e.target.value,
    }))
  }

  const handleDayToggle = (day) => {
    setFormData(prev => {
      const isSelected = prev.selectedDays.includes(day)
      const newSelectedDays = isSelected
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day]

      // Update day timings
      if (!isSelected) {
        // Add day with default timing
        setDayTimings(prevTimings => ({
          ...prevTimings,
          [day]: {
            startTime: formData.defaultTiming.startTime,
            endTime: formData.defaultTiming.endTime,
            isOpen: formData.defaultTiming.isOpen,
          },
        }))
      } else {
        // Remove day
        setDayTimings(prevTimings => {
          const newTimings = { ...prevTimings }
          delete newTimings[day]
          return newTimings
        })
      }

      return {
        ...prev,
        selectedDays: newSelectedDays,
      }
    })
  }

  const handleDefaultTimingChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      defaultTiming: {
        ...prev.defaultTiming,
        [field]: field === 'isOpen' ? value : value,
      },
    }))

    // Apply to all selected days
    setDayTimings(prev => {
      const updated = { ...prev }
      formData.selectedDays.forEach(day => {
        if (updated[day]) {
          updated[day] = {
            ...updated[day],
            [field]: field === 'isOpen' ? value : value,
          }
        }
      })
      return updated
    })
  }

  const handleDayTimingChange = (day, field, value) => {
    setDayTimings(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: field === 'isOpen' ? value : value,
      },
    }))
  }

  const validateForm = () => {
    if (!formData.weekStartDate) {
      setError('Week start date is required')
      return false
    }

    if (formData.selectedDays.length === 0) {
      setError('Please select at least one day')
      return false
    }

    // Validate timings for selected days
    for (const day of formData.selectedDays) {
      const timing = dayTimings[day]
      if (!timing) {
        setError(`Timing for ${day} is missing`)
        return false
      }

      if (timing.isOpen) {
        if (!timing.startTime || !timing.endTime) {
          setError(`Start time and end time are required for ${day}`)
          return false
        }

        if (timing.startTime >= timing.endTime) {
          setError(`End time must be after start time for ${day}`)
          return false
        }
      }
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) {
      return
    }

    try {
      setSaving(true)
      const userData = getUserData()
      if (!userData || !userData._id) {
        setError('User data not found. Please login again.')
        setSaving(false)
        return
      }

      const vendorId = userData._id

      // Build payload with default timing and selected days
      // Backend will create timings for all selectedDays using defaultTiming
      // If individual timings differ from default, we can send them separately
      const payload = {
        vendorId,
        weekStartDate: formData.weekStartDate,
        selectedDays: formData.selectedDays,
        defaultTiming: formData.defaultTiming,
      }
      
      // Check if any day has different timing than default
      // If so, we might need to send individual timings (if backend supports it)
      // For now, backend uses defaultTiming for all selectedDays

      const response = await createWarehouseTimingsAPI(payload)

      if (response && response.warehouseTiming) {
        setSuccess(response.message || 'Warehouse timings updated successfully!')
        setExistingTimings(response.warehouseTiming)
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccess('')
        }, 5000)
      }
    } catch (error) {
      console.error('Error saving warehouse timings:', error)
      setError(error.response?.data?.message || 'Failed to save warehouse timings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="text-green-600" size={32} />
        <h1 className="text-3xl font-bold text-gray-800">Warehouse Timings</h1>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        {/* Week Start Date */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline mr-2" size={18} />
            Week Start Date
          </label>
          <input
            type="date"
            value={formData.weekStartDate}
            onChange={handleWeekStartDateChange}
            className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
          />
          {loading && (
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Loading existing timings...
            </p>
          )}
        </div>

        {/* Default Timing */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Default Timing (Apply to All Days)</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={formData.defaultTiming.startTime}
                onChange={(e) => handleDefaultTimingChange('startTime', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={formData.defaultTiming.endTime}
                onChange={(e) => handleDefaultTimingChange('endTime', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.defaultTiming.isOpen}
                  onChange={(e) => handleDefaultTimingChange('isOpen', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">Warehouse Open</span>
              </label>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  formData.selectedDays.forEach(day => {
                    handleDayTimingChange(day, 'startTime', formData.defaultTiming.startTime)
                    handleDayTimingChange(day, 'endTime', formData.defaultTiming.endTime)
                    handleDayTimingChange(day, 'isOpen', formData.defaultTiming.isOpen)
                  })
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
              >
                Apply to All Days
              </button>
            </div>
          </div>
        </div>

        {/* Days Selection and Individual Timings */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Select Days and Set Timings</h3>
          <div className="space-y-4">
            {daysOfWeek.map((day) => {
              const isSelected = formData.selectedDays.includes(day.value)
              const timing = dayTimings[day.value] || {}

              return (
                <div
                  key={day.value}
                  className={`p-4 border-2 rounded-lg ${
                    isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleDayToggle(day.value)}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-lg font-semibold text-gray-800">{day.label}</span>
                    </label>
                  </div>

                  {isSelected && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                        <input
                          type="time"
                          value={timing.startTime || ''}
                          onChange={(e) => handleDayTimingChange(day.value, 'startTime', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          disabled={!timing.isOpen}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                        <input
                          type="time"
                          value={timing.endTime || ''}
                          onChange={(e) => handleDayTimingChange(day.value, 'endTime', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          disabled={!timing.isOpen}
                        />
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={timing.isOpen || false}
                            onChange={(e) => handleDayTimingChange(day.value, 'isOpen', e.target.checked)}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Open</span>
                        </label>
                      </div>
                      {!timing.isOpen && (
                        <div className="flex items-center text-sm text-gray-500">
                          Warehouse Closed
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4 border-t">
          <button
            type="submit"
            disabled={saving || loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                Save Warehouse Timings
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setError('')
              setSuccess('')
              if (formData.weekStartDate) {
                fetchExistingTimings()
              }
            }}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            disabled={loading || saving}
          >
            Reset
          </button>
        </div>
      </form>

      {/* Existing Timings Info */}
      {existingTimings && !loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> You are updating existing timings for the week starting{' '}
            {new Date(existingTimings.weekStartDate).toLocaleDateString()}. 
            {existingTimings.isLocked && (
              <span className="text-orange-600 font-semibold"> (Locked - cannot be modified)</span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}

export default VendorWarehouseTimings

