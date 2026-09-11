'use client'

import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { RobotItem } from '@/types/robot'
import { useRobotWebSocket, TelemetryMessage } from '@/hooks/useRobotWebSocket'

export const getRobotQueryKey = (robotId?: string) => ['robot', robotId] as const

export async function fetchRobot(robotId: string): Promise<RobotItem> {
  const res = await fetch(`/api/robots/${robotId}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch robot details (${res.status})`)
  }
  return res.json()
}

export interface UseRobotOptions
  extends Omit<UseQueryOptions<RobotItem, Error>, 'queryKey' | 'queryFn'> {
  enableWebSocket?: boolean
  onTelemetry?: (telemetry: TelemetryMessage) => void
}

/**
 * Custom React hook to fetch details for a specific robot by ID
 * and subscribe to live WebSocket telemetry updates.
 *
 * @param robotId - The ID of the robot to fetch
 * @param options - Additional React Query and WebSocket options
 */
export function useRobot(robotId?: string, options?: UseRobotOptions) {
  const queryClient = useQueryClient()
  const { enableWebSocket = true, onTelemetry, ...queryOptions } = options || {}

  const query = useQuery<RobotItem, Error>({
    queryKey: getRobotQueryKey(robotId),
    queryFn: async () => {
      if (!robotId) {
        throw new Error('Robot ID is required to fetch robot details')
      }
      return fetchRobot(robotId)
    },
    enabled: Boolean(robotId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  })

  // Live WebSocket Telemetry listener for real-time updates
  const { isConnected } = useRobotWebSocket({
    enabled: Boolean(robotId) && enableWebSocket,
    onTelemetry: (telemetry) => {
      const incomingId = telemetry.id || telemetry.robotId
      if (incomingId === robotId) {
        // Real-time update into the active robot details cache
        queryClient.setQueryData<RobotItem>(getRobotQueryKey(robotId), (prev) => {
          if (!prev) return prev
          return {
            ...prev,
            batteryPercentage: telemetry.batteryPercentage,
            wifiSignalStrength: telemetry.wifiSignalStrength,
            isCharging: telemetry.isCharging,
            temperature: telemetry.temperature,
            memoryUsage: telemetry.memoryUsage,
            lastSeen: telemetry.timestamp,
          }
        })
      }

      onTelemetry?.(telemetry)
    },
  })

  return {
    ...query,
    robot: query.data,
    isConnected,
    isWsConnected: isConnected,
  }
}

export const useRobotDetail = useRobot
