import { useState, useRef, useEffect } from 'react'
import { Bell, X, AlertTriangle, ShoppingCart } from 'lucide-react'
import { useSocket } from '../contexts/SocketContext'
import { formatDistanceToNow } from 'date-fns'

const NotificationBell = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useSocket()
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const handleMouseEnter = () => {
        setIsOpen(true)
    }

    const handleMouseLeave = () => {
        setIsOpen(false)
    }

    const formatTime = (timestamp) => {
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
        } catch {
            return 'Just now'
        }
    }

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'low_stock':
                return <AlertTriangle size={16} className="text-yellow-600" />
            case 'new_order':
                return <ShoppingCart size={16} className="text-green-600" />
            default:
                return <Bell size={16} className="text-gray-600" />
        }
    }

    return (
        <div
            className="relative"
            ref={dropdownRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-500 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-sm font-semibold text-gray-900">
                            Notifications {unreadCount > 0 && `(${unreadCount})`}
                        </h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    Mark all read
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={() => {
                                        notifications.forEach((n) => removeNotification(n.id))
                                    }}
                                    className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">No notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-50 transition-colors ${
                                            !notification.read ? 'bg-blue-50' : ''
                                        }`}
                                        onClick={() => !notification.read && markAsRead(notification.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p
                                                    className={`text-sm ${
                                                        !notification.read
                                                            ? 'font-semibold text-gray-900'
                                                            : 'text-gray-700'
                                                    }`}
                                                >
                                                    {notification.message}
                                                </p>
                                                {notification.type === 'low_stock' && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {notification.vendorName} • {notification.skuName}
                                                    </p>
                                                )}
                                                {notification.type === 'new_order' && notification.customer && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Customer: {notification.customer.name || 'N/A'}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatTime(notification.timestamp)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    removeNotification(notification.id)
                                                }}
                                                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                                                aria-label="Remove notification"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default NotificationBell

