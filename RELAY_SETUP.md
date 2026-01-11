# AIS & OpenSky Relay Setup Guide

The relay server handles both:
- **AIS vessel tracking** (WebSocket)
- **OpenSky military aircraft** (HTTP proxy)

You only need to set `VITE_WS_RELAY_URL` - OpenSky automatically uses the same server.

## Prerequisites

1. **Get AISStream API Key** (free):
   - Go to https://aisstream.io/
   - Sign up for a free account
   - Get your API key from the dashboard

## Option 1: Local Development (Easiest)

### Step 1: Install Dependencies
```bash
cd scripts
npm install
cd ..
```

### Step 2: Add to `.env`
```env
# AIS vessel tracking & Military aircraft (local dev)
VITE_WS_RELAY_URL=ws://localhost:3004

# Also add your AISStream API key (for the relay server)
AISSTREAM_API_KEY=your_aisstream_key_here
```

### Step 3: Start Relay Server
In a **separate terminal**, run:
```bash
# Windows PowerShell
.\start-relay.ps1

# OR manually:
cd scripts
$env:AISSTREAM_API_KEY="your_key_here"
node ais-relay.cjs
```

The relay will run on `ws://localhost:3004`

### Step 4: Start Your App
In another terminal:
```bash
npm run dev
```

## Option 2: Production (Railway/Heroku)

### Step 1: Deploy Relay Server

**Railway:**
1. Go to https://railway.app/
2. Create new project
3. Connect your GitHub repo
4. Add service → Select `scripts` folder
5. Set environment variable: `AISSTREAM_API_KEY=your_key`
6. Railway will auto-detect Node.js and deploy

**Heroku:**
1. Create `Procfile` in `scripts/` folder:
   ```
   web: node ais-relay.cjs
   ```
2. Deploy:
   ```bash
   cd scripts
   heroku create your-relay-name
   heroku config:set AISSTREAM_API_KEY=your_key
   git push heroku main
   ```

### Step 2: Get Deployed URL
- Railway: `wss://your-app.railway.app`
- Heroku: `wss://your-app.herokuapp.com`

### Step 3: Add to `.env`
```env
VITE_WS_RELAY_URL=wss://your-deployed-url.com
```

## How It Works

- **AIS**: Browser connects to relay via WebSocket → Relay connects to AISStream
- **OpenSky**: Browser makes HTTP request to relay → Relay proxies to OpenSky API

The same relay server handles both services!

## Troubleshooting

**Relay won't start:**
- Check `AISSTREAM_API_KEY` is set
- Make sure port 3004 is not in use
- Check Node.js version (needs >= 18)

**No data showing:**
- Verify relay is running (check terminal output)
- Check browser console for WebSocket errors
- Make sure `VITE_WS_RELAY_URL` is set correctly
