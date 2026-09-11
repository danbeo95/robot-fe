'use client'

import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { RobotHistoryItem } from '@/types/robot'
import { useRobotWebSocket, TelemetryMessage } from '@/hooks/useRobotWebSocket'

export const getRobotHistoryQueryKey = (robotId?: string) =>
  ['robot-history', robotId] as const

export interface FetchRobotHistoryParams {
  limit?: number
  sort?: 'asc' | 'desc'
}

export async function fetchRobotHistory(
  robotId: string,
  params: FetchRobotHistoryParams = { limit: 50, sort: 'asc' }
): Promise<RobotHistoryItem[]> {
  const queryParams = new URLSearchParams()
  if (params.limit !== undefined) queryParams.set('limit', String(params.limit))
  if (params.sort) queryParams.set('sort', params.sort)

  const queryString = queryParams.toString()
  const url = `/api/robots/${robotId}/history${queryString ? `?${queryString}` : ''}`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch history (${res.status})`)
  }
  return res.json()
}

export interface UseRobotHistoryOptions
  extends Omit<UseQueryOptions<RobotHistoryItem[], Error>, 'queryKey' | 'queryFn'> {
  limit?: number
  sort?: 'asc' | 'desc'
  maxPoints?: number
  enableWebSocket?: boolean
  onTelemetry?: (telemetry: TelemetryMessage) => void
}

/**
 * Custom React hook to fetch historical telemetry for a robot
 * and stream live updates into the cache via WebSocket.
 *
 * @param robotId - The ID of the robot
 * @param options - Query and WebSocket options
 */
export function useRobotHistory(
  robotId?: string,
  options?: UseRobotHistoryOptions
) {
  const queryClient = useQueryClient()
  const {
    limit = 50,
    sort = 'asc',
    maxPoints = 50,
    enableWebSocket = true,
    onTelemetry,
    ...queryOptions
  } = options || {}

  const query = useQuery<RobotHistoryItem[], Error>({
    queryKey: getRobotHistoryQueryKey(robotId),
    queryFn: async () => {
      if (!robotId) {
        throw new Error('Robot ID is required to fetch history')
      }
      return fetchRobotHistory(robotId, { limit, sort })
    },
    enabled: Boolean(robotId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  })

  // Live WebSocket Telemetry listener for real-time history updates
  const { isConnected } = useRobotWebSocket({
    enabled: Boolean(robotId) && enableWebSocket,
    onTelemetry: (telemetry) => {
      const incomingId = telemetry.id || telemetry.robotId
      if (incomingId === robotId) {
        // Real-time append into the historical charts data cache
        queryClient.setQueryData<RobotHistoryItem[]>(
          getRobotHistoryQueryKey(robotId),
          (prev = []) => {
            const newPoint: RobotHistoryItem = {
              _id: `live-${Date.now()}`,
              robot_id: robotId,
              robotId,
              batteryPercentage: telemetry.batteryPercentage,
              wifiSignalStrength: telemetry.wifiSignalStrength,
              isCharging: telemetry.isCharging,
              temperature: telemetry.temperature,
              memoryUsage: telemetry.memoryUsage,
              timestamp: telemetry.timestamp || new Date().toISOString(),
            }
            return [...prev.slice(-(maxPoints - 1)), newPoint]
          }
        )
      }

      onTelemetry?.(telemetry)
    },
  })

  return {
    ...query,
    history: query.data ?? [],
    isConnected,
    isWsConnected: isConnected,
  }
}

export default useRobotHistory
