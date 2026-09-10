'use client'

import Link from 'next/link';
import { Layout, Typography, Button, Space, Tag } from 'antd';
import { RobotOutlined, ApiOutlined, CheckCircleOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useWebSocket } from '@/hooks/useWebSocket';

const { Header, Content } = Layout;
const { Title } = Typography;

const baseWsUrl =
  process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
  process.env.WEBSOCKET_URL ||
  'ws://localhost:8080';
const wsUrl = `${baseWsUrl.replace(/\/$/, '')}/dashboard`;

export default function Dashboard() {
  const { isConnected, connect, disconnect } = useWebSocket(wsUrl);

  const handleConnect = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Title level={2} style={{ color: 'white', margin: 0 }}>
            🤖 Robot Fleet Dashboard
          </Title>
        </div>
        <Space>
          <Link href="/robots">
            <Button type="primary" icon={<RobotOutlined />}>
              Robots List
            </Button>
          </Link>
        </Space>
      </Header>

      <Content style={{ padding: '24px' }}>
        <div>
          <h1>Robot Fleet Dashboard</h1>
          <Space>
            <Button
              type={isConnected ? 'default' : 'primary'}
              danger={isConnected}
              icon={isConnected ? <DisconnectOutlined /> : <ApiOutlined />}
              onClick={handleConnect}
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </Button>
            <Tag color={isConnected ? 'green' : 'default'} icon={isConnected ? <CheckCircleOutlined /> : <DisconnectOutlined />}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Tag>
            <Link href="/robots">
              <Button icon={<RobotOutlined />}>View Robots Fleet</Button>
            </Link>
          </Space>
        </div>
      </Content>
    </Layout>
  );
}