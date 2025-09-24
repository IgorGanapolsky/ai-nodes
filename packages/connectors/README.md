# @ai-nodes/connectors

Comprehensive DePIN node connectors for monitoring and optimization across multiple decentralized networks.

## 🌟 Features

- **🔒 Custody-Safe**: Read-only access ensures your assets remain secure
- **🚀 Multi-Network Support**: Connect to IoNet, Nosana, Render, Grass, Natix, Huddle01, and OwnAI
- **⚡ Intelligent Fallbacks**: Playwright-based scraping when APIs are unavailable
- **🔄 Rate Limiting & Retry Logic**: Built-in protection and resilience
- **💾 Advanced Caching**: Multi-level caching for optimal performance
- **🧪 Mock Data Generation**: Complete testing support with realistic data
- **🏭 Factory Pattern**: Easy instantiation and management
- **🛡️ Comprehensive Error Handling**: Robust error management and reporting

## 📦 Installation

```bash
npm install @ai-nodes/connectors
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { ConnectorFactory, ConnectorType } from '@ai-nodes/connectors';

// Create and initialize a connector
const connector = await ConnectorFactory.createAndInitialize(ConnectorType.IONET, {
  apiKey: 'your-api-key',
  baseUrl: 'https://api.io.net'
});

// Get node status
const status = await connector.getNodeStatus();
console.log('Node Status:', status);

// Get earnings for the last week
const earnings = await connector.getEarnings({
  start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  end: new Date(),
  type: 'week'
});
console.log('Weekly Earnings:', earnings);

// Get performance metrics
const metrics = await connector.getMetrics();
console.log('Performance Metrics:', metrics);

// Clean up
await connector.dispose();
```

### Auto-Configuration

```typescript
// Set environment variables
process.env.IONET_API_KEY = 'your-ionet-key';
process.env.RENDER_API_KEY = 'your-render-key';

// Create connectors with auto-detected configuration
const ionetConnector = ConnectorFactory.createWithAutoConfig(ConnectorType.IONET);
const renderConnector = ConnectorFactory.createWithAutoConfig(ConnectorType.RENDER);
```

### Multiple Connectors

```typescript
const configs = [
  { type: ConnectorType.IONET, config: { apiKey: 'ionet-key' } },
  { type: ConnectorType.NOSANA, config: { baseUrl: 'https://explorer.nosana.io' } },
  { type: ConnectorType.RENDER, config: { apiKey: 'render-key' } }
];

const connectors = await ConnectorFactory.createAndInitializeMultiple(configs);

// Get status from all connectors
const allStatuses = await Promise.all(
  connectors.map(connector => connector.getNodeStatus())
);
```

## 🔌 Supported Networks

| Network | Type | Description | API Key Required |
|---------|------|-------------|------------------|
| **IoNet** | GPU Compute | Decentralized GPU compute network | ✅ |
| **Nosana** | AI Compute | AI inference and compute network | ❌ |
| **Render** | GPU Rendering | Distributed GPU rendering network | ✅ |
| **Grass** | Bandwidth | Bandwidth sharing network | ✅ |
| **Natix** | Mapping | Decentralized mapping and location data | ✅ |
| **Huddle01** | Video | Decentralized video infrastructure | ✅ |
| **OwnAI** | AI Compute | Decentralized AI compute network | ✅ |

## 🛠️ Advanced Configuration

### Custom Configuration

```typescript
const connector = await ConnectorFactory.createAndInitialize(ConnectorType.IONET, {
  apiKey: 'your-api-key',
  baseUrl: 'https://api.io.net',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  rateLimit: {
    requests: 60,
    window: 60000 // 1 minute
  },
  cache: {
    enabled: true,
    ttl: 300 // 5 minutes
  },
  scraper: {
    enabled: true,
    headless: true,
    timeout: 30000
  }
});
```

### Configuration Validation

```typescript
const validation = ConnectorFactory.validateConfig(ConnectorType.IONET, {
  apiKey: 'test-key',
  timeout: 30000
});

if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
  console.warn('Configuration warnings:', validation.warnings);
}
```

## 📊 Data Types

### Node Status

```typescript
interface NodeStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  uptime: number;
  lastSeen: Date;
  health: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
  };
  location?: {
    country: string;
    region: string;
    latitude?: number;
    longitude?: number;
  };
  specs?: NodeSpecs;
}
```

