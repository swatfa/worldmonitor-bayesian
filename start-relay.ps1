# Start AIS Relay Server for Local Development
# This handles both AIS vessel tracking and OpenSky military aircraft

Write-Host "Starting AIS Relay Server..." -ForegroundColor Green
Write-Host "Make sure you have AISSTREAM_API_KEY set in your environment or .env file" -ForegroundColor Yellow
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "scripts\ais-relay.cjs")) {
    Write-Host "Error: ais-relay.cjs not found. Make sure you're in the project root." -ForegroundColor Red
    exit 1
}

# Set working directory to scripts folder
Set-Location scripts

# Start the relay server
Write-Host "Relay server will run on ws://localhost:3004" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

node ais-relay.cjs
