'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface ChangeRequest {
  id: string
  changeNumber: string
  title: string
  description: string
  type: string
  status: string
  priority: string
  riskLevel?: string
  requester: {
    id: string
    email: string
    firstName?: string
    lastName?: string
  }
  relatedTicket?: {
    id: string
    ticketNumber: string
    subject: string
  }
  plannedStartDate?: string
  plannedEndDate?: string
  actualStartDate?: string
  actualEndDate?: string
  implementationNotes?: string
  approvals: Array<{
    id: string
    stage: number
    status: string
    comments?: string
    approvedAt?: string
    approver: {
      id: string
      email: string
      firstName?: string
      lastName?: string
    }
  }>
}

export default function ChangeDetailPage() {
  const params = useParams()
  const [changeRequest, setChangeRequest] = useState<ChangeRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadChangeRequest(params.id as string)
    }
  }, [params.id])

  const loadChangeRequest = async (id: string) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/changes/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()
      if (data.success) {
        setChangeRequest(data.data.changeRequest)
      }
    } catch (error) {
      console.error('Failed to load change request:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/changes/${params.id}/submit`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await response.json()
      if (data.success) {
        await loadChangeRequest(params.id as string)
      }
    } catch (error) {
      console.error('Failed to submit change request:', error)
    }
  }

  const handleApprove = async (stage: number, approved: boolean, comments?: string) => {
    try {
      setApproving(true)
      const token = localStorage.getItem('accessToken')
      const userResponse = await fetch('/api/v1/auth/me', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const userData = await userResponse.json()

      const response = await fetch(`/api/v1/changes/${params.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          approverId: userData.data?.user?.id || '',
          stage,
          approved,
          comments,
        }),
      })

      const data = await response.json()
      if (data.success) {
        await loadChangeRequest(params.id as string)
      }
    } catch (error) {
      console.error('Failed to approve change request:', error)
    } finally {
      setApproving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading change request...</div>
  }

  if (!changeRequest) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Change request not found</p>
        <Link href="/changes">Back to Changes</Link>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/changes" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
          ← Back to Changes
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>{changeRequest.title}</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{changeRequest.changeNumber}</p>
        </div>
        {changeRequest.status === 'DRAFT' && (
          <button
            onClick={handleSubmit}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Submit for Approval
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div
          style={{
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>
              <strong>Status:</strong> {changeRequest.status}
            </div>
            <div>
              <strong>Type:</strong> {changeRequest.type}
            </div>
            <div>
              <strong>Priority:</strong> {changeRequest.priority}
            </div>
            {changeRequest.riskLevel && (
              <div>
                <strong>Risk Level:</strong> {changeRequest.riskLevel}
              </div>
            )}
            <div>
              <strong>Requester:</strong>{' '}
              {`${changeRequest.requester.firstName || ''} ${changeRequest.requester.lastName || ''}`.trim() ||
                changeRequest.requester.email}
            </div>
            {changeRequest.relatedTicket && (
              <div>
                <strong>Related Ticket:</strong>{' '}
                <Link href={`/tickets/${changeRequest.relatedTicket.id}`} style={{ color: 'var(--accent-primary)' }}>
                  {changeRequest.relatedTicket.ticketNumber} - {changeRequest.relatedTicket.subject}
                </Link>
              </div>
            )}
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
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Timeline</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {changeRequest.plannedStartDate && (
              <div>
                <strong>Planned Start:</strong> {new Date(changeRequest.plannedStartDate).toLocaleDateString()}
              </div>
            )}
            {changeRequest.plannedEndDate && (
              <div>
                <strong>Planned End:</strong> {new Date(changeRequest.plannedEndDate).toLocaleDateString()}
              </div>
            )}
            {changeRequest.actualStartDate && (
              <div>
                <strong>Actual Start:</strong> {new Date(changeRequest.actualStartDate).toLocaleDateString()}
              </div>
            )}
            {changeRequest.actualEndDate && (
              <div>
                <strong>Actual End:</strong> {new Date(changeRequest.actualEndDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          backgroundColor: 'var(--bg-secondary)',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Description</h2>
        <p style={{ whiteSpace: 'pre-wrap' }}>{changeRequest.description}</p>
      </div>

      {changeRequest.approvals && changeRequest.approvals.length > 0 && (
        <div
          style={{
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-secondary)',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Approvals</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {changeRequest.approvals.map((approval) => (
              <div key={approval.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <div>
                    <strong>Stage {approval.stage}:</strong> {approval.approver.firstName || ''}{' '}
                    {approval.approver.lastName || ''} ({approval.approver.email})
                  </div>
                  <div>
                    <strong>Status:</strong> {approval.status}
                  </div>
                </div>
                {approval.comments && (
                  <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                    <strong>Comments:</strong> {approval.comments}
                  </div>
                )}
                {approval.status === 'PENDING' && changeRequest.status === 'IN_REVIEW' && (
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        const comments = prompt('Enter approval comments (optional):')
                        handleApprove(approval.stage, true, comments || undefined)
                      }}
                      disabled={approving}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'green',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: approving ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const comments = prompt('Enter rejection comments (optional):')
                        handleApprove(approval.stage, false, comments || undefined)
                      }}
                      disabled={approving}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'red',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: approving ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {changeRequest.implementationNotes && (
        <div
          style={{
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Implementation Notes</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{changeRequest.implementationNotes}</p>
        </div>
      )}
    </div>
  )
}

