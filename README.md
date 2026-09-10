# Robot Fleet Management Frontend

A modern, responsive real-time dashboard application for monitoring, tracking, and diagnosing autonomous robot fleets. Built with **Next.js 15 (App Router)**, **React 18**, **TypeScript**, **Ant Design 5**, **TanStack React Query**, and **Recharts**.

---

## 📋 Features

- ⚡ **Live Real-Time Fleet Streaming**: Instant telemetry updates streamed directly from robots over native WebSockets (`ws://localhost:8080/robots`).
- 🤖 **Fleet Overview & Statistics**: High-level KPI metrics showing configured fleet units, active telemetry stream statuses, battery levels, WiFi signals, and CPU temperatures.
- 🚨 **Intelligent Alert System**: Automated battery warning banners with elapsed time trackers when battery drops below 20% without charging (e.g. Critical shutdown alert after 5+ consecutive minutes).
- 📈 **Interactive Historical Telemetry Charts**: Multi-metric visual line charts powered by Recharts tracking battery depletion, WiFi signal fluctuations, core temperature, and memory utilization.
- 📋 **Telemetry History Table**: Paginated, sortable tabular view of historical robot data points.
- 🔍 **Detailed Robot Inspection**: Dedicated individual robot page (`/[id]`) with hardware descriptions, live telemetry gauges, and chronological metrics.
- 🔄 **Hybrid State Management**: Combines TanStack Query server-state caching with real-time in-memory cache patching via WebSocket events.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 15](https://nextjs.org/) | React framework with App Router and Server/Client Component architecture |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict type checking and safety |
| **UI Library** | [Ant Design 5 (`antd`)](https://ant.design/) | Enterprise UI component system and iconography (`@ant-design/icons`) |
| **State & Cache**| [TanStack Query v5](https://tanstack.com/query/latest) | Asynchronous query fetching, automatic caching, and real-time cache patching |
| **Charts** | [Recharts](https://recharts.org/) | Composable declarative charting library for telemetry visualization |
| **Date Utility** | [Day.js](https://day.js.org/) | Lightweight modern datetime formatting and parsing |

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js**: Version **18.x** or **20.x** LTS installed
- **Backend Service**: Make sure the backend server is running on `http://localhost:8080` (see `backend/README.md`)

### 2. Environment Configuration

Create or configure a `.env.local` file in the `frontend` root directory if you need custom endpoints (optional, defaults provided):

```env
# WebSocket endpoint for real-time telemetry streaming
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8080

# Backend REST API endpoint (proxied automatically in development via next.config.js)
API_BASE_URL=http://localhost:8080/api
```

> **Note on API Proxy:** In [`next.config.js`](file:///Users/danbn/Desktop/source_code/frontend/next.config.js), Next.js automatically rewrites requests matching `/api/:path*` to `http://localhost:8080/api/:path*`, avoiding CORS issues in local development.

### 3. Installation

Install all required frontend dependencies:

```bash
cd frontend
npm install
```

### 4. Running the Development Server

Start the development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 5. Building for Production

Compile and optimize the application for production deployment:

```bash
# Create optimized production build
npm run build

# Start the production Next.js server
npm start
```

---

## 📂 Project Structure

```
frontend/
├── next.config.js              # Next.js configuration, environment variables & API rewrites
├── package.json                # Project scripts and dependencies
├── tsconfig.json               # TypeScript configuration
└── src/
    ├── app/
    │   ├── globals.css         # Global styling and reset rules
    │   ├── layout.tsx          # Root layout wrapping AntdRegistry & ReactQueryProvider
    │   ├── page.tsx            # Main Fleet Dashboard page (/)
    │   ├── [id]/
    │   │   ├── page.tsx        # Single Robot Details page (/[id])
    │   │   └── _components/    # Detail-specific components (BasicInfo, HistoryChart, HistoryTable)
    │   ├── _components/        # Dashboard overview components
    │   │   ├── RobotAlerts.tsx # Real-time battery alert banners & countdowns
    │   │   ├── RobotItem.tsx   # Card/Row presentation component for a single robot
    │   │   └── RobotList.tsx   # Fleet overview grid, search/filter, and KPI metrics
    │   └── lib/
    │       ├── AntdRegistry.tsx       # Ant Design SSR style extraction registry
    │       └── ReactQueryProvider.tsx # QueryClientProvider with global cache configuration
    ├── hooks/
    │   ├── useRobotWebSocket.ts # Live telemetry hook listening to /robots & updating Query cache
    │   ├── useWebSocket.ts      # General-purpose reusable WebSocket hook
    │   └── useTrackingLabel.ts  # State mutation tracking label hook
    ├── types/
    │   └── robot.ts             # TypeScript interfaces for Robot, Telemetry, and History items
    └── utils/
        ├── LogController.tsx    # Diagnostic session logger component
        └── logSyncService.ts    # Batch log synchronization service with 64 KB chunking
```

---

## 🧩 Architecture & State Management

### 1. Dual Data-Flow Architecture

The frontend combines standard REST API queries with real-time WebSocket push updates:

```
┌────────────────────────────────────────────────────────┐
│                   Next.js Frontend                     │
│                                                        │
│  1. Initial Page Load        2. Live Telemetry Stream  │
│  [GET /api/robots]           [WS /robots]              │
└───────────▲────────────────────────────▲───────────────┘
            │                            │
            │ REST HTTP                  │ Push Broadcasts
            ▼                            ▼
┌────────────────────────────────────────────────────────┐
│             Backend (uWebSockets.js :8080)             │
└────────────────────────────────────────────────────────┘
```

1. **Initial Hydration**: When pages mount, TanStack Query (`useQuery`) fetches the initial fleet list or robot history from the REST API (`/api/robots` or `/api/robots/:id/history`).
2. **Real-time Patching**: The custom hook [`useRobotWebSocket`](file:///Users/danbn/Desktop/source_code/frontend/src/hooks/useRobotWebSocket.ts) connects to `ws://localhost:8080/robots`. Upon receiving incoming telemetry frames, it directly patches the TanStack Query cache (`queryClient.setQueryData(['robots'], ...)`).
3. **No Unnecessary Polling**: This eliminates expensive polling intervals while ensuring zero-latency updates for metrics such as battery percentage, WiFi signal strength, and temperature.

### 2. Live Alerts Logic (`RobotAlerts`)

Located in [`frontend/src/app/_components/RobotAlerts.tsx`](file:///Users/danbn/Desktop/source_code/frontend/src/app/_components/RobotAlerts.tsx):
- **Warning Alert**: Triggered when `batteryPercentage < 20%` and `isCharging === false`.
- **Critical Alert**: If the low-battery condition persists continuously for **over 5 minutes**, the alert escalates to an error status notifying operators of an impending robot shutdown.
- **Auto-Reset**: Alerts clear immediately when battery percentage returns to `≥ 20%` or the robot begins charging (`isCharging === true`).

---

## 🧭 Pages Guide

### 1. Fleet Overview (`/`)
- **Header**: Top navigation with system identity.
- **KPI Metrics Row**: Active robot count and real-time WebSocket connection badge (`Connected` vs. `Syncing`).
- **Live Alert Banners**: Dynamically displayed when any robot encounters critical or low-battery conditions.
- **Robot Grid**: Cards displaying live telemetry gauges (Battery progress bar, WiFi dBm signal tag, Temperature meter, RAM usage, and Last Seen timestamp). Clicking any card navigates to the detailed inspection view.

### 2. Robot Detail View (`/[id]`)
- **Breadcrumb Navigation**: Direct back link to the fleet overview.
- **Basic Info Card**: Unit ID, descriptions, and real-time status indicators.
- **Telemetry Charts**: Interactive time-series charts visualizing Battery (%), WiFi Signal (dBm), Temperature (°C), and Memory Usage (%).
- **History Data Table**: Comprehensive tabular breakdown of recent historical telemetry points.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs the Next.js development server at [http://localhost:3000](http://localhost:3000) |
| `npm run build` | Builds the production application into `.next` |
| `npm run start` | Runs the built production server |
| `npm run lint` | Runs Next.js code analysis and linting |
