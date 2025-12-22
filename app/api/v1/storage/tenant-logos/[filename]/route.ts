import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    
    // Security: prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_FILENAME', message: 'Invalid filename' } },
        { status: 400 }
      )
    }

    const filepath = join(process.cwd(), 'storage', 'tenant-logos', filename)

    if (!existsSync(filepath)) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'File not found' } },
        { status: 404 }
      )
    }

    const file = await readFile(filepath)
    const extension = filename.split('.').pop()?.toLowerCase() || 'png'
    const contentType = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    }[extension] || 'image/png'

    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to serve file' } },
      { status: 500 }
    )
  }
}

