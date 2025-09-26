# API Reference

Base URL: `http://localhost:4000`

This API is served by the Fastify server in `apps/server`. A live Swagger UI is available when the server runs at `/docs`.

## Health

- `GET /health` — Returns service status and timestamps.

## Owners

- `GET /owners` — List all owners
- `POST /owners` — Create owner
- `GET /owners/:id` — Get owner details
- `PUT /owners/:id` — Update owner
- `DELETE /owners/:id` — Remove owner

Example:

```bash
curl -s http://localhost:4000/owners | jq
```

## Devices

- `GET /devices?ownerId=` — List devices (optionally by owner)
- `POST /devices` — Add device
- `GET /devices/:id` — Get device
- `PUT /devices/:id` — Update device
- `DELETE /devices/:id` — Remove device

## Metrics

- `GET /metrics?deviceId=&since=` — Historical device metrics
- `GET /metrics/live` — Aggregated live data for dashboard

## Actions

- `POST /actions/reprice` — Dynamic pricing
- `POST /actions/optimize` — Performance optimization

## Statements

- `POST /statements/generate` — Generate statement for a period
- `GET  /statements/:id/download` — Download CSV/PDF

## Auth & Security

- Local development runs without auth by default.
- In production, configure `JWT_SECRET` and enable auth where required.
- Enable CORS and Helmet are pre-configured. Adjust via env vars.

## Environment

Set in `.env` (copy from `.env.example`):

- `PORT` (default `4000`)
- `HOST` (default `0.0.0.0`)
- `DATABASE_URL` (SQLite path)
- `LOG_LEVEL` (e.g., `info`)

## SDK and CLI

- CLI wraps typical operations: `pnpm depinautopilot` or `pnpm --filter @depinautopilot/cli dev`.
- For TypeScript usage, prefer the packages in `packages/core` and `packages/db`.
