---
name: openf1-protocol
description: Specification guide, rate limiting constraints (3 req/sec), query parameters, endpoint shapes, and best practices for integrating the OpenF1 REST API (2023+).
---

# OpenF1 Protocol & Integration Guidelines

This skill documents the OpenF1 REST API architecture, rate limits, endpoint conventions, and error handling for Formula 1 data.

---

## 1. Core API Details

- **Base URL**: `https://api.openf1.org/v1`
- **Data Coverage**: **2023 season onwards** (2023, 2024, 2025, 2026+). Pre-2023 historical data is not on OpenF1 (use Jolpica/Ergast).
- **Free Tier Rate Limit**: **3 requests/second**, 30 requests/minute per IP.
- **Authentication**: Historical data access (2023+) is open/unauthenticated. Active live session access may require OAuth2 Bearer token authentication via `POST /token` for sponsored/subscriber access when enabled. Token should be cached on the backend and refreshed on expiry.
- **Error on Exceeded**: HTTP 429 `{"detail":"Rate limit exceeded. Max 3 requests/second."}`.

---

## 2. Query Operators & Incremental Polling

OpenF1 supports standard comparison operators on numeric, string, and timestamp parameters:
- `=` : Exact match (e.g. `session_key=9158`, `driver_number=1`)
- `>=` / `<=` : Greater/less than or equal (e.g. `date>=2024-03-02T15:00:00.000000`, `lap_number>=10`)
- `>` / `<` : Strict greater/less than

### Incremental Polling Pattern
When polling for live updates, always query using the watermark timestamp of the last received item:
```http
GET https://api.openf1.org/v1/race_control?session_key=latest&date>=2026-08-31T15:30:00.000000
GET https://api.openf1.org/v1/intervals?session_key=latest&date>=2026-08-31T15:30:00.000000
```

---

## 3. Critical Safety Rules for Heavy Endpoints

> [!WARNING]
> **/car_data and /location payloads are 30–60 MB if requested unconstrained.**
> 
> - **NEVER** request `/car_data` or `/location` without BOTH `driver_number` and narrow time window bounds (`date>=` and `date<=`).
> - Restrict telemetry windows to **max 10–30 seconds**.
> - Restrict location map snapshots to **max 5–10 seconds**.

---

## 4. FIA Race Control Message Mapping

| Category / Keyword | Flag | Mapped Event Type |
|---|---|---|
| Category: `SafetyCar`, Message contains `DEPLOYED` | — | `safety_car` |
| Category: `SafetyCar`, Message contains `VIRTUAL` | — | `vsc` |
| Flag: `RED` | `RED` | `red_flag` |
| Flag: `YELLOW` or `DOUBLE YELLOW` | `YELLOW` | `yellow_flag` |
| Category: `Flag`, Flag: `BLACK AND WHITE` | `BLACK AND WHITE` | `investigation` / `warning` |
| Category: `Drs`, Message contains `ENABLED` | — | `drs_enabled` |
| Category: `Drs`, Message contains `DISABLED` | — | `drs_disabled` |
| Category: `Flag`, Flag: `CHEQUERED` | `CHEQUERED` | `chequered_flag` |

---

## 5. Driver Identification Mapping

OpenF1 uses `driver_number` (e.g. `1`, `44`, `16`) whereas Jolpica uses driver slug IDs (`max_verstappen`, `hamilton`, `leclerc`).
Always maintain a bidirectional map per session:
```typescript
Map<number, string> // driver_number -> Jolpica driverId
Map<string, number> // Jolpica driverId -> driver_number
```
Built by correlating OpenF1 `/drivers?session_key=...` (`name_acronym`, `last_name`, `driver_number`) with Jolpica driver records.
