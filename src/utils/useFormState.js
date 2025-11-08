// Helper hook for form state management (replacement for react-hook-form)
import { useState } from 'react'

export const useFormState = (initialValues = {}) => {
  const [formData, setFormData] = useState(initialValues)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target
    
    let newValue = value
    
    if (type === 'checkbox') {
      newValue = checked
    } else if (type === 'file') {
      newValue = files
    } else if (type === 'number') {
      newValue = value === '' ? '' : parseFloat(value)
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const setValue = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const setError = (name, message) => {
    setErrors((prev) => ({
      ...prev,
      [name]: message,
    }))
  }

  const reset = (newValues = initialValues) => {
    setFormData(newValues)
    setErrors({})
  }

  const clearErrors = () => {
    setErrors({})
  }

  return {
    formData,
    errors,
    handleChange,
    setValue,
    setError,
    reset,
    clearErrors,
    setFormData,
    setErrors,
  }
}

