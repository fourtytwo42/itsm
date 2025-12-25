/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TenantChatWidget from '@/components/TenantChatWidget'

// Mock fetch
global.fetch = jest.fn()

describe('TenantChatWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    Storage.prototype.getItem = jest.fn()
  })

  it('should render chat button when closed', () => {
    render(<TenantChatWidget tenantId="tenant-1" />)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should open chat when button is clicked', () => {
    render(<TenantChatWidget tenantId="tenant-1" />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(screen.getByText('Support Chat')).toBeInTheDocument()
  })

  it('should display initial message', () => {
    render(<TenantChatWidget tenantId="tenant-1" />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(screen.getByText(/Hello! I can help you/i)).toBeInTheDocument()
  })

  it('should send message with tenantId', async () => {
    Storage.prototype.getItem = jest.fn(() => 'test-token')
    
    const mockResponse = {
      success: true,
      data: { response: 'Test response' },
    }
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    render(<TenantChatWidget tenantId="tenant-1" />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    const input = screen.getByPlaceholderText('Type your message...')
    fireEvent.change(input, { target: { value: 'Test message' } })
    
    const sendButtons = screen.getAllByRole('button')
    const sendButton = sendButtons.find(btn => btn.type === 'button' && !btn.disabled) || sendButtons[sendButtons.length - 1]
    
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: expect.stringContaining('tenant-1'),
      })
    })
  })

  it('should handle send error gracefully', async () => {
    Storage.prototype.getItem = jest.fn(() => 'test-token')
    
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<TenantChatWidget tenantId="tenant-1" />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    const input = screen.getByPlaceholderText('Type your message...')
    fireEvent.change(input, { target: { value: 'Test' } })
    
    const sendButtons = screen.getAllByRole('button')
    const sendButton = sendButtons.find(btn => btn.type === 'button' && !btn.disabled) || sendButtons[sendButtons.length - 1]
    
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Sorry, I encountered an error/i)).toBeInTheDocument()
    })
  })

  it('should close chat when close button is clicked', () => {
    render(<TenantChatWidget tenantId="tenant-1" />)
    
    const openButton = screen.getByRole('button')
    fireEvent.click(openButton)
    
    expect(screen.getByText('Support Chat')).toBeInTheDocument()
    
    const buttons = screen.getAllByRole('button')
    const closeButton = buttons.find(btn => btn.textContent === '' || btn.querySelector('svg'))
    
    if (closeButton) {
      fireEvent.click(closeButton)
      // After closing, the chat should no longer be visible
      expect(screen.queryByText('Support Chat')).not.toBeInTheDocument()
    }
  })

  it('should send message on Enter key press', async () => {
    Storage.prototype.getItem = jest.fn(() => 'test-token')
    
    const mockResponse = {
      success: true,
      data: { response: 'Response' },
    }
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    render(<TenantChatWidget tenantId="tenant-1" />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    const input = screen.getByPlaceholderText('Type your message...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Test' } })
    
    // Use keyPress to trigger the handler
    fireEvent.keyPress(input, { key: 'Enter', charCode: 13 })
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    }, { timeout: 2000 })
  })
})

