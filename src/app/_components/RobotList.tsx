'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Card,
  Button,
  Space,
  Badge,
  Spin,
  Alert,
  Row,
  Col,
  Statistic,
  Empty,
  Typography,
} from 'antd'
import {
  RobotOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { RobotItem as RobotItemType } from '@/types/robot'
import RobotItem from './RobotItem'
import RobotAlerts from './RobotAlerts'
import { useRobotWebSocket } from '@/hooks/useRobotWebSocket'

const { Text } = Typography

export interface RobotListProps {
  /** Optional initial/controlled robots data. If omitted, fetched automatically via React Query. */
  robots?: RobotItemType[]
  /** Controlled loading state */
  isLoading?: boolean
  /** Callback fired when a robot card is selected */
  onSelectRobot?: (robot: RobotItemType) => void
  /** Whether to show top summary KPI cards (default: true) */
  showStats?: boolean
}

export function RobotList({
  robots: propRobots,
  isLoading: propIsLoading,
  onSelectRobot,
  showStats = true,
}: RobotListProps) {
  const router = useRouter()

  // 1. Fetch robots list via React Query
  const {
    data: fetchedRobots = [],
    isLoading: isQueryLoading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery<RobotItemType[]>({
    queryKey: ['robots'],
    queryFn: async () => {
      const res = await fetch('/api/robots')
      if (!res.ok) {
        throw new Error(`Failed to fetch robots (status: ${res.status})`)
      }
      return res.json()
    },
    enabled: propRobots === undefined,
  })

  // 2. Listen to /robots WebSocket and update React Query cache in real-time
  const { isConnected: isWsConnected } = useRobotWebSocket({
    enabled: true,
  })

  const robots = propRobots ?? fetchedRobots
  const isLoading = propIsLoading ?? isQueryLoading

  return (
    <div className="robot-list-container">
      {/* Live Alerts on the top */}
      <RobotAlerts robots={robots} />

      {/* KPI / Metrics Row */}
      {showStats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={12}>
            <Card variant="borderless" style={{ borderRadius: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
              <Statistic
                title="Total Configured Robots"
                value={robots.length}
                prefix={<RobotOutlined style={{ color: '#1890ff' }} />}
                suffix="units"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card variant="borderless" style={{ borderRadius: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
              <Statistic
                title="WebSocket Stream"
                value={isWsConnected ? 'Connected' : 'Syncing'}
                valueStyle={{ color: isWsConnected ? '#52c41a' : '#faad14' }}
                prefix={<Badge status={isWsConnected ? 'processing' : 'warning'} />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Toolbar Row: Fleet Overview Header + Live WS Indicator + Refresh */}
      <Card
        variant="borderless"
        style={{
          borderRadius: 10,
          marginBottom: 20,
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Space size={12} align="center">
              <RobotOutlined style={{ fontSize: 18, color: '#1890ff' }} />
              <Text strong style={{ fontSize: 15 }}>Fleet Overview ({robots.length})</Text>
              {isWsConnected ? (
                <Badge
                  status="processing"
                  color="#52c41a"
                  text={
                    <span style={{ fontSize: 12, color: '#52c41a', fontWeight: 600 }}>
                      Live /robots Socket
                    </span>
                  }
                />
              ) : (
                <Badge
                  status="default"
                  text={<span style={{ fontSize: 12, color: '#8c8c8c' }}>Connecting Socket...</span>}
                />
              )}
            </Space>
          </Col>

          <Col>
            {propRobots === undefined && (
              <Button
                icon={<ReloadOutlined spin={isFetching} />}
                onClick={() => refetch()}
                loading={isFetching}
                size="middle"
              >
                Refresh
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      {/* Error Alert */}
      {queryError && (
        <Alert
          message="Error Loading Robots"
          description={(queryError as Error).message}
          type="error"
          showIcon
          action={
            <Button size="small" danger onClick={() => refetch()}>
              Retry
            </Button>
          }
          style={{ marginBottom: 20 }}
        />
      )}

      {/* Main Content Area: Card Mode Only */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" tip="Loading robots fleet..." />
        </div>
      ) : robots.length === 0 ? (
        <Card variant="borderless" style={{ borderRadius: 10, textAlign: 'center', padding: '40px 0' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No robots available in database."
          />
        </Card>
      ) : (
        /* Dumb RobotItem Cards in Grid */
        <Row gutter={[20, 20]}>
          {robots.map((robot) => (
            <Col xs={24} sm={12} lg={8} key={robot._id || robot.id || robot.robot_id}>
              <RobotItem
                robot={robot}
                viewMode="card"
                onClick={
                  onSelectRobot ||
                  ((r) => router.push(`/${r.id || r.robot_id}`))
                }
              />
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}

export default RobotList
