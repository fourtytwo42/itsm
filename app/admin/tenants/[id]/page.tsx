'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline'

interface Tenant {
  id: string
  name: string
  slug: string
  logo?: string
  description?: string
  requiresLogin: boolean
  isActive: boolean
  categories: Array<{ id: string; category: string }>
  kbArticles: Array<{ id: string; article: { id: string; title: string; slug: string } }>
  customFields: Array<{
    id: string
    label: string
    fieldType: string
    required: boolean
    options?: string[]
    placeholder?: string
    order: number
  }>
  assignments: Array<{
    id: string
    userId: string
    category: string | null
    user: {
      id: string
      email: string
      firstName: string | null
      lastName: string | null
    }
  }>
}

interface KBArticle {
  id: string
  title: string
  slug: string
}

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
}

export default function EditTenantPage() {
  const router = useRouter()
  const params = useParams()
  const tenantId = params?.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [error, setError] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'categories' | 'kb' | 'fields' | 'assignments'>('basic')
  const [allKBArticles, setAllKBArticles] = useState<KBArticle[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [categoryInput, setCategoryInput] = useState('')
  const [selectedKBArticles, setSelectedKBArticles] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [assignAllCategories, setAssignAllCategories] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logo: '',
    requiresLogin: false,
    isActive: true,
  })

  useEffect(() => {
    loadTenant()
    loadKBArticles()
    loadUsers()
  }, [tenantId])

  const loadTenant = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/admin/tenants/${tenantId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()

      if (data.success) {
        setTenant(data.data)
        setFormData({
          name: data.data.name,
          slug: data.data.slug,
          description: data.data.description || '',
          logo: data.data.logo || '',
          requiresLogin: data.data.requiresLogin,
          isActive: data.data.isActive,
        })
        setSelectedCategories(data.data.categories.map((c: any) => c.category))
        setSelectedKBArticles(data.data.kbArticles.map((ka: any) => ka.article.id))
        if (data.data.logo) {
          // If logo is a URL path, prepend the base URL
          const logoUrl = data.data.logo.startsWith('http') 
            ? data.data.logo 
            : `${window.location.origin}${data.data.logo}`
          setLogoPreview(logoUrl)
        }
      } else {
        setError(data.error?.message || 'Failed to load tenant')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const loadKBArticles = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/v1/kb', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await response.json()
      if (data.success) {
        setAllKBArticles(data.data)
      }
    } catch (err) {
      // Ignore errors
    }
  }

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/v1/admin/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await response.json()
      if (data.success) {
        setAllUsers(data.data.users || [])
      }
    } catch (err) {
      // Ignore errors
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError('File size exceeds 5MB limit.')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setUploadingLogo(true)
    setError('')
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/v1/admin/tenants/upload-logo', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      })

      const data = await response.json()

      if (data.success) {
        setFormData({ ...formData, logo: data.data.url })
      } else {
        setError(data.error?.message || 'Failed to upload logo')
        setLogoPreview(null)
      }
    } catch (err) {
      setError('Failed to upload logo')
      setLogoPreview(null)
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleRemoveLogo = () => {
    setLogoPreview(null)
    setFormData({ ...formData, logo: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/admin/tenants/${tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setError('')
        // Save categories, KB articles, etc. in separate calls
        await Promise.all([
          saveCategories(),
          saveKBArticles(),
        ])
        loadTenant()
      } else {
        setError(data.error?.message || 'Failed to update tenant')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const saveCategories = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      await fetch(`/api/v1/admin/tenants/${tenantId}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categories: selectedCategories }),
      })
    } catch (err) {
      // Ignore errors
    }
  }

  const saveKBArticles = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      await fetch(`/api/v1/admin/tenants/${tenantId}/kb-articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ articleIds: selectedKBArticles }),
      })
    } catch (err) {
      // Ignore errors
    }
  }

  const addCategory = () => {
    if (categoryInput.trim() && !selectedCategories.includes(categoryInput.trim())) {
      setSelectedCategories([...selectedCategories, categoryInput.trim()])
      setCategoryInput('')
    }
  }

  const removeCategory = (category: string) => {
    setSelectedCategories(selectedCategories.filter((c) => c !== category))
  }

  const getTenantUrl = () => {
    if (typeof window === 'undefined' || !tenant) return ''
    return `${window.location.origin}/tenant/${tenant.slug}`
  }

  const copyToClipboard = async () => {
    const url = getTenantUrl()
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const addAssignment = async () => {
    if (!selectedUser) return

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/admin/tenants/${tenantId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUser,
          category: assignAllCategories ? null : selectedCategory || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSelectedUser('')
        setSelectedCategory('')
        setAssignAllCategories(false)
        loadTenant()
      } else {
        setError(data.error?.message || 'Failed to add assignment')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  const removeAssignment = async (assignmentId: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/admin/tenants/${tenantId}/assignments?assignmentId=${assignmentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        loadTenant()
      }
    } catch (err) {
      setError('Failed to remove assignment')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Loading tenant...</p>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Tenant not found</p>
        <Link href="/admin/tenants">Back to Tenants</Link>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Edit Tenant: {tenant.name}</h1>
        <Link
          href="/admin/tenants"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            textDecoration: 'none',
            borderRadius: '8px',
          }}
        >
          Back to Tenants
        </Link>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--error)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
        {(['basic', 'categories', 'kb', 'fields', 'assignments'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: activeTab === tab ? 'var(--bg-tertiary)' : 'transparent',
              color: 'var(--text-primary)',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--accent-primary)' : '2px solid transparent',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'kb' ? 'KB Articles' : tab}
          </button>
        ))}
      </div>

      {/* Basic Info Tab */}
      {activeTab === 'basic' && (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Public URL Section */}
          {tenant && (
            <div
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}
            >
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.875rem' }}>
                Public URL (Share with customers)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <code
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    color: 'var(--accent-primary)',
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={getTenantUrl()}
                >
                  {getTenantUrl()}
                </code>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: copiedUrl ? 'var(--success)' : 'var(--accent-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'background-color 0.2s',
                  }}
                  title="Copy URL"
                >
                  {copiedUrl ? (
                    <>
                      <CheckIcon style={{ width: '16px', height: '16px' }} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <DocumentDuplicateIcon style={{ width: '16px', height: '16px' }} />
                      Copy
                    </>
                  )}
                </button>
                <a
                  href={`/tenant/${tenant.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    border: '1px solid var(--border-color)',
                  }}
                  title="Open in new tab"
                >
                  Open
                </a>
              </div>
              <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Customers can use this URL to submit tickets, view knowledge base articles, and chat with AI support.
              </p>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Tenant Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Slug *
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              pattern="[a-z0-9-]+"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Logo
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleLogoUpload}
              disabled={uploadingLogo}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                cursor: uploadingLogo ? 'not-allowed' : 'pointer',
                opacity: uploadingLogo ? 0.6 : 1,
              }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Upload an image file (JPEG, PNG, GIF, WebP). Max size: 5MB
            </p>

            {/* Logo Preview */}
            {logoPreview && (
              <div style={{ marginTop: '1rem', position: 'relative', display: 'inline-block' }}>
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  style={{
                    maxWidth: '200px',
                    maxHeight: '200px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    padding: '0.5rem',
                    backgroundColor: 'var(--bg-secondary)',
                  }}
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                  }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.requiresLogin}
                onChange={(e) => setFormData({ ...formData, requiresLogin: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              <span>Require login to submit tickets</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              <span>Active</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Add Category
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCategory()
                  }
                }}
                placeholder="Category name"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                type="button"
                onClick={addCategory}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '1rem' }}>Categories</h3>
            {selectedCategories.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No categories added yet.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {selectedCategories.map((cat) => (
                  <span
                    key={cat}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {cat}
                    <button
                      type="button"
                      onClick={() => removeCategory(cat)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--error)',
                        cursor: 'pointer',
                        padding: '0',
                        fontSize: '1.25rem',
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={async () => {
              await saveCategories()
              setError('Categories saved!')
              setTimeout(() => setError(''), 3000)
            }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Save Categories
          </button>
        </div>
      )}

      {/* KB Articles Tab */}
      {activeTab === 'kb' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Select Knowledge Base Articles</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
              {allKBArticles.map((article) => (
                <label
                  key={article.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedKBArticles.includes(article.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedKBArticles([...selectedKBArticles, article.id])
                      } else {
                        setSelectedKBArticles(selectedKBArticles.filter((id) => id !== article.id))
                      }
                    }}
                  />
                  <span>{article.title}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={async () => {
              await saveKBArticles()
              setError('KB articles saved!')
              setTimeout(() => setError(''), 3000)
            }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Save KB Articles
          </button>
        </div>
      )}

      {/* Custom Fields Tab */}
      {activeTab === 'fields' && (
        <div>
          <p style={{ color: 'var(--text-secondary)' }}>Custom fields management coming soon...</p>
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Add Assignment</h3>
            <div style={{ display: 'grid', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  User
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="">Select a user...</option>
                  {allUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={assignAllCategories}
                    onChange={(e) => {
                      setAssignAllCategories(e.target.checked)
                      if (e.target.checked) {
                        setSelectedCategory('')
                      }
                    }}
                  />
                  <span>Assign to all categories</span>
                </label>
                {!assignAllCategories && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="">All categories</option>
                    {selectedCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button
                onClick={addAssignment}
                disabled={!selectedUser}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: !selectedUser ? 'not-allowed' : 'pointer',
                  opacity: !selectedUser ? 0.6 : 1,
                }}
              >
                Add Assignment
              </button>
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '1rem' }}>Current Assignments</h3>
            {tenant.assignments.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No assignments yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {tenant.assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    style={{
                      padding: '1rem',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {assignment.user.firstName && assignment.user.lastName
                          ? `${assignment.user.firstName} ${assignment.user.lastName}`
                          : assignment.user.email}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {assignment.category || 'All categories'}
                      </div>
                    </div>
                    <button
                      onClick={() => removeAssignment(assignment.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--error)',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
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

