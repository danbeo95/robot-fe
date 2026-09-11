'use client'

import { useSharedWebSocket } from './useSharedWebSocket'

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

export interface UseRobotWebSocketReturn {
  isConnected: boolean
  lastTelemetry: TelemetryMessage | null
  sendMessage: (data: any) => boolean
}

function parseTelemetryMessage(rawData: any): TelemetryMessage | null {
  if (!rawData || typeof rawData !== 'object') return null

  const incomingRobotId = rawData.robotId || rawData.id || rawData.robot_id

  return {
    id: incomingRobotId,
    robotId: incomingRobotId,
    robot_id: incomingRobotId,
    batteryPercentage: Number(rawData.batteryPercentage ?? 0),
    wifiSignalStrength: Number(rawData.wifiSignalStrength ?? 0),
    isCharging: Boolean(rawData.isCharging),
    temperature: Number(rawData.temperature ?? 0),
    memoryUsage: Number(rawData.memoryUsage ?? 0),
    timestamp: rawData.timestamp || new Date().toISOString(),
  }
}

/**
 * Custom React hook to subscribe to the /robots WebSocket stream
 * using the shared connection pool.
 *
 * All callers of this hook across the application share a single underlying
 * WebSocket connection to /robots.
 */
export function useRobotWebSocket(
  options: UseRobotWebSocketOptions = {}
): UseRobotWebSocketReturn {
  const { enabled = true, onTelemetry } = options

  const { isConnected, lastMessage, sendMessage } = useSharedWebSocket<any>(
    '/robots',
    {
      enabled,
      onMessage: (rawData) => {
        const telemetry = parseTelemetryMessage(rawData)
        if (telemetry) {
          onTelemetry?.(telemetry)
        }
      },
    }
  )

  const lastTelemetry = parseTelemetryMessage(lastMessage)

  return {
    isConnected,
    lastTelemetry,
    sendMessage,
  }
}

export default useRobotWebSocket
