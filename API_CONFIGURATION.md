# API Configuration Guide

This document details all API keys and configuration needed to replicate the production environment from [worldmonitor.app](https://worldmonitor.app/).

## Required API Keys

All API keys are stored server-side in Vercel environment variables. For local development, create a `.env` file in the project root.

### 1. **FINNHUB_API_KEY** (Required for Stock Quotes)
- **Service**: Finnhub.io - Stock market data
- **Usage**: Primary source for stock quotes (AAPL, MSFT, NVDA, etc.)
- **Endpoint**: `/api/finnhub?symbols=AAPL,MSFT,NVDA,...`
- **How to Get**: Free registration at [finnhub.io](https://finnhub.io/)
- **Rate Limit**: 60 requests/minute (free tier)
- **Code Reference**: `api/finnhub.js`
- **Request Format**:
  ```javascript
  GET /api/finnhub?symbols=AAPL,MSFT,NVDA,GOOGL,AMZN,META,BRK-B,TSM,LLY,TSLA,AVGO,WMT,JPM,V,UNH,NVO,XOM,MA,ORCL,PG,COST,JNJ,HD,NFLX,BAC
  ```
- **Response Format**:
  ```json
  {
    "quotes": [
      {
        "symbol": "AAPL",
        "price": 150.25,
        "change": 2.50,
        "changePercent": 1.69,
        "high": 151.00,
        "low": 148.50,
        "open": 149.00,
        "previousClose": 147.75,
        "timestamp": 1704988800
      }
    ]
  }
  ```

### 2. **ACLED_ACCESS_TOKEN** (Optional - for Protest Data)
- **Service**: ACLED (Armed Conflict Location & Event Data)
- **Usage**: Protest, riot, and civil unrest data
- **Endpoint**: `/api/acled`
- **How to Get**: Free registration at [acleddata.com](https://acleddata.com/)
- **Code Reference**: `api/acled.js`
- **Request Format**:
  ```javascript
  GET /api/acled
  ```
- **Response Format**:
  ```json
  {
    "success": true,
    "count": 150,
    "data": [
      {
        "event_id_cnty": "12345",
        "event_date": "2026-01-10",
        "event_type": "Protests",
        "sub_event_type": "Peaceful protest",
        "actor1": "Protesters",
        "country": "Iran",
        "location": "Tehran",
        "latitude": "35.6892",
        "longitude": "51.3890",
        "fatalities": "0"
      }
    ],
    "cached_at": "2026-01-11T15:38:34.000Z"
  }
  ```
- **Note**: Returns `{ configured: false }` if token not set

### 3. **CLOUDFLARE_API_TOKEN** (Optional - for Internet Outages)
- **Service**: Cloudflare Radar API
- **Usage**: Internet outage detection and monitoring
- **Endpoint**: `/api/cloudflare-outages?dateRange=7d&limit=50`
- **How to Get**: Free Cloudflare account with Radar access
- **Code Reference**: `api/cloudflare-outages.js`
- **Request Format**:
  ```javascript
  GET /api/cloudflare-outages?dateRange=7d&limit=50
  ```
- **Response Format**: Cloudflare Radar API response
- **Note**: Returns `{ configured: false }` if token not set

### 4. **FRED_API_KEY** (Optional - for Economic Data)
- **Service**: Federal Reserve Economic Data (FRED)
- **Usage**: Economic indicators (Fed assets, rates, yields, unemployment, CPI)
- **Endpoint**: `/api/fred-data?series_id=WALCL&observation_start=2025-10-13&observation_end=2026-01-11`
- **How to Get**: Free API key at [fred.stlouisfed.org](https://fred.stlouisfed.org/docs/api/api_key.html)
- **Code Reference**: `api/fred-data.js`
- **Request Format**:
  ```javascript
  GET /api/fred-data?series_id=WALCL&observation_start=2025-10-13&observation_end=2026-01-11
  GET /api/fred-data?series_id=FEDFUNDS&observation_start=2025-10-13&observation_end=2026-01-11
  GET /api/fred-data?series_id=T10Y2Y&observation_start=2025-10-13&observation_end=2026-01-11
  GET /api/fred-data?series_id=UNRATE&observation_start=2025-10-13&observation_end=2026-01-11
  GET /api/fred-data?series_id=CPIAUCSL&observation_start=2025-10-13&observation_end=2026-01-11
  GET /api/fred-data?series_id=DGS10&observation_start=2025-10-13&observation_end=2026-01-11
  GET /api/fred-data?series_id=VIXCLS&observation_start=2025-10-13&observation_end=2026-01-11
  ```
- **Series IDs Used**:
  - `WALCL` - Fed Total Assets
  - `FEDFUNDS` - Fed Funds Rate
  - `T10Y2Y` - 10Y-2Y Treasury Spread
  - `UNRATE` - Unemployment Rate
  - `CPIAUCSL` - CPI Index
  - `DGS10` - 10Y Treasury Yield
  - `VIXCLS` - VIX Index

## Client-Side Environment Variables

These are used in the browser (prefixed with `VITE_`):

### 5. **VITE_WS_RELAY_URL** (Optional - for AIS Vessel Tracking)
- **Service**: AIS (Automatic Identification System) WebSocket relay
- **Usage**: Live vessel tracking and maritime intelligence
- **Format**: `ws://localhost:3004` (dev) or `wss://your-relay-url.com` (prod)
- **Code Reference**: `src/services/ais.ts`
- **Note**: Falls back to localhost in dev mode if not set

### 6. **VITE_OPENSKY_RELAY_URL** (Optional - for Military Aircraft)
- **Service**: OpenSky Network relay (bypasses rate limits)
- **Usage**: Military aircraft tracking
- **Format**: `wss://your-relay-url.com/opensky`
- **Code Reference**: `src/services/military-flights.ts`
- **Note**: Falls back to `/api/opensky` proxy if not set

## No-Auth APIs (Work Without Keys)

These APIs work without authentication:

### RSS Feeds
- **Endpoint**: `/api/rss-proxy?url=<encoded-rss-url>`
- **Examples**:
  - `/api/rss-proxy?url=https%3A%2F%2Ffeeds.bbci.co.uk%2Fnews%2Fworld%2Frss.xml`
  - `/api/rss-proxy?url=https%3A%2F%2Ffeeds.npr.org%2F1001%2Frss.xml`
- **Code Reference**: `api/rss-proxy.js`
- **Allowed Domains**: See `api/rss-proxy.js` for full list

### GDELT Intelligence
- **Endpoint**: `/api/gdelt-doc?query=<query>&maxrecords=10&timespan=24h`
- **Example**: `/api/gdelt-doc?query=(military%20exercise%20OR%20troop%20deployment%20OR%20airstrike%20OR%20%22naval%20exercise%22)%20sourcelang%3Aeng&maxrecords=10&timespan=24h`
- **Code Reference**: `api/gdelt-doc.js`
- **GDELT Geo**: `/api/gdelt-geo?query=protest&format=geojson&maxrecords=250&timespan=7d`

### Yahoo Finance (Backup for Markets)
- **Endpoint**: `/api/yahoo-finance?symbol=%5EGSPC`
- **Used for**: Stock indices (S&P 500, Dow, NASDAQ), commodities (VIX, Gold, Oil, etc.)
- **Code Reference**: `api/yahoo-finance.js`

### Polymarket
- **Endpoint**: `/api/polymarket?closed=false&order=volume&ascending=false&limit=100`
- **Code Reference**: `api/polymarket.js`

### PizzINT (Pentagon Pizza Index)
- **Endpoint**: `/api/pizzint/dashboard-data`
- **GDELT Tensions**: `/api/pizzint/gdelt/batch?pairs=usa_russia,russia_ukraine,usa_china,china_taiwan,usa_iran,usa_venezuela&method=gpr&dateStart=20251013&dateEnd=20260111`
- **Code Reference**: `api/pizzint/dashboard-data.js`, `api/pizzint/gdelt/batch.js`

### Earthquakes
- **Endpoint**: `/api/earthquakes`
- **Source**: USGS Earthquake API
- **Code Reference**: `api/earthquakes.js`

### Weather Alerts
- **Endpoint**: Direct to `https://api.weather.gov/alerts/active`
- **Source**: National Weather Service (NWS)

## Request Headers

All API requests from the client use standard fetch with no special headers:

```javascript
fetch('/api/finnhub?symbols=AAPL,MSFT')
```

Server-side proxies add:
- **Finnhub**: `Accept: application/json`
- **ACLED**: `Authorization: Bearer ${token}`, `Accept: application/json`
- **Cloudflare**: `Authorization: Bearer ${token}`
- **FRED**: Standard query params (no auth header)

## Response Headers

All API responses include:
- `Access-Control-Allow-Origin: *`
- `Content-Type: application/json`
- `Cache-Control: public, max-age=<seconds>`

## Local Development Setup

1. **Create `.env` file** in project root:
   ```env
   # Required for stock quotes
   FINNHUB_API_KEY=your_finnhub_key_here

   # Optional - for protest data
   ACLED_ACCESS_TOKEN=your_acled_token_here

   # Optional - for internet outages
   CLOUDFLARE_API_TOKEN=your_cloudflare_token_here

   # Optional - for economic data
   FRED_API_KEY=your_fred_key_here

   # Optional - for AIS vessel tracking (dev mode)
   VITE_WS_RELAY_URL=ws://localhost:3004

   # Optional - for military aircraft tracking
   VITE_OPENSKY_RELAY_URL=wss://your-relay-url.com/opensky
   ```

2. **For Vite dev server**, the middleware in `vite.config.ts` handles:
   - `/api/rss-proxy` - RSS feed proxying
   - `/api/gdelt-doc` - GDELT intelligence queries

3. **For production (Vercel)**, all API keys are set in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add each key with the exact name shown above

## API Endpoint Summary

| Endpoint | Auth Required | Purpose |
|----------|--------------|---------|
| `/api/finnhub` | ✅ FINNHUB_API_KEY | Stock quotes |
| `/api/yahoo-finance` | ❌ | Stock indices, commodities (backup) |
| `/api/acled` | ✅ ACLED_ACCESS_TOKEN | Protest/unrest data |
| `/api/cloudflare-outages` | ✅ CLOUDFLARE_API_TOKEN | Internet outages |
| `/api/fred-data` | ✅ FRED_API_KEY | Economic indicators |
| `/api/rss-proxy` | ❌ | RSS feed proxying |
| `/api/gdelt-doc` | ❌ | GDELT intelligence articles |
| `/api/gdelt-geo` | ❌ | GDELT geolocated events |
| `/api/polymarket` | ❌ | Prediction markets |
| `/api/pizzint/dashboard-data` | ❌ | Pentagon activity metrics |
| `/api/pizzint/gdelt/batch` | ❌ | GDELT tension pairs |
| `/api/earthquakes` | ❌ | USGS earthquake data |

## Rate Limits & Caching

- **Finnhub**: 60 req/min (free tier), cached 30s
- **ACLED**: 10 req/min per IP, cached 10min
- **FRED**: No strict limit, cached 1hr
- **Cloudflare**: Varies by plan, cached 5min
- **GDELT**: No auth, cached 5min
- **RSS Feeds**: Cached 5min, per-feed circuit breakers

## Notes

- All API keys are **server-side only** - never exposed to the client
- Missing optional keys result in graceful degradation (features hidden, not errors)
- Circuit breakers prevent API abuse and handle failures gracefully
- Production uses Vercel Edge Functions for all `/api/*` endpoints
- Local dev uses Vite middleware for `/api/rss-proxy` and `/api/gdelt-doc`
