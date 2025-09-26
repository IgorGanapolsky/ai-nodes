# Connectors Guide

The connectors package integrates with DePIN networks for metrics and earnings. It supports mocks for development.

Package: `@depinautopilot/connectors`

## Supported Networks

- IoNet (GPU compute)
- Nosana (CPU/AI compute)
- Render (GPU rendering)
- Grass (bandwidth)
- Natix (mapping)

## Quick Start

```ts
import { ConnectorFactory, ConnectorNetwork } from '@depinautopilot/connectors';

const connector = ConnectorFactory.createConnector({
  network: ConnectorNetwork.IONET,
});

const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const metrics = await connector.getMetrics('device-id', since);
```

## Configuration

Set API keys via `.env`:

- `CONNECTOR_IONET_API_KEY`
- `CONNECTOR_NOSANA_API_KEY`
- `CONNECTOR_RENDER_API_KEY`
- `CONNECTOR_GRASS_API_KEY`
- `CONNECTOR_NATIX_API_KEY`

Feature flags:

- `FEATURE_SCRAPE=1` to enable Playwright-based scraping fallbacks (if available)

## Mocks

When API keys are not present, connectors return deterministic mock data useful for local dev, demos, and CI runs.

## Pricing Optimization

Connectors expose price suggestion helpers where supported. For richer pricing logic, prefer utilities from `@depinautopilot/core`.
