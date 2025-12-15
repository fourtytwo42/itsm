import prisma from '@/lib/prisma'
import { SettingCategory } from '@prisma/client'

export interface SystemConfig {
  // Authentication
  registrationEnabled: boolean
  passwordResetEnabled: boolean
  ssoEnabled: boolean
  ssoProvider?: 'oauth2' | 'saml'
  ssoConfig?: Record<string, any>
  ldapEnabled: boolean
  ldapConfig?: {
    host: string
    port: number
    baseDN: string
    bindDN: string
    bindPassword: string
    userSearchBase: string
    userSearchFilter: string
  }

  // Email
  emailNotificationsEnabled: boolean
  emailFromAddress: string
  emailFromName: string

  // File Upload
  maxFileSize: number // in bytes
  allowedFileTypes: string[] // MIME types or extensions

  // Branding
  organizationName: string
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  faviconUrl?: string

  // Ticket
  defaultTicketPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  autoAssignEnabled: boolean
  autoAssignMethod?: 'round-robin' | 'least-busy' | 'random'

  // System
  maintenanceMode: boolean
  maintenanceMessage?: string
  sessionTimeout: number // in minutes
}

const DEFAULT_CONFIG: SystemConfig = {
  registrationEnabled: true,
  passwordResetEnabled: true,
  ssoEnabled: false,
  ldapEnabled: false,
  emailNotificationsEnabled: true,
  emailFromAddress: 'noreply@example.com',
  emailFromName: 'ITSM Helpdesk',
  maxFileSize: 104857600, // 100MB
  allowedFileTypes: ['*'], // Allow all by default
  organizationName: 'ITSM Helpdesk',
  defaultTicketPriority: 'MEDIUM',
  autoAssignEnabled: false,
  maintenanceMode: false,
  sessionTimeout: 1440, // 24 hours
}

export async function getSystemConfig(): Promise<SystemConfig> {
  const settings = await prisma.systemSetting.findMany()

  const config: SystemConfig = { ...DEFAULT_CONFIG }

  settings.forEach((setting) => {
    const key = setting.key as keyof SystemConfig
    if (key in DEFAULT_CONFIG) {
      ;(config as any)[key] = setting.value
    }
  })

  return config
}

export async function getSetting(key: string): Promise<any> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key },
  })

  return setting?.value ?? null
}

export async function setSetting(
  key: string,
  value: any,
  category: SettingCategory,
  description?: string,
  updatedBy?: string
): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key },
    update: {
      value,
      category,
      description,
      updatedBy,
      updatedAt: new Date(),
    },
    create: {
      key,
      value,
      category,
      description,
      updatedBy,
    },
  })
}

export async function setSystemConfig(config: Partial<SystemConfig>, updatedBy?: string): Promise<void> {
  const updates = Object.entries(config).map(([key, value]) => {
    let category: SettingCategory = SettingCategory.SYSTEM

    if (['registrationEnabled', 'passwordResetEnabled', 'ssoEnabled', 'ssoProvider', 'ssoConfig', 'ldapEnabled', 'ldapConfig'].includes(key)) {
      category = SettingCategory.AUTHENTICATION
    } else if (['emailNotificationsEnabled', 'emailFromAddress', 'emailFromName'].includes(key)) {
      category = SettingCategory.EMAIL
    } else if (['maxFileSize', 'allowedFileTypes'].includes(key)) {
      category = SettingCategory.FILE_UPLOAD
    } else if (['organizationName', 'logoUrl', 'primaryColor', 'secondaryColor', 'faviconUrl'].includes(key)) {
      category = SettingCategory.BRANDING
    } else if (['defaultTicketPriority', 'autoAssignEnabled', 'autoAssignMethod'].includes(key)) {
      category = SettingCategory.TICKET
    }

    return setSetting(key, value, category, undefined, updatedBy)
  })

  await Promise.all(updates)
}

export async function getAllSettings(): Promise<Array<{ key: string; category: SettingCategory; value: any; description: string | null }>> {
  const settings = await prisma.systemSetting.findMany({
    orderBy: [{ category: 'asc' }, { key: 'asc' }],
  })

  return settings.map((s) => ({
    key: s.key,
    category: s.category,
    value: s.value,
    description: s.description,
  }))
}

export async function getSettingsByCategory(category: SettingCategory): Promise<Array<{ key: string; value: any; description: string | null }>> {
  const settings = await prisma.systemSetting.findMany({
    where: { category },
    orderBy: { key: 'asc' },
  })

  return settings.map((s) => ({
    key: s.key,
    value: s.value,
    description: s.description,
  }))
}

export async function deleteSetting(key: string): Promise<void> {
  await prisma.systemSetting.delete({
    where: { key },
  })
}

// Custom Fields
export async function getCustomFields(entityType: string): Promise<Array<{
  id: string
  name: string
  label: string
  type: string
  required: boolean
  defaultValue: string | null
  options: any
  order: number
}>> {
  const fields = await prisma.customField.findMany({
    where: {
      entityType,
      active: true,
    },
    orderBy: { order: 'asc' },
  })

  return fields.map((f) => ({
    id: f.id,
    name: f.name,
    label: f.label,
    type: f.type,
    required: f.required,
    defaultValue: f.defaultValue,
    options: f.options,
    order: f.order,
  }))
}

export async function createCustomField(data: {
  name: string
  label: string
  type: string
  required?: boolean
  defaultValue?: string
  options?: any
  entityType: string
  order?: number
}) {
  return prisma.customField.create({
    data: {
      name: data.name,
      label: data.label,
      type: data.type,
      required: data.required ?? false,
      defaultValue: data.defaultValue,
      options: data.options,
      entityType: data.entityType,
      order: data.order ?? 0,
    },
  })
}

export async function updateCustomField(id: string, data: Partial<{
  label: string
  type: string
  required: boolean
  defaultValue: string
  options: any
  order: number
  active: boolean
}>) {
  return prisma.customField.update({
    where: { id },
    data,
  })
}

export async function deleteCustomField(id: string): Promise<void> {
  await prisma.customField.delete({
    where: { id },
  })
}

// Ticket Types
export async function getTicketTypes(): Promise<Array<{
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
}>> {
  const types = await prisma.ticketType.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  })

  return types.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    icon: t.icon,
    color: t.color,
  }))
}

export async function createTicketType(data: {
  name: string
  description?: string
  icon?: string
  color?: string
}) {
  return prisma.ticketType.create({
    data: {
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
    },
  })
}

export async function updateTicketType(id: string, data: Partial<{
  name: string
  description: string
  icon: string
  color: string
  active: boolean
}>) {
  return prisma.ticketType.update({
    where: { id },
    data,
  })
}

export async function deleteTicketType(id: string): Promise<void> {
  await prisma.ticketType.delete({
    where: { id },
  })
}

