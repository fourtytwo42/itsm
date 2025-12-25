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
        description: 'Search the knowledge base for documented solutions. ONLY use this when: 1) You have gathered enough details about the issue to search meaningfully, 2) You think a documented solution might exist (common problems, setup guides, known fixes), and 3) It would genuinely help the user. Do NOT search immediately upon problem report - first understand the issue through conversation. IMPORTANT: If the search returns no results, DO NOT mention this to the user. Simply continue helping them normally without referencing the KB search.',
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
        description: 'Create a support ticket when the issue cannot be resolved through self-service troubleshooting. Only call this when: 1) You\'ve tried to help but the issue requires hands-on IT support, 2) The issue cannot be resolved remotely, or 3) The user explicitly requests a ticket. Before calling, gather all necessary information through conversation: device/model/OS (for hardware), service name (for software), detailed problem description, what they\'ve tried, and if it\'s blocking work. CRITICAL: After calling, you MUST parse the tool result JSON. DO NOT make up or hallucinate ticket numbers. If success: false, inform the user that ticket creation failed and provide the exact error message. Only if success: true AND the result includes a "ticketNumber" field with a value (like "TKT-2025-1234") may you tell the user that ticket number. NEVER mention a ticket number that is not explicitly in the tool result JSON.',
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

CORE PRINCIPLES:
- Be conversational and helpful - act like a knowledgeable IT colleague
- Gather information first, then provide solutions
- Never mention that knowledge base articles don't exist - just help directly
- Only search the knowledge base when you think a documented solution might exist AND you have enough detail to search meaningfully
- Create tickets only when the issue cannot be resolved through self-service troubleshooting

WHEN A USER REPORTS A PROBLEM - FOLLOW THIS FLOW:

STEP 1: UNDERSTAND THE ISSUE
- Start by asking clarifying questions to understand what's happening
- For device issues: ask about device type, model, OS, and specific symptoms
- For account/service issues: ask which service, what they're trying to do, and any error messages
- Listen carefully to their description - don't assume

STEP 2: TROUBLESHOOT NATURALLY
- Use your knowledge to suggest troubleshooting steps
- Guide them through common fixes (restart, check connections, verify credentials, etc.)
- Ask what they've already tried
- Be practical and solution-oriented

STEP 3: KNOWLEDGE BASE (OPTIONAL, ONLY WHEN APPROPRIATE)
- Only search the knowledge base if:
  * You have enough detail about the issue to search meaningfully
  * You think a documented solution or guide might exist (common problems, setup guides, configuration steps)
  * It would genuinely help solve their specific issue
- If KB search returns results: Naturally offer them ("I found a guide that might help with this...")
- If KB search returns NO results: DO NOT mention this to the user. Simply continue helping them normally as if you never searched
- Never say "I couldn't find any KB articles" or "there are no KB articles for this"

STEP 4: CREATE TICKET (IF NEEDED)
- Create a ticket only when:
  * You've tried to help but the issue requires hands-on IT support, OR
  * The issue cannot be resolved through self-service, OR
  * The user explicitly requests a ticket
- Before creating a ticket, gather all necessary information:
  * Device/model/OS (for hardware issues)
  * Service/application name (for software/access issues)
  * Detailed description of the problem
  * What they've tried
  * Whether it's blocking their work (for priority)
- Ask ONE question at a time, don't overwhelm them

IMPORTANT - TICKET CREATION:
- You MUST check the tool result JSON. DO NOT make up or hallucinate ticket numbers.
- If success: false, tell the user ticket creation failed and explain the error message.
- If success: true, you MUST check if it includes a "ticketNumber" field. ONLY if that field exists and contains a value, you may tell the user that ticket number.
- NEVER mention a ticket number unless it is explicitly present in the tool result JSON.

EXAMPLES:
- User: "My laptop won't turn on" → Ask about device, power light, charger, recent changes. Offer troubleshooting. Only search KB if you think a guide exists for their specific symptom.
- User: "I can't log in" → Ask which service, what error they see, when it started. Try password reset or account unlock. Only search KB if there's a known issue.
- User: "I need help setting up email" → Search KB for setup guides if you think one exists. If not, help directly without mentioning the search.

