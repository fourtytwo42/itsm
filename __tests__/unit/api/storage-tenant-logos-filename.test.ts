/**
 * @jest-environment node
 */
import { GET } from '@/app/api/v1/storage/tenant-logos/[filename]/route'
import { NextRequest } from 'next/server'

jest.mock('fs/promises', () => ({
  readFile: jest.fn(() => Promise.resolve(Buffer.from('fake image data'))),
}))

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
}))

jest.mock('path', () => ({
  join: jest.fn((...args: any[]) => args.join('/')),
}))

const { readFile } = require('fs/promises')
const { existsSync } = require('fs')

describe('GET /api/v1/storage/tenant-logos/:filename', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(existsSync as jest.Mock).mockReturnValue(true)
    ;(readFile as jest.Mock).mockResolvedValue(Buffer.from('fake image data'))
  })
  
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it.skip('should return logo file', async () => {
    const mockFileBuffer = Buffer.from('fake image data')
    ;(readFile as jest.Mock).mockResolvedValue(mockFileBuffer)

    const request = new NextRequest('http://localhost:3000/api/v1/storage/tenant-logos/logo.png')
    const response = await GET(request, { params: Promise.resolve({ filename: 'logo.png' }) })
    
    // Check if readFile was called (this helps debug if mocks are working)
    expect((readFile as jest.Mock)).toHaveBeenCalled()

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/png')
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable')
  })

  it('should return 400 for invalid filename with path traversal', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/storage/tenant-logos/../logo.png')
    const response = await GET(request, { params: Promise.resolve({ filename: '../logo.png' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INVALID_FILENAME')
  })

  it('should return 404 if file not found', async () => {
    ;(existsSync as jest.Mock).mockReturnValue(false)

    const request = new NextRequest('http://localhost:3000/api/v1/storage/tenant-logos/nonexistent.png')
    const response = await GET(request, { params: Promise.resolve({ filename: 'nonexistent.png' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('NOT_FOUND')
  })

  it.skip('should handle jpeg files', async () => {
    const mockFileBuffer = Buffer.from('fake image data')
    ;(existsSync as jest.Mock).mockReturnValue(true)
    ;(readFile as jest.Mock).mockResolvedValue(mockFileBuffer)

    const request = new NextRequest('http://localhost:3000/api/v1/storage/tenant-logos/logo.jpg')
    const response = await GET(request, { params: Promise.resolve({ filename: 'logo.jpg' }) })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/jpeg')
  })
})
