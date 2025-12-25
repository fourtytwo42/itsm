/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import OrganizationContext from '@/components/OrganizationContext'

// Mock fetch
global.fetch = jest.fn()

describe('OrganizationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    Storage.prototype.getItem = jest.fn()
  })

  it('should return null when loading', () => {
    Storage.prototype.getItem = jest.fn(() => 'test-token')
    ;(global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    )

    const { container } = render(<OrganizationContext />)
    expect(container.firstChild).toBeNull()
  })

  it('should return null when no token', async () => {
    Storage.prototype.getItem = jest.fn(() => null)

    const { container } = render(<OrganizationContext />)

    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })

  it('should fetch and display organization', async () => {
    const mockOrganization = {
      id: 'org-1',
      name: 'Test Organization',
      slug: 'test-org',
      logo: 'https://example.com/logo.png',
    }

    Storage.prototype.getItem = jest.fn(() => 'test-token')
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        organization: mockOrganization,
      }),
    })

    render(<OrganizationContext />)

    await waitFor(() => {
      expect(screen.getByText('Test Organization')).toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/v1/organizations/me', {
      headers: {
        Authorization: 'Bearer test-token',
      },
    })
  })

  it('should display organization logo when available', async () => {
    const mockOrganization = {
      id: 'org-1',
      name: 'Test Organization',
      slug: 'test-org',
      logo: 'https://example.com/logo.png',
    }

    Storage.prototype.getItem = jest.fn(() => 'test-token')
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        organization: mockOrganization,
      }),
    })

    render(<OrganizationContext />)

    await waitFor(() => {
      const img = screen.getByAltText('Test Organization')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/logo.png')
    })
  })

  it('should not display logo when not available', async () => {
    const mockOrganization = {
      id: 'org-1',
      name: 'Test Organization',
      slug: 'test-org',
    }

    Storage.prototype.getItem = jest.fn(() => 'test-token')
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        organization: mockOrganization,
      }),
    })

    render(<OrganizationContext />)

    await waitFor(() => {
      expect(screen.getByText('Test Organization')).toBeInTheDocument()
      expect(screen.queryByAltText('Test Organization')).not.toBeInTheDocument()
    })
  })

  it('should render organization as link', async () => {
    const mockOrganization = {
      id: 'org-1',
      name: 'Test Organization',
      slug: 'test-org',
    }

    Storage.prototype.getItem = jest.fn(() => 'test-token')
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        organization: mockOrganization,
      }),
    })

    render(<OrganizationContext />)

    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'Test Organization' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/organization/settings')
    })
  })

  it('should return null when fetch fails', async () => {
    Storage.prototype.getItem = jest.fn(() => 'test-token')
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const { container } = render(<OrganizationContext />)

    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })

  it('should return null when response is not ok', async () => {
    Storage.prototype.getItem = jest.fn(() => 'test-token')
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    })

    const { container } = render(<OrganizationContext />)

    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })
})

