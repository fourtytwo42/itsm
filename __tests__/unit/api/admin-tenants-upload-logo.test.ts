/**
 * @jest-environment node
 */
import { POST } from '@/app/api/v1/admin/tenants/upload-logo/route'
import { NextRequest } from 'next/server'
import { getAuthContext } from '@/lib/middleware/auth'

jest.mock('@/lib/middleware/auth', () => ({
  getAuthContext: jest.fn(),
  requireAuth: jest.fn(),
}))

jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
  mkdir: jest.fn(),
}))

jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
}))

jest.mock('path', () => ({
  join: jest.fn((...args: any[]) => args.join('/')),
}))

const { writeFile, mkdir } = require('fs/promises')
const { existsSync } = require('fs')
const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

describe('POST /api/v1/admin/tenants/upload-logo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(existsSync as jest.Mock).mockReturnValue(false) // Directory doesn't exist by default
    ;(mkdir as jest.Mock).mockResolvedValue(undefined)
    ;(writeFile as jest.Mock).mockResolvedValue(undefined)
  })

  it('should upload tenant logo', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })

    const formData = new FormData()
    const blob = new Blob(['fake image data'], { type: 'image/png' })
    const file = new File([blob], 'logo.png', { type: 'image/png' })
    formData.append('file', file)

    const request = new NextRequest('http://localhost:3000/api/v1/admin/tenants/upload-logo', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.url).toBeDefined()
    expect(data.data.filename).toBeDefined()
  })

  it('should return 400 if no file provided', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })

    const formData = new FormData()
    const request = new NextRequest('http://localhost:3000/api/v1/admin/tenants/upload-logo', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 400 for invalid file type', async () => {
    mockGetAuthContext.mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
      },
    })

    const formData = new FormData()
    const blob = new Blob(['fake file data'], { type: 'application/pdf' })
    const file = new File([blob], 'document.pdf', { type: 'application/pdf' })
    formData.append('file', file)

    const request = new NextRequest('http://localhost:3000/api/v1/admin/tenants/upload-logo', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })
})
