'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Alert, Space, Tag } from 'antd'
import { RobotItem as RobotItemType } from '../../../types/robot'

export interface ActiveAlertItem {
  id: string
  type: 'warning' | 'error'
  message: string
  battery: number
  elapsedSeconds: number
}

interface RobotAlertTracker {
  lowBatteryStartTime: number | null
}

export interface RobotAlertsProps {
  robots: RobotItemType[]
}

export function RobotAlerts({ robots }: RobotAlertsProps) {
  // Track when each robot entered the low-battery state
  const trackersRef = useRef<Map<string, RobotAlertTracker>>(new Map())
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlertItem[]>([])

  useEffect(() => {
    const evaluateAlerts = () => {
      const now = Date.now()
      const alerts: ActiveAlertItem[] = []

      robots.forEach((robot) => {
        const id = robot.id || robot.robot_id
        if (!id) return

        const battery = robot.batteryPercentage
        const isCharging = Boolean(robot.isCharging)

        // Trigger condition: Battery < 20% AND not charging
        const isLowBattery = battery !== undefined && battery < 20 && !isCharging

        let tracker = trackersRef.current.get(id)
        if (!tracker) {
          tracker = { lowBatteryStartTime: null }
          trackersRef.current.set(id, tracker)
        }

        if (!isLowBattery) {
          // Reset when battery >= 20% OR the robot starts charging
          tracker.lowBatteryStartTime = null
        } else {
          if (tracker.lowBatteryStartTime === null) {
            tracker.lowBatteryStartTime = now
          }

          const elapsedMs = now - tracker.lowBatteryStartTime
          const elapsedMinutes = elapsedMs / (1000 * 60)
          const elapsedSeconds = Math.floor(elapsedMs / 1000)

          // Critical Battery Alert: 5+ consecutive minutes
          if (elapsedMinutes >= 5) {
            alerts.push({
              id,
              type: 'error',
              message: `Robot ${id} will be shut down soon!`,
              battery: battery ?? 0,
              elapsedSeconds,
            })
          } else {
            // Low Battery Alert: < 5 minutes
            alerts.push({
              id,
              type: 'warning',
              message: `Robot ${id} is low battery!`,
              battery: battery ?? 0,
              elapsedSeconds,
            })
          }
        }
      })

      setActiveAlerts(alerts)
    }

    evaluateAlerts()
    const timer = setInterval(evaluateAlerts, 1000)
    return () => clearInterval(timer)
  }, [robots])

  // Only render when there are active alert banners to show
  if (activeAlerts.length === 0) {
    return null
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }} size={10}>
        {activeAlerts.map((alert) => (
          <Alert
            key={`${alert.id}-${alert.type}`}
            type={alert.type}
            showIcon
            message={<span style={{ fontWeight: 700, fontSize: 14 }}>{alert.message}</span>}
            description={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  {alert.type === 'error'
                    ? `Battery is ${alert.battery}% (< 20%) and not charging for over 5 minutes (${Math.floor(alert.elapsedSeconds / 60)}m ${alert.elapsedSeconds % 60}s).`
                    : `Battery is ${alert.battery}% (< 20%) and not charging (${alert.elapsedSeconds}s).`}
                </span>
                <Tag color={alert.type === 'error' ? 'error' : 'warning'}>
                  Robot {alert.id}
                </Tag>
              </div>
            }
            style={{
              borderRadius: 8,
              border: alert.type === 'error' ? '1px solid #ffa39e' : '1px solid #ffe58f',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            }}
          />
        ))}
      </Space>
    </div>
  )
}

export default RobotAlerts
