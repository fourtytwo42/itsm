'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Asset {
  id: string
  assetNumber: string
  name: string
  type: string
  category?: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  status: string
  assignedTo?: {
    id: string
    email: string
    firstName?: string
    lastName?: string
  }
  location?: string
  building?: string
  floor?: string
  room?: string
  purchaseDate?: string
  purchasePrice?: number
  warrantyExpiry?: string
  relationships?: Array<{
    id: string
    relationshipType: string
    targetAsset: {
      id: string
      assetNumber: string
      name: string
    }
  }>
  relatedAssets?: Array<{
    id: string
    relationshipType: string
    sourceAsset: {
      id: string
      assetNumber: string
      name: string
    }
  }>
}

export default function AssetDetailPage() {
  const params = useParams()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadAsset(params.id as string)
    }
  }, [params.id])

  const loadAsset = async (id: string) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/assets/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()
      if (data.success) {
        setAsset(data.data.asset)
      }
    } catch (error) {
      console.error('Failed to load asset:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading asset...</div>
  }

  if (!asset) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Asset not found</p>
        <Link href="/assets">Back to Assets</Link>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/assets" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
          ← Back to Assets
        </Link>
      </div>

      <h1 style={{ marginBottom: '2rem' }}>{asset.name}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div
          style={{
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Basic Information</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>
              <strong>Asset Number:</strong> {asset.assetNumber}
            </div>
            <div>
              <strong>Type:</strong> {asset.type}
            </div>
            <div>
              <strong>Category:</strong> {asset.category || 'N/A'}
            </div>
            <div>
              <strong>Status:</strong> {asset.status}
            </div>
            <div>
              <strong>Manufacturer:</strong> {asset.manufacturer || 'N/A'}
            </div>
            <div>
              <strong>Model:</strong> {asset.model || 'N/A'}
            </div>
            <div>
              <strong>Serial Number:</strong> {asset.serialNumber || 'N/A'}
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
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Assignment & Location</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>
              <strong>Assigned To:</strong>{' '}
              {asset.assignedTo
                ? `${asset.assignedTo.firstName || ''} ${asset.assignedTo.lastName || ''}`.trim() ||
                  asset.assignedTo.email
                : 'Unassigned'}
            </div>
            <div>
              <strong>Location:</strong> {asset.location || 'N/A'}
            </div>
            <div>
              <strong>Building:</strong> {asset.building || 'N/A'}
            </div>
            <div>
              <strong>Floor:</strong> {asset.floor || 'N/A'}
            </div>
            <div>
              <strong>Room:</strong> {asset.room || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {(asset.relationships && asset.relationships.length > 0) ||
      (asset.relatedAssets && asset.relatedAssets.length > 0) ? (
        <div
          style={{
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-secondary)',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Relationships</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {asset.relationships?.map((rel) => (
              <div key={rel.id}>
                <strong>{rel.relationshipType}:</strong>{' '}
                <Link href={`/assets/${rel.targetAsset.id}`} style={{ color: 'var(--accent-primary)' }}>
                  {rel.targetAsset.assetNumber} - {rel.targetAsset.name}
                </Link>
              </div>
            ))}
            {asset.relatedAssets?.map((rel) => (
              <div key={rel.id}>
                <strong>{rel.relationshipType}:</strong>{' '}
                <Link href={`/assets/${rel.sourceAsset.id}`} style={{ color: 'var(--accent-primary)' }}>
                  {rel.sourceAsset.assetNumber} - {rel.sourceAsset.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

