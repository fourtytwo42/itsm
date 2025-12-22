import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, requireAnyRole } from '@/lib/middleware/auth'
import { updateOrganization } from '@/lib/services/organization-service'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request)
    requireAuth(authContext)
    requireAnyRole(authContext, ['GLOBAL_ADMIN', 'ADMIN', 'IT_MANAGER'])

    const formData = await request.formData()
    const file = formData.get('file') as File
    const organizationId = formData.get('organizationId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      )
    }

    // Verify user can manage this organization
    if (!authContext.user.isGlobalAdmin) {
      if (authContext.user.organizationId !== organizationId) {
        return NextResponse.json(
          { error: 'Forbidden: No access to this organization' },
          { status: 403 }
        )
      }
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'organization-logos')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${organizationId}-${timestamp}.${extension}`
    const filepath = join(uploadsDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Update organization with logo path
    const logoUrl = `/uploads/organization-logos/${filename}`
    await updateOrganization(organizationId, { logo: logoUrl })

    return NextResponse.json({ logoUrl })
  } catch (error: any) {
    console.error('Logo upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

