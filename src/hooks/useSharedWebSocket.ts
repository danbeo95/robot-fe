'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface Subscriber<T = any> {
  onMessage?: (data: T) => void
  onStateChange: (connected: boolean, lastMessage: T | null) => void
}

export interface Channel<T = any> {
  endpoint: string
  ws: WebSocket | null
  isConnected: boolean
  lastMessage: T | null
  subscribers: Set<Subscriber<T>>
  reconnectTimeout?: NodeJS.Timeout
  disconnectGraceTimeout?: NodeJS.Timeout
}

// Module-level connection pool keyed by endpoint (e.g. '/robots', '/history', '/dashboard')
const connectionPool = new Map<string, Channel<any>>()

export function getFullWsUrl(endpoint: string): string {
  // If endpoint is already a full ws:// or wss:// URL, use it directly
  if (endpoint.startsWith('ws://') || endpoint.startsWith('wss://')) {
    return endpoint
  }

  const baseWsUrl =
    process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
    process.env.WEBSOCKET_URL ||
    'ws://localhost:8080'

  const cleanBase = baseWsUrl.replace(/\/+$/, '')
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${cleanBase}${cleanEndpoint}`
}

export function getOrCreateChannel<T = any>(endpoint: string): Channel<T> {
  let channel = connectionPool.get(endpoint) as Channel<T> | undefined
  if (!channel) {
    channel = {
      endpoint,
      ws: null,
      isConnected: false,
      lastMessage: null,
      subscribers: new Set(),
    }
    connectionPool.set(endpoint, channel)
  }
  return channel
}

function notifyChannelState<T>(channel: Channel<T>) {
  channel.subscribers.forEach((sub) => {
    sub.onStateChange(channel.isConnected, channel.lastMessage)
  })
}

export function connectChannel<T = any>(channel: Channel<T>) {
  if (typeof window === 'undefined') return
  if (channel.subscribers.size === 0) return

  // Avoid duplicate connection if already connecting or open
  if (
    channel.ws &&
    (channel.ws.readyState === WebSocket.CONNECTING ||
      channel.ws.readyState === WebSocket.OPEN)
  ) {
    return
  }

  if (channel.ws) {
    try {
      channel.ws.close()
    } catch (_) {}
    channel.ws = null
  }

  if (channel.reconnectTimeout) {
    clearTimeout(channel.reconnectTimeout)
    channel.reconnectTimeout = undefined
  }

  const wsUrl = getFullWsUrl(channel.endpoint)

  try {
    const ws = new WebSocket(wsUrl)
    channel.ws = ws

    ws.onopen = () => {
      console.log(`🔌 [WS Pool] Connected to: ${wsUrl}`)
      channel.isConnected = true
      notifyChannelState(channel)
    }

    ws.onmessage = (event) => {
      try {
        let parsedData: any
        try {
          parsedData = JSON.parse(event.data)
        } catch {
          parsedData = event.data
        }

        channel.lastMessage = parsedData

        channel.subscribers.forEach((sub) => {
          sub.onMessage?.(parsedData)
          sub.onStateChange(true, parsedData)
        })
      } catch (err) {
        console.error(`Failed to process WebSocket message on ${wsUrl}:`, err)
      }
    }

    ws.onclose = (event) => {
      console.log(`❌ [WS Pool] Disconnected (${event.code}) for ${wsUrl}`)
      channel.isConnected = false
      channel.ws = null
      notifyChannelState(channel)

      // Reconnect after 3 seconds if active subscribers remain
      if (channel.subscribers.size > 0 && !channel.reconnectTimeout) {
        channel.reconnectTimeout = setTimeout(() => {
          channel.reconnectTimeout = undefined
          if (channel.subscribers.size > 0) {
            console.log(`🔄 [WS Pool] Attempting reconnect for ${wsUrl}...`)
            connectChannel(channel)
          }
        }, 3000)
      }
    }

    ws.onerror = (error) => {
      console.warn(`🚨 [WS Pool] Error on ${wsUrl}:`, error)
      channel.isConnected = false
      notifyChannelState(channel)
    }
  } catch (err) {
    console.error(`Failed to initialize WebSocket for ${wsUrl}:`, err)
    channel.isConnected = false
    notifyChannelState(channel)
  }
}

export function disconnectChannel<T = any>(channel: Channel<T>) {
  if (channel.reconnectTimeout) {
    clearTimeout(channel.reconnectTimeout)
    channel.reconnectTimeout = undefined
  }

  if (channel.ws) {
    try {
      channel.ws.close()
    } catch (_) {}
    channel.ws = null
  }

  channel.isConnected = false
  notifyChannelState(channel)
  connectionPool.delete(channel.endpoint)
}

export function subscribeToChannel<T = any>(
  endpoint: string,
  subscriber: Subscriber<T>
): () => void {
  const channel = getOrCreateChannel<T>(endpoint)

  // Cancel pending teardown grace timer
  if (channel.disconnectGraceTimeout) {
    clearTimeout(channel.disconnectGraceTimeout)
    channel.disconnectGraceTimeout = undefined
  }

  channel.subscribers.add(subscriber)

  // Sync initial state immediately to new subscriber
  subscriber.onStateChange(channel.isConnected, channel.lastMessage)

  // Connect if needed
  if (
    channel.subscribers.size === 1 ||
    !channel.ws ||
    channel.ws.readyState > WebSocket.OPEN
  ) {
    connectChannel(channel)
  }

  return () => {
    channel.subscribers.delete(subscriber)

    if (channel.subscribers.size === 0) {
      if (channel.disconnectGraceTimeout) {
        clearTimeout(channel.disconnectGraceTimeout)
      }
      channel.disconnectGraceTimeout = setTimeout(() => {
        channel.disconnectGraceTimeout = undefined
        if (channel.subscribers.size === 0) {
          disconnectChannel(channel)
        }
      }, 1000)
    }
  }
}

export function sendToChannel(endpoint: string, data: any): boolean {
  const channel = connectionPool.get(endpoint)
  if (channel?.ws && channel.ws.readyState === WebSocket.OPEN) {
    const payload = typeof data === 'string' ? data : JSON.stringify(data)
    channel.ws.send(payload)
    return true
  }
  return false
}

export interface UseSharedWebSocketOptions<T = any> {
  enabled?: boolean
  onMessage?: (data: T) => void
}

export interface UseSharedWebSocketReturn<T = any> {
  isConnected: boolean
  lastMessage: T | null
  sendMessage: (data: any) => boolean
}

/**
 * Universal custom hook to subscribe to any WebSocket endpoint in the shared connection pool.
 * Multiple subscribers to the same endpoint share a single underlying connection.
 *
 * @param endpoint - Relative path (e.g. '/robots', '/dashboard', '/history') or absolute ws URL
 * @param options - Subscription options (enabled, onMessage)
 */
export function useSharedWebSocket<T = any>(
  endpoint: string,
  options: UseSharedWebSocketOptions<T> = {}
): UseSharedWebSocketReturn<T> {
  const { enabled = true, onMessage } = options

  const channel = getOrCreateChannel<T>(endpoint)
  const [isConnected, setIsConnected] = useState(() => channel.isConnected)
  const [lastMessage, setLastMessage] = useState<T | null>(() => channel.lastMessage)

  const onMessageRef = useRef(onMessage)
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    if (!enabled || !endpoint) return

    const subscriber: Subscriber<T> = {
      onMessage: (data) => {
        onMessageRef.current?.(data)
      },
      onStateChange: (connected, message) => {
        setIsConnected(connected)
        if (message !== null && message !== undefined) {
          setLastMessage(message)
        }
      },
    }

    return subscribeToChannel<T>(endpoint, subscriber)
  }, [endpoint, enabled])

  const sendMessage = useCallback(
    (data: any) => sendToChannel(endpoint, data),
    [endpoint]
  )

  return {
    isConnected,
    lastMessage,
    sendMessage,
  }
}

export default useSharedWebSocket