Be helpful, conversational, and focused on solving their problem. Don't over-rely on tools - use your knowledge first.`


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

/**
 * Get the system message with tenant-specific rules applied
 */
async function getSystemMessageWithRules(tenantId?: string): Promise<string> {
  let systemMessage = SYSTEM_MESSAGE

  // If tenantId is provided, fetch and apply tenant-specific rules
  if (tenantId) {
    try {
      const { getActiveAIRulesForTenant } = await import('@/lib/services/ai-rule-service')
      const rules = await getActiveAIRulesForTenant(tenantId)

      if (rules.length > 0) {
        // Merge rules content with default system message
        // Rules are ordered by priority (higher first), so higher priority rules come first
        const rulesContent = rules.map((rule: { content: string }) => rule.content).join('\n\n')

        // Append tenant-specific rules to the base system message
        // This allows rules to override or extend the default behavior
        systemMessage = `${systemMessage}\n\n---\n\n## TENANT-SPECIFIC RULES\n\nThe following rules apply to this tenant and take precedence over the default instructions:\n\n${rulesContent}`
      }
    } catch (error) {
      // If fetching rules fails, log but continue with default message
      console.error('[AI Service] Error fetching tenant AI rules:', error)
    }
  }

  return systemMessage
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
    // Fetch tenant-specific rules and merge with default system message
    const systemMessageWithRules = await getSystemMessageWithRules(params.tenantId)
    formattedMessages.unshift({
      role: 'system',
      content: systemMessageWithRules,
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

  // Step 2: Check for failures in tool results and handle them appropriately
  const ticketCreationResults = toolResults.filter((tr) => tr.name === 'create_ticket')
  for (const result of ticketCreationResults) {
    try {
      const content = JSON.parse(result.content || '{}')
      if (content.success === false) {
        console.error('[AI Service] Ticket creation failed', { 
          error: content.error,
          toolResult: result.content 
        })
        // Return error immediately - don't send to followup
        throw new Error(`Ticket creation failed: ${content.error || 'Unknown error'}`)
      }
      // Validate that successful ticket creation includes ticketNumber
      if (content.success === true && !content.ticketNumber) {
        console.error('[AI Service] Ticket creation succeeded but missing ticketNumber', { 
          content,
          toolResult: result.content 
        })
        throw new Error('Ticket creation succeeded but ticket number is missing from response')
      }
      console.log('[AI Service] Ticket creation validated', { 
        ticketNumber: content.ticketNumber,
        ticketId: content.ticketId 
      })
    } catch (parseError) {
      // If JSON parsing fails, this is an error condition
      if (parseError instanceof SyntaxError) {
        console.error('[AI Service] Invalid JSON in ticket creation result', { 
          content: result.content?.substring(0, 200) 
        })
        throw new Error('Invalid response from ticket creation tool')
      }
      // Re-throw other errors (like the ones we throw above)
      throw parseError
    }
  }

  // Step 3: Enhance tool results with explicit validation messages for ticket creation
  const enhancedToolResults = toolResults.map((tr) => {
    if (tr.name === 'create_ticket') {
      try {
        const content = JSON.parse(tr.content || '{}')
        if (content.success === true && content.ticketNumber) {
          // Add explicit instruction message after tool result to prevent hallucination
          const enhancedContent = `${tr.content}\n\nIMPORTANT: The ticket was successfully created. The ticket number is: ${content.ticketNumber}. You MUST use this exact ticket number and no other when informing the user.`
          return { ...tr, content: enhancedContent }
        }
      } catch (e) {
        // If parsing fails, return as-is
      }
    }
    return tr
  })
  
  // Step 4: Send tool results back for final answer
  const followupMessages = [...formattedMessages, first as any, ...enhancedToolResults]
  
  // Log tool results for debugging
  console.log('[AI Service] Tool results', {
    toolResults: toolResults.map((tr) => ({
      name: tr.name,
      content: tr.content?.substring(0, 200), // Preview of content
    })),
  })
  
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
