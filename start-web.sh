#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "======================================================"
echo " PM2230 Dashboard - Web Mode Launcher"
echo "======================================================"

# Setup .env if not exists
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "[*] First-time setup..."
    echo "DASHSCOPE_API_KEY=" > "$SCRIPT_DIR/.env"
    echo "DASHSCOPE_MODEL=qwen-plus" >> "$SCRIPT_DIR/.env"
    echo "PM2230_API_PORT=8003" >> "$SCRIPT_DIR/.env"
    echo "PM2230_SIMULATE=0" >> "$SCRIPT_DIR/.env"
    echo ""
    echo "⚠️  ใส่ DashScope API Key สำหรับ AI (กด Enter เพื่อข้าม)"
    read -p "API Key: " api_key
    if [ ! -z "$api_key" ]; then
        sed -i "s/DASHSCOPE_API_KEY=.*/DASHSCOPE_API_KEY=$api_key/" "$SCRIPT_DIR/.env"
        echo "[OK] บันทึก API Key แล้ว"
    fi
fi

# Clear port 8003 if in use
fuser -k 8003/tcp 2>/dev/null || true

# Start backend
echo "[*] Starting server..."
"$SCRIPT_DIR/backend-server" &
BACKEND_PID=$!

# Wait and open browser
echo "[*] กำลังเปิด Dashboard..."
sleep 3
xdg-open "http://localhost:8003" 2>/dev/null || \
    open "http://localhost:8003" 2>/dev/null || \
    echo "เปิด Browser แล้วไปที่: http://localhost:8003"

echo ""
echo "======================================================"
echo " ✅ Dashboard: http://localhost:8003"
echo " กด Ctrl+C เพื่อหยุด"
echo "======================================================"

# Wait for Ctrl+C then cleanup
trap "kill $BACKEND_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait $BACKEND_PID
