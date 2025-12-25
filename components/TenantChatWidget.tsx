'use client'

import { useState, useRef, useEffect } from 'react'
import {
  PaperAirplaneIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface TenantChatWidgetProps {
  tenantId: string
}

const TENANT_CHAT_STORAGE_KEY = (tenantId: string) => `ai-chat-messages-tenant-${tenantId}`

const getInitialMessages = (tenantId: string): Message[] => {
  if (typeof window === 'undefined') {
    return [
      {
        role: 'assistant',
        content: 'Hi! I\'m your IT support assistant. What issue are you experiencing?',
      },
    ]
  }

  try {
    const stored = localStorage.getItem(TENANT_CHAT_STORAGE_KEY(tenantId))
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (error) {
    console.error('Failed to load chat from localStorage:', error)
  }

  return [
    {
      role: 'assistant',
      content: 'Hi! I\'m your IT support assistant. What issue are you experiencing?',
    },
  ]
}

export default function TenantChatWidget({ tenantId }: TenantChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>(() => getInitialMessages(tenantId))
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const wasInputFocusedRef = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Restore focus to input after receiving a message if it was previously focused
  useEffect(() => {
    if (!loading && wasInputFocusedRef.current && inputRef.current) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [messages, loading])

  // Save messages to localStorage whenever they change (but skip if we just cleared)
  const skipSaveRef = useRef(false)
  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false
      return
    }
    if (typeof window !== 'undefined' && messages.length > 0) {
      try {
        localStorage.setItem(TENANT_CHAT_STORAGE_KEY(tenantId), JSON.stringify(messages))
      } catch (error) {
        console.error('Failed to save chat to localStorage:', error)
      }
    }
  }, [messages, tenantId])

  const handleSend = async () => {
    if (!input.trim() || loading) {
      console.log('[TenantChatWidget] handleSend: Skipping - input empty or already loading', { input: input.trim(), loading, tenantId })
      return
    }

    const userMessage: Message = { role: 'user', content: input }
    const userInputText = input
    const newMessages = [...messages, userMessage]
    
    console.log('[TenantChatWidget] handleSend: Starting', { 
      messageCount: newMessages.length, 
      userMessage: userInputText.substring(0, 50),
      tenantId 
    })
    
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const token = localStorage.getItem('accessToken')
      const requestBody = {
        messages: newMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        tenantId,
      }
      
      console.log('[TenantChatWidget] handleSend: Sending request', { 
        messageCount: requestBody.messages.length,
        hasToken: !!token,
        tenantId 
      })
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.error('[TenantChatWidget] handleSend: Request timeout after 60s', { tenantId })
        controller.abort()
      }, 60000) // 60 second timeout
      
      let response: Response
      try {
        response = await fetch('/api/v1/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Request timeout - the server took too long to respond. Please try again.')
        }
        throw fetchError
      }

      console.log('[TenantChatWidget] handleSend: Response received', { 
        status: response.status, 
        ok: response.ok,
        tenantId 
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[TenantChatWidget] handleSend: HTTP Error', { 
          status: response.status, 
          statusText: response.statusText,
          errorText: errorText.substring(0, 200),
          tenantId 
        })
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('[TenantChatWidget] handleSend: Response parsed', { 
        success: data.success,
        hasReply: !!data.data?.reply,
        replyLength: data.data?.reply?.length || 0,
        tenantId 
      })

      if (!data.success) {
        console.error('[TenantChatWidget] handleSend: API Error Response', { 
          error: data.error,
          errorCode: data.error?.code,
          errorMessage: data.error?.message,
          tenantId 
        })
        throw new Error(data.error?.message || 'Failed to get response')
      }

      if (!data.data?.reply) {
        console.error('[TenantChatWidget] handleSend: No reply in response', { data, tenantId })
        throw new Error('No reply received from server')
      }

      // Store conversationId but don't use it for loading history
      // We use localStorage for persistence, conversationId is just for backend tracking
      if (data.data.conversationId) {
        console.log('[TenantChatWidget] handleSend: Conversation ID updated', { 
          conversationId: data.data.conversationId,
          tenantId 
        })
        setConversationId(data.data.conversationId)
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.data.reply,
      }

      console.log('[TenantChatWidget] handleSend: Adding assistant message', { 
        messageLength: assistantMessage.content.length,
        tenantId 
      })
      
      setMessages((prev) => {
        const updated = [...prev, assistantMessage]
        console.log('[TenantChatWidget] handleSend: Messages updated', { 
          totalMessages: updated.length,
          tenantId 
        })
        return updated
      })
    } catch (error) {
      console.error('[TenantChatWidget] handleSend: Exception caught', { 
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        tenantId 
      })
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error. Please try again or create a support ticket. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
      
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      console.log('[TenantChatWidget] handleSend: Finalizing (setting loading to false)', { tenantId })
      setLoading(false)
    }
  }

  const handleClearChat = () => {
    // Skip saving when clearing
    skipSaveRef.current = true
    
    // Clear localStorage first
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(TENANT_CHAT_STORAGE_KEY(tenantId))
      } catch (error) {
        console.error('Failed to clear chat from localStorage:', error)
      }
    }

    // Reset conversation ID
    setConversationId(null)

    // Reset messages to initial state immediately
    const initialMessages = [
      {
        role: 'assistant' as const,
        content: 'Hi! I\'m your IT support assistant. What issue are you experiencing?',
      },
    ]
    setMessages(initialMessages)
    
    // Now save the cleared state
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(TENANT_CHAT_STORAGE_KEY(tenantId), JSON.stringify(initialMessages))
      } catch (error) {
        console.error('Failed to save cleared chat to localStorage:', error)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-primary)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px var(--shadow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        aria-label="Open chat"
      >
        <PaperAirplaneIcon style={{ width: '24px', height: '24px' }} />
      </button>
    )
  }

  const widgetStyle: React.CSSProperties = isFullscreen
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--bg-secondary)',
        border: 'none',
        borderRadius: 0,
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
      }
    : {
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        width: '600px',
        maxWidth: 'calc(100vw - 40px)',
        height: '800px',
        maxHeight: 'calc(100vh - 40px)',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        boxShadow: '0 8px 24px var(--shadow)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
      }

  return (
    <div style={widgetStyle}>
      <div
        style={{
          padding: '0.75rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, fontWeight: '600', fontSize: '0.875rem' }}>AI Assistant</h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={handleClearChat}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Clear chat"
            title="Clear chat"
          >
            <TrashIcon style={{ width: '20px', height: '20px' }} />
          </button>
          <button
            onClick={toggleFullscreen}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon style={{ width: '20px', height: '20px' }} />
            ) : (
              <ArrowsPointingOutIcon style={{ width: '20px', height: '20px' }} />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
            aria-label="Close chat"
          >
            <XMarkIcon style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                padding: '0.5rem 0.75rem',
                borderRadius: '12px',
                backgroundColor: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                fontSize: '0.8125rem',
                lineHeight: 1.5,
              }}
            >
              {msg.role === 'assistant' ? (
                <div
                  style={{
                    // Style for markdown content
                    lineHeight: 1.4,
                    fontSize: '0.8125rem',
                  }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      p: ({ children }: any) => <p style={{ margin: '0 0 0.375rem 0', fontSize: '0.8125rem' }}>{children}</p>,
                      ul: ({ children }: any) => (
                        <ul style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.5rem' }}>{children}</ul>
                      ),
                      ol: ({ children }: any) => (
                        <ol style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.5rem' }}>{children}</ol>
                      ),
                      li: ({ children }: any) => <li style={{ margin: '0.25rem 0' }}>{children}</li>,
                      code: ({ children, className }: any) => (
                        <code
                          style={{
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            padding: '0.15rem 0.3rem',
                            borderRadius: '4px',
                            fontSize: '0.75em',
                            fontFamily: 'monospace',
                          }}
                        >
                          {children}
                        </code>
                      ),
                      pre: ({ children }: any) => (
                        <pre
                          style={{
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            overflowX: 'auto',
                            margin: '0.375rem 0',
                            fontSize: '0.75em',
                            fontFamily: 'monospace',
                          }}
                        >
                          {children}
                        </pre>
                      ),
                      a: ({ children, href }: any) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: 'inherit',
                            textDecoration: 'underline',
                          }}
                        >
                          {children}
                        </a>
                      ),
                      strong: ({ children }: any) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                      em: ({ children }: any) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div style={{ fontSize: '0.8125rem' }}>{msg.content}</div>
              )}
            </div>
          ))}
        {loading && (
          <div
            style={{
              alignSelf: 'flex-start',
              padding: '0.5rem 0.75rem',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              fontSize: '0.8125rem',
            }}
          >
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          padding: '0.75rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          gap: '0.5rem',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => {
            wasInputFocusedRef.current = true
          }}
          onBlur={() => {
            // Only clear the flag if user explicitly clicks away
            // We'll check document.activeElement to see if focus moved elsewhere intentionally
            setTimeout(() => {
              if (document.activeElement !== inputRef.current) {
                wasInputFocusedRef.current = false
              }
            }, 100)
          }}
          placeholder="Type your message..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: '0.75rem',
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            padding: '0.5rem 0.75rem',
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !input.trim() ? 0.5 : 1,
          }}
        >
          <PaperAirplaneIcon style={{ width: '20px', height: '20px' }} />
        </button>
      </div>
    </div>
  )
}
