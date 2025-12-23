'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TicketStatus, TicketPriority } from '@prisma/client'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

interface Ticket {
  id: string
  ticketNumber: string
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  createdAt: string
  updatedAt: string
  requester?: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
  } | null
  requesterEmail?: string | null
  requesterName?: string | null
  assignee?: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
  } | null
  tenant?: {
    id: string
    name: string
    slug: string
  } | null
}

interface TicketsTableProps {
  tickets: Ticket[]
  onStatusChange?: (ticketId: string, newStatus: TicketStatus) => Promise<void>
  showQuickActions?: boolean
  onRefresh?: () => void
  disableClientSort?: boolean // Disable client-side sorting (for server-side sorted data)
  onSortChange?: (field: string, order: 'asc' | 'desc') => void // Callback for server-side sorting
  currentSortField?: string // Current sort field (for server-side sorting display)
  currentSortOrder?: 'asc' | 'desc' // Current sort order (for server-side sorting display)
}

export default function TicketsTable({ 
  tickets, 
  onStatusChange, 
  showQuickActions = true, 
  onRefresh,
  disableClientSort = false,
  onSortChange,
  currentSortField: externalSortField,
  currentSortOrder: externalSortOrder,
}: TicketsTableProps) {
  const [internalSortField, setInternalSortField] = useState<string>('createdAt')
  const [internalSortOrder, setInternalSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Use external sort state if provided, otherwise use internal state
  const sortField = disableClientSort && externalSortField !== undefined ? externalSortField : internalSortField
  const sortOrder = disableClientSort && externalSortOrder !== undefined ? externalSortOrder : internalSortOrder
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({})

  const handleSort = (field: string) => {
    if (disableClientSort && onSortChange) {
      // Server-side sorting
      const newOrder = sortField === field && sortOrder === 'desc' ? 'asc' : 'desc'
      onSortChange(field, newOrder)
    } else {
      // Client-side sorting
      if (sortField === field) {
        setInternalSortOrder(internalSortOrder === 'asc' ? 'desc' : 'asc')
      } else {
        setInternalSortField(field)
        setInternalSortOrder('desc')
      }
    }
  }

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    if (!onStatusChange) return

    setUpdatingStatus(prev => ({ ...prev, [ticketId]: true }))
    try {
      await onStatusChange(ticketId, newStatus)
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [ticketId]: false }))
    }
  }

  const sortedTickets = disableClientSort ? tickets : [...tickets].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortField) {
      case 'ticketNumber':
        aValue = a.ticketNumber
        bValue = b.ticketNumber
        break
      case 'subject':
        aValue = a.subject
        bValue = b.subject
        break
      case 'status':
        aValue = a.status
        bValue = b.status
        break
      case 'priority':
        aValue = a.priority
        bValue = b.priority
        break
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      case 'updatedAt':
        aValue = new Date(a.updatedAt).getTime()
        bValue = new Date(b.updatedAt).getTime()
        break
      case 'requester':
        aValue = a.requester?.email || a.requesterEmail || ''
        bValue = b.requester?.email || b.requesterEmail || ''
        break
      case 'assignee':
        aValue = a.assignee?.email || ''
        bValue = b.assignee?.email || ''
        break
      default:
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'NEW':
        return 'rgba(59, 130, 246, 0.15)'
      case 'IN_PROGRESS':
        return 'rgba(234, 179, 8, 0.15)'
      case 'RESOLVED':
        return 'rgba(34, 197, 94, 0.15)'
      case 'CLOSED':
        return 'rgba(107, 114, 128, 0.15)'
      default:
        return 'var(--bg-tertiary)'
    }
  }

  const getStatusTextColor = (status: TicketStatus) => {
    switch (status) {
      case 'NEW':
        return 'rgb(59, 130, 246)'
      case 'IN_PROGRESS':
        return 'rgb(234, 179, 8)'
      case 'RESOLVED':
        return 'rgb(34, 197, 94)'
      case 'CLOSED':
        return 'rgb(107, 114, 128)'
      default:
        return 'var(--text-secondary)'
    }
  }

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'LOW':
        return 'rgba(34, 197, 94, 0.15)'
      case 'MEDIUM':
        return 'rgba(234, 179, 8, 0.15)'
      case 'HIGH':
        return 'rgba(251, 146, 60, 0.15)'
      case 'CRITICAL':
        return 'rgba(239, 68, 68, 0.15)'
      default:
        return 'var(--bg-tertiary)'
    }
  }

  const getPriorityTextColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'LOW':
        return 'rgb(34, 197, 94)'
      case 'MEDIUM':
        return 'rgb(234, 179, 8)'
      case 'HIGH':
        return 'rgb(251, 146, 60)'
      case 'CRITICAL':
        return 'rgb(239, 68, 68)'
      default:
        return 'var(--text-secondary)'
    }
  }

  const getRequesterName = (ticket: Ticket) => {
    if (ticket.requester) {
      const name = [ticket.requester.firstName, ticket.requester.lastName].filter(Boolean).join(' ')
      return name || ticket.requester.email
    }
    return ticket.requesterName || ticket.requesterEmail || 'Unknown'
  }

  const SortableHeader = ({ field, label }: { field: string; label: string }) => (
    <th
      style={{
        padding: '0.875rem 1rem',
        textAlign: 'left',
        fontWeight: 600,
        fontSize: '0.875rem',
        cursor: 'pointer',
        userSelect: 'none',
        position: 'relative',
      }}
      onClick={() => handleSort(field)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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

  if (tickets.length === 0) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        No tickets found.
      </div>
    )
  }

  return (
    <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <SortableHeader field="ticketNumber" label="Ticket #" />
            <SortableHeader field="subject" label="Subject" />
            <SortableHeader field="requester" label="Requester" />
            <SortableHeader field="assignee" label="Assignee" />
            <SortableHeader field="status" label="Status" />
            <SortableHeader field="priority" label="Priority" />
            <SortableHeader field="createdAt" label="Created" />
            {showQuickActions && (
              <th style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 600, fontSize: '0.875rem' }}>
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedTickets.map((ticket) => (
            <tr key={ticket.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '1rem' }}>
                <Link
                  href={`/tickets/${ticket.id}`}
                  style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}
                >
                  {ticket.ticketNumber}
                </Link>
              </td>
              <td style={{ padding: '1rem' }}>
                <Link
                  href={`/tickets/${ticket.id}`}
                  style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
                >
                  {ticket.subject}
                </Link>
              </td>
              <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                {getRequesterName(ticket)}
              </td>
              <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                {ticket.assignee
                  ? [ticket.assignee.firstName, ticket.assignee.lastName].filter(Boolean).join(' ') || ticket.assignee.email
                  : 'Unassigned'}
              </td>
              <td style={{ padding: '1rem' }}>
                <span
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: getStatusColor(ticket.status),
                    color: getStatusTextColor(ticket.status),
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textTransform: 'capitalize',
                  }}
                >
                  {ticket.status.replace('_', ' ')}
                </span>
              </td>
              <td style={{ padding: '1rem' }}>
                <span
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: getPriorityColor(ticket.priority),
                    color: getPriorityTextColor(ticket.priority),
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textTransform: 'capitalize',
                  }}
                >
                  {ticket.priority}
                </span>
              </td>
              <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {new Date(ticket.createdAt).toLocaleDateString()} {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </td>
              {showQuickActions && (
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  {onStatusChange && (
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value as TicketStatus)}
                      disabled={updatingStatus[ticket.id]}
                      style={{
                        padding: '0.375rem 0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        cursor: updatingStatus[ticket.id] ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      <option value="NEW">New</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

