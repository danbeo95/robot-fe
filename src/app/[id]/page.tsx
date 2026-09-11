'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { useRobot, useRobotHistory } from './hooks'
import {
  RobotBasicInfo,
  RobotHistoryChart,
  RobotHistoryTable,
} from './_components'

const { Header, Content } = Layout
const { Title, Text } = Typography

export default function RobotDetailPage() {
  const params = useParams()
  const router = useRouter()
  const robotId = (params?.id as string) || ''

  // 1. Fetch Basic Robot Information & Live Telemetry listener
  const {
    data: robot,
    isLoading: isRobotLoading,
    error: robotError,
    refetch: refetchRobot,
    isWsConnected,
  } = useRobot(robotId)

  // 2. Fetch Historical Telemetry Data & Live Append listener
  const {
    data: history = [],
    isLoading: isHistoryLoading,
    refetch: refetchHistory,
  } = useRobotHistory(robotId)

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
            <Space direction="vertical" align="center" size="middle">
              <Spin size="large" />
              <Text type="secondary">Loading robot profile and telemetry...</Text>
            </Space>
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
