#!/bin/bash
# PM2230 Dashboard - Raspberry Pi Launcher
# Place this file next to backend-server binary

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "======================================================"
echo " PM2230 Dashboard - Pi Launcher"
echo "======================================================"
echo ""
echo " [1] Local only   (this Pi only)"
echo " [2] Tunnel mode  (share public URL)"
echo ""
read -p "Select [1/2]: " MODE

# Kill any existing instance on port 8003
fuser -k 8003/tcp 2>/dev/null || true

# Check binary exists
if [ ! -f "$SCRIPT_DIR/backend-server" ]; then
    echo "[ERROR] backend-server binary not found"
    echo "        Please run build-pi.sh first"
    exit 1
fi

echo ""
echo "[*] Starting server..."
"$SCRIPT_DIR/backend-server" &
BACKEND_PID=$!

if [ "$MODE" = "2" ]; then
    echo "[*] Waiting for Cloudflare tunnel... (10-20 seconds)"
    TUNNEL_URL=""
    TRIES=0
    while [ $TRIES -lt 30 ]; do
        sleep 2
        TRIES=$((TRIES+1))
        RAW=$(curl -s http://localhost:8003/api/v1/tunnel-url 2>/dev/null || true)
        URL=$(echo "$RAW" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('url',''))" 2>/dev/null || true)
        if [ ! -z "$URL" ]; then
            TUNNEL_URL="$URL"
            break
        fi
    done

    if [ -z "$TUNNEL_URL" ]; then
        echo "[WARN] Tunnel failed - using local URL"
        TUNNEL_URL="http://localhost:8003"
    fi

    echo ""
    echo "======================================================"
    echo " [OK] Dashboard ready!"
    echo ""
    echo "  Public URL : $TUNNEL_URL"
    echo "  Local URL  : http://localhost:8003"
    echo ""
    echo "  Share the Public URL with anyone!"
    echo "======================================================"
else
    sleep 3
    echo ""
    echo "======================================================"
    echo " [OK] Dashboard: http://localhost:8003"
    echo "      (open this URL in any browser on this network)"
    echo "      Press Ctrl+C to stop"
    echo "======================================================"

    # Try to auto-open browser (works if Pi has desktop)
    xdg-open "http://localhost:8003" 2>/dev/null || true
fi

# Wait and cleanup on Ctrl+C
trap "kill $BACKEND_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait $BACKEND_PID
