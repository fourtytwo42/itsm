import { searchArticles } from '@/lib/services/kb-service'
import { createTicket } from '@/lib/services/ticket-service'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = 'gpt-5-nano'

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string | null
  name?: string
  tool_call_id?: string
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: {
      name: string
      arguments: string
    }
  }>
}

type OpenAIChoiceMessage = {
  role: string
  content: string | null
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: {
      name: string
      arguments: string
    }
  }>
}

type OpenAIResponse = {
  choices: Array<{
    message: OpenAIChoiceMessage
  }>
}

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error('OPENAI_API_KEY is not set')
  }
  return key
}

/**
 * Tool definitions for GPT-5 function calling
 * GPT-5-nano supports standard function calling via Chat Completions API
 * For GPT-5.2, we could optionally use custom tools with type: 'custom' for freeform inputs
 */
function toolDefinitions() {
  return [
    {
      type: 'function' as const,
      function: {
        name: 'search_knowledge_base',
        description: 'Automatically search the knowledge base to find solutions and troubleshooting steps for the user\'s issue. Always use this tool FIRST when a user reports a problem - search immediately and provide the solution directly.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query based on the user\'s problem description. Extract key technical terms and symptoms.',
            },
          },
          required: ['query'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'create_ticket',
        description: 'Create a support ticket when you cannot resolve the issue yourself. Only call this when: 1) KB search found no solutions, 2) The issue requires hands-on IT support, or 3) The user explicitly requests a ticket. Gather required information one piece at a time before calling this function.',
        parameters: {
          type: 'object',
          properties: {
            subject: {
              type: 'string',
              description: 'Brief summary of the issue (e.g., "Laptop not booting - Dell XPS 13")',
            },
            description: {
              type: 'string',
              description: 'Detailed description including: device/model, OS, symptoms, what was tried, when it started',
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
              description: 'LOW=non-urgent, MEDIUM=normal issue, HIGH=urgent/blocking work, CRITICAL=system outage/critical business impact',
            },
          },
          required: ['subject', 'description'],
        },
      },
    },
  ]
}

const SYSTEM_MESSAGE = `You are a friendly IT support assistant. Help users with any IT-related issues including:
- Device problems (laptops, desktops, mobile devices)
- Account access issues (locked out, password resets, login problems)
- Application/service access (can't access software, websites, or services)
- Network connectivity issues
- Software installation or configuration
- Email and communication tools
- General IT questions and requests

CONVERSATION RULES:
- Respond naturally to greetings and casual conversation
- Only search the knowledge base when a user describes a specific technical problem
- Only create tickets when: (1) KB search found no solutions AND (2) the issue requires hands-on IT support or cannot be resolved through self-service
- Don't jump to ticket creation - that's a last resort after trying to help directly

WHEN A USER REPORTS A PROBLEM:
1. First, automatically search the knowledge base using search_knowledge_base tool (don't ask permission, just search)
2. If KB articles are found, provide the solution directly based on those articles
3. If no KB solution exists and the problem needs hands-on support, THEN guide them to create a ticket by asking ONE question at a time to gather relevant details:
   - For device issues: "What device are you using?" then "What operating system?" then "What specific symptoms?"
   - For account/service issues: "Which service or account are you trying to access?" then "What error message do you see?"
   - Always ask: "What have you tried so far?" and "Is this blocking your work?" (for priority)
   Then create the ticket with create_ticket tool using all collected information.

Be friendly, conversational, and helpful. Don't assume all problems are device-related - listen to what the user is actually reporting.`


async function callOpenAI(payload: any): Promise<OpenAIResponse> {
  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('OpenAI API Error:', res.status, text)
    throw new Error(`OpenAI API error: ${res.status} ${text}`)
  }

  return res.json()
}

async function handleToolCall(
  toolCall: { id: string; function: { name: string; arguments: string } },
  requesterId?: string,
  tenantId?: string,
  organizationId?: string,
  userRoles?: string[]
) {
  const args = JSON.parse(toolCall.function.arguments || '{}')
  if (toolCall.function.name === 'search_knowledge_base') {
    const results = await searchArticles(args.query ?? '', tenantId, {
      organizationId,
      userId: requesterId,
      userRoles,
      useSemanticSearch: true,
    })
    return {
      tool_call_id: toolCall.id,
      role: 'tool' as const,
      name: 'search_knowledge_base',
      content: JSON.stringify(results),
    }
  }

  if (toolCall.function.name === 'create_ticket') {
    if (!requesterId) {
      throw new Error('Authentication required to create ticket')
    }
    try {
      console.log('[AI Service] Creating ticket via tool call', { 
        subject: args.subject?.substring(0, 50),
        requesterId 
      })
      const ticket = await createTicket({
        subject: args.subject,
        description: args.description,
        priority: args.priority || 'MEDIUM',
        requesterId,
        tenantId,
      })
      console.log('[AI Service] Ticket created successfully', { 
        ticketId: ticket.id,
        ticketNumber: (ticket as any).ticketNumber 
      })
      return {
        tool_call_id: toolCall.id,
        role: 'tool' as const,
        name: 'create_ticket',
        content: JSON.stringify({ 
          success: true, 
          ticketId: ticket.id,
          ticketNumber: (ticket as any).ticketNumber,
          subject: (ticket as any).subject,
          message: `Ticket ${(ticket as any).ticketNumber} created successfully`
        }),
      }
    } catch (error) {
      console.error('[AI Service] Error creating ticket via tool call', { error, args })
      return {
        tool_call_id: toolCall.id,
        role: 'tool' as const,
        name: 'create_ticket',
        content: JSON.stringify({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to create ticket'
        }),
      }
    }
  }

  throw new Error(`Unsupported tool: ${toolCall.function.name}`)
}

