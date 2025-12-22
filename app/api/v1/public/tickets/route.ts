import { NextRequest, NextResponse } from 'next/server'
import { verifyPublicToken } from '@/lib/jwt'
import { listTickets } from '@/lib/services/ticket-service'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Public token required' } },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    try {
      const payload = verifyPublicToken(token)
      
      // Get tickets for this public token
      const tickets = await listTickets({
        publicTokenId: payload.publicId,
      })

      return NextResponse.json({ success: true, data: tickets })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired public token' } },
        { status: 401 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to fetch tickets' } },
      { status: 500 }
    )
  }
}

