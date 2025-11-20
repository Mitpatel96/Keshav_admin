/* @refresh reset */
import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { toast } from 'react-toastify'
import { getUserData, getAuthToken } from '../utils/api'

const SocketContext = createContext(null)

// Get Socket.IO server URL - uses same logic as API URL
const getSocketUrl = () => {
    // Debug: Log available environment variables in development
    if (import.meta.env.DEV) {
        console.debug('Socket Environment Variables:', {
            VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL || '(not set)',
            VITE_USE_LOCAL_API: import.meta.env.VITE_USE_LOCAL_API || '(not set)',
            VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '(not set)',
            VITE_ENABLE_SOCKET: import.meta.env.VITE_ENABLE_SOCKET || '(not set)',
            DEV: import.meta.env.DEV,
        })
    }

    // Priority 1: Use VITE_SOCKET_URL if explicitly set (highest priority)
    // This allows you to set any custom socket URL
    if (import.meta.env.VITE_SOCKET_URL && import.meta.env.VITE_SOCKET_URL.trim() !== '') {
        const url = import.meta.env.VITE_SOCKET_URL.trim()
        console.log('🔌 Using VITE_SOCKET_URL:', url)
        return url
    }

    // Priority 2: Use same logic as API - check VITE_USE_LOCAL_API
    // This ensures Socket and API use the same environment
    const useLocalApi = import.meta.env.VITE_USE_LOCAL_API === 'true' || import.meta.env.VITE_USE_LOCAL_API === true

    if (useLocalApi) {
        console.log('🔌 Using LOCAL socket: http://localhost:8080')
        return 'http://localhost:8080'
    }

    // Priority 3: Try to get from VITE_API_BASE_URL (if set)
    const envUrl = import.meta.env.VITE_API_BASE_URL
    if (envUrl && envUrl.trim() !== '') {
        // Remove /api suffix if present to get base URL for socket
        const url = envUrl.trim().replace(/\/api\/?$/, '')
        console.log('🔌 Using socket URL from VITE_API_BASE_URL:', url)
        return url
    }

    // Fallback: Production URL (same as API base URL)
    const apiUrl = 'https://dev.api.keshavtraders.com.au'
    console.log('🔌 Using PRODUCTION socket URL:', apiUrl)
    return apiUrl
}

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null)
    const [isConnected, setIsConnected] = useState(false)
    const [notifications, setNotifications] = useState([]) // Store notifications
    const reconnectAttempts = useRef(0)
    const maxReconnectAttempts = 3 // Reduced from 5 to fail faster
    const socketRef = useRef(null)
    const hasShownMaxAttemptsWarning = useRef(false)
    const shouldAttemptConnection = useRef(true) // Flag to stop attempting after max failures

    // Initialize socket connection
    const connectSocket = () => {
        const userData = getUserData()
        const token = getAuthToken()

        // Don't attempt if we've already failed max attempts
        if (!shouldAttemptConnection.current) {
            return
        }

        // Only connect if user is authenticated
        if (!userData || !token) {
            if (import.meta.env.DEV) {
                console.log('Cannot connect socket: User not authenticated')
            }
            return
        }

        // Disconnect existing socket if any
        if (socketRef.current) {
            socketRef.current.removeAllListeners()
            socketRef.current.disconnect()
            socketRef.current = null
        }

        const socketUrl = getSocketUrl()

        // Log the socket URL in development for debugging
        if (import.meta.env.DEV) {
            console.log('Connecting to Socket.IO server:', socketUrl)
        }

        // Check if socket connection should be enabled (can be disabled via env var)
        const socketEnabled = import.meta.env.VITE_ENABLE_SOCKET !== 'false'

        if (!socketEnabled) {
            if (import.meta.env.DEV) {
                console.log('Socket connection disabled via VITE_ENABLE_SOCKET')
            }
            return
        }

        const newSocket = io(socketUrl, {
            transports: ['polling', 'websocket'], // Try polling first, then websocket
            reconnection: true,
            reconnectionAttempts: maxReconnectAttempts,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
            timeout: 15000, // Reduced timeout to fail faster
            autoConnect: true,
            // Suppress connection errors in console
            forceNew: false,
        })

        // Suppress default error logging
        newSocket.io.on('error', (error) => {
            // Silently handle connection errors - don't log to console
            // Only log in development mode
            if (import.meta.env.DEV && reconnectAttempts.current < 2) {
                console.debug('Socket connection attempt:', error.message || error)
            }
        })

        // Set up authentication listeners BEFORE connecting
        // Authentication response - listen BEFORE emitting authenticate
        newSocket.on('authenticated', (response) => {
            console.log('✅ Socket authenticated successfully!')
            if (response) {
                console.log('📥 Authentication response data:', response)
            }
            console.log('👤 User role:', userData.role)
            console.log('📡 Setting up event listeners for role:', userData.role)
            setupEventListeners(newSocket, userData.role)

            // Log what events we're listening for
            if (userData.role === 'admin') {
                console.log('🔔 Admin: Listening for "low_stock_alert" events')
            } else if (userData.role === 'vendor') {
                console.log('🔔 Vendor: Listening for "new_order" events')
            }
        })

        newSocket.on('authentication_error', (error) => {
            console.error('❌ Socket authentication error:', error)
            console.error('❌ Error details:', JSON.stringify(error, null, 2))
            // Only show toast for auth errors as they're more critical
            toast.error('Socket authentication failed. Real-time notifications may not work.')
            // Don't disconnect - let it try to reconnect
        })

        // Also listen for alternative event names the backend might use
        newSocket.on('auth_success', (response) => {
            console.log('✅ Received auth_success event:', response)
            setupEventListeners(newSocket, userData.role)
        })

        newSocket.on('auth_failed', (error) => {
            console.error('❌ Received auth_failed event:', error)
        })

        // Listen for any error events
        newSocket.on('error', (error) => {
            console.error('❌ Socket error event:', error)
        })

        // Connection event handlers
        newSocket.on('connect', () => {
            console.log('✅ Socket connected! Socket ID:', newSocket.id)
            setIsConnected(true)
            reconnectAttempts.current = 0
            hasShownMaxAttemptsWarning.current = false // Reset warning flag on successful connection
            shouldAttemptConnection.current = true // Re-enable connection attempts on success

            // Authenticate with server
            console.log('🔐 Authenticating socket with server...')
            authenticateSocket(newSocket, userData)
        })

        newSocket.on('disconnect', (reason) => {
            // Only log disconnect in development mode and if it's not a normal closure
            if (import.meta.env.DEV && reason !== 'io client disconnect') {
                console.debug('Socket disconnected:', reason)
            }
            setIsConnected(false)

            // Attempt to reconnect if not manually disconnected
            if (reason === 'io server disconnect') {
                // Server disconnected, reconnect manually
                newSocket.connect()
            }
        })

        newSocket.on('connect_error', (error) => {
            reconnectAttempts.current += 1

            // Silently handle connection errors - don't spam console
            // Only log in development mode and only first few attempts
            if (import.meta.env.DEV && reconnectAttempts.current <= 2) {
                console.debug('Socket connection attempt failed:', error.message || 'Connection timeout')
            }

            // Stop attempting after max reconnection attempts
            if (reconnectAttempts.current >= maxReconnectAttempts && !hasShownMaxAttemptsWarning.current) {
                hasShownMaxAttemptsWarning.current = true
                shouldAttemptConnection.current = false

                // Disconnect to stop further attempts
                if (socketRef.current) {
                    socketRef.current.removeAllListeners()
                    socketRef.current.disconnect()
                    socketRef.current = null
                    setSocket(null)
                }

                // Only log in development mode
                if (import.meta.env.DEV) {
                    console.info('Socket notifications unavailable. App will continue to work normally.')
                }
                // Don't show error toast - socket is optional for app functionality
                // The app will continue to work normally without real-time notifications
            }
        })

        // Authentication response - listen BEFORE emitting authenticate
        newSocket.on('authenticated', (response) => {
            console.log('✅ Socket authenticated successfully!')
            if (response) {
                console.log('📥 Authentication response data:', response)
            }
            console.log('👤 User role:', userData.role)
            console.log('📡 Setting up event listeners for role:', userData.role)
            setupEventListeners(newSocket, userData.role)

            // Log what events we're listening for
            if (userData.role === 'admin') {
                console.log('🔔 Admin: Listening for "low_stock_alert" events')
            } else if (userData.role === 'vendor') {
                console.log('🔔 Vendor: Listening for "new_order" events')
            }
        })

        // Also listen for alternative event names the backend might use
        newSocket.on('auth_success', (response) => {
            console.log('✅ Received auth_success event:', response)
            setupEventListeners(newSocket, userData.role)
        })

        newSocket.on('auth_failed', (error) => {
            console.error('❌ Received auth_failed event:', error)
        })

        newSocket.on('authentication_error', (error) => {
            console.error('❌ Socket authentication error:', error)
            console.error('❌ Error details:', JSON.stringify(error, null, 2))
            // Only show toast for auth errors as they're more critical
            toast.error('Socket authentication failed. Real-time notifications may not work.')
            // Don't disconnect - let it try to reconnect
        })

        // Listen for any error events
        newSocket.on('error', (error) => {
            console.error('❌ Socket error event:', error)
        })

        // Listen for connect_error specifically
        newSocket.on('connect_error', (error) => {
            console.error('❌ Socket connect_error:', error)
        })

        socketRef.current = newSocket
        setSocket(newSocket)
    }

    // Authenticate socket with server
    const authenticateSocket = (socketInstance, userData) => {
        const authData = {
            userId: userData._id,
            role: userData.role,
        }

        // Add permanentId for vendors - backend might expect vendorId or permanentId
        if (userData.role === 'vendor') {
            // Try permanentId first (as per requirements)
            if (userData.permanentId) {
                authData.permanentId = userData.permanentId
            }
            // Also try vendorId if it exists (some backends might use this)
            if (userData.vendorId) {
                authData.vendorId = userData.vendorId
            }
            // Fallback: check localStorage for vendorId
            const storedVendorId = localStorage.getItem('vendorId')
            if (storedVendorId && !authData.permanentId) {
                authData.permanentId = storedVendorId
            }
        }

        console.log('📤 Emitting authenticate event with data:', authData)
        console.log('📋 Full userData:', userData)

        socketInstance.emit('authenticate', authData)

        // Also listen for any response from backend (for debugging)
        socketInstance.once('authenticate_response', (response) => {
            console.log('📥 Backend authenticate response:', response)
        })
    }

    // Setup event listeners based on user role
    const setupEventListeners = (socketInstance, role) => {
        // Remove any existing listeners first
        socketInstance.off('low_stock_alert')
        socketInstance.off('new_order')

        if (role === 'admin') {
            // Admin: Listen for low stock alerts
            console.log('✅ Admin event listener registered: low_stock_alert')
            socketInstance.on('low_stock_alert', (data) => {
                console.log('📨 Received low_stock_alert event:', data)
                handleLowStockAlert(data)
            })
        } else if (role === 'vendor') {
            // Vendor: Listen for new order notifications
            console.log('✅ Vendor event listener registered: new_order')
            socketInstance.on('new_order', (data) => {
                console.log('📨 Received new_order event:', data)
                handleNewOrder(data)
            })
        }

        // Also listen for any event for debugging
        socketInstance.onAny((eventName, ...args) => {
            console.log('🔍 Socket event received:', eventName, args)
        })
    }

    // Handle low stock alert (Admin)
    const handleLowStockAlert = (data) => {
        const { vendorName, skuName, quantity, timestamp } = data

        const message = `${vendorName} - ${skuName} has only ${quantity} units left`

        // Add notification to state
        const notification = {
            id: Date.now() + Math.random(),
            type: 'low_stock',
            message,
            vendorName,
            skuName,
            quantity,
            timestamp: timestamp || new Date().toISOString(),
            read: false,
        }

        setNotifications((prev) => [notification, ...prev])

        // Also show toast
        toast.warning(message, {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            icon: '⚠️',
        })

        console.log('Low stock alert:', { vendorName, skuName, quantity, timestamp })
    }

    // Handle new order notification (Vendor)
    const handleNewOrder = (data) => {
        const { orderId, orderData, timestamp } = data

        if (!orderData) {
            console.error('Invalid order data received')
            return
        }

        const { orderCode, orderVFC, totalAmount, user } = orderData

        const message = `New order ${orderCode} received - Amount: ₹${totalAmount?.toLocaleString() || 0}`

        // Add notification to state
        const notification = {
            id: Date.now() + Math.random(),
            type: 'new_order',
            message,
            orderId,
            orderCode,
            orderVFC,
            totalAmount,
            customer: user,
            timestamp: timestamp || new Date().toISOString(),
            read: false,
        }

        setNotifications((prev) => [notification, ...prev])

        // Also show toast
        toast.success(message, {
            position: 'top-right',
            autoClose: 6000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            icon: '🛒',
        })

        console.log('New order notification:', {
            orderId,
            orderCode,
            orderVFC,
            totalAmount,
            customer: user,
            timestamp,
        })
    }

    // Mark notification as read
    const markAsRead = (notificationId) => {
        setNotifications((prev) =>
            prev.map((notif) =>
                notif.id === notificationId ? { ...notif, read: true } : notif
            )
        )
    }

    // Mark all as read
    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
    }

    // Clear all notifications
    const clearNotifications = () => {
        setNotifications([])
    }

    // Remove a notification
    const removeNotification = (notificationId) => {
        setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId))
    }

    // Disconnect socket
    const disconnectSocket = () => {
        if (socketRef.current) {
            socketRef.current.removeAllListeners()
            socketRef.current.disconnect()
            socketRef.current = null
            setSocket(null)
            setIsConnected(false)
        }
        // Clear notifications on disconnect/logout
        setNotifications([])
    }

    // Connect socket when user is authenticated on mount
    useEffect(() => {
        const userData = getUserData()
        const token = getAuthToken()
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'

        if (isAuthenticated && userData && token && !socketRef.current) {
            connectSocket()
        }

        // Cleanup on unmount
        return () => {
            disconnectSocket()
        }
    }, []) // Only run on mount

    // Test function to manually trigger a notification (for testing)
    const testNotification = (type = 'low_stock') => {
        if (type === 'low_stock') {
            handleLowStockAlert({
                vendorName: 'Test Vendor',
                skuName: 'Test Product',
                quantity: 5,
                timestamp: new Date().toISOString(),
            })
        } else if (type === 'new_order') {
            handleNewOrder({
                orderId: 'test-order-123',
                orderData: {
                    orderCode: 'ORD-TEST-123',
                    orderVFC: 'TEST123',
                    totalAmount: 1000,
                    user: {
                        name: 'Test Customer',
                        email: 'test@example.com',
                    },
                },
                timestamp: new Date().toISOString(),
            })
        }
    }

    const value = {
        socket,
        isConnected,
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
        connectSocket,
        disconnectSocket,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        removeNotification,
        testNotification, // For testing purposes
    }

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export const useSocket = () => {
    const context = useContext(SocketContext)
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider')
    }
    return context
}

