'use client'

import React from 'react'
import Link from 'next/link'
import { Layout, Typography, Button } from 'antd'
import { RobotOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import RobotList from './_components/RobotList'

const { Header, Content } = Layout
const { Title } = Typography

export default function RobotsPage() {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fb' }}>
      {/* Navigation Header */}
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
          <Link href="/" style={{ display: 'flex', alignItems: 'center', color: 'white' }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined style={{ color: '#fff' }} />}
              style={{ color: '#fff', marginRight: 4 }}
            >
              Dashboard
            </Button>
          </Link>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)' }} />
          <Title
            level={4}
            style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <RobotOutlined style={{ color: '#1890ff' }} />
            Robot Fleet Management
          </Title>
        </div>
      </Header>

      {/* Main Content with RobotList client component */}
      <Content style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <RobotList showStats={true} />
      </Content>
    </Layout>
  )
}
