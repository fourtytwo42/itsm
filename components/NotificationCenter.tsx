'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import {
  BellIcon,
  XMarkIcon,
  CheckIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { NotificationType, NotificationStatus } from '@prisma/client'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  status: NotificationStatus
  link?: string | null
  createdAt: string
}

export default function NotificationCenter() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if we should hide on landing/login/register/checkout pages
  // Handle null/undefined pathname during navigation
  const shouldHide = !pathname || pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/checkout' || pathname.startsWith('/reset-password')

  useEffect(() => {
    // Don't initialize if we should hide
    if (shouldHide) return

    fetchNotifications()

    // Connect to WebSocket
    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [pathname]) // Use pathname directly instead of shouldHide

  const connectWebSocket = () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    // Don't try to connect if already connected or connecting
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`

    try {
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('[NotificationCenter] WebSocket connected')
        // Send ping to keep connection alive
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ event: 'ping' }))
          } else {
            clearInterval(pingInterval)
          }
        }, 30000) // Ping every 30 seconds
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handleWebSocketMessage(message)
        } catch (error) {
          console.error('[NotificationCenter] Error parsing WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        // Only log error, don't spam console - connection will close and reconnect
        console.warn('[NotificationCenter] WebSocket connection error (will retry)')
      }

      ws.onclose = (event) => {
        // Don't reconnect if it was a clean close (code 1000) or authentication failure (1008)
        if (event.code === 1000 || event.code === 1008) {
          console.log('[NotificationCenter] WebSocket closed:', event.code === 1008 ? 'Authentication failed' : 'Clean close')
          return
        }

        // Reconnect with exponential backoff (max 30 seconds)
        const delay = Math.min(3000 * Math.pow(2, 0), 30000) // Start with 3s, max 30s
        console.log(`[NotificationCenter] WebSocket disconnected, reconnecting in ${delay/1000}s...`)
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket()
        }, delay)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('[NotificationCenter] Failed to connect WebSocket:', error)
      // Retry after 5 seconds on initial connection failure
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket()
      }, 5000)
    }
  }

  const handleWebSocketMessage = (message: any) => {
    if (message.event === 'notification:new') {
      // Add new notification to the list
      setNotifications((prev) => [message.data.notification, ...prev])
      setUnreadCount((prev) => prev + 1)
    } else if (message.event === 'ticket:created' || message.event === 'ticket:updated') {
      // Refresh notifications when ticket events occur
      fetchNotifications()
    }
  }

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const res = await fetch('/api/v1/notifications?limit=20', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await res.json()
      if (data.success) {
        setNotifications(data.data.notifications)
        setUnreadCount(data.data.unreadCount)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const res = await fetch(`/api/v1/notifications/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'read' }),
      })

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, status: NotificationStatus.READ }
              : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const res = await fetch('/api/v1/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'markAllAsRead' }),
      })

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, status: NotificationStatus.READ }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const res = await fetch(`/api/v1/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        setNotifications((prev) => {
          const notification = prev.find((n) => n.id === notificationId)
          const wasUnread = notification?.status === NotificationStatus.UNREAD
          const filtered = prev.filter((n) => n.id !== notificationId)
          if (wasUnread) {
            setUnreadCount((prev) => Math.max(0, prev - 1))
          }
          return filtered
        })
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Hide on landing/login/register pages - return after all hooks
  if (shouldHide) {
    return null
  }

  return (
    <div className="notification-center">
      <button
        className="notification-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button
                  className="notification-action-button"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                >
                  <CheckIcon className="h-5 w-5" />
                </button>
              )}
              <button
                className="notification-action-button"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${
                    notification.status === NotificationStatus.UNREAD ? 'unread' : ''
                  }`}
                  onClick={() => {
                    if (notification.link) {
                      window.location.href = notification.link
                    }
                    if (notification.status === NotificationStatus.UNREAD) {
                      markAsRead(notification.id)
                    }
                  }}
                >
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{formatTime(notification.createdAt)}</div>
                  </div>
                  <div className="notification-item-actions">
                    {notification.status === NotificationStatus.UNREAD && (
                      <button
                        className="notification-item-action"
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(notification.id)
                        }}
                        title="Mark as read"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      className="notification-item-action"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(notification.id)
                      }}
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .notification-center {
          position: relative;
        }

        .notification-button {
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-button:hover {
          opacity: 0.8;
        }

        .notification-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: var(--error-color, #ef4444);
          color: white;
          border-radius: 50%;
          width: 1.25rem;
          height: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: bold;
        }

        .notification-panel {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.5rem;
          width: 24rem;
          max-height: 32rem;
          background: var(--bg-primary, #ffffff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          display: flex;
          flex-direction: column;
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .notification-header h3 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .notification-actions {
          display: flex;
          gap: 0.5rem;
        }

        .notification-action-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          color: var(--text-secondary, #6b7280);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-action-button:hover {
          color: var(--text-primary, #111827);
        }

        .notification-list {
          overflow-y: auto;
          max-height: 28rem;
        }

        .notification-loading,
        .notification-empty {
          padding: 2rem;
          text-align: center;
          color: var(--text-secondary, #6b7280);
        }

        .notification-item {
          display: flex;
          justify-content: space-between;
          padding: 1rem;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .notification-item:hover {
          background-color: var(--bg-secondary, #f9fafb);
        }

        .notification-item.unread {
          background-color: var(--bg-accent, #eff6ff);
        }

        .notification-content {
          flex: 1;
        }

        .notification-title {
          font-weight: 600;
          margin-bottom: 0.25rem;
          color: var(--text-primary, #111827);
        }

        .notification-message {
          font-size: 0.875rem;
          color: var(--text-secondary, #6b7280);
          margin-bottom: 0.25rem;
        }

        .notification-time {
          font-size: 0.75rem;
          color: var(--text-tertiary, #9ca3af);
        }

        .notification-item-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .notification-item-action {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          color: var(--text-secondary, #6b7280);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-item-action:hover {
          color: var(--text-primary, #111827);
        }

        @media (prefers-color-scheme: dark) {
          .notification-panel {
            background: var(--bg-primary, #1f2937);
            border-color: var(--border-color, #374151);
          }

          .notification-header {
            border-bottom-color: var(--border-color, #374151);
          }

          .notification-item {
            border-bottom-color: var(--border-color, #374151);
          }

          .notification-item:hover {
            background-color: var(--bg-secondary, #111827);
          }

          .notification-item.unread {
            background-color: var(--bg-accent, #1e3a8a);
          }
        }
      `}</style>
    </div>
  )
}

