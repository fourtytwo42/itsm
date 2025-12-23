import prisma from '@/lib/prisma'
import { AssetType } from '@prisma/client'

export interface CreateCustomAssetTypeInput {
  name: string
  organizationId: string
  description?: string
}

export interface UpdateCustomAssetTypeInput {
  name?: string
  description?: string
  isActive?: boolean
}

export interface CreateAssetTypeCustomFieldInput {
  customAssetTypeId: string
  fieldName: string
  label: string
  fieldType: string
  required?: boolean
  defaultValue?: string
  options?: any
  placeholder?: string
  order?: number
}

export interface UpdateAssetTypeCustomFieldInput {
  label?: string
  fieldType?: string
  required?: boolean
  defaultValue?: string
  options?: any
  placeholder?: string
  order?: number
  isActive?: boolean
}

export async function createCustomAssetType(input: CreateCustomAssetTypeInput) {
  return prisma.customAssetType.create({
    data: {
      name: input.name,
      organizationId: input.organizationId,
      description: input.description,
    },
    include: {
      customFields: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
    },
  })
}

export async function listCustomAssetTypes(organizationId: string) {
  const where: any = {
    organizationId,
    isActive: true,
  }

  return prisma.customAssetType.findMany({
    where,
    include: {
      customFields: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getCustomAssetTypeById(id: string, organizationId: string) {
  return prisma.customAssetType.findFirst({
    where: {
      id,
      organizationId,
    },
    include: {
      customFields: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
    },
  })
}

export async function updateCustomAssetType(id: string, organizationId: string, input: UpdateCustomAssetTypeInput) {
  return prisma.customAssetType.updateMany({
    where: {
      id,
      organizationId,
    },
    data: input,
  })
}

export async function deleteCustomAssetType(id: string, organizationId: string) {
  return prisma.customAssetType.updateMany({
    where: {
      id,
      organizationId,
    },
    data: {
      isActive: false,
    },
  })
}

export async function createAssetTypeCustomField(input: CreateAssetTypeCustomFieldInput) {
  return prisma.assetTypeCustomField.create({
    data: {
      customAssetTypeId: input.customAssetTypeId,
      fieldName: input.fieldName,
      label: input.label,
      fieldType: input.fieldType,
      required: input.required || false,
      defaultValue: input.defaultValue,
      options: input.options,
      placeholder: input.placeholder,
      order: input.order || 0,
    },
  })
}

export async function listAssetTypeCustomFields(customAssetTypeId: string) {
  return prisma.assetTypeCustomField.findMany({
    where: {
      customAssetTypeId,
      isActive: true,
    },
    orderBy: { order: 'asc' },
  })
}

export async function getAssetTypeCustomFieldById(id: string, customAssetTypeId: string) {
  return prisma.assetTypeCustomField.findFirst({
    where: {
      id,
      customAssetTypeId,
    },
  })
}

export async function updateAssetTypeCustomField(
  id: string,
  customAssetTypeId: string,
  input: UpdateAssetTypeCustomFieldInput
) {
  return prisma.assetTypeCustomField.updateMany({
    where: {
      id,
      customAssetTypeId,
    },
    data: input,
  })
}

export async function deleteAssetTypeCustomField(id: string, customAssetTypeId: string) {
  return prisma.assetTypeCustomField.updateMany({
    where: {
      id,
      customAssetTypeId,
    },
    data: {
      isActive: false,
    },
  })
}

