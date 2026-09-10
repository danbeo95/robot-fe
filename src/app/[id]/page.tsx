'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Layout,
  Typography,
  Card,
  Badge,
  Button,
  Space,
  Spin,
  Alert,
  Breadcrumb,
  Empty,
} from 'antd'
import {
  RobotOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { RobotItem, RobotHistoryItem } from '@/types/robot'
import { useRobotWebSocket } from '@/hooks/useRobotWebSocket'
import {
  RobotBasicInfo,
  RobotHistoryChart,
  RobotHistoryTable,
} from './_components'

const { Header, Content } = Layout
const { Title } = Typography

export default function RobotDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const robotId = (params?.id as string) || ''

  // 1. Fetch Basic Robot Information
  const {
    data: robot,
    isLoading: isRobotLoading,
    error: robotError,
    refetch: refetchRobot,
  } = useQuery<RobotItem>({
    queryKey: ['robot', robotId],
    queryFn: async () => {
      const res = await fetch(`/api/robots/${robotId}`)
      if (!res.ok) {
        throw new Error(`Failed to fetch robot details (${res.status})`)
      }
      return res.json()
    },
    enabled: Boolean(robotId),
  })

  // 2. Fetch Historical Telemetry Data
  const {
    data: history = [],
    isLoading: isHistoryLoading,
    refetch: refetchHistory,
  } = useQuery<RobotHistoryItem[]>({
    queryKey: ['robot-history', robotId],
    queryFn: async () => {
      // Fetch up to 50 historical points in ascending chronological order for charts
      const res = await fetch(`/api/robots/${robotId}/history?limit=50&sort=asc`)
      if (!res.ok) {
        throw new Error(`Failed to fetch history (${res.status})`)
      }
      return res.json()
    },
    enabled: Boolean(robotId),
  })

  // 3. Live WebSocket Telemetry listener for real-time updates
  const { isConnected: isWsConnected } = useRobotWebSocket({
    enabled: Boolean(robotId),
    onTelemetry: (telemetry) => {
      const incomingId = telemetry.id || telemetry.robotId
      if (incomingId === robotId) {
        // Real-time update into the active robot details cache
        queryClient.setQueryData<RobotItem>(['robot', robotId], (prev) => {
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

        // Real-time append into the historical charts data cache
        queryClient.setQueryData<RobotHistoryItem[]>(
          ['robot-history', robotId],
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
            return [...prev.slice(-49), newPoint]
          }
        )
      }
    },
  })

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fb' }}>
      {/* Top Navigation Header */}
      <Header
        style={{
          background: '#001529',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/robots">
            <Button
              type="text"
              icon={<ArrowLeftOutlined style={{ color: '#fff' }} />}
              style={{ color: '#fff' }}
            >
              Fleet List
            </Button>
          </Link>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)' }} />
          <Title
            level={4}
            style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <RobotOutlined style={{ color: '#1890ff' }} />
            Robot {robotId} Details
          </Title>
        </div>

        <Space size={16} align="center">
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
              text={<span style={{ fontSize: 12, color: '#8c8c8c' }}>Connecting WS...</span>}
            />
          )}

          <Button
            size="small"
            icon={<ReloadOutlined spin={isRobotLoading || isHistoryLoading} />}
            onClick={() => {
              refetchRobot()
              refetchHistory()
            }}
          >
            Sync
          </Button>
        </Space>
      </Header>

      {/* Main Content */}
      <Content style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          style={{ marginBottom: 16 }}
          items={[
            { title: <Link href="/">Dashboard</Link> },
            { title: <Link href="/robots">Robots</Link> },
            { title: `Robot ${robotId}` },
          ]}
        />

        {/* Error Alert */}
        {robotError && (
          <Alert
            message="Error Loading Robot Details"
            description={(robotError as Error).message}
            type="error"
            showIcon
            action={
              <Button size="small" danger onClick={() => refetchRobot()}>
                Retry
              </Button>
            }
            style={{ marginBottom: 20 }}
          />
        )}

        {isRobotLoading && !robot ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin size="large" tip="Loading robot profile and telemetry..." />
          </div>
        ) : !robot ? (
          <Card style={{ textAlign: 'center', padding: 40, borderRadius: 12 }}>
            <Empty description={`No robot found with ID: ${robotId}`} />
            <Button type="primary" onClick={() => router.push('/')} style={{ marginTop: 16 }}>
              Back to Fleet
            </Button>
          </Card>
        ) : (
          <>
            {/* Dedicated Section 1: Basic Robot Information & Current KPI Metrics */}
            <RobotBasicInfo robot={robot} isLoading={isRobotLoading} />

            {/* Dedicated Section 2: Historical Telemetry Charts */}
            <RobotHistoryChart
              history={history}
              isLoading={isHistoryLoading}
              onRefresh={() => refetchHistory()}
            />

            {/* Dedicated Section 3: Recent Telemetry Logs Table */}
            <RobotHistoryTable
              history={history}
              isLoading={isHistoryLoading}
            />
          </>
        )}
      </Content>
    </Layout>
  )
}
