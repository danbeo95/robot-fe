'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { RobotItem } from '../types/robot'

export interface TelemetryMessage {
  id?: string
  robotId?: string
  robot_id?: string
  batteryPercentage: number
  wifiSignalStrength: number
  isCharging: boolean
  temperature: number
  memoryUsage: number
  timestamp?: string
}

export interface UseRobotWebSocketOptions {
  enabled?: boolean
  onTelemetry?: (data: TelemetryMessage) => void
}

export function useRobotWebSocket(options: UseRobotWebSocketOptions = {}) {
  const { enabled = true, onTelemetry } = options
  const [isConnected, setIsConnected] = useState(false)
  const [lastTelemetry, setLastTelemetry] = useState<TelemetryMessage | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const queryClient = useQueryClient()

  // Save callback in ref to prevent unnecessary re-connections
  const onTelemetryRef = useRef(onTelemetry)
  useEffect(() => {
    onTelemetryRef.current = onTelemetry
  }, [onTelemetry])

  const connect = useCallback(() => {
    if (!enabled) return

    // Base URL defaults to ws://localhost:8080 or environment variable
    const baseWsUrl =
      process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
      process.env.WEBSOCKET_URL ||
      'ws://localhost:8080'

    const wsUrl = `${baseWsUrl}/robots`

    try {
      if (wsRef.current) {
        wsRef.current.close()
      }

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log(`🔌 WebSocket connected to: ${wsUrl}`)
        setIsConnected(true)
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
      }

      ws.onmessage = (event) => {
        try {
          const rawData = JSON.parse(event.data)
          const incomingRobotId = rawData.robotId || rawData.id

          const telemetry: TelemetryMessage = {
            id: incomingRobotId,
            robotId: incomingRobotId,
            batteryPercentage: rawData.batteryPercentage,
            wifiSignalStrength: rawData.wifiSignalStrength,
            isCharging: Boolean(rawData.isCharging),
            temperature: rawData.temperature,
            memoryUsage: rawData.memoryUsage,
            timestamp: rawData.timestamp || new Date().toISOString(),
          }

          setLastTelemetry(telemetry)

          // 1. Fire custom onTelemetry callback if provided
          if (onTelemetryRef.current) {
            onTelemetryRef.current(telemetry)
          }

          // 2. Real-time update into React Query cache for ['robots']
          if (incomingRobotId) {
            queryClient.setQueryData<RobotItem[]>(['robots'], (prevRobots) => {
              if (!prevRobots) return prevRobots
              return prevRobots.map((r) => {
                const rId = r.id || r.robot_id
                const matches = rId === incomingRobotId

                if (matches) {
                  return {
                    ...r,
                    batteryPercentage: telemetry.batteryPercentage,
                    wifiSignalStrength: telemetry.wifiSignalStrength,
                    isCharging: telemetry.isCharging,
                    temperature: telemetry.temperature,
                    memoryUsage: telemetry.memoryUsage,
                    lastSeen: telemetry.timestamp,
                  }
                }
                return r
              })
            })
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onclose = (event) => {
        setIsConnected(false)
        console.log(`❌ WebSocket disconnected (${event.code}) for /robots`)

        // Reconnect after 3 seconds if still enabled
        if (enabled) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting reconnect for /robots...')
            connect()
          }, 3000)
        }
      }

      ws.onerror = (error) => {
        console.warn('🚨 WebSocket error for /robots:', error)
        setIsConnected(false)
      }
    } catch (error) {
      console.error('Failed to initialize WebSocket for /robots:', error)
      setIsConnected(false)
    }
  }, [enabled, queryClient])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])

  return {
    isConnected,
    lastTelemetry,
  }
}

export default useRobotWebSocket
