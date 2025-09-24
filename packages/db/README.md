# DePIN Autopilot Database Layer

A complete database layer built with Drizzle ORM and SQLite for the DePIN Autopilot platform.

## Features

### 🗄️ Complete Database Schema
- **Users**: Authentication and role management
- **Nodes**: DePIN node management with support for multiple node types
- **Earnings**: Revenue tracking with crypto/fiat support
- **Metrics**: Real-time performance monitoring with time-series data
- **Alerts**: Intelligent monitoring and notification system
- **Revenue Shares**: Automated revenue distribution tracking

### 🚀 Repository Pattern
- Type-safe CRUD operations
- Advanced querying with filters, pagination, and sorting
- Aggregation and reporting capabilities
- Time-series data analysis
- Performance optimizations with proper indexing

### 🛠️ Development Tools
- **Migration System**: Schema versioning and deployment
- **Seeding**: Sample data generation for development
- **Backup/Restore**: Complete database backup and restoration utilities
- **Initialization**: One-command database setup

### 📊 Advanced Features
- Connection pooling for high performance
- Query optimization with strategic indexes
- Time-series analytics for metrics
- Revenue projection and analytics
- Alert management with auto-resolution
- Health monitoring and scoring

## Schema Overview

### Tables Structure

```
users
├── id (Primary Key)
├── email (Unique)
├── password_hash
├── role (admin|user|viewer)
└── timestamps

nodes
├── id (Primary Key)
├── owner_id → users.id
├── type (storj|filecoin|chia|akash|etc.)
├── name, description
├── api_key, api_url
├── status, version, location
├── hardware specs (bandwidth, storage)
├── online status
└── timestamps

earnings
├── id (Primary Key)
├── node_id → nodes.id
├── amount, currency
├── crypto_amount, crypto_currency
├── earning_type (storage|bandwidth|compute|etc.)
├── payment status
└── timestamps

metrics
├── id (Primary Key)
├── node_id → nodes.id
├── CPU metrics (usage, cores, frequency, temperature)
├── Memory metrics (usage, total, used, free)
├── Storage metrics (usage, total, IOPS)
├── Network metrics (bandwidth, latency, packet loss)
├── Node metrics (uptime, connections, sync status)
└── timestamp

alerts
├── id (Primary Key)
├── node_id → nodes.id
├── type, severity, title, message
├── resolution status and tracking
├── notification status
└── timestamps

revenue_shares
├── id (Primary Key)
├── node_id → nodes.id
├── percentage, amount, currency
├── period information
├── share_type (owner|platform|referral|etc.)
├── recipient information
├── payout status
└── timestamps
```

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database
```bash
# Initialize with migrations and sample data (development)
npm run db:init

# Initialize for production (no sample data)
npm run db:init -- --env production --skip-seeding

# Force reinitialize with backup
npm run db:init -- --force --create-backup
```

### 3. Available Scripts

#### Database Management
```bash
npm run db:generate   # Generate new migrations
npm run db:migrate    # Run pending migrations
npm run db:push       # Push schema changes (development)
npm run db:studio     # Open Drizzle Studio (GUI)
```

#### Data Management
```bash
npm run db:seed       # Seed with sample data
npm run db:backup     # Create database backup
npm run db:restore    # Restore from backup
```

#### Development
```bash
npm run build         # Build the package
npm run dev           # Watch mode development
npm run type-check    # TypeScript validation
```

## Usage Examples

### Basic Setup
```typescript
import { initializeDatabase, getRepositories } from '@ai-nodes/db';

// Initialize database
await initializeDatabase({
  url: './data/production.db',
  runMigrations: true,
  seedData: false
});

// Get repository instances
const { users, nodes, earnings, metrics, alerts } = getRepositories();
```

### Working with Repositories

#### User Management
```typescript
const userRepo = getUserRepository();

// Create user
const user = await userRepo.createUser({
  email: 'user@example.com',
  passwordHash: 'hashed_password',
  role: 'user'
});

// Find by email
const foundUser = await userRepo.findByEmail('user@example.com');

// Get user stats
const stats = await userRepo.getUserStats();
```

#### Node Management
```typescript
const nodeRepo = getNodeRepository();

// Create node
const node = await nodeRepo.create({
  ownerId: user.id,
  type: 'storj',
  name: 'My Storj Node',
  status: 'active'
});

// Find nodes by owner
const userNodes = await nodeRepo.findByOwner(user.id, {
  pagination: { page: 1, limit: 20 }
});

// Get node statistics
const nodeStats = await nodeRepo.getStats({
  ownerId: user.id
});
```

#### Earnings Analytics
```typescript
const earningsRepo = getEarningsRepository();

// Get earnings report
const report = await earningsRepo.getEarningsReport({
  nodeId: node.id
}, {
  start: new Date('2024-01-01'),
  end: new Date('2024-12-31')
});

// Get time series data
const timeSeries = await earningsRepo.getTimeSeries(
  'day',
  new Date('2024-01-01'),
  new Date('2024-01-31'),
  { nodeId: node.id }
);

// Get projections
const projection = await earningsRepo.getProjectedEarnings(
  node.id,
  30, // historical days
  30  // projection days
);
```

