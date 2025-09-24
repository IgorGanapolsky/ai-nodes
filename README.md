# DePIN Autopilot

A comprehensive monorepo for managing and monitoring DePIN (Decentralized Physical Infrastructure Network) nodes across multiple protocols and networks.

## 🚀 Features

- **Multi-Network Support**: Connect to Helium, Filecoin, Storj, Theta, Akash, and more
- **Real-time Monitoring**: Track node performance, earnings, and health metrics
- **Smart Alerts**: Get notified via Discord, email, or SMS when issues arise
- **CLI Management**: Powerful command-line interface for node operations
- **Web Dashboard**: Modern React-based web interface
- **Mobile App**: Native mobile app built with React Native and Expo
- **Automated Reporting**: Generate performance and earnings reports

## 📁 Project Structure

```
depinautopilot/
├── apps/
│   ├── server/          # Fastify REST API server
│   ├── cli/             # Node.js CLI application
│   ├── web/             # Next.js 14 web dashboard
│   └── mobile/          # React Native mobile app
├── packages/
│   ├── core/            # Shared domain models and types
│   ├── db/              # Database layer with Drizzle ORM
│   ├── connectors/      # DePIN network API connectors
│   ├── notify/          # Notification system
│   └── utils/           # Shared utility functions
├── package.json         # Root package configuration
├── turbo.json          # Turborepo configuration
└── pnpm-workspace.yaml # PNPM workspace configuration
```

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Fastify
- **Database**: SQLite with Drizzle ORM
- **Language**: TypeScript
- **Build**: Turborepo + PNPM

### Frontend
- **Web**: Next.js 14 with App Router
- **Mobile**: React Native with Expo SDK 52
- **UI**: Tailwind CSS + shadcn/ui
- **State**: TanStack Query
- **Charts**: Recharts

### DevOps
- **Package Manager**: PNPM with workspaces
- **Build System**: Turborepo
- **Testing**: Vitest
- **Linting**: ESLint + TypeScript

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or later
- PNPM 8.0.0 or later

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd depinautopilot
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Build all packages**
   ```bash
   pnpm build
   ```

### Development

Start all applications in development mode:
```bash
pnpm dev
```

Or start individual applications:
```bash
# API Server
pnpm --filter @depinautopilot/server dev

# Web Dashboard
pnpm --filter @depinautopilot/web dev

# CLI
pnpm --filter @depinautopilot/cli dev

# Mobile App
pnpm --filter @depinautopilot/mobile dev
```

## 📱 Applications

### 🖥 Server API

REST API server providing:
- Node management endpoints
- Metrics collection and reporting
- Alert management
- Authentication and authorization

**Endpoints:**
- `GET /api/v1/health` - Health check
- `GET /api/v1/nodes` - List nodes
- `POST /api/v1/nodes` - Create node
- `GET /api/v1/metrics/summary` - Metrics overview
- `GET /api/v1/metrics/alerts` - Active alerts

### 🌐 Web Dashboard

Modern web interface featuring:
- Real-time node monitoring
- Interactive charts and graphs
- Node management interface
- Alert configuration
- Performance analytics

### 📱 Mobile App

Native mobile application with:
- Push notifications for alerts
- Node status overview
- Quick actions for common tasks
- Offline capability
- Dark/light theme support

### ⌨️ CLI Tool

Powerful command-line interface:

```bash
# List all nodes
depin node list

# Show node details
depin node show <node-id>

# Add a new node
depin node add

# Monitor nodes in real-time
depin monitor watch

# View metrics
depin metrics summary

# Configure CLI
depin config setup
```

## 📊 Supported Networks

| Network | Status | Features |
|---------|--------|----------|
| Helium | ✅ | Node monitoring, earnings tracking |
| Filecoin | ✅ | Storage metrics, reward tracking |
| Storj | ✅ | Storage node monitoring |
| Theta | ✅ | Edge node management |
| Akash | 🚧 | Container monitoring |
| Render | 🚧 | GPU tracking |

## 🔧 Configuration

### Environment Variables

Key configuration options:

```bash
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=./data/depin.db

# Notifications
DISCORD_TOKEN=your-discord-token
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com

# DePIN Networks
HELIUM_API_KEY=your-api-key
FILECOIN_API_KEY=your-api-key
```

### Database Setup

Initialize the database:
```bash
pnpm --filter @depinautopilot/db db:generate
pnpm --filter @depinautopilot/db db:migrate
pnpm --filter @depinautopilot/db db:seed
```

## 🧪 Testing

Run tests across all packages:
```bash
pnpm test
```

Run tests for specific package:
```bash
pnpm --filter @depinautopilot/core test
```

## 📈 Monitoring & Alerts

### Alert Types
- **Node Offline**: When a node hasn't reported in X minutes
- **High Resource Usage**: CPU/Memory above threshold
- **Low Earnings**: Earnings below expected rate
- **Network Issues**: High latency or connection problems

### Notification Channels
- **Discord**: Real-time alerts in Discord channels
- **Email**: HTML-formatted email reports
- **SMS**: Critical alerts via Twilio
- **Mobile Push**: In-app notifications

## 🔒 Security

- JWT-based authentication
- Rate limiting on all endpoints
- Input validation with Zod schemas
- Secure credential storage
- CORS configuration
- Helmet security headers

## 🚀 Deployment

### Using Docker

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment

```bash
# Build for production
pnpm build

# Start server
pnpm --filter @depinautopilot/server start
```

### Environment-specific Builds

```bash
# Production build
NODE_ENV=production pnpm build

# Staging build
NODE_ENV=staging pnpm build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Use TypeScript for all new code
- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](docs/)
- 🐛 [Report Issues](https://github.com/your-org/depinautopilot/issues)
- 💬 [Discord Community](https://discord.gg/depinautopilot)
- 📧 [Email Support](mailto:support@depinautopilot.io)

## 🗺 Roadmap

### Version 1.1
- [ ] GraphQL API
- [ ] Advanced analytics
- [ ] Custom dashboards
- [ ] Webhook integrations

### Version 1.2
- [ ] Multi-user support
- [ ] Role-based permissions
- [ ] Advanced alerting rules
- [ ] Performance optimizations

### Version 2.0
- [ ] Kubernetes deployment
- [ ] Microservices architecture
- [ ] Real-time WebSocket updates
- [ ] Machine learning insights

---

**Made with ❤️ for the DePIN community**