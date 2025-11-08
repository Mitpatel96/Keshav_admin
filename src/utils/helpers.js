// Helper utility functions

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export const formatDateTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const generateSKUCode = (category, brand, name) => {
  const catCode = category?.substring(0, 2).toUpperCase() || 'SK'
  const brandCode = brand?.substring(0, 2).toUpperCase() || 'BR'
  const nameCode = name?.substring(0, 3).toUpperCase().replace(/\s/g, '') || 'PRD'
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `SKU-${catCode}-${brandCode}-${nameCode}-${random}`
}

export const generateProductCode = (category, brand) => {
  const catCode = category?.substring(0, 3).toUpperCase() || 'PRO'
  const brandCode = brand?.substring(0, 3).toUpperCase() || 'BRD'
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `PROD-${catCode}-${brandCode}-${random}`
}

export const generateVendorID = () => {
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `V${random}`
}

export const generateCategoryCode = (name) => {
  const code = name?.substring(0, 3).toUpperCase().replace(/\s/g, '') || 'CAT'
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${code}${random}`
}

export const calculateDiscount = (basePrice, sellingPrice) => {
  if (!basePrice || basePrice === 0) return 0
  return Math.round(((basePrice - sellingPrice) / basePrice) * 100)
}

export const calculateSavings = (individualPrices, comboPrice) => {
  const total = individualPrices.reduce((sum, price) => sum + price, 0)
  return total - comboPrice
}

export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0
  return ((value / total) * 100).toFixed(2)
}

