import { searchArticles } from '@/lib/services/kb-service'
import { createTicket } from '@/lib/services/ticket-service'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'openai/gpt-oss-20b'

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string | null
  name?: string
  tool_call_id?: string
}

type GroqToolCall = {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

type GroqChoiceMessage = {
  role: string
  content: string | null
  tool_calls?: GroqToolCall[]
}

type GroqResponse = {
  choices: Array<{
    message: GroqChoiceMessage
  }>
}

function getApiKey(): string {
  const key = process.env.GROQ_API_KEY
  if (!key) {
    throw new Error('GROQ_API_KEY is not set')
  }
  return key
}

function toolDefinitions() {
  return [
    {
      type: 'function',
      function: {
        name: 'search_knowledge_base',
        description: 'Search KB articles',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string' },
          },
          required: ['query'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'create_ticket',
        description: 'Create a support ticket',
        parameters: {
          type: 'object',
          properties: {
            subject: { type: 'string' },
            description: { type: 'string' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          },
          required: ['subject', 'description'],
        },
      },
    },
  ]
}

async function callGroq(payload: any): Promise<GroqResponse> {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Groq API error: ${res.status} ${text}`)
  }

  return res.json()
}

async function handleToolCall(toolCall: GroqToolCall, requesterId?: string) {
  const args = JSON.parse(toolCall.function.arguments || '{}')
  if (toolCall.function.name === 'search_knowledge_base') {
    const results = await searchArticles(args.query ?? '')
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
    const ticket = await createTicket({
      subject: args.subject,
      description: args.description,
      priority: args.priority,
      requesterId,
    })
    return {
      tool_call_id: toolCall.id,
      role: 'tool' as const,
      name: 'create_ticket',
      content: JSON.stringify(ticket),
    }
  }

  throw new Error(`Unsupported tool: ${toolCall.function.name}`)
}

export async function chatWithTools(params: {
  messages: ChatMessage[]
  requesterId?: string
}) {
  // Step 1: Ask Groq with tool definitions
  const initial = await callGroq({
    model: MODEL,
    messages: params.messages,
    tools: toolDefinitions(),
    tool_choice: 'auto',
  })

  const first = initial.choices[0]?.message
  if (!first) {
    throw new Error('No response from Groq')
  }

  // If no tool calls, return the assistant message
  if (!first.tool_calls || first.tool_calls.length === 0) {
    return { reply: first.content ?? '', toolCalls: [] }
  }

  // Handle only the first tool call for simplicity
  const toolCall = first.tool_calls[0]
  const toolResult = await handleToolCall(toolCall, params.requesterId)

  // Step 2: Send tool result back for final answer
  const followup = await callGroq({
    model: MODEL,
    messages: [
      ...params.messages,
      first as any,
      toolResult,
    ],
  })

  const finalMsg = followup.choices[0]?.message
  return {
    reply: finalMsg?.content ?? '',
    toolCalls: [toolCall.function.name],
  }
}

