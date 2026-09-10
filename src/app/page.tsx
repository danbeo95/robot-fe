'use client'

import React from 'react'
import { Layout, Typography } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import RobotList from './_components/RobotList'

const { Header, Content } = Layout
const { Title } = Typography

export default function RootFleetPage() {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Title
            level={4}
            style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <RobotOutlined style={{ color: '#1890ff' }} />
            Robot Fleet Management
          </Title>
        </div>
      </Header>

      {/* Main Content: Fleet overview stats, real-time alert banners, and robot cards */}
      <Content style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <RobotList showStats={true} />
      </Content>
    </Layout>
  )
}