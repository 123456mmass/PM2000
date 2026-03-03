@echo off
setlocal enabledelayedexpansion
title PM2230 Dashboard

echo ======================================================
echo  PM2230 Dashboard - Web Mode Launcher
echo ======================================================
echo.

:: Setup .env if not exists
if not exist "%~dp0.env" (
    echo [*] First-time setup...
    echo DASHSCOPE_API_KEY=> "%~dp0.env"
    echo DASHSCOPE_MODEL=qwen3.5-plus>> "%~dp0.env"
    echo PM2230_API_PORT=8003>> "%~dp0.env"
    echo PM2230_SIMULATE=0>> "%~dp0.env"
    echo.
    echo ==============================================
    echo  ⚠️  กรุณาใส่ DashScope API Key สำหรับ AI
    echo  (ข้ามได้ถ้าไม่ใช้ฟีเจอร์ AI Analysis)
    echo ==============================================
    set /p api_key="API Key (กด Enter เพื่อข้าม): "
    if not "!api_key!"=="" (
        echo DASHSCOPE_API_KEY=!api_key!> "%~dp0.env"
        echo DASHSCOPE_MODEL=qwen-plus>> "%~dp0.env"
        echo PM2230_API_PORT=8003>> "%~dp0.env"
        echo PM2230_SIMULATE=0>> "%~dp0.env"
        echo [OK] บันทึก API Key แล้ว
    )
    echo.
)

:: Clear port 8003 if in use
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8003 2^>nul') do taskkill /f /pid %%a >nul 2>&1

:: Check backend exe
if not exist "%~dp0backend-server.exe" (
    echo [!] ไม่พบไฟล์ backend-server.exe
    echo     กรุณาตรวจสอบว่า zip ครบถ้วน
    pause
    exit /b 1
)

:: Start backend (serves API + Frontend)
echo [*] Starting server...
start "" /B "%~dp0backend-server.exe"

:: Wait and open browser
echo [*] กำลังเปิด Dashboard...
timeout /t 3 /nobreak > nul
start "" "http://localhost:8003"

echo.
echo ======================================================
echo  ✅ Dashboard: http://localhost:8003
echo  กด Ctrl+C หรือปิดหน้าต่างนี้เพื่อหยุด
echo ======================================================
pause > nul

:: Cleanup
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8003 2^>nul') do taskkill /f /pid %%a >nul 2>&1
