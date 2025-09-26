# Revenue & Planning

This document explains the revenue model, calculations, and planning workflows.

## Model

- Revenue Share: typically 10–20% platform fee (`DEFAULT_REV_SHARE_PCT` env).
- Owners keep custody; platform provides monitoring and optimization.

## Core Calculations

Examples are implemented in `@depinautopilot/core`.

- Target gross for net goal
  - `gross = net / (1 - revShare)`
- Monthly projection
  - `monthly = hourlyRate * utilizationHoursPerDay * 30`
- Revenue split
  - `operator = gross * revShare`
  - `owner = gross - operator`

## Planning CLI

```bash
# Utilization target planning
depinautopilot plan \
  --owner john@example.com \
  --target-monthly-gross 500

# Repricing suggestions
depinautopilot reprice \
  --device device-123 \
  --target-util 0.75 \
  --dry-run
```

## Statements

Statements roll up device earnings for a period and compute splits.

```bash
depinautopilot statement \
  --owner john@example.com \
  --period 2024-01

# Output: statements/john@example.com/2024-01.csv
```
