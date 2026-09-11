'use client'

import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { RobotItem } from '@/types/robot'
import { useRobotWebSocket, TelemetryMessage } from './useRobotWebSocket'

export const ROBOTS_QUERY_KEY = ['robots'] as const
export const getRobotsQueryKey = () => ROBOTS_QUERY_KEY

export async function fetchRobots(): Promise<RobotItem[]> {
  const res = await fetch('/api/robots')
  if (!res.ok) {
    throw new Error(`Failed to fetch robots (status: ${res.status})`)
  }
  return res.json()
}

export interface UseRobotListOptions
  extends Omit<UseQueryOptions<RobotItem[], Error>, 'queryKey' | 'queryFn'> {
  enableWebSocket?: boolean
  onTelemetry?: (telemetry: TelemetryMessage) => void
}

/**
 * Custom React hook to fetch the fleet list of robots
 * and update the list in real-time via WebSocket telemetry.
 *
 * @param options - Additional React Query and WebSocket options
 */
export function useRobotList(options: UseRobotListOptions = {}) {
  const queryClient = useQueryClient()
  const { enableWebSocket = true, onTelemetry, ...queryOptions } = options

  const query = useQuery<RobotItem[], Error>({
    queryKey: ROBOTS_QUERY_KEY,
    queryFn: fetchRobots,
    ...queryOptions,
  })

  // Real-time update into React Query cache for ['robots']
  const { isConnected, lastTelemetry } = useRobotWebSocket({
    enabled: enableWebSocket,
    onTelemetry: (telemetry) => {
      const incomingRobotId = telemetry.id || telemetry.robotId
      if (incomingRobotId) {
        queryClient.setQueryData<RobotItem[]>(ROBOTS_QUERY_KEY, (prevRobots) => {
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

      onTelemetry?.(telemetry)
    },
  })

  return {
    ...query,
    robots: query.data ?? [],
    isConnected,
    isWsConnected: isConnected,
    lastTelemetry,
  }
}

export default useRobotList
