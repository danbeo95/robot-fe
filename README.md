# 🤖 Robot Fleet Management — Frontend

A real-time robot fleet monitoring and telemetry dashboard built with **Next.js 15 (App Router)**, **React 18**, **Ant Design 5**, **TanStack React Query**, and **Recharts**.

The application connects to a backend WebSocket server (`uWebSockets.js`) to stream live telemetry updates, detect critical fleet conditions in real time, and visualize historical robot metric trends.

---

## 🚀 Key Features

### 1. Real-Time Fleet Overview (`/`)
- **Fleet Statistics**: Real-time counter of total configured robots and live WebSocket stream connectivity status.
- **Smart Battery Alerts**:
  - **Low Battery Alert** (Warning): Triggers when `battery < 20%` and the robot is **not charging**. Automatically resets when battery reaches $\ge 20\%$ or charging starts.
  - **Critical Battery Alert** (Error): Triggers when `battery < 20%` and not charging for **5+ consecutive minutes**. Displays an urgent shutdown warning.
- **Robot Fleet Grid**: Responsive card layout showing real-time battery status, WiFi signal, temperature, memory usage, charging status, and last-seen timestamps.
- **Optimized Rendering**: `RobotItem` components are designed as dumb presentation components wrapped in `React.memo` to prevent unnecessary re-renders when other robots update.

### 2. Robot Details & Historical Analytics (`/[id]`)
- **Profile & Telemetry KPIs**: Full robot specifications, description, online/charging status tags, and 4 KPI metric cards (Battery gauge, WiFi dBm rating, Temperature alert status, and RAM usage).
- **Tab-Free Historical Visualizations**: Responsive 2x2 grid of real-time synchronized charts powered by **Recharts**:
  - 🔋 **Battery Level (%)**: Area chart with gradient fill and latest percentage tag.
  - 📶 **WiFi Signal (dBm)**: Wireless signal strength area chart.
  - 🌡️ **Temp (°C) & RAM Usage (%)**: Dual-axis line chart tracking thermal and memory utilization over time.
  - 📈 **All Metrics Overview**: Multi-metric composite trend chart.
- **Recent Telemetry Logs**: Tabular record of recent data points sorted newest first with color-coded threshold tags.
- **Live Cache Synchronization**: Incoming WebSocket packets for the active robot automatically update the React Query cache and append live points to historical charts.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router, Client Components) |
| **UI Library** | [Ant Design 5](https://ant.design/) (`antd`) & `@ant-design/icons` |
| **State & Data Fetching** | [@tanstack/react-query](https://tanstack.com/query/latest) v5 |
| **Visualizations** | [Recharts 2](https://recharts.org/) (`AreaChart`, `LineChart`, `ResponsiveContainer`) |
| **WebSocket Client** | Custom WebSocket hook with automatic reconnect (`useRobotWebSocket`) |
| **Utilities** | [Day.js](https://day.js.org/) for timestamp manipulation |
| **Language & Tooling** | TypeScript 5, ESLint |

---

## 📁 Project Structure

```text
frontend/
├── src/
│   ├── app/
│   │   ├── _components/            # Fleet overview components
│   │   │   ├── RobotAlerts.tsx     # Low & critical battery alert banner manager
│   │   │   ├── RobotItem.tsx       # Dumb, memoized robot card component
│   │   │   ├── RobotList.tsx       # Fleet grid, statistics, and query orchestration
│   │   │   └── index.ts            # Barrel export
│   │   ├── [id]/                   # Dynamic robot detail route (e.g. /00001)
│   │   │   ├── _components/        # Dedicated detail section components
│   │   │   │   ├── RobotBasicInfo.tsx   # Basic robot info & KPI metric cards
│   │   │   │   ├── RobotHistoryChart.tsx# 2x2 grid of historical telemetry charts
│   │   │   │   ├── RobotHistoryTable.tsx# Recent telemetry tabular logs
│   │   │   │   └── index.ts        # Section component exports
│   │   │   └── page.tsx            # Robot detail page
│   │   ├── lib/
│   │   │   ├── AntdRegistry.tsx    # Ant Design SSR styling registry
│   │   │   └── ReactQueryProvider.tsx # TanStack Query client provider
│   │   ├── globals.css             # Global base CSS
│   │   ├── layout.tsx              # Root HTML layout with providers
│   │   └── page.tsx                # Root route (Fleet Management Dashboard)
│   ├── hooks/
│   │   ├── useRobotWebSocket.ts    # Reconnecting hook for ws://.../robots stream
│   │   └── useWebSocket.ts         # Generic WebSocket client hook
│   └── types/
│       └── robot.ts                # TypeScript interfaces (RobotItem, RobotHistoryItem, Alert)
├── next.config.js                  # Next.js config & API proxy rewrites
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript configuration with @/* path alias
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js**: v18.17+ or v20+ recommended
- **Backend Service**: Make sure the backend server (`uWebSockets.js`) is running on `http://localhost:8080` (and `ws://localhost:8080`).

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables (optional, defaults to `localhost:8080`):
   Create a `.env.local` file in the `frontend` root:
   ```env
   NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8080
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

---

## 🔌 API & WebSocket Integration

`next.config.js` is pre-configured with proxy rewrites to forward REST API requests directly to the backend without CORS issues:
- `GET /api/robots` ➔ `http://localhost:8080/api/robots`
- `GET /api/robots/:id` ➔ `http://localhost:8080/api/robots/:id`
- `GET /api/robots/:id/history` ➔ `http://localhost:8080/api/robots/:id/history`

Real-time telemetry streams from `ws://localhost:8080/robots` and broadcasts data to all connected clients.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server on port 3000 |
| `npm run build` | Builds an optimized production bundle |
| `npm run start` | Runs the production build server |
| `npm run lint` | Runs ESLint to check for code quality issues |
| `npx tsc --noEmit` | Runs TypeScript type checker |

---

## 📄 License

This project is licensed under the MIT License.
