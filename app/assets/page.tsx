'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Asset {
  id: string
  assetNumber: string
  name: string
  type: string
  status: string
  assignedTo?: {
    id: string
    email: string
    firstName?: string
    lastName?: string
  }
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: '',
  })

  useEffect(() => {
    loadAssets()
  }, [filters])

  const loadAssets = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const params = new URLSearchParams()
      if (filters.type) params.append('type', filters.type)
      if (filters.status) params.append('status', filters.status)
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`/api/v1/assets?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()
      if (data.success) {
        setAssets(data.data.assets)
      }
    } catch (error) {
      console.error('Failed to load assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const params = new URLSearchParams()
      if (filters.type) params.append('type', filters.type)
      if (filters.status) params.append('status', filters.status)
      if (filters.search) params.append('search', filters.search)
      params.append('export', 'csv')

      const response = await fetch(`/api/v1/assets?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `assets-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to export assets:', error)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Assets (CMDB)</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={handleExport}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Export CSV
          </button>
          <Link
            href="/assets/new"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
            }}
          >
            New Asset
          </Link>
        </div>
      </div>

      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search assets..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{
            padding: '0.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            flex: 1,
            minWidth: '200px',
          }}
        />
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          style={{
            padding: '0.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
          }}
        >
          <option value="">All Types</option>
          <option value="HARDWARE">Hardware</option>
          <option value="SOFTWARE">Software</option>
          <option value="NETWORK_DEVICE">Network Device</option>
          <option value="CLOUD_RESOURCE">Cloud Resource</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          style={{
            padding: '0.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
          }}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="RETIRED">Retired</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
      </div>

      {loading ? (
        <div>Loading assets...</div>
      ) : (
        <div
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Asset Number</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Assigned To</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No assets found
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>{asset.assetNumber}</td>
                    <td style={{ padding: '1rem' }}>{asset.name}</td>
                    <td style={{ padding: '1rem' }}>{asset.type}</td>
                    <td style={{ padding: '1rem' }}>{asset.status}</td>
                    <td style={{ padding: '1rem' }}>
                      {asset.assignedTo
                        ? `${asset.assignedTo.firstName || ''} ${asset.assignedTo.lastName || ''}`.trim() ||
                          asset.assignedTo.email
                        : 'Unassigned'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <Link
                        href={`/assets/${asset.id}`}
                        style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

