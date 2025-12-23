'use client'

import { useState, useEffect } from 'react'
import { RoleName } from '@prisma/client'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  avatar?: string
  isActive: boolean
  emailVerified: boolean
  role: RoleName
  createdAt: string
  updatedAt: string
  tenantAssignments?: TenantAssignment[]
}

interface Tenant {
  id: string
  name: string
  slug: string
  isActive: boolean
}

interface TenantAssignment {
  id: string
  tenantId: string
  tenant: Tenant
}

export default function AgentUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userTenantMap, setUserTenantMap] = useState<Record<string, TenantAssignment[]>>({})
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    isActive: '',
  })

  useEffect(() => {
    loadUsers()
  }, [filters])

  // Load tenant assignments for all users (for display in table)
  useEffect(() => {
    if (users.length > 0) {
      loadAllUserTenantAssignments()
    }
  }, [users])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.role) params.append('role', filters.role)
      if (filters.isActive !== '') params.append('isActive', filters.isActive)

      const response = await fetch(`/api/v1/admin/users?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()

      if (data.success) {
        // Convert users with roles array to single role
        const usersList = data.data?.users || data.data || []
        const usersWithSingleRole = usersList.map((user: any) => ({
          ...user,
          role: user.roles && user.roles.length > 0 ? user.roles[0] : RoleName.END_USER,
        }))
        setUsers(usersWithSingleRole)
      } else {
        setError(data.error?.message || 'Failed to load users')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const loadAllUserTenantAssignments = async () => {
    const token = localStorage.getItem('accessToken')
    const newMap: Record<string, TenantAssignment[]> = {}

    // Load assignments for users who can have tenant assignments (not ADMIN)
    const usersToLoad = users.filter(
      (u) => u.role !== RoleName.ADMIN && (u.role === RoleName.AGENT || u.role === RoleName.IT_MANAGER || u.role === RoleName.END_USER)
    )

    await Promise.all(
      usersToLoad.map(async (user) => {
          try {
            // Use admin endpoint to get tenant assignments
            const response = await fetch(`/api/v1/admin/users/${user.id}/tenants`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            const data = await response.json()
            if (data.success) {
              newMap[user.id] = data.data
            }
          } catch (err) {
            console.error(`Failed to load tenant assignments for user ${user.id}:`, err)
          }
      })
    )
    setUserTenantMap(newMap)
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading users...</div>
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Users</h1>
      </div>

      {error && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--error)',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          color: 'var(--error)',
        }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by email, name..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="input"
            style={{ flex: 1, minWidth: '250px', maxWidth: '400px' }}
          />
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="input"
            style={{ minWidth: '120px', maxWidth: '150px' }}
          >
            <option value="">All Roles</option>
            {Object.values(RoleName).filter(r => r !== RoleName.GLOBAL_ADMIN).map((role) => (
              <option key={role} value={role}>
                {role.replace('_', ' ')}
              </option>
            ))}
          </select>
          <select
            value={filters.isActive}
            onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
            className="input"
            style={{ minWidth: '120px', maxWidth: '150px' }}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
        {users.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ margin: 0, fontSize: '1rem' }}>No users found</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>Try adjusting your filters</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ 
                borderBottom: '2px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
              }}>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Email</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Name</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Role</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Tenants</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Verified</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr 
                  key={user.id} 
                  style={{ 
                    borderBottom: '1px solid var(--border-color)',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{user.email}</div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {user.firstName || user.lastName
                      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                      : <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>-</span>}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', maxWidth: '200px' }}>
                    {user.role === RoleName.ADMIN ? (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>All tenants</span>
                    ) : user.role === RoleName.AGENT || user.role === RoleName.END_USER || user.role === RoleName.IT_MANAGER ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {userTenantMap[user.id] && userTenantMap[user.id].length > 0 ? (
                          <>
                            {userTenantMap[user.id].slice(0, 3).map((assignment) => (
                              <span
                                key={assignment.id}
                                style={{
                                  padding: '0.1875rem 0.5rem',
                                  backgroundColor: 'var(--bg-tertiary)',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  color: 'var(--text-primary)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {assignment.tenant.name}
                              </span>
                            ))}
                            {userTenantMap[user.id].length > 3 && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>
                                +{userTenantMap[user.id].length - 3}
                              </span>
                            )}
                          </>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            No tenants
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.625rem',
                        backgroundColor: user.isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: user.isActive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        display: 'inline-block',
                      }}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span
                      style={{
                        fontSize: '1rem',
                        color: user.emailVerified ? 'rgb(34, 197, 94)' : 'var(--text-secondary)',
                        fontWeight: user.emailVerified ? 600 : 400,
                      }}
                    >
                      {user.emailVerified ? '✓' : '✗'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {new Date(user.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

