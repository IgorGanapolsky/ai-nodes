# AI Nodes Automation Scripts

This directory contains comprehensive automation scripts for AI nodes infrastructure management, monitoring, and deployment.

## 📁 Directory Structure

```
scripts/
├── README.md                      # This file
├── setup.sh                      # Main setup script
├── monitor.sh                     # Node monitoring script
├── reinvest.sh                    # Auto-reinvestment script
├── backup.sh                      # Backup automation script
├── deploy.sh                      # Deployment automation script
├── systemd/                       # Linux systemd service files
│   ├── ai-nodes-monitor.service
│   ├── ai-nodes-reinvest.service
│   ├── ai-nodes-backup.service
│   ├── ai-nodes-backup.timer
│   ├── ai-nodes-health.service
│   └── install-services.sh
├── docker/                        # Docker containerization
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── .dockerignore
│   └── docker-manage.sh
└── health-checks/                 # Health monitoring scripts
    ├── basic.sh
    ├── solana.sh
    └── comprehensive.sh
```

## 🚀 Quick Start

### 1. Initial Setup

```bash
# Clone or download the ai-nodes project
cd /path/to/ai-nodes

# Run the main setup script
bash scripts/setup.sh
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.template .env

# Edit configuration
vim .env
```

### 3. Start Monitoring

```bash
# Manual monitoring check
bash scripts/monitor.sh

# Start with systemd (Linux)
sudo bash scripts/systemd/install-services.sh
sudo systemctl start ai-nodes-monitor

# Start with Docker
bash scripts/docker/docker-manage.sh start prod
```

## 📋 Script Documentation

### Core Scripts

#### `setup.sh` - Main Setup Script

**Purpose**: Installs dependencies, sets up environment, initializes database, and configures the system.

**Usage**:

```bash
bash scripts/setup.sh
```

**Features**:

- ✅ Cross-platform support (Linux, macOS)
- ✅ Automatic package manager detection
- ✅ Node.js 20+ installation
- ✅ SQLite database initialization
- ✅ Cron job setup
- ✅ Directory structure creation
- ✅ Environment validation

#### `monitor.sh` - Node Monitoring

**Purpose**: Monitors system resources, Solana network status, and sends alerts.

**Usage**:

```bash
bash scripts/monitor.sh [node_id]
```

**Features**:

- ✅ System resource monitoring (CPU, memory, disk)
- ✅ Solana network connectivity checks
- ✅ Database logging
- ✅ Discord/Email alerts
- ✅ Daily report generation
- ✅ Automated cleanup

**Configuration**:

```bash
MONITORING_INTERVAL=900          # 15 minutes
ALERT_THRESHOLD_CPU=80          # CPU alert threshold
ALERT_THRESHOLD_MEMORY=85       # Memory alert threshold
ALERT_THRESHOLD_DISK=90         # Disk alert threshold
```

#### `reinvest.sh` - Auto-Reinvestment

**Purpose**: Automatically reinvests earnings when thresholds are met using Solana DeFi protocols.

**Usage**:

```bash
bash scripts/reinvest.sh
```

**Features**:

- ✅ Balance threshold checking
- ✅ Jupiter DEX integration for swaps
- ✅ Marinade Finance staking
- ✅ Transaction logging
- ✅ Dry-run mode support
- ✅ Gas price optimization

**Configuration**:

```bash
REINVEST_THRESHOLD=100          # USD threshold
MAX_GAS_PRICE=50               # Max gas price (gwei)
SLIPPAGE_BPS=100               # 1% slippage tolerance
DRY_RUN=false                  # Enable dry-run mode
```

#### `backup.sh` - Data Backup

**Purpose**: Creates encrypted backups with cloud storage support.

**Usage**:

```bash
bash scripts/backup.sh [type]
# Types: full, database, config, incremental
```

**Features**:

- ✅ Multiple backup types
- ✅ Encryption support (AES-256)
- ✅ Compression (gzip)
- ✅ S3/cloud storage upload
- ✅ Retention management
- ✅ Checksum verification

**Configuration**:

```bash
BACKUP_RETENTION_DAYS=30        # Backup retention
BACKUP_ENCRYPTION=true          # Enable encryption
BACKUP_S3_BUCKET=your-bucket    # S3 bucket name
```

#### `deploy.sh` - Deployment Automation

**Purpose**: Automates deployment to various cloud providers and VPS.

**Usage**:

```bash
bash scripts/deploy.sh <type> [target]
# Types: vps, aws, gcp, digitalocean, docker
```

**Features**:

- ✅ Multi-cloud support (AWS, GCP, DigitalOcean)
- ✅ VPS deployment
- ✅ Docker containerization
- ✅ Automated provisioning
- ✅ Security group configuration
- ✅ Post-deployment verification

**Examples**:

```bash
# Deploy to VPS
bash scripts/deploy.sh vps 192.168.1.100

# Deploy to AWS
bash scripts/deploy.sh aws

# Create Docker setup
bash scripts/deploy.sh docker
```

### Systemd Services

#### Installation

```bash
# Install all services
sudo bash scripts/systemd/install-services.sh

# Start services
sudo systemctl start ai-nodes-monitor
sudo systemctl start ai-nodes-reinvest
sudo systemctl start ai-nodes-backup.timer
sudo systemctl start ai-nodes-health
```

#### Service Management

