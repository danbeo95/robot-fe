'use client'

import { useState, useEffect, useRef } from 'react'

export interface UseWebSocketOptions {
  autoConnect?: boolean
  reconnectOnClose?: boolean
  onOpen?: (event: Event) => void
  onMessage?: (data: string) => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
}

export interface UseWebSocketReturn {
  isConnected: boolean
  lastMessage: string | null
  sendMessage: (message: string) => void
  connect: () => void
  disconnect: () => void
  reconnect: () => void
}

export function useWebSocket(
  url?: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const { autoConnect = false, reconnectOnClose = false } = options
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<string | null>(null)
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const shouldReconnectRef = useRef(false)
  const optionsRef = useRef(options)

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const targetUrl =
    url ||
    (typeof process !== 'undefined' &&
    (process.env.NEXT_PUBLIC_WEBSOCKET_URL || process.env.WEBSOCKET_URL)
      ? `${process.env.NEXT_PUBLIC_WEBSOCKET_URL || process.env.WEBSOCKET_URL}/dashboard`
      : 'ws://localhost:8080/dashboard')

  const disconnect = () => {
    shouldReconnectRef.current = false
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = undefined
    }
    if (ws.current) {
      ws.current.close()
      ws.current = null
    }
    setIsConnected(false)
  }

  const connect = () => {
    if (!targetUrl) return

    // Avoid duplicate connection if already open or connecting
    if (
      ws.current &&
      (ws.current.readyState === WebSocket.OPEN ||
        ws.current.readyState === WebSocket.CONNECTING)
    ) {
      return
    }

    try {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = undefined
      }

      shouldReconnectRef.current = reconnectOnClose
      const socket = new WebSocket(targetUrl)
      ws.current = socket

      socket.onopen = (event) => {
        console.log('✅ WebSocket connected to:', targetUrl)
        setIsConnected(true)
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = undefined
        }
        optionsRef.current.onOpen?.(event)
      }

      socket.onmessage = (event) => {
        setLastMessage(event.data)
        optionsRef.current.onMessage?.(event.data)
      }

      socket.onclose = (event) => {
        console.log('❌ WebSocket disconnected:', event.code, event.reason)
        setIsConnected(false)
        optionsRef.current.onClose?.(event)

        if (shouldReconnectRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect...')
            connect()
          }, 3000)
        }
      }

      socket.onerror = (error) => {
        console.error('🚨 WebSocket error:', error)
        setIsConnected(false)
        optionsRef.current.onError?.(error)
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      setIsConnected(false)
    }
  }

  const sendMessage = (message: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message)
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  const reconnect = () => {
    disconnect()
    connect()
  }

  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      shouldReconnectRef.current = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (ws.current) {
        ws.current.close()
        ws.current = null
      }
    }
  }, [autoConnect, targetUrl])

  return {
    isConnected,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
    reconnect,
  }
}

export default useWebSocket