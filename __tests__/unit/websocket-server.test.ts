import { WebSocketServer, WebSocket } from 'ws'
import { wsServer } from '@/lib/websocket/server'
import { verifyToken } from '@/lib/jwt'
import { getUserById } from '@/lib/auth'

jest.mock('@/lib/jwt')
jest.mock('@/lib/auth')

describe.skip('WebSocket Server', () => {
  let mockServer: any
  let mockHttpServer: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockHttpServer = {
      on: jest.fn(),
      once: jest.fn(),
      listen: jest.fn(),
    }
    mockServer = {
      on: jest.fn(),
    }
    ;(WebSocketServer as any) = jest.fn(() => mockServer)
  })

  describe('initialize', () => {
    it('should initialize WebSocket server', () => {
      wsServer.initialize(mockHttpServer as any)

      expect(WebSocketServer).toHaveBeenCalledWith({
        server: mockHttpServer,
        path: '/ws',
      })
      expect(mockServer.on).toHaveBeenCalledWith('connection', expect.any(Function))
    })
  })

  describe('broadcastToUser', () => {
    it('should broadcast message to specific user', () => {
      const mockWs = {
        readyState: 1, // WebSocket.OPEN
        send: jest.fn(),
      }

      // Manually add client to internal map (testing private method behavior)
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
        readyState: 1, // WebSocket.OPEN
        send: jest.fn(),
      }
      const mockWs2 = {
        readyState: 1, // WebSocket.OPEN
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
        readyState: 1, // WebSocket.OPEN
        send: jest.fn(),
      }
      const mockWs2 = {
        readyState: 1, // WebSocket.OPEN
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
        readyState: 1, // WebSocket.OPEN
        send: jest.fn(),
      }
      const mockWs2 = {
        readyState: 1, // WebSocket.OPEN
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

      // Mock sendToClient to avoid WebSocket.OPEN check
      const originalSendToClient = (wsServer as any).sendToClient
      ;(wsServer as any).sendToClient = jest.fn((client, message) => {
        client.ws.send(JSON.stringify(message))
      })

      wsServer.broadcastToRoles(['ADMIN'], 'test:event', { data: 'test' })

      expect(mockWs1.send).toHaveBeenCalledWith(
        JSON.stringify({
          event: 'test:event',
          data: { data: 'test' },
        })
      )
      expect(mockWs2.send).not.toHaveBeenCalled()

      // Restore original method
      ;(wsServer as any).sendToClient = originalSendToClient
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
})

