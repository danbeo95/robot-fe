"use client";

import React, { useState } from "react";
import { Card, Typography, Tag, Progress, Row, Col, Space, Tooltip, Badge } from "antd";
import {
  RobotOutlined,
  ThunderboltOutlined,
  WifiOutlined,
  ClockCircleOutlined,
  FireOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { RobotItem as RobotItemType } from "@/types/robot";
import LogController from "@/utils/LogController";
import logSyncService from "@/utils/logSyncService";
import useTrackingLabel from "@/hooks/useTrackingLabel";

const { Title, Text, Paragraph } = Typography;

export interface RobotItemProps {
  robot: RobotItemType;
  onClick?: (robot: RobotItemType) => void;
  viewMode?: "card" | "row";
}

/**
 * Helper to determine battery color by percentage
 */
function getBatteryColor(percent?: number): string {
  if (percent === undefined) return "#1890ff";
  if (percent <= 20) return "#ff4d4f";
  if (percent <= 50) return "#faad14";
  return "#52c41a";
}

/**
 * Helper to describe WiFi quality
 */
function getWifiColor(signal?: number): string {
  if (signal === undefined) return "default";
  if (signal >= -60) return "success";
  if (signal >= -75) return "warning";
  return "error";
}

/**
 * Dumb presentation component for a single Robot item.
 * Purely renders the passed robot state without any internal WebSocket connection.
 */
function RobotItemBase({ robot, onClick, viewMode = "card" }: RobotItemProps) {
  const robotId = robot.id || robot.robot_id;
  const battery = robot.batteryPercentage;
  const wifi = robot.wifiSignalStrength;
  const isCharging = Boolean(robot.isCharging);
  const temperature = robot.temperature;
  const memory = robot.memoryUsage;
  const timestamp = robot.lastSeen || robot.createdAt;

  const hasTelemetry = battery !== undefined || wifi !== undefined || temperature !== undefined || memory !== undefined;

  const batteryColor = getBatteryColor(battery);

  const [clickCount, setClickCount] = useState(0);
  const ramUpdateLabel = useTrackingLabel({ currentValue: memory, prefix: "updated-ram" });
  const tempUpdateLabel = useTrackingLabel({ currentValue: temperature, prefix: "updated-temp" });
  const wifiUpdateLabel = useTrackingLabel({ currentValue: wifi, prefix: "updated-wifi" });

  const handleClick = () => {
    setClickCount((prev) => prev + 1);
    if (onClick) onClick(robot);
  };

  // Row View Mode
  if (viewMode === "row") {
    return (
      <div
        onClick={handleClick}
        style={{
          padding: "12px 16px",
          background: "#fff",
          borderRadius: 8,
          border: "1px solid #f0f0f0",
          marginBottom: 8,
          cursor: onClick ? "pointer" : "default",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "all 0.2s ease",
        }}
        className="robot-item-row"
      >
        <Space size={16} align="center">
          <Badge status="processing" color="#1890ff" />
          <Space>
            <RobotOutlined style={{ color: "#1890ff", fontSize: 16 }} />
            <Text strong>Robot {robotId}</Text>
          </Space>
          <Text
            type="secondary"
            style={{ maxWidth: 220 }}
            ellipsis={{ tooltip: robot.descriptions || robot.description }}
          >
            {robot.descriptions || robot.description || "No description"}
          </Text>
        </Space>

        <Space size={24} align="center">
          {battery !== undefined && (
            <Tooltip title={`Battery: ${battery}% ${isCharging ? "(Charging)" : ""}`}>
              <Space size={12}>
                <LogController exportLog={logSyncService.registerSink}>
                  {clickCount > 0 ? `+${clickCount}` : null}
                </LogController>
                <Space size={4}>
                  <ThunderboltOutlined style={{ color: batteryColor }} />
                  <span style={{ fontWeight: 600, color: batteryColor }}>
                    {battery !== undefined ? `${Math.round(battery)}%` : "—"}
                  </span>
                </Space>
              </Space>
            </Tooltip>
          )}

          {wifi !== undefined && (
            <Tooltip title={`WiFi Signal: ${wifi} dBm`}>
              <Space size={6} align="center">
                <LogController exportLog={logSyncService.registerSink}>
                  <small style={{ fontSize: 11 }}>{wifiUpdateLabel}</small>
                </LogController>
                <Tag color={getWifiColor(wifi)}>
                  <WifiOutlined /> {wifi} dBm
                </Tag>
              </Space>
            </Tooltip>
          )}

          {temperature !== undefined && (
            <Tooltip title={`Core Temp: ${temperature}°C`}>
              <Space size={6} align="center">
                <LogController exportLog={logSyncService.registerSink}>
                  <small style={{ fontSize: 11 }}>{tempUpdateLabel}</small>
                </LogController>
                <Tag color={temperature > 65 ? "volcano" : "orange"}>
                  <FireOutlined /> {temperature}°C
                </Tag>
              </Space>
            </Tooltip>
          )}

          {memory !== undefined && (
            <Tooltip title={`RAM Usage: ${Math.round(memory)}%`}>
              <Space size={6} align="center">
                <LogController exportLog={logSyncService.registerSink}>
                  <small style={{ fontSize: 11 }}>{ramUpdateLabel}</small>
                </LogController>
                <Tag color="purple">
                  <DashboardOutlined /> {Math.round(memory)}%
                </Tag>
              </Space>
            </Tooltip>
          )}

          {timestamp && (
            <Text type="secondary" style={{ fontSize: 11 }} suppressHydrationWarning>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {dayjs(timestamp).format("HH:mm:ss")}
            </Text>
          )}
        </Space>
      </div>
    );
  }

  // Default: Card View Mode
  return (
    <Card
      hoverable={Boolean(onClick)}
      className="robot-card"
      onClick={handleClick}
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid #e8ecf4",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        background: "#ffffff",
      }}
      styles={{ body: { padding: 20 } }}
    >
      {/* Card Header: Robot Badge, ID, Online / Charging Tag */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: "linear-gradient(135deg, #1890ff 0%, #0050b3 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 22,
              boxShadow: "0 4px 12px rgba(24, 144, 255, 0.35)",
            }}
          >
            <RobotOutlined />
          </div>
          <div>
            <Title level={5} style={{ margin: 0, fontWeight: 700, letterSpacing: "-0.2px" }}>
              Robot {robotId}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ID: {robot.id || robotId}
            </Text>
          </div>
        </div>

        <Space size={8} align="center">
          <LogController exportLog={logSyncService.registerSink}>
            {clickCount > 0 ? (
              <span
                className="log-controller-click-badge"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "1px 8px",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#d4380d",
                  background: "#fff2e8",
                  border: "1px solid #ffbb96",
                }}
              >
                +{clickCount}
              </span>
            ) : null}
          </LogController>
          {isCharging ? (
            <Tag color="green" style={{ borderRadius: 12, padding: "2px 8px" }}>
              ⚡ Charging
            </Tag>
          ) : (
            <Tag color="cyan" style={{ borderRadius: 12, padding: "2px 8px" }}>
              ● Active
            </Tag>
          )}
        </Space>
      </div>

      {/* Description */}
      <Paragraph
        type="secondary"
        ellipsis={{ rows: 2, tooltip: robot.descriptions || robot.description }}
        style={{ minHeight: 40, fontSize: 13, color: "#656d78", marginBottom: 14, lineHeight: "1.45" }}
      >
        {robot.descriptions || robot.description || "No description assigned."}
      </Paragraph>

      {/* Real-time Telemetry Indicators */}
      <div
        style={{
          background: "#f8fafd",
          borderRadius: 10,
          padding: "12px 14px",
          marginBottom: 14,
          border: "1px solid #edf2f9",
        }}
      >
        {hasTelemetry ? (
          <>
            {/* Battery & Charging */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: "#8c9ba5" }}>
                  <ThunderboltOutlined style={{ marginRight: 4, color: batteryColor }} />
                  Battery Level
                </Text>
                <Text strong style={{ fontSize: 12, color: batteryColor }}>
                  {battery !== undefined ? `${Math.round(battery)}%` : "—"}
                </Text>
              </div>
              <Progress percent={Math.round(battery || 0)} showInfo={false} strokeColor={batteryColor} size="small" />
            </div>

            {/* Memory Usage */}
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <Space size={6} align="center">
                  <Text style={{ fontSize: 12, color: "#8c9ba5" }}>
                    <DashboardOutlined style={{ marginRight: 4, color: "#722ed1" }} />
                    RAM Usage
                  </Text>
                  <LogController exportLog={logSyncService.registerSink}>
                    <small style={{ fontSize: 11 }}>{ramUpdateLabel}</small>
                  </LogController>
                </Space>
                <Text strong style={{ fontSize: 12, color: "#722ed1" }}>
                  {memory !== undefined ? `${Math.round(memory)}%` : "—"}
                </Text>
              </div>
              <Progress percent={Math.round(memory || 0)} showInfo={false} strokeColor="#722ed1" size="small" />
            </div>

            {/* Temperature & WiFi Stats Grid */}
            <Row gutter={8} style={{ marginTop: 6 }}>
              <Col span={12}>
                <div
                  style={{
                    background: "#ffffff",
                    padding: "6px 8px",
                    borderRadius: 6,
                    border: "1px solid #eef2f8",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <FireOutlined style={{ color: temperature && temperature > 65 ? "#ff4d4f" : "#fa8c16" }} />
                  <div>
                    <div style={{ fontSize: 10, color: "#8c9ba5", lineHeight: 1, display: "flex", alignItems: "center", gap: 4 }}>
                      <span>Temp</span>
                      <LogController exportLog={logSyncService.registerSink}>
                        <small style={{ fontSize: 9 }}>{tempUpdateLabel}</small>
                      </LogController>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#262626" }}>
                      {temperature !== undefined ? `${temperature}°C` : "—"}
                    </div>
                  </div>
                </div>
              </Col>

              <Col span={12}>
                <div
                  style={{
                    background: "#ffffff",
                    padding: "6px 8px",
                    borderRadius: 6,
                    border: "1px solid #eef2f8",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <WifiOutlined style={{ color: "#1890ff" }} />
                  <div>
                    <div style={{ fontSize: 10, color: "#8c9ba5", lineHeight: 1, display: "flex", alignItems: "center", gap: 4 }}>
                      <span>WiFi</span>
                      <LogController exportLog={logSyncService.registerSink}>
                        <small style={{ fontSize: 9 }}>{wifiUpdateLabel}</small>
                      </LogController>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#262626" }}>
                      {wifi !== undefined ? `${wifi} dBm` : "—"}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Awaiting telemetry sync...
            </Text>
          </div>
        )}
      </div>

      {/* Card Footer: Timestamp */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Text type="secondary" style={{ fontSize: 11 }} suppressHydrationWarning>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          {timestamp ? dayjs(timestamp).format("HH:mm:ss") : "Active"}
        </Text>
        <Tag color="blue" style={{ margin: 0, fontSize: 11, borderRadius: 10 }}>
          {robot.id || robotId}
        </Tag>
      </div>
    </Card>
  );
}

export const RobotItem = React.memo(RobotItemBase, (prev, next) => {
  if (prev.viewMode !== next.viewMode) return false;
  if (prev.onClick !== next.onClick) return false;
  if (prev.robot === next.robot) return true;

  const pr = prev.robot;
  const nr = next.robot;

  return (
    (pr.id || pr.robot_id) === (nr.id || nr.robot_id) &&
    pr.batteryPercentage === nr.batteryPercentage &&
    pr.wifiSignalStrength === nr.wifiSignalStrength &&
    pr.isCharging === nr.isCharging &&
    pr.temperature === nr.temperature &&
    pr.memoryUsage === nr.memoryUsage &&
    (pr.lastSeen || pr.createdAt) === (nr.lastSeen || nr.createdAt) &&
    (pr.descriptions || pr.description) === (nr.descriptions || nr.description)
  );
});

export default RobotItem;
