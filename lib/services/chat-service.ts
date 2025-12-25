import prisma from '@/lib/prisma'
import type { ChatConversation, ChatMessage } from '@prisma/client'

export async function getOrCreateConversation(userId: string): Promise<ChatConversation> {
  // Get the most recent conversation or create a new one
  const existing = await prisma.chatConversation.findFirst({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  })

  if (existing) {
    return existing
  }

  return prisma.chatConversation.create({
    data: {
      userId,
    },
  })
}

export async function saveMessage(
  conversationId: string,
  role: string,
  content: string | null,
  toolCalls?: any,
  toolCallId?: string
): Promise<ChatMessage> {
  return prisma.chatMessage.create({
    data: {
      conversationId,
      role,
      content,
      toolCalls: toolCalls ? JSON.parse(JSON.stringify(toolCalls)) : null,
      toolCallId,
    },
  })
}

export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  return prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function clearConversation(conversationId: string): Promise<void> {
  await prisma.chatMessage.deleteMany({
    where: { conversationId },
  })
}

export async function getUserConversations(userId: string): Promise<ChatConversation[]> {
  return prisma.chatConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 1, // Just get first message for preview
      },
    },
  })
}

export async function getConversationById(conversationId: string, userId: string): Promise<ChatConversation | null> {
  return prisma.chatConversation.findFirst({
    where: {
      id: conversationId,
      userId, // Ensure user owns this conversation
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

export async function deleteConversation(conversationId: string, userId: string): Promise<void> {
  await prisma.chatConversation.deleteMany({
    where: {
      id: conversationId,
      userId, // Ensure user owns this conversation
    },
  })
}

/**
 * Search chat history for a user
 * Returns messages matching the search query across all conversations
 */
export async function searchChatHistory(userId: string, query: string, limit: number = 10): Promise<ChatMessage[]> {
  return prisma.chatMessage.findMany({
    where: {
      conversation: {
        userId, // Ensure user owns the conversation
      },
      content: {
        contains: query,
        mode: 'insensitive',
      },
    },
    include: {
      conversation: {
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

