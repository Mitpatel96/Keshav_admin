// Form validation utilities

export const validateField = (name, value, rules = {}) => {
  const errors = {}

  // Required validation
  if (rules.required && (!value || value.toString().trim() === '')) {
    errors[name] = rules.requiredMessage || `${name} is required`
    return errors
  }

  // If field is empty and not required, return no error
  if (!value || value.toString().trim() === '') {
    return {}
  }

  // Min length validation
  if (rules.minLength && value.toString().length < rules.minLength) {
    errors[name] = rules.minLengthMessage || `Minimum ${rules.minLength} characters required`
    return errors
  }

  // Max length validation
  if (rules.maxLength && value.toString().length > rules.maxLength) {
    errors[name] = rules.maxLengthMessage || `Maximum ${rules.maxLength} characters allowed`
    return errors
  }

  // Min value validation
  if (rules.min !== undefined && parseFloat(value) < rules.min) {
    errors[name] = rules.minMessage || `Minimum value is ${rules.min}`
    return errors
  }

  // Max value validation
  if (rules.max !== undefined && parseFloat(value) > rules.max) {
    errors[name] = rules.maxMessage || `Maximum value is ${rules.max}`
    return errors
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(value.toString())) {
    errors[name] = rules.patternMessage || 'Invalid format'
    return errors
  }

  // Custom validation
  if (rules.validate) {
    const customError = rules.validate(value)
    if (customError && typeof customError === 'string') {
      errors[name] = customError
      return errors
    }
  }

  return {}
}

export const validateForm = (formData, validationRules) => {
  const errors = {}
  
  Object.keys(validationRules).forEach((fieldName) => {
    const rules = validationRules[fieldName]
    const value = formData[fieldName]
    const fieldErrors = validateField(fieldName, value, rules)
    Object.assign(errors, fieldErrors)
  })

  return errors
}