```bash
# Check status
sudo systemctl status ai-nodes-monitor

# View logs
sudo journalctl -u ai-nodes-monitor -f

# Stop services
sudo systemctl stop ai-nodes-monitor

# Uninstall services
sudo bash scripts/systemd/install-services.sh uninstall
```

### Docker Deployment

#### Production Deployment

```bash
# Build and start production stack
bash scripts/docker/docker-manage.sh build prod
bash scripts/docker/docker-manage.sh start prod

# With monitoring stack
bash scripts/docker/docker-manage.sh start prod monitoring

# Check status
bash scripts/docker/docker-manage.sh status prod
```

#### Development Environment

```bash
# Start development environment
bash scripts/docker/docker-manage.sh start dev

# View logs
bash scripts/docker/docker-manage.sh logs dev ai-nodes-dev true

# Execute commands in container
bash scripts/docker/docker-manage.sh exec dev ai-nodes-dev bash
```

#### Available Profiles

- **web**: Nginx reverse proxy
- **monitoring**: Prometheus + Grafana
- **backup**: Backup services
- **tools**: Development tools (SQLite Web UI)

### Health Checks

#### Basic Health Check

```bash
bash scripts/health-checks/basic.sh
```

Checks:

- System resources (CPU, memory, disk)
- Database connectivity
- Network connectivity
- Required tools
- Environment configuration
- Directory structure
- Log file sizes
- Process status

#### Solana-Specific Health Check

```bash
bash scripts/health-checks/solana.sh
```

Checks:

- Solana RPC health
- Network status
- Wallet balance
- Transaction activity
- Stake accounts
- Jupiter API availability
- Slot progression

#### Comprehensive Health Check

```bash
bash scripts/health-checks/comprehensive.sh [options]

# Options:
--parallel      # Run checks in parallel
--no-alerts     # Disable alerts
--no-summary    # Disable console summary
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Node Configuration
NODE_ENV=production

# Database
DATABASE_PATH=./db/ai_nodes.db

# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_PRIVATE_KEY=your_private_key_array
SOLANA_PUBLIC_KEY=your_public_key

# DeFi Settings
JUPITER_API_URL=https://quote-api.jup.ag/v6
MARINADE_STAKE_POOL=8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC
REINVEST_THRESHOLD=100
MAX_GAS_PRICE=50

# Monitoring
MONITORING_INTERVAL=900
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85
ALERT_THRESHOLD_DISK=90

# Alerts
DISCORD_WEBHOOK_URL=your_discord_webhook
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USERNAME=your_email
EMAIL_PASSWORD=your_app_password
EMAIL_TO=alerts@yourcompany.com

# Backup
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=your_backup_bucket
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1

# Security
ENCRYPTION_KEY=your_32_character_encryption_key
```

### Database Schema

The system automatically creates the following tables:

- `node_metrics`: System and node performance metrics
- `transactions`: DeFi transaction logs
- `alerts`: Alert history and status
- `config`: Configuration settings
- `backups`: Backup operation logs

## 📊 Monitoring & Alerting

### Metrics Collected

- **System Metrics**: CPU, memory, disk usage, network latency, uptime
- **Solana Metrics**: Account balance, staked amount, rewards earned
- **Application Metrics**: Transaction counts, success rates, error rates

### Alert Conditions

- High resource usage (CPU > 80%, Memory > 85%, Disk > 90%)
- Network connectivity issues
- Database problems
- Failed transactions
- Low account balance
- Service downtime

### Alert Channels

- **Discord**: Rich embeds with metric details
- **Email**: Detailed text notifications
- **Logs**: All alerts logged to database and files

## 🔐 Security Features

- **Encryption**: AES-256 encryption for sensitive data
- **Access Control**: Non-root user execution
- **Secure Storage**: Environment variables for secrets
- **Network Security**: Firewall rules and security groups
- **Audit Logging**: All operations logged

## 🛠️ Troubleshooting

### Common Issues

1. **Permission Denied**

   ```bash
   chmod +x scripts/*.sh scripts/*/*.sh
   ```

2. **Missing Dependencies**

   ```bash
   bash scripts/setup.sh  # Re-run setup
   ```

3. **Database Issues**

   ```bash
   # Check database
   sqlite3 db/ai_nodes.db ".tables"

   # Reinitialize if needed
   rm db/ai_nodes.db
   bash scripts/setup.sh
   ```

4. **Service Won't Start**

   ```bash
   # Check logs
   sudo journalctl -u ai-nodes-monitor -f

   # Verify environment
   bash scripts/health-checks/basic.sh
   ```

### Log Locations

- **Application Logs**: `logs/`
- **System Logs**: `journalctl -u ai-nodes-*`
- **Health Reports**: `monitoring/`
- **Backup Logs**: `logs/backup-*.log`

## 📈 Performance Optimization

### Recommended Resources

- **Minimum**: 1 CPU, 1GB RAM, 20GB storage
- **Recommended**: 2 CPU, 4GB RAM, 50GB storage
- **Network**: Stable internet connection

### Scaling

- Use Docker swarm for horizontal scaling
- Implement load balancing for multiple nodes
- Consider dedicated database server for high loads

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-script`
3. Test thoroughly on multiple environments
4. Update documentation
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:

1. Check the troubleshooting section
2. Review logs for error details
3. Run health checks to identify problems
4. Create an issue with logs and environment details

---

**Note**: Always test scripts in a development environment before deploying to production. Keep your private keys secure and never commit them to version control.
