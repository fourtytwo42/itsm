# AI Integration Guide

**Complete guide for implementing AI chat widget with Groq GPT OSS 20B and tool calling.**

---

## Table of Contents

1. [Overview](#overview)
2. [Groq API Setup](#groq-api-setup)
3. [Tool Definitions](#tool-definitions)
4. [Complete Implementation](#complete-implementation)
5. [Streaming Responses](#streaming-responses)
6. [Error Handling](#error-handling)
7. [Context Management](#context-management)
8. [Learning from Resolved Tickets](#learning-from-resolved-tickets)

---

## Overview

The AI chat widget uses Groq's GPT OSS 20B model with OpenAI-compatible tool calling to:
- Search the knowledge base for solutions
- Create tickets when issues can't be resolved
- Check ticket status
- Learn from resolved tickets to improve responses

**Key Features:**
- OpenAI-compatible API (same format as OpenAI)
- Tool calling for KB search and ticket creation
- Streaming responses for real-time chat
- Context management for conversation history
- Learning from resolved tickets

---

## Groq API Setup

### Model Information

- **Model Name:** `openai/gpt-oss-20b` (exact identifier - no alternatives)
- **API Endpoint:** `https://api.groq.com/openai/v1/chat/completions`
- **API Version:** v1
- **Context Window:** 131,072 tokens
- **Maximum Output Tokens:** 65,536
- **Architecture:** 20B parameters, MoE (3.6B active per forward pass)
- **Capabilities:** Tool calling, streaming, long-context reasoning, browser search, code execution

### API Key Setup

```typescript
// Store in environment variable or database settings
const GROQ_API_KEY = process.env.GROQ_API_KEY || await getSetting('groq.api_key');
```

### Base API Call

```typescript
const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${GROQ_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'openai/gpt-oss-20b', // Exact model identifier
    messages: messages,
    tools: tools,
    tool_choice: 'auto',
    temperature: 0.7,
    max_tokens: 1000
  })
});
```

---

## Tool Definitions

### Complete Tool Definitions

```typescript
const tools = [
  {
    type: "function",
    function: {
      name: "search_knowledge_base",
      description: "Search the knowledge base for articles that might help resolve the user's issue. Use this tool when the user asks a question that might be answered by existing knowledge base articles. Always try searching the KB before creating a ticket.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to find relevant knowledge base articles. Use the user's exact words or rephrase their question."
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return (default: 5)",
            default: 5
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_ticket",
      description: "Create a support ticket when the issue cannot be resolved through the knowledge base or when the user explicitly requests to create a ticket. Only use this tool if you cannot help the user with available information from the knowledge base.",
      parameters: {
        type: "object",
        properties: {
          subject: {
            type: "string",
            description: "Brief, clear subject line for the ticket (e.g., 'Printer not printing in office')"
          },
          description: {
            type: "string",
            description: "Detailed description of the issue, including: what the user is trying to do, what error messages they see, what they've already tried, and any relevant context."
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "critical"],
            description: "Priority level: 'low' for minor issues, 'medium' for normal issues, 'high' for urgent issues affecting work, 'critical' for system-wide outages or security issues."
          },
          category: {
            type: "string",
            description: "Optional category for the ticket (e.g., 'HARDWARE', 'SOFTWARE', 'NETWORK', 'EMAIL')"
          }
        },
        required: ["subject", "description"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_ticket_status",
      description: "Check the status of an existing ticket. Use this when the user asks about a ticket they previously created or provides a ticket number.",
      parameters: {
        type: "object",
        properties: {
          ticketNumber: {
            type: "string",
            description: "The ticket number (e.g., 'TKT-2025-0001') or ticket ID"
          }
        },
        required: ["ticketNumber"]
      }
    }
  }
];
```

---

## Complete Implementation

### Main AI Service

```typescript
// lib/services/ai-service.ts
import { prisma } from '@/lib/prisma';

interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
}

export class AIService {
  private apiKey: string;
  private apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
  }
  
  async sendMessage(
    userMessage: string,
    conversationId: string,
    userEmail?: string
  ): Promise<string> {
    // Get conversation history
    const conversation = await this.getConversation(conversationId);
    const messages = this.buildMessages(conversation, userMessage);
    
    // Call Groq API
    const response = await this.callGroqAPI(messages);
    
    // Handle tool calls if present
    if (response.tool_calls && response.tool_calls.length > 0) {
      return await this.handleToolCalls(response, conversationId, userEmail);
    }
    
    // Save and return response
    await this.saveMessage(conversationId, userMessage, response.content);
    return response.content || 'I apologize, but I encountered an error.';
  }
  
  private async callGroqAPI(messages: AIMessage[]) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b', // Exact model identifier
        messages: messages,
        tools: this.getTools(),
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message;
  }
  
  private async handleToolCalls(
    message: any,
    conversationId: string,
    userEmail?: string
  ): Promise<string> {
    const messages: AIMessage[] = await this.getConversationMessages(conversationId);
    
    // Add assistant message with tool calls
    messages.push({
      role: 'assistant',
      content: message.content,
      tool_calls: message.tool_calls
    });
    
    // Execute all tool calls in parallel
    const toolResults = await Promise.all(
      message.tool_calls.map(async (toolCall: any) => {
        const { name, arguments: args } = toolCall.function;
        const parsedArgs = JSON.parse(args);
        
        let result;
        try {
          switch (name) {
            case 'search_knowledge_base':
              result = await this.searchKnowledgeBase(parsedArgs.query, parsedArgs.limit);
              break;
            case 'create_ticket':
              result = await this.createTicket({
                ...parsedArgs,
                requesterEmail: userEmail || 'anonymous@example.com'
              });
              break;
            case 'get_ticket_status':
              result = await this.getTicketStatus(parsedArgs.ticketNumber);
              break;
            default:
              result = { error: `Unknown tool: ${name}` };
          }
        } catch (error: any) {
          result = { error: error.message };
        }
        
        // Add tool result to messages
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });
        
        return result;
      })
    );
    
    // Continue conversation with tool results
    const finalResponse = await this.callGroqAPI(messages);
    
    // Save conversation
    await this.saveMessage(conversationId, userMessage, finalResponse.content);
    
    return finalResponse.content || 'I processed your request.';
  }
  
  private async searchKnowledgeBase(query: string, limit: number = 5) {
    // Generate embedding for query
    const embedding = await this.generateEmbedding(query);
    
    // Semantic search using pgvector
    const results = await prisma.$queryRaw`
      SELECT 
        id,
        title,
        content,
        summary,
        category,
        tags,
        1 - (embedding <=> ${embedding}::vector) as similarity
      FROM "KBArticleEmbedding" kbe
      JOIN "KnowledgeBaseArticle" kba ON kba.id = kbe."articleId"
      WHERE kba.status = 'PUBLISHED'
        AND kba.deleted_at IS NULL
      ORDER BY kbe.embedding <=> ${embedding}::vector
      LIMIT ${limit}
    `;
    
    return {
      results: (results as any[]).map(r => ({
        id: r.id,
        title: r.title,
        summary: r.summary || r.content.substring(0, 200),
        similarity: r.similarity
      })),
      count: results.length
    };
  }
  
  private async createTicket(data: {
    subject: string;
    description: string;
    priority: string;
    category?: string;
    requesterEmail: string;
  }) {
    const ticketNumber = await this.generateTicketNumber();
    
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        subject: data.subject,
        description: data.description,
        priority: data.priority.toUpperCase(),
        category: data.category,
        status: 'NEW',
        source: 'AI_CHAT',
        requesterEmail: data.requesterEmail,
        assignedToId: await this.getAutoAssignedAgent(data.priority, data.category)
      }
    });
    
    return {
      ticketNumber: ticket.ticketNumber,
      id: ticket.id,
      status: ticket.status,
      message: `Ticket ${ticket.ticketNumber} has been created. An agent will review it shortly.`
    };
  }
  
  private async getTicketStatus(ticketNumber: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        status: true,
        priority: true,
        assignedTo: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    if (!ticket) {
      return { error: `Ticket ${ticketNumber} not found` };
    }
    
    return {
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      priority: ticket.priority,
      assignedTo: ticket.assignedTo 
        ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`
        : 'Unassigned'
    };
  }
  
  private getTools() {
    return [
      {
        type: "function",
        function: {
          name: "search_knowledge_base",
          description: "Search the knowledge base for articles that might help resolve the user's issue.",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "The search query" },
              limit: { type: "number", description: "Max results", default: 5 }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_ticket",
          description: "Create a support ticket when the issue cannot be resolved through the knowledge base.",
          parameters: {
            type: "object",
            properties: {
              subject: { type: "string" },
              description: { type: "string" },
              priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
              category: { type: "string" }
            },
            required: ["subject", "description"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_ticket_status",
          description: "Check the status of an existing ticket.",
          parameters: {
            type: "object",
            properties: {
              ticketNumber: { type: "string" }
            },
            required: ["ticketNumber"]
          }
        }
      }
    ];
  }
  
  private buildMessages(conversation: any, newMessage: string): AIMessage[] {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are a helpful IT support assistant. Your capabilities:
1. Search Knowledge Base: You can search the knowledge base to find solutions to common issues.
2. Create Tickets: If you cannot resolve an issue, create a support ticket.
3. Check Ticket Status: Users can ask about existing tickets.

Guidelines:
- Be friendly, professional, and concise
- Try to resolve issues using the knowledge base first
- Only create tickets when necessary
- Provide clear, actionable steps
- If unsure, ask clarifying questions before creating a ticket`
      }
    ];
    
    // Add recent conversation history (last 10 messages)
    const recentMessages = conversation.messages?.slice(-10) || [];
    for (const msg of recentMessages) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }
    
    // Add new user message
    messages.push({
      role: 'user',
      content: newMessage
    });
    
    return messages;
  }
  
  // Helper methods (implement as needed)
  private async getConversation(conversationId: string) { /* ... */ }
  private async getConversationMessages(conversationId: string): Promise<AIMessage[]> { /* ... */ }
  private async saveMessage(conversationId: string, userMessage: string, aiResponse: string) { /* ... */ }
  private async generateEmbedding(text: string): Promise<number[]> { /* ... */ }
  private async generateTicketNumber(): Promise<string> { /* ... */ }
  private async getAutoAssignedAgent(priority: string, category?: string): Promise<string | null> { /* ... */ }
}
```

---

## Streaming Responses

### WebSocket Streaming Implementation

```typescript
// app/api/ai/chat/stream/route.ts
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { message, conversationId } = await req.json();
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-oss-20b',
      messages: messages,
      tools: tools,
      tool_choice: 'auto',
      stream: true // Enable streaming
    })
  });
  
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) return;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              controller.close();
              return;
            }
            
            try {
              const json = JSON.parse(data);
              const delta = json.choices[0]?.delta;
              
              if (delta?.content) {
                controller.enqueue(
                  new TextEncoder().encode(`data: ${JSON.stringify({ content: delta.content })}\n\n`)
                );
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

---

## Error Handling

```typescript
async function handleAIRequest(userMessage: string, conversationId: string) {
  try {
    // Validate input
    if (!userMessage || userMessage.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }
    
    if (userMessage.length > 2000) {
      throw new Error('Message is too long. Please keep it under 2000 characters.');
    }
    
    // Rate limiting check
    const rateLimit = await checkRateLimit(conversationId);
    if (!rateLimit.allowed) {
      throw new Error(`Rate limit exceeded. Please try again in ${rateLimit.retryAfter} seconds.`);
    }
    
    // Call AI service
    const response = await aiService.sendMessage(userMessage, conversationId);
    return { success: true, response };
    
  } catch (error: any) {
    console.error('AI request error:', error);
    
    // Log error
    await logError('ai_chat', error, { conversationId, userMessage });
    
    // Return user-friendly error
    if (error.message.includes('rate limit')) {
      return {
        success: false,
        error: "I'm receiving too many requests right now. Please try again in a moment."
      };
    } else if (error.message.includes('API') || error.message.includes('Groq')) {
      return {
        success: false,
        error: "I'm having trouble connecting right now. Please try again or create a ticket for assistance."
      };
    } else {
      return {
        success: false,
        error: "I encountered an error. Please try rephrasing your question or create a ticket for assistance."
      };
    }
  }
}
```

---

## Learning from Resolved Tickets

```typescript
// Background job to learn from resolved tickets
async function learnFromResolvedTickets() {
  // Get recently resolved tickets (last 24 hours)
  const resolvedTickets = await prisma.ticket.findMany({
    where: {
      status: 'RESOLVED',
      resolvedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    },
    include: {
      comments: {
        where: {
          isInternal: false
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      }
    }
  });
  
  for (const ticket of resolvedTickets) {
    try {
      // Extract solution from resolution comment
      const solution = ticket.comments[0]?.comment;
      if (!solution || solution.length < 50) continue; // Skip if no meaningful solution
      
      // Check if KB article already exists for this issue
      const existingArticle = await findSimilarKBArticle(ticket.subject, ticket.description);
      
      if (existingArticle) {
        // Update existing article with new solution
        await prisma.knowledgeBaseArticle.update({
          where: { id: existingArticle.id },
          data: {
            content: mergeSolutions(existingArticle.content, solution),
            updatedAt: new Date()
          }
        });
      } else {
        // Create new KB article draft
        const article = await prisma.knowledgeBaseArticle.create({
          data: {
            title: `How to resolve: ${ticket.subject}`,
            content: buildKBArticleContent(ticket, solution),
            categoryId: await determineCategory(ticket.category),
            tags: extractTags(ticket),
            status: 'DRAFT',
            createdFromTicketId: ticket.id,
            createdById: ticket.assignedToId
          }
        });
        
        // Generate embedding for new article
        await generateAndStoreEmbedding(article.id, article.content);
      }
    } catch (error) {
      console.error(`Error processing ticket ${ticket.id}:`, error);
    }
  }
}

// Run daily via cron job
// 0 2 * * * - Run at 2 AM daily
```

---

This guide provides complete implementation details for the AI chat widget with Groq integration.

