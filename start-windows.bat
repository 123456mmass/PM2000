@echo off
echo ========================================
echo  PM2230 Dashboard - Windows Starter
echo ========================================
echo.

:: Check if .venv exists
if not exist "backend\.venv" (
    echo [1/4] Creating virtual environment...
    cd backend
    python -m venv .venv
    cd ..
)

:: Activate and install backend
echo [2/4] Installing backend dependencies...
cd backend
call .venv\Scripts\activate
pip install -r requirements.txt -q
cd ..

:: Start backend
echo [3/4] Starting backend on port 8002...
start "PM2230 Backend" cmd /k "cd backend && .venv\Scripts\activate && python main.py"

:: Wait for backend to start
echo Waiting for backend to start (5 seconds)...
timeout /t 5 /nobreak >nul

:: Install frontend if needed
if not exist "frontend\node_modules" (
    echo [4/4] Installing frontend dependencies...
    cd frontend
    call npm install --legacy-peer-deps
    cd ..
)

:: Start frontend
echo Starting frontend on port 3002...
start "PM2230 Frontend" cmd /k "cd frontend && npm run dev -- -p 3002"

echo.
echo ========================================
echo  ✅ Dashboard is starting...
echo ========================================
echo.
echo  Backend:  http://localhost:8002
echo  Dashboard: http://localhost:3002
echo  API Docs: http://localhost:8002/docs
echo.
echo  Press any key to exit this window...
echo.
pause >nul
