'use client'

import React, { memo } from 'react'
import { Card, Row, Col, Typography, Tag, Progress, Statistic, Space } from 'antd'
import {
  RobotOutlined,
  ThunderboltOutlined,
  WifiOutlined,
  FireOutlined,
  DashboardOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { RobotItem } from '@/types/robot'

const { Title, Text, Paragraph } = Typography

export interface RobotBasicInfoProps {
  /** The robot item containing profile and current telemetry */
  robot: RobotItem
  /** Optional loading indicator */
  isLoading?: boolean
}

/**
 * Battery color helper based on remaining level
 */
function getBatteryColor(percent?: number): string {
  if (percent === undefined) return '#1890ff'
  if (percent <= 20) return '#ff4d4f'
  if (percent <= 50) return '#faad14'
  return '#52c41a'
}

/**
 * WiFi signal quality tag helper
 */
function getWifiQuality(signal?: number): { color: string; label: string } {
  if (signal === undefined) return { color: 'default', label: 'Unknown' }
  if (signal >= -60) return { color: 'success', label: 'Excellent' }
  if (signal >= -75) return { color: 'warning', label: 'Good' }
  return { color: 'error', label: 'Weak' }
}

/**
 * Dedicated Section 1: Basic Robot Information & Current KPI Metrics
 */
function RobotBasicInfoBase({ robot, isLoading = false }: RobotBasicInfoProps) {
  const robotId = robot.id || robot.robot_id
  const currentBattery = robot.batteryPercentage
  const currentWifi = robot.wifiSignalStrength
  const currentIsCharging = Boolean(robot.isCharging)
  const currentTemperature = robot.temperature
  const currentMemory = robot.memoryUsage
  const currentTimestamp = robot.lastSeen || robot.createdAt
  const batteryColor = getBatteryColor(currentBattery)
  const wifiQuality = getWifiQuality(currentWifi)

  return (
    <Card
      loading={isLoading}
      variant="borderless"
      style={{
        borderRadius: 12,
        marginBottom: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
      styles={{ body: { padding: 24 } }}
    >
      <Row justify="space-between" align="middle" gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 28,
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.35)',
                flexShrink: 0,
              }}
            >
              <RobotOutlined />
            </div>
            <div>
              <Space align="center" size={10}>
                <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                  Robot {robotId}
                </Title>
                <Tag color={currentIsCharging ? 'green' : 'cyan'}>
                  {currentIsCharging ? '⚡ Charging' : '● Online'}
                </Tag>
              </Space>
              <Paragraph
                type="secondary"
                style={{ margin: '4px 0 0 0', maxWidth: 500, fontSize: 13 }}
                ellipsis={{ rows: 2, tooltip: robot.descriptions || robot.description }}
              >
                {robot.descriptions || robot.description || 'No description assigned.'}
              </Paragraph>
            </div>
          </div>
        </Col>

        <Col xs={24} md={8} style={{ textAlign: 'right' }}>
          <Space direction="vertical" size={4} style={{ textAlign: 'right' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              Last Telemetry Sync:
            </Text>
            <Text strong style={{ fontSize: 14 }} suppressHydrationWarning>
              {currentTimestamp
                ? dayjs(currentTimestamp).format('YYYY-MM-DD HH:mm:ss')
                : '—'}
            </Text>
          </Space>
        </Col>
      </Row>

      {/* KPI Metrics Row */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {/* Battery Metric */}
        <Col xs={12} sm={6}>
          <Card
            size="small"
            style={{
              borderRadius: 10,
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              textAlign: 'center',
            }}
          >
            <Statistic
              title="Battery Level"
              value={currentBattery !== undefined ? Math.round(currentBattery) : '—'}
              suffix="%"
              valueStyle={{ color: batteryColor, fontWeight: 700 }}
              prefix={<ThunderboltOutlined style={{ color: batteryColor }} />}
            />
            <div style={{ marginTop: 6 }}>
              <Progress
                percent={Math.round(currentBattery || 0)}
                showInfo={false}
                strokeColor={batteryColor}
                size="small"
              />
            </div>
          </Card>
        </Col>

        {/* WiFi Signal Metric */}
        <Col xs={12} sm={6}>
          <Card
            size="small"
            style={{
              borderRadius: 10,
              background: '#e6f7ff',
              border: '1px solid #91d5ff',
              textAlign: 'center',
            }}
          >
            <Statistic
              title="WiFi Signal"
              value={currentWifi !== undefined ? currentWifi : '—'}
              suffix="dBm"
              valueStyle={{ color: '#1890ff', fontWeight: 700 }}
              prefix={<WifiOutlined style={{ color: '#1890ff' }} />}
            />
            <Tag color={wifiQuality.color} style={{ marginTop: 6 }}>
              {wifiQuality.label} Quality
            </Tag>
          </Card>
        </Col>

        {/* Temperature Metric */}
        <Col xs={12} sm={6}>
          <Card
            size="small"
            style={{
              borderRadius: 10,
              background: '#fffbe6',
              border: '1px solid #ffe58f',
              textAlign: 'center',
            }}
          >
            <Statistic
              title="Temperature"
              value={currentTemperature !== undefined ? currentTemperature : '—'}
              suffix="°C"
              valueStyle={{
                color: currentTemperature && currentTemperature > 65 ? '#ff4d4f' : '#faad14',
                fontWeight: 700,
              }}
              prefix={
                <FireOutlined
                  style={{
                    color: currentTemperature && currentTemperature > 65 ? '#ff4d4f' : '#faad14',
                  }}
                />
              }
            />
            <Tag
              color={currentTemperature && currentTemperature > 65 ? 'volcano' : 'gold'}
              style={{ marginTop: 6 }}
            >
              {currentTemperature && currentTemperature > 65 ? 'High Temp' : 'Optimal'}
            </Tag>
          </Card>
        </Col>

        {/* RAM / Memory Usage */}
        <Col xs={12} sm={6}>
          <Card
            size="small"
            style={{
              borderRadius: 10,
              background: '#f9f0ff',
              border: '1px solid #d3adf7',
              textAlign: 'center',
            }}
          >
            <Statistic
              title="Memory Usage"
              value={currentMemory !== undefined ? Math.round(currentMemory) : '—'}
              suffix="%"
              valueStyle={{ color: '#722ed1', fontWeight: 700 }}
              prefix={<DashboardOutlined style={{ color: '#722ed1' }} />}
            />
            <div style={{ marginTop: 6 }}>
              <Progress
                percent={Math.round(currentMemory || 0)}
                showInfo={false}
                strokeColor="#722ed1"
                size="small"
              />
            </div>
          </Card>
        </Col>
      </Row>
    </Card>
  )
}

export const RobotBasicInfo = memo(RobotBasicInfoBase)
export default RobotBasicInfo
