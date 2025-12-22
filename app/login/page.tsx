'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const DEMO_ACCOUNTS = [
  { email: 'global@demo.com', password: 'demo123', label: 'Global Admin' },
  { email: 'admin@demo-organization.demo', password: 'demo123', label: 'Organization Admin' },
  { email: 'manager@demo.com', password: 'demo123', label: 'IT Manager' },
  { email: 'agent@demo.com', password: 'demo123', label: 'Agent' },
  { email: 'user@demo.com', password: 'demo123', label: 'End User' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const publicToken = localStorage.getItem('publicToken')
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(publicToken && { 'x-public-token': publicToken }),
        },
        body: JSON.stringify({ email, password }),
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        setError('Invalid response from server')
        setLoading(false)
        return
      }

      if (!response.ok || !data.success) {
        setError(data.error?.message || `Login failed: ${response.statusText || 'Unknown error'}`)
        setLoading(false)
        return
      }

      // Validate response structure
      if (!data.data?.accessToken || !data.data?.refreshToken || !data.data?.user) {
        setError('Invalid response structure from server')
        setLoading(false)
        return
      }

      // Store tokens
      try {
        localStorage.setItem('accessToken', data.data.accessToken)
        localStorage.setItem('refreshToken', data.data.refreshToken)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        
        // Clear public token after successful login (tickets are now merged)
        localStorage.removeItem('publicToken')
        localStorage.removeItem('publicTokenId')
      } catch (storageError) {
        setError('Failed to save login credentials')
        setLoading(false)
        return
      }

      // Reset loading state before redirect
      setLoading(false)
      
      // Check for redirect parameter
      const urlParams = new URLSearchParams(window.location.search)
      const redirect = urlParams.get('redirect') || '/dashboard'
      
      // Use window.location for full page reload to ensure middleware doesn't block
      window.location.href = redirect
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleDemoAccount = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'center' }}>
          ITSM Helpdesk
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Sign in to your account
        </p>

        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--error)',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            color: 'var(--error)',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
            Demo Accounts (Click to auto-fill):
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                className="btn btn-secondary"
                onClick={() => handleDemoAccount(account.email, account.password)}
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link href="/register" style={{ color: 'var(--accent-primary)', fontSize: '0.875rem' }}>
            Don't have an account? Sign up
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <Link href="/reset-password" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  )
}

