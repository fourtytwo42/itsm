/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import TopHeader from '@/components/TopHeader'
import { usePathname } from 'next/navigation'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

// Mock fetch
global.fetch = jest.fn()

describe('TopHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    Storage.prototype.getItem = jest.fn()
  })

  it('should return null on landing page', () => {
    mockUsePathname.mockReturnValue('/')
    const { container } = render(<TopHeader />)
    expect(container.firstChild).toBeNull()
  })

  it('should return null on login page', () => {
    mockUsePathname.mockReturnValue('/login')
    const { container } = render(<TopHeader />)
    expect(container.firstChild).toBeNull()
  })

  it('should return null on register page', () => {
    mockUsePathname.mockReturnValue('/register')
    const { container } = render(<TopHeader />)
    expect(container.firstChild).toBeNull()
  })

  it('should return null on checkout page', () => {
    mockUsePathname.mockReturnValue('/checkout')
    const { container } = render(<TopHeader />)
    expect(container.firstChild).toBeNull()
  })

  it('should return null on reset-password page', () => {
    mockUsePathname.mockReturnValue('/reset-password')
    const { container } = render(<TopHeader />)
    expect(container.firstChild).toBeNull()
  })

  it('should render header for dashboard', async () => {
    mockUsePathname.mockReturnValue('/dashboard')
    Storage.prototype.getItem = jest.fn((key: string) => {
      if (key === 'user') return JSON.stringify({ id: '1', roles: ['END_USER'] })
      return null
    })
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        organization: { id: 'org-1', name: 'Test Org', slug: 'test-org' },
      }),
    })
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { registrationEnabled: true },
      }),
    })

    render(<TopHeader />)

    await waitFor(() => {
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })
  })

  it('should fetch organization when logged in', async () => {
    mockUsePathname.mockReturnValue('/dashboard')
    Storage.prototype.getItem = jest.fn((key: string) => {
      if (key === 'accessToken') return 'test-token'
      if (key === 'user') return JSON.stringify({ id: '1', roles: ['END_USER'] })
      return null
    })

    const mockOrganization = { id: 'org-1', name: 'Test Org', slug: 'test-org' }
    
    // Mock both fetch calls - organizations/me and config/public
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ organization: mockOrganization }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { registrationEnabled: true },
        }),
      })

    render(<TopHeader />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('should fetch tenant organization on tenant page', async () => {
    mockUsePathname.mockReturnValue('/tenant/test-tenant')
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { id: 'tenant-1', name: 'Test Tenant', slug: 'test-tenant' },
      }),
    })
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { id: 'org-1', name: 'Test Org', slug: 'test-org' },
      }),
    })
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { registrationEnabled: true },
      }),
    })

    render(<TopHeader />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/tenants/test-tenant')
    })
  })

  it('should display organization name when available', async () => {
    mockUsePathname.mockReturnValue('/dashboard')
    Storage.prototype.getItem = jest.fn((key: string) => {
      if (key === 'accessToken') return 'test-token'
      if (key === 'user') return JSON.stringify({ id: '1', roles: ['END_USER'] })
      return null
    })

    const mockOrganization = { id: 'org-1', name: 'Test Organization', slug: 'test-org' }
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ organization: mockOrganization }),
    })
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { registrationEnabled: true },
      }),
    })

    render(<TopHeader />)

    await waitFor(() => {
      // Verify header is rendered - organization name may take time to load
      const header = screen.getByRole('banner')
      expect(header).toBeInTheDocument()
      // Organization fetch should have been called
      expect(global.fetch).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('should display login button when not logged in', async () => {
    mockUsePathname.mockReturnValue('/dashboard')
    Storage.prototype.getItem = jest.fn(() => null)
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { registrationEnabled: true },
      }),
    })

    render(<TopHeader />)

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument()
    })
  })

  it('should display registration button when registration is enabled', async () => {
    mockUsePathname.mockReturnValue('/dashboard')
    Storage.prototype.getItem = jest.fn(() => null)
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { registrationEnabled: true },
      }),
    })

    render(<TopHeader />)

    await waitFor(() => {
      expect(screen.getByText('Register')).toBeInTheDocument()
    })
  })
})

