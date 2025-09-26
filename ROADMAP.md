# Roadmap

This roadmap outlines prioritized milestones and acceptance criteria for agents.

## M1: API Documentation & Tests

- Wire Swagger UI at `/docs` with basic OpenAPI info.
- Add smoke tests for key routes (health, owners, devices).
- Acceptance: CI runs and passes route tests; Swagger loads.

## M2: Connector Stability

- Add smoke tests for mock connectors and error handling.
- Document env-based behavior and fallbacks.
- Acceptance: connectors tests green; docs updated.

## M3: Pricing & Planning

- Expand pricing optimizer + CLI flows (`reprice`, `plan`).
- Add projections and “what-if” scenarios.
- Acceptance: CLI returns actionable suggestions with tests.

## M4: Web Dashboard

- Wire API to key dashboard views (owners/devices/metrics/alerts).
- Add basic charts and tables fed from `/metrics` and `/metrics/live`.
- Acceptance: local dashboard displays live data from API.

## M5: Notifications

- Discord and email notification flows with env-config.
- Acceptance: send test notification from CLI and server job.

## M6: Mobile Polish

- Ensure parity on core views; stabilize tests.
- Acceptance: Jest suite green; manual smoke in Expo.
