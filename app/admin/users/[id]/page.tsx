'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: string
  isActive: boolean
  emailVerified: boolean
  createdAt: string
}

interface Asset {
  id: string
  assetNumber: string
  name: string
  type: string
  status: string
  assignedAt?: string
}

interface AuditLog {
  id: string
  eventType: string
  description: string
  userEmail: string
  createdAt: string
  metadata?: any
}

interface Ticket {
  id: string
  ticketNumber: string
  subject: string
  status: string
  priority: string
  createdAt: string
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [assetsLoading, setAssetsLoading] = useState(false)
  const [allAssets, setAllAssets] = useState<Array<{ id: string; assetNumber: string; name: string }>>([])
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadUser(params.id as string)
      loadUserAssets(params.id as string)
      loadAllAssets()
      loadHistory(params.id as string)
      loadTickets(params.id as string)
    }
  }, [params.id])

  const loadUser = async (userId: string) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/admin/users/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()
      if (data.success) {
        setUser(data.data.user)
      }
    } catch (error) {
      console.error('Failed to load user:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserAssets = async (userId: string) => {
    try {
      setAssetsLoading(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/assets?assignedTo=${userId}&limit=1000`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()
      if (data.success && data.data?.assets) {
        setAssets(data.data.assets)
      }
    } catch (err) {
      console.error('Failed to load user assets:', err)
    } finally {
      setAssetsLoading(false)
    }
  }

  const loadAllAssets = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/assets?limit=1000`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()
      if (data.success && data.data?.assets) {
        setAllAssets(data.data.assets)
      }
    } catch (err) {
      console.error('Failed to load assets:', err)
    }
  }

  const loadHistory = async (userId: string) => {
    try {
      setLoadingHistory(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/organizations/audit?entityType=User&entityId=${userId}&limit=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()
      if (data.logs) {
        setAuditLogs(data.logs)
      }
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const loadTickets = async (userId: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      // Get tickets where user is requester or assignee
      const response = await fetch(`/api/v1/tickets?requesterId=${userId}&limit=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()
      if (data.success && data.data) {
        setTickets(data.data)
      }
    } catch (err) {
      console.error('Failed to load tickets:', err)
    }
  }

  const handleAssignAsset = async () => {
    if (!user || !selectedAssetId) return

    try {
      setAssigning(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/assets/${selectedAssetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignedToId: user.id,
        }),
      })

      const data = await response.json()
      if (data.success) {
        await loadUserAssets(user.id)
        await loadHistory(user.id)
        setSelectedAssetId('')
      } else {
        alert(data.error?.message || 'Failed to assign asset')
      }
    } catch (err) {
      alert('An unexpected error occurred')
    } finally {
      setAssigning(false)
    }
  }

  const handleUnassignAsset = async (assetId: string) => {
    if (!user) return

    if (!confirm('Are you sure you want to unassign this asset?')) {
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/assets/${assetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignedToId: null,
        }),
      })

      const data = await response.json()
      if (data.success) {
        await loadUserAssets(user.id)
        await loadHistory(user.id)
      } else {
        alert(data.error?.message || 'Failed to unassign asset')
      }
    } catch (err) {
      alert('An unexpected error occurred')
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading user...</div>
  }

  if (!user) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>User not found</p>
        <Link href="/admin/users">Back to Users</Link>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/admin/users" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
          ← Back to Users
        </Link>
      </div>

      <h1 style={{ marginBottom: '2rem' }}>
        {user.firstName || user.lastName
          ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
          : user.email}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div
          style={{
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>User Information</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>
              <strong>Email:</strong> {user.email}
            </div>
            <div>
              <strong>Role:</strong> {user.role}
            </div>
            <div>
              <strong>Status:</strong> {user.isActive ? 'Active' : 'Inactive'}
            </div>
            <div>
              <strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Created:</strong> {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Assign Asset</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <select
              className="input"
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              disabled={assigning}
            >
              <option value="">Select an asset...</option>
              {allAssets
                .filter((asset) => !assets.find((a) => a.id === asset.id))
                .map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.assetNumber} - {asset.name}
                  </option>
                ))}
            </select>
            <button
              className="btn btn-primary"
              onClick={handleAssignAsset}
              disabled={assigning || !selectedAssetId}
            >
              {assigning ? 'Assigning...' : 'Assign Asset'}
            </button>
          </div>
        </div>
      </div>

      {assets.length > 0 && (
        <div
          style={{
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-secondary)',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Assigned Assets</h2>
          {assetsLoading ? (
            <div>Loading assets...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <Link href={`/assets/${asset.id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                      <strong>{asset.assetNumber}</strong> - {asset.name}
                    </Link>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Type: {asset.type} | Status: {asset.status}
                      {asset.assignedAt && ` | Assigned: ${new Date(asset.assignedAt).toLocaleDateString()}`}
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleUnassignAsset(asset.id)}
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  >
                    Unassign
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tickets.length > 0 && (
        <div
          style={{
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-secondary)',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Related Tickets</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {tickets.map((ticket) => (
              <div key={ticket.id} style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                <Link href={`/tickets/${ticket.id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                  <strong>{ticket.ticketNumber}</strong> - {ticket.subject}
                </Link>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Status: {ticket.status} | Priority: {ticket.priority} | Created: {new Date(ticket.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          backgroundColor: 'var(--bg-secondary)',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>History</h2>
        {loadingHistory ? (
          <div>Loading history...</div>
        ) : auditLogs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {auditLogs.map((log) => (
              <div key={log.id} style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.25rem' }}>
                  <strong>{log.eventType}</strong>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  By: {log.userEmail}
                </div>
                <div style={{ fontSize: '0.875rem' }}>{log.description}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)' }}>No history available</div>
        )}
      </div>
    </div>
  )
}

