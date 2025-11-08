// Validation utility functions

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/
  return phoneRegex.test(phone)
}

export const validatePassword = (password) => {
  const minLength = password.length >= 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  return {
    isValid: minLength && hasUpperCase && hasNumber && hasSpecialChar,
    strength: getPasswordStrength(password, minLength, hasUpperCase, hasNumber, hasSpecialChar)
  }
}

const getPasswordStrength = (password, minLength, hasUpperCase, hasNumber, hasSpecialChar) => {
  let score = 0
  if (minLength) score++
  if (hasUpperCase) score++
  if (hasNumber) score++
  if (hasSpecialChar) score++
  if (password.length >= 12) score++
  
  if (score <= 2) return 'Weak'
  if (score <= 4) return 'Medium'
  return 'Strong'
}

export const validateGST = (gst) => {
  if (!gst) return true // Optional field
  const gstRegex = /^[0-9A-Z]{15}$/
  return gstRegex.test(gst)
}

export const validatePAN = (pan) => {
  if (!pan) return true // Optional field
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  return panRegex.test(pan)
}

export const validateIFSC = (ifsc) => {
  if (!ifsc) return true // Optional field
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
  return ifscRegex.test(ifsc)
}

export const validatePIN = (pin) => {
  const pinRegex = /^[0-9]{6}$/
  return pinRegex.test(pin)
}

export const validateFileSize = (file, maxSizeMB = 5) => {
  if (!file) return true
  return file.size <= maxSizeMB * 1024 * 1024
}

export const validateFileType = (file, allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']) => {
  if (!file) return true
  return allowedTypes.includes(file.type)
}

