'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RoleName } from '@prisma/client'
import OrganizationContext from '@/components/OrganizationContext'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  avatar?: string
  isActive: boolean
  emailVerified: boolean
  role: RoleName // Single role instead of array
  createdAt: string
  updatedAt: string
  tenantAssignments?: TenantAssignment[] // Optional: tenant assignments for display
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

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showTenantModal, setShowTenantModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [userTenantAssignments, setUserTenantAssignments] = useState<TenantAssignment[]>([])
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([])
  const [loadingTenants, setLoadingTenants] = useState(false)
  const [savingTenants, setSavingTenants] = useState(false)
  const [userTenantMap, setUserTenantMap] = useState<Record<string, TenantAssignment[]>>({})
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    isActive: '',
  })

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
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
        const usersWithSingleRole = data.data.users.map((user: any) => ({
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          roles: [RoleName.END_USER], // Default role for new users
          isActive: true,
          emailVerified: false,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setShowCreateModal(false)
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
        })
        loadUsers()
      } else {
        setError(data.error?.message || 'Failed to create user')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      const token = localStorage.getItem('accessToken')
      const updateData: any = { ...formData }
      if (!updateData.password) {
        delete updateData.password
      }

      // Update user data
      const response = await fetch(`/api/v1/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error?.message || 'Failed to update user')
        return
      }

      setShowEditModal(false)
      setSelectedUser(null)
      loadUsers()
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  const handleRoleChange = async (userId: string, newRole: RoleName) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roles: [newRole] }),
      })

      const data = await response.json()

      if (data.success) {
        loadUsers()
      } else {
        setError(data.error?.message || 'Failed to update user role')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        loadUsers()
      } else {
        setError(data.error?.message || 'Failed to delete user')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/admin/users/${id}/activate?action=${currentStatus ? 'deactivate' : 'activate'}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        loadUsers()
      } else {
        setError(data.error?.message || 'Failed to update user status')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  const loadTenants = async () => {
    try {
      setLoadingTenants(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/v1/admin/tenants', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await response.json()
      if (data.success) {
        setTenants(data.data)
      }
    } catch (err) {
      console.error('Failed to load tenants:', err)
    } finally {
      setLoadingTenants(false)
    }
  }

  const loadAllUserTenantAssignments = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const map: Record<string, TenantAssignment[]> = {}
      
      // Load assignments for users who can have tenant assignments (not ADMIN)
      const usersToLoad = users.filter(
        (u) => u.role !== 'ADMIN' && (u.role === 'AGENT' || u.role === 'IT_MANAGER' || u.role === 'END_USER')
      )

      await Promise.all(
        usersToLoad.map(async (user) => {
          try {
            const response = await fetch(`/api/v1/admin/users/${user.id}/tenants`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            const data = await response.json()
            if (data.success) {
              map[user.id] = data.data
            }
          } catch (err) {
            // Silently fail for individual users
          }
        })
      )

      setUserTenantMap(map)
    } catch (err) {
      // Silently fail
    }
  }

  const loadUserTenantAssignments = async (userId: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/admin/users/${userId}/tenants`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await response.json()
      if (data.success) {
        setUserTenantAssignments(data.data)
        setSelectedTenantIds(data.data.map((a: TenantAssignment) => a.tenantId))
      }
    } catch (err) {
      console.error('Failed to load tenant assignments:', err)
    }
  }

  const openTenantModal = async (user: User) => {
    setSelectedUser(user)
    setSelectedTenantIds([])
    setUserTenantAssignments([])
    
    // Load tenants and user's tenant assignments
    await Promise.all([
      loadTenants(),
      loadUserTenantAssignments(user.id),
    ])
    
    setShowTenantModal(true)
  }

  // Helper to check if user has a specific role
  const hasRole = (user: User, role: RoleName) => {
    return user.role === role
  }

  const handleSaveTenantAssignments = async () => {
    if (!selectedUser) return

    setSavingTenants(true)
    setError('')

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/admin/users/${selectedUser.id}/tenants`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tenantIds: selectedTenantIds }),
      })

      const data = await response.json()

      if (data.success) {
        setShowTenantModal(false)
        setSelectedUser(null)
        setSelectedTenantIds([])
        setUserTenantAssignments([])
        setError('')
        // Refresh user list and tenant assignments
        await loadUsers()
        await loadAllUserTenantAssignments()
      } else {
        setError(data.error?.message || 'Failed to update tenant assignments')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setSavingTenants(false)
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      password: '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    })
    setShowEditModal(true)
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading users...</div>
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>User Management</h1>
        <button
          onClick={() => {
            setFormData({
              email: '',
              password: '',
              firstName: '',
              lastName: '',
            })
            setShowCreateModal(true)
          }}
          className="btn btn-primary"
        >
          Create User
        </button>
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
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>Try adjusting your filters or create a new user</p>
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
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
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
                    {user.role === RoleName.ADMIN ? (
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
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as RoleName)}
                        style={{
                          padding: '0.375rem 0.625rem',
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          color: 'var(--text-primary)',
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                          minWidth: '100px',
                          maxWidth: '140px',
                          width: 'auto',
                        }}
                      >
                        {Object.values(RoleName).filter(r => r !== RoleName.GLOBAL_ADMIN).map((role) => (
                          <option key={role} value={role}>
                            {role.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td style={{ padding: '1rem', maxWidth: '200px' }}>
                    {hasRole(user, 'ADMIN') ? (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>All tenants</span>
                    ) : hasRole(user, 'AGENT') || hasRole(user, 'IT_MANAGER') || hasRole(user, 'END_USER') ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {userTenantMap[user.id] && userTenantMap[user.id].length > 0 ? (
                          <>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                              {userTenantMap[user.id].slice(0, 2).map((assignment) => (
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
                              {userTenantMap[user.id].length > 2 && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>
                                  +{userTenantMap[user.id].length - 2}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => openTenantModal(user)}
                              style={{
                                padding: '0.25rem 0.625rem',
                                backgroundColor: 'transparent',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                color: 'var(--accent-primary)',
                                alignSelf: 'flex-start',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              Manage
                            </button>
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                              No tenants
                            </span>
                            <button
                              onClick={() => openTenantModal(user)}
                              style={{
                                padding: '0.25rem 0.625rem',
                                backgroundColor: 'transparent',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                color: 'var(--accent-primary)',
                                alignSelf: 'flex-start',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              Assign
                            </button>
                          </>
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
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => openEditModal(user)}
                        className="btn btn-secondary"
                        style={{ 
                          padding: '0.375rem 0.75rem', 
                          fontSize: '0.8125rem',
                          minWidth: 'auto',
                        }}
                        title="Edit user"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                        className="btn btn-secondary"
                        style={{ 
                          padding: '0.375rem 0.75rem', 
                          fontSize: '0.8125rem',
                          minWidth: 'auto',
                        }}
                        title={user.isActive ? 'Deactivate user' : 'Activate user'}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="btn btn-secondary"
                        style={{ 
                          padding: '0.375rem 0.75rem', 
                          fontSize: '0.8125rem',
                          minWidth: 'auto',
                          color: 'var(--error)',
                        }}
                        title="Delete user"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0 }}>Create User</h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Email *</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Password *</label>
                <input
                  type="password"
                  className="input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">First Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Last Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0 }}>Edit User</h2>
            <form onSubmit={handleUpdate}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Email *</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Password (leave blank to keep current)</label>
                <input
                  type="password"
                  className="input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  minLength={8}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">First Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Last Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedUser(null)
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tenant Assignment Modal */}
      {showTenantModal && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0 }}>Manage Tenant Assignments</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              User: <strong>{selectedUser.email}</strong> ({selectedUser.role})
            </p>

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

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label" style={{ marginBottom: '0.75rem' }}>
                Select Tenants
                {hasRole(selectedUser, 'ADMIN') && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                    (Admin has access to all tenants, but you can still manage assignments)
                  </span>
                )}
              </label>
              {loadingTenants ? (
                <div style={{ color: 'var(--text-secondary)' }}>Loading tenants...</div>
              ) : tenants.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)' }}>No tenants available</div>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.75rem', 
                  maxHeight: '400px', 
                  overflowY: 'auto',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '8px',
                }}>
                  {tenants.map((tenant) => (
                    <label 
                      key={tenant.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem',
                        padding: '0.75rem',
                        backgroundColor: selectedTenantIds.includes(tenant.id) ? 'var(--bg-primary)' : 'transparent',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        border: selectedTenantIds.includes(tenant.id) ? '1px solid var(--accent-primary)' : '1px solid transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTenantIds.includes(tenant.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTenantIds([...selectedTenantIds, tenant.id])
                          } else {
                            setSelectedTenantIds(selectedTenantIds.filter((id) => id !== tenant.id))
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                          {tenant.name}
                        </span>
                        {!tenant.isActive && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                            (Inactive)
                          </span>
                        )}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          {tenant.slug}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div style={{ 
              padding: '1rem', 
              backgroundColor: 'var(--bg-secondary)', 
              borderRadius: '8px',
              marginBottom: '1.5rem',
            }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <strong>Selected:</strong> {selectedTenantIds.length} tenant{selectedTenantIds.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowTenantModal(false)
                  setSelectedUser(null)
                  setSelectedTenantIds([])
                  setUserTenantAssignments([])
                  setError('')
                }}
                disabled={savingTenants}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="btn btn-primary"
                onClick={handleSaveTenantAssignments}
                disabled={savingTenants}
              >
                {savingTenants ? 'Saving...' : 'Save Assignments'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

