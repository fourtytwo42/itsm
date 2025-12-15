import { WebSocketServer, WebSocket } from 'ws'
import { verifyToken, type TokenPayload } from '@/lib/jwt'
import { getUserById } from '@/lib/auth'
import type { Server as HTTPServer } from 'http'

export interface WebSocketClient {
  ws: WebSocket
  userId: string
  email: string
  roles: string[]
  subscriptions: Set<string> // Set of ticket IDs or other resource IDs
}

export interface WebSocketMessage {
  event: string
  data?: any
  error?: string
}

class WSServer {
  private wss: WebSocketServer | null = null
  private clients: Map<string, WebSocketClient> = new Map() // userId -> client
  private ticketSubscriptions: Map<string, Set<string>> = new Map() // ticketId -> Set of userIds

  initialize(server: HTTPServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' })

    this.wss.on('connection', async (ws: WebSocket, req) => {
      try {
        // Extract token from query string or Authorization header
        const url = new URL(req.url || '', `http://${req.headers.host}`)
        const token = url.searchParams.get('token') || this.extractTokenFromHeaders(req.headers)

        if (!token) {
          ws.close(1008, 'Authentication required')
          return
        }

        // Verify JWT token
        const payload = verifyToken(token)
        const user = await getUserById(payload.userId)

        if (!user || !user.isActive) {
          ws.close(1008, 'Invalid or inactive user')
          return
        }

        const roles = user.roles.map((ur) => ur.role.name)

        const client: WebSocketClient = {
          ws,
          userId: user.id,
          email: user.email,
          roles,
          subscriptions: new Set(),
        }

        // Store client
        this.clients.set(user.id, client)

        // Send connection confirmation
        this.sendToClient(client, {
          event: 'connected',
          data: { userId: user.id, email: user.email },
        })

        // Handle messages
        ws.on('message', (data: Buffer) => {
          try {
            const message: WebSocketMessage = JSON.parse(data.toString())
            this.handleMessage(client, message)
          } catch (error) {
            this.sendToClient(client, {
              event: 'error',
              error: 'Invalid message format',
            })
          }
        })

        // Handle disconnect
        ws.on('close', () => {
          this.handleDisconnect(client)
        })

        // Handle errors
        ws.on('error', (error) => {
          console.error('WebSocket error:', error)
          this.handleDisconnect(client)
        })
      } catch (error: any) {
        console.error('WebSocket connection error:', error)
        ws.close(1008, error.message || 'Connection failed')
      }
    })

    console.log('WebSocket server initialized on /ws')
  }

  private extractTokenFromHeaders(headers: any): string | null {
    const authHeader = headers.authorization || headers.Authorization
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7)
    }
    return null
  }

  private handleMessage(client: WebSocketClient, message: WebSocketMessage) {
    switch (message.event) {
      case 'subscribe:ticket':
        if (message.data?.ticketId) {
          client.subscriptions.add(`ticket:${message.data.ticketId}`)
          this.subscribeToTicket(message.data.ticketId, client.userId)
          this.sendToClient(client, {
            event: 'subscribed',
            data: { resource: `ticket:${message.data.ticketId}` },
          })
        }
        break

      case 'unsubscribe:ticket':
        if (message.data?.ticketId) {
          client.subscriptions.delete(`ticket:${message.data.ticketId}`)
          this.unsubscribeFromTicket(message.data.ticketId, client.userId)
          this.sendToClient(client, {
            event: 'unsubscribed',
            data: { resource: `ticket:${message.data.ticketId}` },
          })
        }
        break

      case 'ping':
        this.sendToClient(client, { event: 'pong' })
        break

      default:
        this.sendToClient(client, {
          event: 'error',
          error: `Unknown event: ${message.event}`,
        })
    }
  }

  private subscribeToTicket(ticketId: string, userId: string) {
    if (!this.ticketSubscriptions.has(ticketId)) {
      this.ticketSubscriptions.set(ticketId, new Set())
    }
    this.ticketSubscriptions.get(ticketId)!.add(userId)
  }

  private unsubscribeFromTicket(ticketId: string, userId: string) {
    const subscribers = this.ticketSubscriptions.get(ticketId)
    if (subscribers) {
      subscribers.delete(userId)
      if (subscribers.size === 0) {
        this.ticketSubscriptions.delete(ticketId)
      }
    }
  }

  private handleDisconnect(client: WebSocketClient) {
    // Remove all ticket subscriptions
    for (const sub of client.subscriptions) {
      if (sub.startsWith('ticket:')) {
        const ticketId = sub.replace('ticket:', '')
        this.unsubscribeFromTicket(ticketId, client.userId)
      }
    }

    this.clients.delete(client.userId)
  }

  private sendToClient(client: WebSocketClient, message: WebSocketMessage) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message))
    }
  }

  // Public methods for broadcasting events
  broadcastToUser(userId: string, event: string, data: any) {
    const client = this.clients.get(userId)
    if (client) {
      this.sendToClient(client, { event, data })
    }
  }

  broadcastToTicketSubscribers(ticketId: string, event: string, data: any) {
    const subscribers = this.ticketSubscriptions.get(ticketId)
    if (subscribers) {
      subscribers.forEach((userId) => {
        this.broadcastToUser(userId, event, data)
      })
    }
  }

  broadcastToAll(event: string, data: any) {
    this.clients.forEach((client) => {
      this.sendToClient(client, { event, data })
    })
  }

  broadcastToRoles(roles: string[], event: string, data: any) {
    this.clients.forEach((client) => {
      if (roles.some((role) => client.roles.includes(role))) {
        this.sendToClient(client, { event, data })
      }
    })
  }

  getClientCount(): number {
    return this.clients.size
  }

  getTicketSubscriberCount(ticketId: string): number {
    return this.ticketSubscriptions.get(ticketId)?.size || 0
  }
}

// Singleton instance
export const wsServer = new WSServer()