#### Metrics Monitoring
```typescript
const metricsRepo = getMetricsRepository();

// Record metrics
await metricsRepo.create({
  nodeId: node.id,
  cpuUsage: 45.2,
  memoryUsage: 67.8,
  storageUsage: 23.1,
  timestamp: new Date()
});

// Get health scores
const healthScores = await metricsRepo.calculateHealthScores([node.id]);

// Get performance alerts
const alerts = await metricsRepo.detectPerformanceAlerts({
  cpuUsage: 80,
  memoryUsage: 85,
  storageUsage: 90
});
```

### Advanced Features

#### Time-Series Analytics
```typescript
// Get detailed time series with multiple metrics
const timeSeries = await metricsRepo.getTimeSeries(
  [node.id],
  'hour',
  new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
  new Date()
);

// Analyze resource trends
const trends = await metricsRepo.getResourceTrends(node.id, 7); // 7 days
```

#### Alert Management
```typescript
const alertRepo = getAlertRepository();

// Create alert
await alertRepo.createAlert({
  nodeId: node.id,
  type: 'high_cpu',
  severity: 'warning',
  title: 'High CPU Usage',
  message: 'CPU usage is above 80%'
});

// Get alert statistics
const alertStats = await alertRepo.getAlertStats({
  nodeId: node.id
});

// Auto-resolve stale alerts
const resolved = await alertRepo.autoResolveStaleAlerts(48); // 48 hours
```

#### Revenue Sharing
```typescript
const revenueRepo = getRevenueShareRepository();

// Generate revenue shares for period
const shares = await revenueRepo.generateRevenueShares(
  '2024-01',
  new Date('2024-01-01'),
  new Date('2024-01-31'),
  [
    { nodeId: node.id, shareType: 'owner', percentage: 70 },
    { nodeId: node.id, shareType: 'platform', percentage: 30 }
  ]
);

// Get revenue share report
const shareReport = await revenueRepo.getRevenueShareReport({
  nodeId: node.id
});
```

## Database Operations

### Backup & Restore
```bash
# Create compressed backup
npm run db:backup

# Create backup with custom path
npm run db:backup -- --output ./backups/custom

# List available backups
npm run db:backup -- --list

# Restore from backup
npm run db:restore ./backups/backup-2024-01-01.sql.gz

# Dry run restore (see what would be restored)
npm run db:restore ./backups/backup-2024-01-01.sql.gz --dry-run

# Restore specific tables only
npm run db:restore ./backups/backup.sql --tables users,nodes
```

### Database Maintenance
```bash
# Clean up old backups (keep last 30 days, minimum 5 backups)
npm run db:backup -- --cleanup --retention 30 --keep 5

# Clean up old metrics (keep last 90 days)
const cleaned = await metricsRepo.cleanupOldMetrics(90);
```

## Configuration

### Environment Variables
```bash
DATABASE_URL=./data/app.db          # Database file path
NODE_ENV=development                # Environment mode
```

### Connection Options
```typescript
// Custom connection configuration
const db = createConnection({
  url: './custom.db',
  enableWAL: true,           // Enable WAL mode (recommended)
  enableForeignKeys: true,   // Enable foreign key constraints
  busyTimeout: 5000,         // Busy timeout in ms
  verbose: true              // Enable query logging
});
```

## Performance Optimization

### Indexing Strategy
The schema includes strategic indexes on:
- Foreign key relationships
- Frequently queried columns (status, type, timestamp)
- Composite indexes for common query patterns
- Time-series optimized indexes for metrics

### Connection Pooling
```typescript
import { ConnectionPool } from '@ai-nodes/db';

const pool = new ConnectionPool({
  maxConnections: 10,
  url: './data/app.db'
});

const connection = await pool.getConnection();
// Use connection...
pool.returnConnection(connection);
```

### Query Optimization
- Use pagination for large result sets
- Leverage time-series specific queries for metrics
- Use aggregation queries for reporting
- Implement proper filtering at database level

## Production Deployment

### Requirements
- Node.js 18+
- SQLite 3.38+
- Write permissions for database directory

### Production Setup
```bash
# 1. Install dependencies
npm ci --production

# 2. Initialize production database
npm run db:init -- --env production --skip-seeding

# 3. Set up backup schedule (example with cron)
# Daily backup at 2 AM
0 2 * * * cd /app && npm run db:backup

# Weekly cleanup
0 3 * * 0 cd /app && npm run db:backup -- --cleanup
```

### Monitoring
```typescript
// Health check endpoint
app.get('/health/db', async (req, res) => {
  try {
    const db = getConnection();
    await db.select({ test: sql`1` });
    res.json({ status: 'healthy', timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});
```

## Contributing

### Development Workflow
1. Make schema changes in `src/schema/`
2. Generate migrations: `npm run db:generate`
3. Test migrations: `npm run db:migrate`
4. Update repositories if needed
5. Add/update tests
6. Update documentation

### Testing
```bash
# Run type checking
npm run type-check

# Build package
npm run build

# Test with sample data
npm run db:seed
```

## Support

For issues and questions:
1. Check the [troubleshooting guide](#troubleshooting)
2. Review the [examples](#usage-examples)
3. Open an issue on the repository

## License

MIT License - see LICENSE file for details.