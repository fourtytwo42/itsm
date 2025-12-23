'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RoleName } from '@prisma/client'
import { XMarkIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

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

export default function ManagerUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showTenantModal, setShowTenantModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([])
  const [loadingTenants, setLoadingTenants] = useState(false)
  const [savingTenants, setSavingTenants] = useState(false)
  const [userTenantMap, setUserTenantMap] = useState<Record<string, TenantAssignment[]>>({})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    isActive: '',
    tenantId: '',
  })
  const [sortField, setSortField] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Form state for Create/Edit modals
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: RoleName.AGENT as RoleName,
  })

  useEffect(() => {
    // Get current user ID
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      setCurrentUserId(user.id)
    }
    loadUsers()
    loadTenants()
  }, [filters, sortField, sortOrder])

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
      if (filters.tenantId) params.append('tenantId', filters.tenantId)
      params.append('sort', sortField)
      params.append('order', sortOrder)

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

  const loadTenants = async () => {
    setLoadingTenants(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/v1/manager/tenants', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await response.json()
      if (data.success) {
        setTenants(data.data.tenants || data.data || [])
      } else {
        console.error('Failed to load tenants:', data.error?.message)
      }
    } catch (err) {
      console.error('An unexpected error occurred while loading tenants:', err)
    } finally {
      setLoadingTenants(false)
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
            // Always use admin endpoint for IT_MANAGER users (including self) to see all their assignments
            // For other users, use manager endpoint which filters by IT manager's tenant assignments
            const endpoint = user.role === RoleName.IT_MANAGER 
              ? `/api/v1/admin/users/${user.id}/tenants`
              : `/api/v1/manager/users/${user.id}/tenants`
            const response = await fetch(endpoint, {
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/v1/manager/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          roles: [formData.role],
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
          role: RoleName.AGENT,
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
      const updateData: any = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
      }
      if (formData.password) {
        updateData.password = formData.password
      }

      const response = await fetch(`/api/v1/manager/agents/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (data.success) {
        setShowEditModal(false)
        setSelectedUser(null)
        loadUsers()
      } else {
        setError(data.error?.message || 'Failed to update user')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/manager/agents/${id}`, {
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
      const response = await fetch(`/api/v1/manager/agents/${id}/disable`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ disabled: currentStatus }),
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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const SortableHeader = ({ field, label, align = 'left' }: { field: string; label: string; align?: 'left' | 'center' | 'right' }) => (
    <th
      style={{
        padding: '0.875rem 1rem',
        textAlign: align,
        fontWeight: 600,
        fontSize: '0.875rem',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={() => handleSort(field)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start' }}>
        {label}
        {sortField === field && (
          sortOrder === 'asc' ? (
            <ChevronUpIcon style={{ width: '0.875rem', height: '0.875rem' }} />
          ) : (
            <ChevronDownIcon style={{ width: '0.875rem', height: '0.875rem' }} />
          )
        )}
      </div>
    </th>
  )

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      password: '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
    })
    setShowEditModal(true)
  }

  const openTenantModal = (user: User) => {
    setSelectedUser(user)
    const currentAssignments = userTenantMap[user.id] || []
    setSelectedTenantIds(currentAssignments.map(assignment => assignment.tenantId))
    setShowTenantModal(true)
  }

  const handleSaveTenantAssignments = async () => {
    if (!selectedUser) return
    setSavingTenants(true)
    setError('')

    try {
      const token = localStorage.getItem('accessToken')
      
      // Use admin endpoint for all users since IT Managers can see all users in their organization
      // The admin endpoint now allows IT_MANAGER users
      const endpoint = `/api/v1/admin/users/${selectedUser.id}/tenants`

      const response = await fetch(endpoint, {
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
        loadAllUserTenantAssignments()
      } else {
        setError(data.error?.message || 'Failed to update tenant assignments.')
      }
    } catch (err) {
      setError('Failed to update tenant assignments.')
      console.error('Error saving tenant assignments:', err)
    } finally {
      setSavingTenants(false)
    }
  }

  // Check if user can be edited (not admin, not self)
  const canEditUser = (user: User) => {
    if (user.role === RoleName.ADMIN) {
      return false
    }
    if (currentUserId && user.id === currentUserId) {
      return false
    }
    return true
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading users...</div>
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Users</h1>
        <button
          onClick={() => {
            setFormData({
              email: '',
              password: '',
              firstName: '',
              lastName: '',
              role: RoleName.AGENT,
            })
            setShowCreateModal(true)
          }}
          className="btn btn-primary"
        >
          Register User
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
          <select
            value={filters.tenantId}
            onChange={(e) => setFilters({ ...filters, tenantId: e.target.value })}
            className="input"
            style={{ minWidth: '150px', maxWidth: '200px' }}
          >
            <option value="">All Tenants</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
        {users.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ margin: 0, fontSize: '1rem' }}>No users found</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>Try adjusting your filters or register a new user</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ 
                borderBottom: '2px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
              }}>
                <SortableHeader field="email" label="Email" />
                <SortableHeader field="firstName" label="Name" />
                <SortableHeader field="role" label="Role" />
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Tenants</th>
                <SortableHeader field="isActive" label="Status" />
                <SortableHeader field="emailVerified" label="Verified" align="center" />
                <SortableHeader field="createdAt" label="Created" />
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const canEdit = canEditUser(user)
                return (
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
                              {canEdit && (
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
                              )}
                            </>
                          ) : (
                            <>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                No tenants
                              </span>
                              {canEdit && (
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
                              )}
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
                      {canEdit ? (
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
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          {user.id === currentUserId ? 'Cannot edit self' : 'Restricted'}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create User Modal */}
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
          <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Register User</h2>
              <button 
                onClick={() => setShowCreateModal(false)} 
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
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
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Role *</label>
                <select
                  className="input"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as RoleName })}
                  required
                >
                  <option value={RoleName.AGENT}>Agent</option>
                  <option value={RoleName.END_USER}>End User</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && canEditUser(selectedUser) && (
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
          <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Edit User</h2>
              <button 
                onClick={() => setShowEditModal(false)} 
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
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
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Last Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
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
      {showTenantModal && selectedUser && canEditUser(selectedUser) && (
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
          <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Assign Tenants to {selectedUser.email}</h2>
              <button 
                onClick={() => setShowTenantModal(false)} 
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {loadingTenants ? (
              <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Loading tenants...</div>
            ) : tenants.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No tenants available in your organization.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                {tenants.map((tenant) => (
                  <label key={tenant.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                    />
                    <span style={{ fontSize: '0.9rem' }}>
                      {tenant.name} {!tenant.isActive && <span style={{ color: 'var(--text-secondary)' }}>(Inactive)</span>}
                    </span>
                  </label>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowTenantModal(false)
                  setSelectedUser(null)
                  setSelectedTenantIds([])
                }}
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

