# Deployment Guide

This project runs as a monorepo (Turbo + pnpm). Deploy the Fastify API, Web dashboard, and CLI as needed.

## Prerequisites

- Node.js 20+
- pnpm 8+
- SQLite file storage (default)

## Local

```bash
pnpm install
cp .env.example .env
pnpm db:generate && pnpm db:migrate && pnpm seed
pnpm dev
```

## Docker

Example for the API server (see `apps/server/Dockerfile`):

```bash
docker build -t depinautopilot .
docker run -d \
  -p 4000:4000 \
  -v ./data:/app/data \
  --env-file .env \
  depinautopilot
```

## Production Tips

- Use `NODE_ENV=production` and adjust logging via `LOG_LEVEL`.
- Set `JWT_SECRET`, `ADMIN_SECRET` and any connector API keys.
- Persist `data/` volume for SQLite.
- Put the web app behind a reverse proxy (e.g., Nginx) and TLS.

## Environment

See `.env.example` for a full list. Minimum:

- `DATABASE_URL`
- `PORT`
- `HOST`

## Health & Monitoring

- API health: `GET /health`
- Swagger UI: `GET /docs`
- Consider Prometheus/Grafana via the `scripts/` examples.