export async function chatWithTools(params: {
  messages: ChatMessage[]
  requesterId?: string
  tenantId?: string
  organizationId?: string
  userRoles?: string[]
}) {
  // Prepare messages with system message at the start if not already present
  const formattedMessages = params.messages.map((m) => {
    // Clean up message format for OpenAI API
    const msg: any = {
      role: m.role,
      content: m.content,
    }
    if (m.name) msg.name = m.name
    if (m.tool_call_id) msg.tool_call_id = m.tool_call_id
    return msg
  })

  // Add system message if it's not already in the messages
  const hasSystemMessage = formattedMessages.some((m) => m.role === 'system')
  if (!hasSystemMessage) {
    formattedMessages.unshift({
      role: 'system',
      content: SYSTEM_MESSAGE,
    })
  }

  // Step 1: Ask OpenAI with tool definitions
  const initial = await callOpenAI({
    model: MODEL,
    messages: formattedMessages,
    tools: toolDefinitions(),
    tool_choice: 'auto',
  })

  const first = initial.choices[0]?.message
  if (!first) {
    throw new Error('No response from OpenAI')
  }

  // If no tool calls, return the assistant message
  if (!first.tool_calls || first.tool_calls.length === 0) {
    return {
      reply: first.content ?? '',
      toolCalls: [],
    }
  }

  // Handle tool calls - process each one
  console.log('[AI Service] Processing tool calls', { 
    toolCallCount: first.tool_calls.length,
    toolNames: first.tool_calls.map((tc) => tc.function.name)
  })
  
  const toolResults = await Promise.all(
    first.tool_calls.map((toolCall) =>
      handleToolCall(toolCall, params.requesterId, params.tenantId, params.organizationId, params.userRoles)
    )
  )

  console.log('[AI Service] Tool calls completed', { 
    resultCount: toolResults.length 
  })

  // Step 2: Send tool results back for final answer
  const followupMessages = [...formattedMessages, first as any, ...toolResults]
  
  console.log('[AI Service] Sending followup request to OpenAI', { 
    messageCount: followupMessages.length 
  })
  
  // Don't include tools in followup - we want a final text answer, not more tool calls
  const followup = await callOpenAI({
    model: MODEL,
    messages: followupMessages,
    // No tools parameter = OpenAI will return text response, not tool calls
  })

  console.log('[AI Service] Followup response received', { 
    hasChoices: !!followup.choices?.length,
    choiceCount: followup.choices?.length || 0
  })

  const finalMsg = followup.choices[0]?.message
  if (!finalMsg) {
    console.error('[AI Service] No response from OpenAI followup call', { 
      followup: JSON.stringify(followup).substring(0, 500) 
    })
    throw new Error('No response from OpenAI followup call')
  }
  
  // Check if the message has tool_calls instead of content (shouldn't happen with tool_choice: 'none', but just in case)
  if (finalMsg.tool_calls && finalMsg.tool_calls.length > 0) {
    console.error('[AI Service] Followup response has tool_calls instead of content', { 
      toolCalls: finalMsg.tool_calls 
    })
    // Fallback message
    return {
      reply: 'I\'ve processed your request. If you need additional help, please let me know.',
      toolCalls: first.tool_calls.map((tc) => tc.function.name),
      toolCallsData: first.tool_calls,
    }
  }
  
  const reply = finalMsg.content ?? ''
  if (!reply || reply.trim().length === 0) {
    console.error('[AI Service] Empty reply from OpenAI followup call', { 
      finalMsg: JSON.stringify(finalMsg).substring(0, 500),
      hasContent: 'content' in finalMsg,
      contentValue: finalMsg.content
    })
    // Fallback: provide a helpful message based on what tool was called
    const toolNames = first.tool_calls.map((tc) => tc.function.name)
    let fallbackMessage = 'I\'ve processed your request. '
    if (toolNames.includes('create_ticket')) {
      fallbackMessage += 'Your support ticket has been created. You should receive a confirmation shortly.'
    } else if (toolNames.includes('search_knowledge_base')) {
      fallbackMessage += 'I searched the knowledge base for you. If you need more help, please let me know.'
    } else {
      fallbackMessage += 'If you need additional assistance, please let me know or create a support ticket.'
    }
    return {
      reply: fallbackMessage,
      toolCalls: toolNames,
      toolCallsData: first.tool_calls,
    }
  }
  
  return {
    reply,
    toolCalls: first.tool_calls.map((tc) => tc.function.name),
    toolCallsData: first.tool_calls, // Include tool calls data for storage
  }
}
