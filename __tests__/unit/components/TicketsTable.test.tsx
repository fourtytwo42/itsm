/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TicketsTable from '@/components/TicketsTable'
import { TicketStatus, TicketPriority } from '@prisma/client'

const mockTickets = [
  {
    id: '1',
    ticketNumber: 'TKT-001',
    subject: 'Test Ticket 1',
    description: 'Test Description',
    status: TicketStatus.NEW,
    priority: TicketPriority.MEDIUM,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
    requester: {
      id: 'req-1',
      email: 'requester@test.com',
      firstName: 'John',
      lastName: 'Doe',
    },
    assignee: null,
  },
  {
    id: '2',
    ticketNumber: 'TKT-002',
    subject: 'Test Ticket 2',
    description: 'Test Description 2',
    status: TicketStatus.IN_PROGRESS,
    priority: TicketPriority.HIGH,
    createdAt: new Date('2024-01-02').toISOString(),
    updatedAt: new Date('2024-01-02').toISOString(),
    requesterEmail: 'requester2@test.com',
    requesterName: 'Jane Smith',
    assignee: {
      id: 'assignee-1',
      email: 'assignee@test.com',
      firstName: 'Assign',
      lastName: 'Ee',
    },
  },
]

describe('TicketsTable', () => {
  it('should render empty state when no tickets', () => {
    render(<TicketsTable tickets={[]} />)
    expect(screen.getByText('No tickets found.')).toBeInTheDocument()
  })

  it('should render tickets', () => {
    render(<TicketsTable tickets={mockTickets} />)
    expect(screen.getByText('TKT-001')).toBeInTheDocument()
    expect(screen.getByText('TKT-002')).toBeInTheDocument()
    expect(screen.getByText('Test Ticket 1')).toBeInTheDocument()
    expect(screen.getByText('Test Ticket 2')).toBeInTheDocument()
  })

  it('should display requester name', () => {
    render(<TicketsTable tickets={mockTickets} />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('should display assignee name', () => {
    render(<TicketsTable tickets={mockTickets} />)
    expect(screen.getByText('Assign Ee')).toBeInTheDocument()
    expect(screen.getByText('Unassigned')).toBeInTheDocument()
  })

  it('should call onStatusChange when status is changed', async () => {
    const mockOnStatusChange = jest.fn().mockResolvedValue(undefined)
    render(<TicketsTable tickets={mockTickets} onStatusChange={mockOnStatusChange} />)
    
    const statusSelects = screen.getAllByRole('combobox')
    if (statusSelects.length > 0) {
      fireEvent.change(statusSelects[0], { target: { value: TicketStatus.RESOLVED } })
      
      await waitFor(() => {
        expect(mockOnStatusChange).toHaveBeenCalled()
        const calls = mockOnStatusChange.mock.calls
        expect(calls[0][1]).toBe(TicketStatus.RESOLVED)
      })
    }
  })

  it('should not show quick actions column when showQuickActions is false', () => {
    const { container } = render(<TicketsTable tickets={mockTickets} showQuickActions={false} />)
    // Actions column header should not be present
    const headers = Array.from(container.querySelectorAll('th')).map(th => th.textContent)
    expect(headers).not.toContain('Actions')
  })

  it('should handle sorting when disableClientSort is false', () => {
    render(<TicketsTable tickets={mockTickets} />)
    const ticketNumberHeader = screen.getByText('Ticket #')
    fireEvent.click(ticketNumberHeader)
    // Should still render tickets
    expect(screen.getByText('TKT-001')).toBeInTheDocument()
  })

  it('should call onSortChange when disableClientSort is true', () => {
    const mockOnSortChange = jest.fn()
    render(
      <TicketsTable
        tickets={mockTickets}
        disableClientSort={true}
        onSortChange={mockOnSortChange}
      />
    )
    
    const ticketNumberHeader = screen.getByText('Ticket #')
    fireEvent.click(ticketNumberHeader)
    
    expect(mockOnSortChange).toHaveBeenCalled()
  })
})

