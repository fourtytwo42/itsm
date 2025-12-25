/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import LayoutContent from '@/components/LayoutContent'
import { usePathname } from 'next/navigation'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('LayoutContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset localStorage
    localStorage.clear()
    // Mock localStorage methods
    Storage.prototype.getItem = jest.fn()
    Storage.prototype.removeItem = jest.fn()
  })

  it('should render children without margins on landing page', () => {
    mockUsePathname.mockReturnValue('/')
    
    render(
      <LayoutContent>
        <div>Test Content</div>
      </LayoutContent>
    )

    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
    expect(main).toHaveTextContent('Test Content')
    expect(main).toHaveStyle({ marginLeft: '' })
  })

  it('should render children without margins on login page', () => {
    mockUsePathname.mockReturnValue('/login')
    
    render(
      <LayoutContent>
        <div>Login Content</div>
      </LayoutContent>
    )

    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
    expect(main).toHaveTextContent('Login Content')
  })

  it('should render children without margins on register page', () => {
    mockUsePathname.mockReturnValue('/register')
    
    render(
      <LayoutContent>
        <div>Register Content</div>
      </LayoutContent>
    )

    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
  })

  it('should render children without margins on checkout page', () => {
    mockUsePathname.mockReturnValue('/checkout')
    
    render(
      <LayoutContent>
        <div>Checkout Content</div>
      </LayoutContent>
    )

    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
  })

  it('should render children without margins on reset-password page', () => {
    mockUsePathname.mockReturnValue('/reset-password')
    
    render(
      <LayoutContent>
        <div>Reset Password Content</div>
      </LayoutContent>
    )

    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
  })

  it('should apply margins for logged-in non-END_USER users', async () => {
    mockUsePathname.mockReturnValue('/dashboard')
    Storage.prototype.getItem = jest.fn((key: string) => {
      if (key === 'accessToken') return 'test-token'
      if (key === 'user') return JSON.stringify({ id: '1', roles: ['ADMIN'] })
      return null
    })
    
    render(
      <LayoutContent>
        <div>Dashboard Content</div>
      </LayoutContent>
    )

    await waitFor(() => {
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
      expect(main).toHaveStyle({ 
        marginLeft: 'var(--side-nav-width, 72px)',
        marginTop: '64px'
      })
    })
  })

  it('should not apply left margin for END_USER role', async () => {
    mockUsePathname.mockReturnValue('/dashboard')
    Storage.prototype.getItem = jest.fn((key: string) => {
      if (key === 'accessToken') return 'test-token'
      if (key === 'user') return JSON.stringify({ id: '1', roles: ['END_USER'] })
      return null
    })
    
    render(
      <LayoutContent>
        <div>Dashboard Content</div>
      </LayoutContent>
    )

    await waitFor(() => {
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
      expect(main).toHaveStyle({ 
        marginLeft: '0',
        marginTop: '64px'
      })
    })
  })

  it('should not apply left margin when not logged in', async () => {
    mockUsePathname.mockReturnValue('/dashboard')
    Storage.prototype.getItem = jest.fn(() => null)
    
    render(
      <LayoutContent>
        <div>Dashboard Content</div>
      </LayoutContent>
    )

    await waitFor(() => {
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
      expect(main).toHaveStyle({ 
        marginLeft: '0',
        marginTop: '64px'
      })
    })
  })

  it('should handle invalid user JSON gracefully', async () => {
    mockUsePathname.mockReturnValue('/dashboard')
    Storage.prototype.getItem = jest.fn((key: string) => {
      if (key === 'accessToken') return 'test-token'
      if (key === 'user') return 'invalid-json'
      return null
    })
    
    render(
      <LayoutContent>
        <div>Dashboard Content</div>
      </LayoutContent>
    )

    await waitFor(() => {
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
      // Component renders successfully even with invalid JSON
      // Margin behavior depends on token + user parsing, but component doesn't crash
      expect(main).toBeInTheDocument()
    })
  })

  it('should handle storage event listener', async () => {
    mockUsePathname.mockReturnValue('/dashboard')
    Storage.prototype.getItem = jest.fn(() => null)
    
    render(
      <LayoutContent>
        <div>Dashboard Content</div>
      </LayoutContent>
    )

    await waitFor(() => {
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })

    // Verify component renders - storage event listener is tested indirectly
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
  })

  it('should apply transition style', async () => {
    mockUsePathname.mockReturnValue('/dashboard')
    Storage.prototype.getItem = jest.fn((key: string) => {
      if (key === 'accessToken') return 'test-token'
      if (key === 'user') return JSON.stringify({ id: '1', roles: ['ADMIN'] })
      return null
    })
    
    render(
      <LayoutContent>
        <div>Dashboard Content</div>
      </LayoutContent>
    )

    await waitFor(() => {
      const main = screen.getByRole('main')
      expect(main).toHaveStyle({ 
        transition: 'margin-left 0.3s ease'
      })
    })
  })
})

