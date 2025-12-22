import { NextRequest } from 'next/server'
import { logEvent, CreateAuditLogInput } from '@/lib/services/audit-service'
import { AuditEventType } from '@prisma/client'

export async function auditLog(
  eventType: AuditEventType,
  entityType: string,
  entityId: string | null,
  userId: string,
  userEmail: string,
  description: string,
  metadata?: any,
  request?: NextRequest
) {
  // Extract IP address and user agent from request
  const ipAddress = request?.headers.get('x-forwarded-for') || 
                   request?.headers.get('x-real-ip') || 
                   'unknown'
  const userAgent = request?.headers.get('user-agent') || 'unknown'

  // Get organizationId from metadata if provided, otherwise null
  const organizationId = metadata?.organizationId ?? null

  try {
    await logEvent({
      organizationId,
      eventType,
      entityType,
      entityId,
      userId,
      userEmail,
      description,
      metadata,
      ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
      userAgent,
    })
  } catch (error) {
    // Don't throw - audit logging failures shouldn't break the application
    console.error('Failed to log audit event:', error)
  }
}

