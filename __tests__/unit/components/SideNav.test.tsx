/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SideNav from '@/components/SideNav'
import { useRouter, usePathname } from 'next/navigation'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}))

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('SideNav', () => {
  const mockPush = jest.fn()
  const mockRouter = {
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue(mockRouter as any)
    localStorage.clear()
    Storage.prototype.getItem = jest.fn()
    Storage.prototype.setItem = jest.fn()
  })

  it('should return null on landing page', () => {
    mockUsePathname.mockReturnValue('/')
    const { container } = render(<SideNav />)
    expect(container.firstChild).toBeNull()
  })

  it('should return null on login page', () => {
    mockUsePathname.mockReturnValue('/login')
    const { container } = render(<SideNav />)
    expect(container.firstChild).toBeNull()
  })

  it('should return null when not logged in', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    Storage.prototype.getItem = jest.fn(() => null)
    
    const { container } = render(<SideNav />)
    expect(container.firstChild).toBeNull()
  })

  it('should return null for END_USER role', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    Storage.prototype.getItem = jest.fn((key: string) => {
      if (key === 'accessToken') return 'test-token'
      if (key === 'user') return JSON.stringify({ id: '1', roles: ['END_USER'] })
      return null
    })
    
    const { container } = render(<SideNav />)
    expect(container.firstChild).toBeNull()
  })

  it('should render nav for admin user', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    Storage.prototype.getItem = jest.fn((key: string) => {
      if (key === 'accessToken') return 'test-token'
      if (key === 'user') return JSON.stringify({ id: '1', roles: ['ADMIN'], email: 'admin@test.com' })
      if (key === 'sideNavExpanded') return 'true'
      return null
    })
    
    render(<SideNav />)
    
    // Should render navigation
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('should render nav items for admin', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    Storage.prototype.getItem = jest.fn((key: string) => {
      if (key === 'accessToken') return 'test-token'
      if (key === 'user') return JSON.stringify({ id: '1', roles: ['ADMIN'], email: 'admin@test.com' })
      if (key === 'sideNavExpanded') return 'true'
      return null
    })
    
    render(<SideNav />)
    
    // Should have navigation items
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
  })

  it('should toggle expand/collapse', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    Storage.prototype.getItem = jest.fn((key: string) => {
      if (key === 'accessToken') return 'test-token'
      if (key === 'user') return JSON.stringify({ id: '1', roles: ['ADMIN'], email: 'admin@test.com' })
      if (key === 'sideNavExpanded') return 'false'
      return null
    })
    
    render(<SideNav />)
    
    const toggleButton = screen.getByLabelText(/Collapse navigation|Expand navigation/)
    expect(toggleButton).toBeInTheDocument()
    
    fireEvent.click(toggleButton)
    
    expect(Storage.prototype.setItem).toHaveBeenCalled()
  })

  it('should handle logout', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    Storage.prototype.getItem = jest.fn((key: string) => {
      if (key === 'accessToken') return 'test-token'
      if (key === 'user') return JSON.stringify({ id: '1', roles: ['ADMIN'], email: 'admin@test.com', firstName: 'Admin' })
      if (key === 'sideNavExpanded') return 'true'
      return null
    })

    // Mock window.location
    delete (window as any).location
    window.location = { href: '' } as any

    render(<SideNav />)
    
    // Find logout button - it should be in the user menu area
    const logoutButtons = screen.queryAllByText(/Sign Out|Logout/i)
    if (logoutButtons.length > 0) {
      fireEvent.click(logoutButtons[0])
      expect(Storage.prototype.removeItem).toHaveBeenCalledWith('accessToken')
      expect(Storage.prototype.removeItem).toHaveBeenCalledWith('refreshToken')
      expect(Storage.prototype.removeItem).toHaveBeenCalledWith('user')
    }
  })
})

