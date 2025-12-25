import { WebSocketServer, WebSocket } from 'ws'
import { wsServer } from '@/lib/websocket/server'
import { verifyToken } from '@/lib/jwt'
import { getUserById } from '@/lib/auth'

const WebSocketConstants = {
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
  CONNECTING: 0,
}

jest.mock('ws', () => ({
  WebSocketServer: jest.fn(),
  WebSocket: {
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
    CONNECTING: 0,
  },
}))

jest.mock('@/lib/jwt')
jest.mock('@/lib/auth')

const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>
const mockGetUserById = getUserById as jest.MockedFunction<typeof getUserById>

describe('WebSocket Server', () => {
  let mockServer: any
  let mockHttpServer: any
  let mockWss: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset singleton state by clearing clients and subscriptions
    ;(wsServer as any).clients.clear()
    ;(wsServer as any).ticketSubscriptions.clear()
    ;(wsServer as any).wss = null

    mockHttpServer = {
      on: jest.fn(),
      once: jest.fn(),
      listen: jest.fn(),
    }
    
    mockWss = {
      on: jest.fn(),
    }
    
    mockServer = {
      on: jest.fn(),
      close: jest.fn(),
    }
    
    ;(WebSocketServer as jest.Mock).mockImplementation(() => mockWss)
  })

  describe('initialize', () => {
    it('should initialize WebSocket server', () => {
      wsServer.initialize(mockHttpServer as any)

      expect(WebSocketServer).toHaveBeenCalledWith({
        server: mockHttpServer,
        path: '/ws',
      })
      expect(mockWss.on).toHaveBeenCalledWith('connection', expect.any(Function))
      expect((wsServer as any).wss).toBe(mockWss)
    })

    it('should handle new connection with valid token in query string', async () => {
      const mockWs = {
        readyState: WebSocketConstants.OPEN,
        send: jest.fn(),
        on: jest.fn(),
        close: jest.fn(),
      }
      const mockReq = {
        url: '/ws?token=valid-token',
        headers: { host: 'localhost:3000' },
      }

      mockVerifyToken.mockReturnValue({ userId: 'user-1' })
      mockGetUserById.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        isActive: true,
        roles: [{ role: { name: 'AGENT' }, customRole: null }],
      })

      wsServer.initialize(mockHttpServer as any)
      const connectionHandler = mockWss.on.mock.calls[0][1]
      await connectionHandler(mockWs, mockReq)

      expect(mockVerifyToken).toHaveBeenCalledWith('valid-token')
      expect(mockGetUserById).toHaveBeenCalledWith('user-1')
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({ event: 'connected', data: { userId: 'user-1', email: 'user@example.com' } })
      )
      expect((wsServer as any).clients.has('user-1')).toBe(true)
      expect(mockWs.on).toHaveBeenCalledWith('message', expect.any(Function))
      expect(mockWs.on).toHaveBeenCalledWith('close', expect.any(Function))
      expect(mockWs.on).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('should close connection if no token', async () => {
      const mockWs = {
        readyState: WebSocketConstants.OPEN,
        send: jest.fn(),
        on: jest.fn(),
        close: jest.fn(),
      }
      const mockReq = {
        url: '/ws',
        headers: { host: 'localhost:3000' },
      }

      wsServer.initialize(mockHttpServer as any)
      const connectionHandler = mockWss.on.mock.calls[0][1]
      await connectionHandler(mockWs, mockReq)

      expect(mockWs.close).toHaveBeenCalledWith(1008, 'Authentication required')
      expect((wsServer as any).clients.has('user-1')).toBe(false)
    })

    it('should close connection if token is invalid', async () => {
      const mockWs = {
        readyState: WebSocketConstants.OPEN,
        send: jest.fn(),
        on: jest.fn(),
        close: jest.fn(),
      }
      const mockReq = {
        url: '/ws?token=invalid-token',
        headers: { host: 'localhost:3000' },
      }

      mockVerifyToken.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      wsServer.initialize(mockHttpServer as any)
      const connectionHandler = mockWss.on.mock.calls[0][1]
      await connectionHandler(mockWs, mockReq)

      expect(mockWs.close).toHaveBeenCalledWith(1008, 'Invalid token')
    })

    it('should close connection if user is not found or inactive', async () => {
      const mockWs = {
        readyState: WebSocketConstants.OPEN,
        send: jest.fn(),
        on: jest.fn(),
        close: jest.fn(),
      }
      const mockReq = {
        url: '/ws?token=valid-token',
        headers: { host: 'localhost:3000' },
      }

      mockVerifyToken.mockReturnValue({ userId: 'user-1' })
      mockGetUserById.mockResolvedValue(null) // User not found

      wsServer.initialize(mockHttpServer as any)
      const connectionHandler = mockWss.on.mock.calls[0][1]
      await connectionHandler(mockWs, mockReq)

      expect(mockWs.close).toHaveBeenCalledWith(1008, 'Invalid or inactive user')
    })

    it('should close connection if user is inactive', async () => {
      const mockWs = {
        readyState: WebSocketConstants.OPEN,
        send: jest.fn(),
        on: jest.fn(),
        close: jest.fn(),
      }
      const mockReq = {
        url: '/ws?token=valid-token',
        headers: { host: 'localhost:3000' },
      }

      mockVerifyToken.mockReturnValue({ userId: 'user-1' })
      mockGetUserById.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        isActive: false, // Inactive user
        roles: [],
      })

      wsServer.initialize(mockHttpServer as any)
      const connectionHandler = mockWss.on.mock.calls[0][1]
      await connectionHandler(mockWs, mockReq)

      expect(mockWs.close).toHaveBeenCalledWith(1008, 'Invalid or inactive user')
    })

    it('should extract token from Authorization header', async () => {
      const mockWs = {
        readyState: WebSocketConstants.OPEN,
        send: jest.fn(),
        on: jest.fn(),
        close: jest.fn(),
      }
      const mockReq = {
        url: '/ws',
        headers: { host: 'localhost:3000', authorization: 'Bearer header-token' },
      }

      mockVerifyToken.mockReturnValue({ userId: 'user-1' })
      mockGetUserById.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        isActive: true,
        roles: [],
      })

      wsServer.initialize(mockHttpServer as any)
      const connectionHandler = mockWss.on.mock.calls[0][1]
      await connectionHandler(mockWs, mockReq)

      expect(mockVerifyToken).toHaveBeenCalledWith('header-token')
    })

    it('should handle invalid JSON message format', async () => {
      const mockWs = {
        readyState: WebSocketConstants.OPEN,
        send: jest.fn(),
        on: jest.fn(),
        close: jest.fn(),
      }
      const mockReq = {
        url: '/ws?token=valid-token',
        headers: { host: 'localhost:3000' },
      }

      mockVerifyToken.mockReturnValue({ userId: 'user-1' })
      mockGetUserById.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        isActive: true,
        roles: [],
      })

      wsServer.initialize(mockHttpServer as any)
      const connectionHandler = mockWss.on.mock.calls[0][1]
      await connectionHandler(mockWs, mockReq)

      // Get the message handler
      const messageHandler = mockWs.on.mock.calls.find(call => call[0] === 'message')[1]
      
      // Call it with invalid JSON
      messageHandler(Buffer.from('invalid json'))

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          event: 'error',
          error: 'Invalid message format',
        })
      )
    })

    it('should handle WebSocket error event', async () => {
      const mockWs = {
        readyState: WebSocketConstants.OPEN,
        send: jest.fn(),
        on: jest.fn(),
        close: jest.fn(),
      }
      const mockReq = {
        url: '/ws?token=valid-token',
        headers: { host: 'localhost:3000' },
      }

      mockVerifyToken.mockReturnValue({ userId: 'user-1' })
      mockGetUserById.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        isActive: true,
        roles: [],
      })

      wsServer.initialize(mockHttpServer as any)
      const connectionHandler = mockWss.on.mock.calls[0][1]
      await connectionHandler(mockWs, mockReq)

      // Get the error handler
      const errorHandler = mockWs.on.mock.calls.find(call => call[0] === 'error')[1]
      
      // Call it with an error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      errorHandler(new Error('WebSocket error'))

      expect(consoleSpy).toHaveBeenCalledWith('WebSocket error:', expect.any(Error))
      expect((wsServer as any).clients.has('user-1')).toBe(false) // Client should be removed
      consoleSpy.mockRestore()
    })
  })

  describe('broadcastToUser', () => {
    it('should broadcast message to specific user', () => {
      const mockWs = {
        readyState: WebSocketConstants.OPEN,
        send: jest.fn(),
      }

      ;(wsServer as any).clients = new Map([
        [
          'user-1',
          {
            ws: mockWs,
            userId: 'user-1',
            email: 'user@example.com',
            roles: ['AGENT'],
            subscriptions: new Set(),
          },
        ],
      ])

      wsServer.broadcastToUser('user-1', 'test:event', { data: 'test' })

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          event: 'test:event',
          data: { data: 'test' },
        })
      )
    })

    it('should not send if user not connected', () => {
      ;(wsServer as any).clients = new Map()

      // Should not throw
      wsServer.broadcastToUser('user-1', 'test:event', { data: 'test' })
    })
  })

  describe('broadcastToTicketSubscribers', () => {
    it('should broadcast to all ticket subscribers', () => {
      const mockWs1 = {
        readyState: WebSocketConstants.OPEN,
        send: jest.fn(),
      }
      const mockWs2 = {
        readyState: WebSocketConstants.OPEN,
        send: jest.fn(),
      }

      ;(wsServer as any).clients = new Map([
        [
          'user-1',
          {
            ws: mockWs1,
            userId: 'user-1',
            email: 'user1@example.com',
            roles: ['AGENT'],
            subscriptions: new Set(),
          },
        ],
        [
          'user-2',
          {
            ws: mockWs2,
            userId: 'user-2',
            email: 'user2@example.com',
            roles: ['AGENT'],
            subscriptions: new Set(),
          },
        ],
      ])

      ;(wsServer as any).ticketSubscriptions = new Map([
        ['ticket-1', new Set(['user-1', 'user-2'])],
      ])

      wsServer.broadcastToTicketSubscribers('ticket-1', 'ticket:updated', { ticket: { id: 'ticket-1' } })

      expect(mockWs1.send).toHaveBeenCalled()
      expect(mockWs2.send).toHaveBeenCalled()
    })

    it('should not send if no subscribers', () => {
      ;(wsServer as any).ticketSubscriptions = new Map()

      // Should not throw
      wsServer.broadcastToTicketSubscribers('ticket-1', 'ticket:updated', {})
    })
  })

  describe('broadcastToAll', () => {
    it('should broadcast to all connected clients', () => {
      const mockWs1 = {
        readyState: WebSocketConstants.OPEN,
        send: jest.fn(),
      }
      const mockWs2 = {
        readyState: WebSocketConstants.OPEN,
        send: jest.fn(),
      }

      ;(wsServer as any).clients = new Map([
        [
          'user-1',
          {
            ws: mockWs1,
            userId: 'user-1',
            email: 'user1@example.com',
            roles: ['AGENT'],
            subscriptions: new Set(),
          },
        ],
        [
          'user-2',
          {
            ws: mockWs2,
            userId: 'user-2',
            email: 'user2@example.com',
            roles: ['AGENT'],
            subscriptions: new Set(),
          },
        ],
      ])

      wsServer.broadcastToAll('test:event', { data: 'test' })

      expect(mockWs1.send).toHaveBeenCalled()
      expect(mockWs2.send).toHaveBeenCalled()
    })
  })

  describe('broadcastToRoles', () => {
    it('should broadcast to users with specific roles', () => {
      const mockWs1 = {
        readyState: WebSocketConstants.OPEN,
        send: jest.fn(),
      }
      const mockWs2 = {
        readyState: WebSocketConstants.OPEN,
        send: jest.fn(),
      }

      const clients = new Map([
        [
          'user-1',
          {
            ws: mockWs1,
            userId: 'user-1',
            email: 'user1@example.com',
            roles: ['ADMIN'],
            subscriptions: new Set(),
          },
        ],
        [
          'user-2',
          {
            ws: mockWs2,
            userId: 'user-2',
            email: 'user2@example.com',
            roles: ['AGENT'],
            subscriptions: new Set(),
          },
        ],
      ])

      ;(wsServer as any).clients = clients

      wsServer.broadcastToRoles(['ADMIN'], 'test:event', { data: 'test' })

      expect(mockWs1.send).toHaveBeenCalledWith(
        JSON.stringify({
          event: 'test:event',
          data: { data: 'test' },
        })
      )
      expect(mockWs2.send).not.toHaveBeenCalled()
    })

    it('should not send if WebSocket is not OPEN', () => {
      const mockWs = {
        readyState: WebSocketConstants.CLOSING,
        send: jest.fn(),
      }

      ;(wsServer as any).clients = new Map([
        [
          'user-1',
          {
            ws: mockWs,
            userId: 'user-1',
            email: 'user1@example.com',
            roles: ['ADMIN'],
            subscriptions: new Set(),
          },
        ],
      ])

      wsServer.broadcastToRoles(['ADMIN'], 'test:event', { data: 'test' })

      expect(mockWs.send).not.toHaveBeenCalled()
    })
  })

  describe('getClientCount', () => {
    it('should return number of connected clients', () => {
      ;(wsServer as any).clients = new Map([
        ['user-1', {}],
        ['user-2', {}],
      ])

      expect(wsServer.getClientCount()).toBe(2)
    })
  })

  describe('getTicketSubscriberCount', () => {
    it('should return number of ticket subscribers', () => {
      ;(wsServer as any).ticketSubscriptions = new Map([
        ['ticket-1', new Set(['user-1', 'user-2', 'user-3'])],
      ])

      expect(wsServer.getTicketSubscriberCount('ticket-1')).toBe(3)
    })

    it('should return 0 if no subscribers', () => {
      ;(wsServer as any).ticketSubscriptions = new Map()

      expect(wsServer.getTicketSubscriberCount('ticket-1')).toBe(0)
    })
  })

  describe('handleMessage', () => {
    it('should handle subscribe:ticket event', () => {
      const mockWs = {
        readyState: WebSocketConstants.OPEN,
        send: jest.fn(),
      }

      const client = {
        ws: mockWs,
        userId: 'user-1',
        email: 'user@example.com',
        roles: ['AGENT'],
        subscriptions: new Set(),
      }

      ;(wsServer as any).clients.set('user-1', client)

      const message = {
        event: 'subscribe:ticket',
        data: { ticketId: 'ticket-1' },
      }

      ;(wsServer as any).handleMessage(client, message)

      expect(client.subscriptions.has('ticket:ticket-1')).toBe(true)
      expect((wsServer as any).ticketSubscriptions.get('ticket-1')?.has('user-1')).toBe(true)
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          event: 'subscribed',
          data: { resource: 'ticket:ticket-1' },
        })
      )
    })

    it('should handle unsubscribe:ticket event', () => {
      const mockWs = {
        readyState: WebSocketConstants.OPEN,
        send: jest.fn(),
      }

      const client = {
        ws: mockWs,
        userId: 'user-1',
        email: 'user@example.com',
        roles: ['AGENT'],
        subscriptions: new Set(['ticket:ticket-1']),
      }

      ;(wsServer as any).clients.set('user-1', client)
      ;(wsServer as any).ticketSubscriptions.set('ticket-1', new Set(['user-1']))

      const message = {
        event: 'unsubscribe:ticket',
        data: { ticketId: 'ticket-1' },
      }

      ;(wsServer as any).handleMessage(client, message)

      expect(client.subscriptions.has('ticket:ticket-1')).toBe(false)
      expect((wsServer as any).ticketSubscriptions.has('ticket-1')).toBe(false)
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          event: 'unsubscribed',
          data: { resource: 'ticket:ticket-1' },
        })
      )
    })

    it('should handle ping event', () => {
      const mockWs = {
        readyState: WebSocketConstants.OPEN,
        send: jest.fn(),
      }

      const client = {
        ws: mockWs,
        userId: 'user-1',
        email: 'user@example.com',
        roles: ['AGENT'],
        subscriptions: new Set(),
      }

      const message = {
        event: 'ping',
      }

      ;(wsServer as any).handleMessage(client, message)

      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({ event: 'pong' }))
    })

    it('should handle unknown event', () => {
      const mockWs = {
        readyState: WebSocketConstants.OPEN,
        send: jest.fn(),
      }

      const client = {
        ws: mockWs,
        userId: 'user-1',
        email: 'user@example.com',
        roles: ['AGENT'],
        subscriptions: new Set(),
      }

      const message = {
        event: 'unknown:event',
      }

      ;(wsServer as any).handleMessage(client, message)

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          event: 'error',
          error: 'Unknown event: unknown:event',
        })
      )
    })

    it('should not subscribe if ticketId is missing', () => {
      const mockWs = {
        readyState: WebSocketConstants.OPEN,
        send: jest.fn(),
      }

      const client = {
        ws: mockWs,
        userId: 'user-1',
        email: 'user@example.com',
        roles: ['AGENT'],
        subscriptions: new Set(),
      }

      const message = {
        event: 'subscribe:ticket',
        data: {},
      }

      ;(wsServer as any).handleMessage(client, message)

      expect(client.subscriptions.size).toBe(0)
      expect(mockWs.send).not.toHaveBeenCalled()
    })
  })

  describe('handleDisconnect', () => {
    it('should remove client and clean up subscriptions', () => {
      const mockWs = {
        readyState: WebSocketConstants.OPEN,
        send: jest.fn(),
      }

      const client = {
        ws: mockWs,
        userId: 'user-1',
        email: 'user@example.com',
        roles: ['AGENT'],
        subscriptions: new Set(['ticket:ticket-1', 'ticket:ticket-2']),
      }

      ;(wsServer as any).clients.set('user-1', client)
      ;(wsServer as any).ticketSubscriptions.set('ticket-1', new Set(['user-1', 'user-2']))
      ;(wsServer as any).ticketSubscriptions.set('ticket-2', new Set(['user-1']))

      ;(wsServer as any).handleDisconnect(client)

      expect((wsServer as any).clients.has('user-1')).toBe(false)
      expect((wsServer as any).ticketSubscriptions.get('ticket-1')?.has('user-1')).toBe(false)
      expect((wsServer as any).ticketSubscriptions.has('ticket-2')).toBe(false) // Should be deleted when empty
      expect((wsServer as any).ticketSubscriptions.has('ticket-1')).toBe(true) // Should still exist with user-2
    })
  })

  describe('sendToClient', () => {
    it('should not send if WebSocket is not OPEN', () => {
      const mockWs = {
        readyState: WebSocketConstants.CLOSING,
        send: jest.fn(),
      }

      const client = {
        ws: mockWs,
        userId: 'user-1',
        email: 'user@example.com',
        roles: ['AGENT'],
        subscriptions: new Set(),
      }

      ;(wsServer as any).sendToClient(client, { event: 'test', data: {} })

      expect(mockWs.send).not.toHaveBeenCalled()
    })
  })
})
