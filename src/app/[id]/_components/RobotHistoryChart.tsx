'use client'

import React, { useState, useEffect, useMemo, memo } from 'react'
import { Card, Row, Col, Space, Button, Tag, Empty } from 'antd'
import {
  LineChartOutlined,
  ThunderboltOutlined,
  FireOutlined,
  WifiOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts'
import { RobotHistoryItem } from '@/types/robot'

export interface RobotHistoryChartProps {
  /** Array of historical telemetry records */
  history: RobotHistoryItem[]
  /** Whether historical data is actively being fetched */
  isLoading?: boolean
  /** Callback triggered when clicking refresh */
  onRefresh?: () => void
}

/**
 * Dedicated Section 2: Historical Telemetry Visualizations displayed as cards (no tabs)
 */
function RobotHistoryChartBase({
  history = [],
  isLoading = false,
  onRefresh,
}: RobotHistoryChartProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Format data points for charts with human-readable timestamps
  const chartData = useMemo(() => {
    return history.map((item) => ({
      time: dayjs(item.timestamp).format('HH:mm:ss'),
      battery: item.batteryPercentage,
      wifi: item.wifiSignalStrength,
      temperature: item.temperature,
      memory: item.memoryUsage,
      isCharging: item.isCharging ? 1 : 0,
    }))
  }, [history])

  const latestPoint = chartData.length > 0 ? chartData[chartData.length - 1] : null

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Section Header Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Space>
          <LineChartOutlined style={{ color: '#1890ff', fontSize: 18 }} />
          <span style={{ fontSize: 16, fontWeight: 600, color: '#262626' }}>
            Historical Telemetry Trends
          </span>
        </Space>

        <Space>
          <Tag color="blue">{history.length} Data Points Logged</Tag>
          {onRefresh && (
            <Button
              size="small"
              icon={<ReloadOutlined spin={isLoading} />}
              onClick={onRefresh}
            >
              Refresh Charts
            </Button>
          )}
        </Space>
      </div>

      {/* Grid of Chart Cards */}
      {mounted && chartData.length > 0 ? (
        <Row gutter={[16, 16]}>
          {/* Card 1: Battery Level (%) */}
          <Col xs={24} lg={12}>
            <Card
              variant="borderless"
              style={{
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                height: '100%',
              }}
              title={
                <Space>
                  <ThunderboltOutlined style={{ color: '#52c41a' }} />
                  <span>Battery Level (%)</span>
                </Space>
              }
              extra={
                latestPoint && (
                  <Tag color="green">
                    Latest: {Math.round(latestPoint.battery)}%
                  </Tag>
                )
              }
              bodyStyle={{ padding: '16px 20px 20px 10px' }}
            >
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="batteryGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#52c41a" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#52c41a" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" stroke="#8c8c8c" fontSize={11} />
                    <YAxis domain={[0, 100]} unit="%" stroke="#8c8c8c" fontSize={11} />
                    <RechartsTooltip
                      formatter={(value: any) => [`${value}%`, 'Battery']}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="battery"
                      stroke="#52c41a"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#batteryGrad)"
                      name="Battery (%)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          {/* Card 2: WiFi Signal Strength (dBm) */}
          <Col xs={24} lg={12}>
            <Card
              variant="borderless"
              style={{
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                height: '100%',
              }}
              title={
                <Space>
                  <WifiOutlined style={{ color: '#1890ff' }} />
                  <span>WiFi Signal (dBm)</span>
                </Space>
              }
              extra={
                latestPoint && (
                  <Tag color="blue">
                    Latest: {latestPoint.wifi} dBm
                  </Tag>
                )
              }
              bodyStyle={{ padding: '16px 20px 20px 10px' }}
            >
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="wifiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1890ff" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#1890ff" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" stroke="#8c8c8c" fontSize={11} />
                    <YAxis domain={[-100, -30]} unit=" dBm" stroke="#8c8c8c" fontSize={11} />
                    <RechartsTooltip
                      formatter={(value: any) => [`${value} dBm`, 'WiFi Signal']}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="wifi"
                      stroke="#1890ff"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#wifiGrad)"
                      name="WiFi Signal (dBm)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          {/* Card 3: Temperature (°C) & RAM Usage (%) */}
          <Col xs={24} lg={12}>
            <Card
              variant="borderless"
              style={{
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                height: '100%',
              }}
              title={
                <Space>
                  <FireOutlined style={{ color: '#fa8c16' }} />
                  <span>Temp (°C) & RAM Usage (%)</span>
                </Space>
              }
              extra={
                latestPoint && (
                  <Space size={4}>
                    <Tag color="orange">
                      {latestPoint.temperature}°C
                    </Tag>
                    <Tag color="purple">
                      {Math.round(latestPoint.memory)}% RAM
                    </Tag>
                  </Space>
                )
              }
              bodyStyle={{ padding: '16px 20px 20px 10px' }}
            >
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" stroke="#8c8c8c" fontSize={11} />
                    <YAxis yAxisId="temp" domain={[30, 90]} unit="°C" stroke="#fa8c16" fontSize={11} />
                    <YAxis yAxisId="ram" orientation="right" domain={[0, 100]} unit="%" stroke="#722ed1" fontSize={11} />
                    <RechartsTooltip labelFormatter={(label) => `Time: ${label}`} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      yAxisId="temp"
                      type="monotone"
                      dataKey="temperature"
                      stroke="#fa8c16"
                      strokeWidth={2}
                      dot={false}
                      name="Temp (°C)"
                    />
                    <Line
                      yAxisId="ram"
                      type="monotone"
                      dataKey="memory"
                      stroke="#722ed1"
                      strokeWidth={2}
                      dot={false}
                      name="RAM Usage (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          {/* Card 4: All Metrics Trends */}
          <Col xs={24} lg={12}>
            <Card
              variant="borderless"
              style={{
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                height: '100%',
              }}
              title={
                <Space>
                  <LineChartOutlined style={{ color: '#722ed1' }} />
                  <span>All Metrics Overview</span>
                </Space>
              }
              extra={<Tag color="purple">Composite</Tag>}
              bodyStyle={{ padding: '16px 20px 20px 10px' }}
            >
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" stroke="#8c8c8c" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#8c8c8c" fontSize={11} />
                    <RechartsTooltip labelFormatter={(label) => `Time: ${label}`} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="battery"
                      stroke="#52c41a"
                      strokeWidth={2}
                      dot={false}
                      name="Battery (%)"
                    />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      stroke="#fa8c16"
                      strokeWidth={2}
                      dot={false}
                      name="Temp (°C)"
                    />
                    <Line
                      type="monotone"
                      dataKey="memory"
                      stroke="#722ed1"
                      strokeWidth={2}
                      dot={false}
                      name="Memory (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>
      ) : (
        <Card
          variant="borderless"
          style={{
            borderRadius: 12,
            textAlign: 'center',
            padding: '60px 0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              isLoading
                ? 'Loading telemetry points...'
                : 'Awaiting telemetry data points from robot simulator...'
            }
          />
        </Card>
      )}
    </div>
  )
}

export const RobotHistoryChart = memo(RobotHistoryChartBase)
export default RobotHistoryChart
