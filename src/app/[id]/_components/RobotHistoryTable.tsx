'use client'

import React, { useMemo, memo } from 'react'
import { Card, Space, Table, Tag } from 'antd'
import {
  HistoryOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  WifiOutlined,
  FireOutlined,
  DashboardOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { RobotHistoryItem } from '@/types/robot'

export interface RobotHistoryTableProps {
  /** Telemetry history records */
  history: RobotHistoryItem[]
  /** Loading state indicator */
  isLoading?: boolean
  /** Maximum recent rows to display (defaults to 10) */
  maxRows?: number
}

/**
 * Battery color helper
 */
function getBatteryColor(percent?: number): string {
  if (percent === undefined) return '#1890ff'
  if (percent <= 20) return '#ff4d4f'
  if (percent <= 50) return '#faad14'
  return '#52c41a'
}

/**
 * WiFi quality tag helper
 */
function getWifiQuality(signal?: number): { color: string; label: string } {
  if (signal === undefined) return { color: 'default', label: 'Unknown' }
  if (signal >= -60) return { color: 'success', label: 'Excellent' }
  if (signal >= -75) return { color: 'warning', label: 'Good' }
  return { color: 'error', label: 'Weak' }
}

/**
 * Dedicated Section 3: Recent Telemetry Logs Table
 */
function RobotHistoryTableBase({
  history = [],
  isLoading = false,
  maxRows = 10,
}: RobotHistoryTableProps) {
  // Sort newest first and limit to maxRows
  const tableData = useMemo(() => {
    return [...history]
      .reverse()
      .slice(0, maxRows)
      .map((item, idx) => ({
        ...item,
        key: (item as any)._id || (item as any).id || `${item.timestamp}-${idx}`,
      }))
  }, [history, maxRows])

  const columns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (t: string) => (
        <Space size={4}>
          <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
          <span suppressHydrationWarning>{dayjs(t).format('HH:mm:ss')}</span>
        </Space>
      ),
    },
    {
      title: 'Battery',
      dataIndex: 'batteryPercentage',
      key: 'batteryPercentage',
      render: (val: number, r: RobotHistoryItem) => (
        <Space size={6}>
          <ThunderboltOutlined style={{ color: getBatteryColor(val) }} />
          <span style={{ fontWeight: 600, color: getBatteryColor(val) }}>
            {Math.round(val)}%
          </span>
          {r.isCharging && (
            <Tag color="green" style={{ fontSize: 10, padding: '0 4px' }}>
              ⚡
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'WiFi',
      dataIndex: 'wifiSignalStrength',
      key: 'wifiSignalStrength',
      render: (val: number) => (
        <Tag color={getWifiQuality(val).color}>
          <WifiOutlined /> {val} dBm
        </Tag>
      ),
    },
    {
      title: 'Temperature',
      dataIndex: 'temperature',
      key: 'temperature',
      render: (val: number) => (
        <Tag color={val > 65 ? 'volcano' : 'orange'}>
          <FireOutlined /> {val}°C
        </Tag>
      ),
    },
    {
      title: 'Memory Usage',
      dataIndex: 'memoryUsage',
      key: 'memoryUsage',
      render: (val: number) => (
        <Tag color="purple">
          <DashboardOutlined /> {Math.round(val)}%
        </Tag>
      ),
    },
  ]

  return (
    <Card
      variant="borderless"
      style={{
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
      title={
        <Space>
          <HistoryOutlined style={{ color: '#1890ff' }} />
          <span>Recent Telemetry Logs</span>
        </Space>
      }
      styles={{ body: { padding: 0 } }}
    >
      <Table
        size="middle"
        loading={isLoading}
        columns={columns}
        dataSource={tableData}
        rowKey="key"
        pagination={false}
      />
    </Card>
  )
}

export const RobotHistoryTable = memo(RobotHistoryTableBase)
export default RobotHistoryTable
