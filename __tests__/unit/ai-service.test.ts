import { chatWithTools } from '@/lib/services/ai-service'
import { searchArticles } from '@/lib/services/kb-service'
import { createTicket } from '@/lib/services/ticket-service'

jest.mock('@/lib/services/kb-service')
jest.mock('@/lib/services/ticket-service')

// Mock fetch globally
global.fetch = jest.fn()

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GROQ_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    delete process.env.GROQ_API_KEY
  })

  describe('chatWithTools', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should return direct response when no tool calls', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Hello, how can I help you?',
            },
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await chatWithTools({
        messages: [{ role: 'user', content: 'Hello' }],
      })

      expect(result.reply).toBe('Hello, how can I help you?')
      expect(result.toolCalls).toEqual([])
    })

    it('should handle KB search tool call', async () => {
      const mockKBResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'call-1',
                  type: 'function',
                  function: {
                    name: 'search_knowledge_base',
                    arguments: JSON.stringify({ query: 'printer' }),
                  },
                },
              ],
            },
          },
        ],
      }

      const mockFinalResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Here are some articles about printers...',
            },
          },
        ],
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockKBResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFinalResponse,
        })

      ;(searchArticles as jest.Mock).mockResolvedValue([
        { id: '1', title: 'Printer Setup', content: '...' },
      ])

      const result = await chatWithTools({
        messages: [{ role: 'user', content: 'How do I set up a printer?' }],
      })

      expect(result.reply).toBe('Here are some articles about printers...')
      expect(result.toolCalls).toContain('search_knowledge_base')
      expect(searchArticles).toHaveBeenCalledWith('printer', undefined)
    })

    it('should handle ticket creation tool call', async () => {
      const mockTicketResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'call-1',
                  type: 'function',
                  function: {
                    name: 'create_ticket',
                    arguments: JSON.stringify({
                      subject: 'Test issue',
                      description: 'Test description',
                      priority: 'MEDIUM',
                    }),
                  },
                },
              ],
            },
          },
        ],
      }

      const mockFinalResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'I have created a ticket for you...',
            },
          },
        ],
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTicketResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFinalResponse,
        })

      ;(createTicket as jest.Mock).mockResolvedValue({
        id: 'ticket-1',
        ticketNumber: 'TKT-2025-0001',
      })

      const result = await chatWithTools({
        messages: [{ role: 'user', content: 'I need help with my computer' }],
        requesterId: 'user-123',
      })

      expect(result.reply).toBe('I have created a ticket for you...')
      expect(result.toolCalls).toContain('create_ticket')
      expect(createTicket).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Test issue',
          description: 'Test description',
          priority: 'MEDIUM',
          requesterId: 'user-123',
        })
      )
    })

    it('should throw error when requesterId is missing for ticket creation', async () => {
      const mockTicketResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'call-1',
                  type: 'function',
                  function: {
                    name: 'create_ticket',
                    arguments: JSON.stringify({
                      subject: 'Test issue',
                      description: 'Test description',
                    }),
                  },
                },
              ],
            },
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTicketResponse,
      })

      await expect(
        chatWithTools({
          messages: [{ role: 'user', content: 'Create a ticket' }],
        })
      ).rejects.toThrow('Authentication required to create ticket')
    })

    it('should throw error when GROQ_API_KEY is not set', async () => {
      delete process.env.GROQ_API_KEY

      await expect(
        chatWithTools({
          messages: [{ role: 'user', content: 'Hello' }],
        })
      ).rejects.toThrow('GROQ_API_KEY is not set')
    })

    it('should handle API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      })

      await expect(
        chatWithTools({
          messages: [{ role: 'user', content: 'Hello' }],
        })
      ).rejects.toThrow('Groq API error: 401 Unauthorized')
    })

    it('should throw error for unsupported tool', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'call-1',
                  type: 'function',
                  function: {
                    name: 'unsupported_tool',
                    arguments: JSON.stringify({}),
                  },
                },
              ],
            },
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await expect(
        chatWithTools({
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow('Unsupported tool: unsupported_tool')
    })

    it('should handle empty response from Groq', async () => {
      const mockResponse = {
        choices: [],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await expect(
        chatWithTools({
          messages: [{ role: 'user', content: 'Hello' }],
        })
      ).rejects.toThrow('No response from Groq')
    })

    it('should handle multiple tool calls (only processes first)', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'call-1',
                  type: 'function',
                  function: {
                    name: 'search_knowledge_base',
                    arguments: JSON.stringify({ query: 'test' }),
                  },
                },
                {
                  id: 'call-2',
                  type: 'function',
                  function: {
                    name: 'create_ticket',
                    arguments: JSON.stringify({ subject: 'Test' }),
                  },
                },
              ],
            },
          },
        ],
      }

      const mockFinalResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Response after tool call',
            },
          },
        ],
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFinalResponse,
        })

      ;(searchArticles as jest.Mock).mockResolvedValue([])

      const result = await chatWithTools({
        messages: [{ role: 'user', content: 'Test' }],
      })

      expect(result.reply).toBe('Response after tool call')
      expect(result.toolCalls).toContain('search_knowledge_base')
      // Should only process first tool call
      expect(searchArticles).toHaveBeenCalledTimes(1)
    })

    it('should handle empty tool call arguments', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'call-1',
                  type: 'function',
                  function: {
                    name: 'search_knowledge_base',
                    arguments: '',
                  },
                },
              ],
            },
          },
        ],
      }

      const mockFinalResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Response',
            },
          },
        ],
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFinalResponse,
        })

      ;(searchArticles as jest.Mock).mockResolvedValue([])

      const result = await chatWithTools({
        messages: [{ role: 'user', content: 'Test' }],
      })

      expect(result.reply).toBe('Response')
      expect(searchArticles).toHaveBeenCalledWith('', undefined)
    })

    it('should handle null content in final response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'call-1',
                  type: 'function',
                  function: {
                    name: 'search_knowledge_base',
                    arguments: JSON.stringify({ query: 'test' }),
                  },
                },
              ],
            },
          },
        ],
      }

      const mockFinalResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
            },
          },
        ],
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFinalResponse,
        })

      ;(searchArticles as jest.Mock).mockResolvedValue([])

      const result = await chatWithTools({
        messages: [{ role: 'user', content: 'Test' }],
      })

      expect(result.reply).toBe('')
    })

    it('should handle invalid JSON in tool arguments', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'call-1',
                  type: 'function',
                  function: {
                    name: 'search_knowledge_base',
                    arguments: 'invalid json{',
                  },
                },
              ],
            },
          },
        ],
      }

      const mockFinalResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Error occurred',
            },
          },
        ],
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFinalResponse,
        })

      // The JSON.parse will throw, but chatWithTools should handle it
      // Actually, handleToolCall uses JSON.parse which will throw
      // So chatWithTools should catch and handle the error
      await expect(
        chatWithTools({
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow()
    })

    it('should handle network errors from Groq API', async () => {
      ;(global.fetch as jest.Mock).mockReset()
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      await expect(
        chatWithTools({
          messages: [{ role: 'user', content: 'Hello' }],
        })
      ).rejects.toThrow('Network error')
    })

    it('should handle invalid JSON response from Groq API', async () => {
      ;(global.fetch as jest.Mock).mockReset()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      await expect(
        chatWithTools({
          messages: [{ role: 'user', content: 'Hello' }],
        })
      ).rejects.toThrow('Invalid JSON')
    })
  })
})

