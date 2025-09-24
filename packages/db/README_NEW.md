# @depinautopilot/db

Database layer with Drizzle ORM and SQLite for DePIN Autopilot

## Overview

This package provides a complete database solution with:

- **Drizzle ORM**: Type-safe SQL queries and schema management
- **SQLite**: Lightweight, serverless database
- **Comprehensive Schema**: Owners, Devices, Metrics, Statements, and Alerts tables
- **Demo Data**: Pre-populated sample data for development and testing

## Schema

### Tables

- **owners**: Device owners with contact info and revenue sharing settings
- **devices**: Compute devices/nodes across various marketplaces (io.net, Nosana, etc.)
- **metrics**: Performance and earnings metrics collected over time
- **statements**: Financial statements for billing periods
- **alerts**: System alerts and notifications

### Key Features

- Proper foreign key relationships and indexing
- UUID-based primary keys
- Timestamp tracking for all records
- Support for multiple marketplaces (io.net, Nosana, Render, etc.)

## Installation

```bash
npm install
```

## Database Scripts

### Generate Migrations
```bash
npm run db:generate
```

### Run Migrations
```bash
npm run db:migrate
```

### Seed Demo Data
```bash
npm run db:seed
```

### Open Drizzle Studio
```bash
npm run db:studio
```

### Push Schema to Database (Development)
```bash
npm run db:push
```

## Demo Data

The seed script creates:

- **1 Demo Owner**: `demo@owner.test` with 15% platform fee
- **2 Demo Devices**:
  - High-Performance GPU Node (io.net) @ $2.50/hour
  - Nosana CPU Compute Node (nosana) @ $0.75/hour
- **240 Metric Records**: 30 days of synthetic performance data (4 records per day per device)
- **2 Monthly Statements**: Revenue statements for each device

## Usage

```typescript
import {
  database,
  owners,
  devices,
  metrics,
  statements,
  alerts
} from '@depinautopilot/db';

// Query owners
const allOwners = await database.select().from(owners);

// Query devices for an owner
const ownerDevices = await database
  .select()
  .from(devices)
  .where(eq(devices.ownerId, 'owner-id'));

// Insert new metric
await database.insert(metrics).values({
  deviceId: 'device-id',
  cpuUsage: 75.5,
  memoryUsage: 80.2,
  earningsUsd: 2.50,
  timestamp: new Date()
});
```

## Configuration

Database configuration can be set via environment variables:

- `DATABASE_URL`: Database file path (default: `./data/app.db`)
- `NODE_ENV`: Environment mode for verbose logging

## Migration Workflow

1. Update schema in `src/schema.ts`
2. Generate migration: `npm run db:generate`
3. Review generated SQL in `migrations/`
4. Apply migration: `npm run db:migrate`

## Development

- Use `npm run db:studio` to visually inspect and edit data
- Use `npm run db:seed` to reset to demo data
- Database file is stored in `data/app.db`