### Earnings

```typescript
interface Earnings {
  period: Period;
  total: number;
  currency: string;
  breakdown: {
    compute?: number;
    storage?: number;
    bandwidth?: number;
    staking?: number;
    rewards?: number;
  };
  transactions: Transaction[];
  projectedMonthly?: number;
  projectedYearly?: number;
}
```

### Node Metrics

```typescript
interface NodeMetrics {
  performance: {
    tasksCompleted: number;
    tasksActive: number;
    tasksFailed: number;
    averageTaskDuration: number;
    successRate: number;
  };
  resource_utilization: {
    cpu: number;
    memory: number;
    storage: number;
    bandwidth: number;
    gpu?: number;
  };
  earnings: {
    hourly: number;
    daily: number;
    weekly: number;
    monthly: number;
  };
  network: {
    latency: number;
    throughput: number;
    uptime: number;
  };
  reputation?: {
    score: number;
    rank: number;
    totalNodes: number;
  };
}
```

## 🧪 Testing with Mock Data

```typescript
import { MockDataGenerator, ConnectorType } from '@ai-nodes/connectors';

// Generate mock node status
const mockStatus = MockDataGenerator.generateNodeStatus(ConnectorType.IONET);

// Generate mock earnings
const period = MockDataGenerator.generatePeriod('week');
const mockEarnings = MockDataGenerator.generateEarnings(period, ConnectorType.RENDER);

// Generate mock metrics
const mockMetrics = MockDataGenerator.generateNodeMetrics(ConnectorType.GRASS);
```

## 🔧 Error Handling

The connectors include comprehensive error handling with automatic fallbacks:

```typescript
try {
  const status = await connector.getNodeStatus();
} catch (error) {
  if (error.code === 'API_ERROR') {
    console.log('API failed, trying scraper fallback...');
  } else if (error.retryable) {
    console.log('Temporary error, will retry automatically');
  } else {
    console.error('Permanent error:', error.message);
  }
}
```

## 🎯 Pricing Optimization

```typescript
const pricingStrategy = await connector.optimizePricing({
  targetUtilization: 80,
  priceStrategy: 'competitive',
  marketConditions: 'normal',
  nodeSpecs: {
    cpu: { cores: 16, model: 'Intel i9-13900K', frequency: 3.0 },
    memory: { total: 64, available: 48 },
    storage: { total: 2000, available: 1500, type: 'NVMe' },
    gpu: { model: 'NVIDIA RTX 4090', memory: 24, compute: 165 }
  }
});

console.log('Recommended pricing:', pricingStrategy.recommended);
console.log('Market analysis:', pricingStrategy.market);
console.log('Optimization suggestion:', pricingStrategy.optimization.suggestion);
```

## 🌐 Web Scraping Fallback

When API access is limited, connectors automatically fall back to web scraping:

```typescript
const connector = await ConnectorFactory.createAndInitialize(ConnectorType.IONET, {
  apiKey: 'optional-key',
  scraper: {
    enabled: true,
    headless: true,
    timeout: 30000
  }
});

// Will use API if available, otherwise scrapes dashboard
const status = await connector.getNodeStatus();
```

## 📈 Factory Statistics

```typescript
// Get factory statistics
const stats = ConnectorFactory.getStats();
console.log('Total instances:', stats.totalInstances);
console.log('Instances by type:', stats.instancesByType);
console.log('Memory usage:', stats.memoryUsage);

// Get connector type information
const availableTypes = ConnectorFactory.getAvailableTypes();
availableTypes.forEach(type => {
  const info = ConnectorFactory.getTypeInfo(type);
  console.log(`${info.name}: ${info.description}`);
});
```

## 🔒 Security & Best Practices

- **Read-Only Access**: All connectors are designed for monitoring only
- **API Key Protection**: Store API keys in environment variables
- **Rate Limiting**: Built-in rate limiting prevents API abuse
- **Error Boundary**: Comprehensive error handling prevents crashes
- **Resource Cleanup**: Always call `dispose()` to clean up resources

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@ai-nodes.com
- 💬 Discord: [Join our community](https://discord.gg/ai-nodes)
- 📖 Documentation: [Full API docs](https://docs.ai-nodes.com)
- 🐛 Issues: [GitHub Issues](https://github.com/ai-nodes/connectors/issues)

---

Built with ❤️ for the DePIN ecosystem