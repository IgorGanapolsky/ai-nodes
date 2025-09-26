# 🚀 DePIN Autopilot

> Zero-capex DePIN Ops-as-a-Service platform for managing AI/blockchain nodes with revenue sharing

[![CI](https://github.com/IgorGanapolsky/ai-nodes/actions/workflows/ci.yml/badge.svg)](https://github.com/IgorGanapolsky/ai-nodes/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-20+-green)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Revenue Model](#revenue-model)
- [Supported Networks](#supported-networks)
- [API Documentation](#api-documentation)
- [CLI Usage](#cli-usage)
- [Security](#security)
- [Contributing](#contributing)
- [Roadmap](#roadmap)

## 🎯 Overview

DePIN Autopilot is a comprehensive platform for managing decentralized physical infrastructure (DePIN) nodes across multiple networks. Device owners retain full custody while operators provide monitoring, optimization, and reporting services for a revenue share (typically 10-20%).

### Key Benefits

- **Zero Capital Investment**: Manage other people's nodes without buying hardware
- **Non-Custodial**: Owners keep wallet custody; operators only read metrics
- **Automated Operations**: Smart repricing, utilization optimization, alert monitoring
- **Multi-Network Support**: io.net, Nosana, Render, Grass, Natix, and more
- **Revenue Sharing**: Transparent earnings tracking and automated statements

## ✨ Features

### Core Capabilities

- 📊 **Real-time Monitoring**: Track node performance, earnings, and utilization
- 💰 **Revenue Management**: Automated revenue sharing and statement generation
- 🤖 **Smart Pricing**: Dynamic price optimization based on utilization targets
- 🔔 **Alert System**: Proactive monitoring with Discord/Email notifications
- 📈 **Analytics Dashboard**: Web interface with charts and performance metrics
- 🖥️ **CLI Tool**: Powerful command-line interface for automation
- 🔄 **API Integration**: RESTful API for custom integrations

### Technical Features

- **Monorepo Architecture**: Organized with Turborepo for efficient builds
- **TypeScript**: Full type safety across all packages
- **SQLite Database**: Portable database with Drizzle ORM
- **Mock Connectors**: Deterministic fake data for development
- **Scheduled Jobs**: Automated polling, statements, and alerts
- **Docker Ready**: Containerized deployment support

## 🏗️ Architecture

```
depinautopilot/
├── apps/
│   ├── server/      # Fastify REST API
│   ├── cli/         # Commander CLI tool
│   └── web/         # Next.js 14 dashboard
├── packages/
│   ├── connectors/  # DePIN network integrations
│   ├── core/        # Business logic & calculations
│   ├── db/          # Drizzle ORM + SQLite
│   ├── notify/      # Discord/Email notifications
│   └── utils/       # Shared utilities
└── scripts/         # Demo and automation scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/IgorGanapolsky/ai-nodes.git
cd ai-nodes

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Initialize database
pnpm db:generate
pnpm db:migrate
pnpm seed

# Start development
pnpm dev
```

### One-Command Demo

```bash
# Run complete demo with sample data
pnpm demo
```

This will:

1. Seed database with demo owner and devices
2. Pull metrics from mock connectors
3. Display earnings and utilization
4. Generate a weekly statement CSV
5. Show next steps

## 💵 Revenue Model

### How It Works

1. **Device Owner**: Provides read-only API keys or dashboard access
2. **Operator** (You): Monitors, optimizes, and reports on performance
3. **Revenue Share**: Typically 10-20% of gross earnings
4. **Settlement**: Weekly automated statements and payouts

### Example Economics

```
Target Monthly Income: $300 after fees
Required Gross: $430 (at 15% share = $64.50)
Devices Needed: 2-3 well-utilized nodes
Average Hourly Rate: $0.60-$1.20 per device
```

### Utilization Planning

```bash
# Calculate required utilization for target earnings
pnpm depinautopilot plan --owner demo@owner.test --target-monthly-gross 430

# Output:
# Required: 23.9 hours/day at $0.60/hour
# Current: 18.2 hours/day (76% utilization)
# Gap: Need 5.7 more hours/day
```

## 🌐 Supported Networks

| Network | Type           | Avg Rate/Hour | Status  |
| ------- | -------------- | ------------- | ------- |
| io.net  | GPU Compute    | $1.50-$3.00   | ✅ Mock |
| Nosana  | CPU Compute    | $0.40-$0.80   | ✅ Mock |
| Render  | 3D Rendering   | $0.80-$2.00   | ✅ Mock |
| Grass   | Bandwidth      | $0.10-$0.30   | ✅ Mock |
| Natix   | Mapping/Camera | $0.20-$0.50   | ✅ Mock |

**Note**: Mock connectors provide deterministic fake data. Real API integration requires adding keys to `.env`.

## 📡 API Documentation

### Base URL

```
http://localhost:4000
```

### Live Docs

- OpenAPI/Swagger UI: `http://localhost:4000/docs`

### Key Endpoints

#### Health Check

```http
GET /health
```

#### Owners Management

```http
GET    /owners              # List all owners
POST   /owners              # Create owner
GET    /owners/:id          # Get owner details
PUT    /owners/:id          # Update owner
DELETE /owners/:id          # Remove owner
```

#### Device Operations

```http
GET    /devices?ownerId=    # List devices
POST   /devices             # Add device
GET    /devices/:id         # Get device
PUT    /devices/:id         # Update device
DELETE /devices/:id         # Remove device
```

#### Metrics & Analytics

```http
GET /metrics?deviceId=&since=  # Get device metrics
GET /metrics/live              # Real-time dashboard data
```

#### Actions

```http
POST /actions/reprice          # Dynamic pricing
POST /actions/optimize         # Performance optimization
```

#### Statements

```http
POST /statements/generate      # Generate statement
GET  /statements/:id/download  # Download CSV/PDF
```

## 🖥️ CLI Usage

### Installation

```bash
# Global installation (after build)
npm link
depinautopilot --help
```

### Common Commands

#### Owner Management

```bash
# Add new owner
depinautopilot owners add \
  --name "John Doe" \
  --email john@example.com \
  --rev-share 0.15 \
  --discord https://discord.com/api/webhooks/...

# List owners
depinautopilot owners list
```

#### Device Management

```bash
# Add device
depinautopilot devices add \
  --owner john@example.com \
  --marketplace ionet \
  --external-id abc123 \
  --price 1.50

# List devices
depinautopilot devices list --owner john@example.com
```

#### Monitoring

```bash
# Pull latest metrics (shows table)
depinautopilot pull

# Watch mode (updates every 60s)
depinautopilot pull --watch
```

#### Planning & Optimization

```bash
# Calculate required utilization
depinautopilot plan \
  --owner john@example.com \
  --target-monthly-gross 500

# Suggest repricing
depinautopilot reprice \
  --device device-123 \
  --target-util 0.75 \
  --dry-run
```

#### Statements

```bash
# Generate monthly statement
depinautopilot statement \
  --owner john@example.com \
  --period 2024-01

# Output: statements/john@example.com/2024-01.csv
```

## 🔒 Security

### Custody-Safe Design

- **No Private Keys**: Never stores wallet private keys or seed phrases
- **Read-Only Access**: Only requires dashboard viewing permissions
- **API Keys**: Stored encrypted in environment variables
- **Scraping Fallback**: Playwright support for dashboard access (opt-in)

### Best Practices

1. Use strong, unique API keys
2. Enable 2FA on all node provider accounts
3. Regularly rotate credentials
4. Monitor access logs
5. Use HTTPS in production

### Security Policy

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm --filter @depinautopilot/core test

# Coverage report
pnpm test:coverage
```

## 🐳 Docker Deployment

```bash
# Build image
docker build -t depinautopilot .

# Run container
docker run -d \
  -p 4000:4000 \
  -v ./data:/app/data \
  --env-file .env \
  depinautopilot
```

## 📚 Documentation

- [API Reference](./docs/API.md)
- [Connector Guide](./docs/CONNECTORS.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Revenue Calculator](./docs/REVENUE.md)
- [Roadmap](./ROADMAP.md)

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](./LICENSE) file

## 🙏 Acknowledgments

Built with:

- [Fastify](https://www.fastify.io/) - Fast web framework
- [Next.js](https://nextjs.org/) - React framework
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Commander.js](https://github.com/tj/commander.js/) - CLI framework
- [Turborepo](https://turbo.build/) - Monorepo build system

---

**⚠️ Disclaimer**: This software manages node operations but does not guarantee earnings. Actual returns depend on network conditions, device performance, and market demand. Always comply with local regulations and tax obligations.

**🚀 Ready to maximize your DePIN earnings?** Start with `pnpm demo` and see the platform in action!
