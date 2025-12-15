import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/middleware/auth'
import {
  getCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
} from '@/lib/services/config-service'

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req)
    if (!authContext) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!authContext.user.roles.includes('ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const entityType = searchParams.get('entityType') || 'ticket'

    const fields = await getCustomFields(entityType)

    return NextResponse.json({
      success: true,
      data: { fields },
    })
  } catch (error: any) {
    console.error('Get custom fields error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'CUSTOM_FIELDS_ERROR', message: error.message } },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req)
    if (!authContext) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!authContext.user.roles.includes('ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const field = await createCustomField(body)

    return NextResponse.json({
      success: true,
      data: { field },
    })
  } catch (error: any) {
    console.error('Create custom field error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'CUSTOM_FIELDS_ERROR', message: error.message } },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req)
    if (!authContext) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!authContext.user.roles.includes('ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Field ID required' }, { status: 400 })
    }

    const field = await updateCustomField(id, data)

    return NextResponse.json({
      success: true,
      data: { field },
    })
  } catch (error: any) {
    console.error('Update custom field error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'CUSTOM_FIELDS_ERROR', message: error.message } },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req)
    if (!authContext) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!authContext.user.roles.includes('ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Field ID required' }, { status: 400 })
    }

    await deleteCustomField(id)

    return NextResponse.json({
      success: true,
      data: { message: 'Custom field deleted' },
    })
  } catch (error: any) {
    console.error('Delete custom field error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'CUSTOM_FIELDS_ERROR', message: error.message } },
      { status: 500 }
    )
  }
}

