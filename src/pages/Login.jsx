import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../components/Form/Input'
import { loginAPI, setAuthData, getUserData, getAuthToken } from '../utils/api'
import { useSocket } from '../contexts/SocketContext'

const Login = () => {
  const navigate = useNavigate()
  const { connectSocket } = useSocket()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
    const token = getAuthToken()
    const userData = getUserData()

    if (isAuthenticated && token && userData) {
      if (userData.role === 'admin') {
        navigate('/', { replace: true })
      } else if (userData.role === 'vendor') {
        navigate('/vendor', { replace: true })
      }
    }
  }, [navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
    if (error) {
      setError('')
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await loginAPI(formData.email, formData.password)

      // Store auth data
      setAuthData(response.token, response.user)

      // Connect socket after successful login
      // Small delay to ensure auth data is stored
      setTimeout(() => {
        if (connectSocket) {
          connectSocket()
        }
      }, 100)

      // Check user role and redirect accordingly
      if (response.user.role === 'admin') {
        navigate('/')
      } else if (response.user.role === 'vendor') {
        navigate('/vendor')
      } else {
        setError('Invalid user role')
        setLoading(false)
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-primary-600">
          Keshav Admin
        </h1>
        <p className="text-center text-gray-600 mb-6">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            errors={errors}
            required
            placeholder="Enter your email"
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            errors={errors}
            required
            placeholder="Enter your password"
          />

          {error && (
            <div className="text-sm text-red-500 text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login

