@echo off
setlocal enabledelayedexpansion
echo ======================================================
echo PM2230 Dashboard - Windows Build Automation Tool
echo ======================================================
echo.

:: Clear potentially colliding ports
echo [*] Cleaning up ports 8003 and 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8003') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /f /pid %%a >nul 2>&1

:: 0. Setup Environment Files
echo [0/4] Checking environment files...
if not exist backend\.env (
    echo Creating backend\.env from example...
    copy backend\.env.example backend\.env
)
if not exist frontend\.env.local (
    echo Creating frontend\.env.local from example...
    copy frontend\.env.example frontend\.env.local
)

:: Prompt for API Key if not set
findstr /C:"DASHSCOPE_API_KEY=sk-your-api-key-here" backend\.env >nul
if %errorlevel%==0 (
    echo.
    echo DashScope AI API Key not found!
    set /p api_key="Please enter your DashScope API Key: "
    if not "!api_key!"=="" (
        powershell -Command "(Get-Content backend\.env) -replace 'DASHSCOPE_API_KEY=sk-your-api-key-here', 'DASHSCOPE_API_KEY=!api_key!' | Set-Content backend\.env"
        echo API Key updated in backend\.env
    )
)

:: 1. Setup Backend
echo [1/4] Setting up Python Backend...
cd backend
if not exist .venv (
    echo Creating virtual environment...
    python -m venv .venv
)
call .venv\Scripts\activate
echo Installing Python dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt
pip install pyinstaller

echo Bundling Python backend into executable (Sidecar)...
pyinstaller --noconfirm --onefile --console --name "backend-server" main.py
if exist .env (copy .env dist\ >nul)
cd ..

:: 2. Setup Frontend
echo.
echo [2/4] Setting up Frontend Dependencies...
cd frontend
echo Installing Node.js packages (this may take a while)...
call npm install --legacy-peer-deps

:: 3. Build Static Frontend
echo.
echo [3/4] Building Frontend (Next.js Export)...
call npm run build

:: 4. Package Electron
echo.
echo [4/4] Packaging Desktop Application (EXE)...
call npm run electron-dist
cd ..

:: 5. Copy frontend into backend/dist for Web Mode (AFTER frontend is built!)
echo.
echo [+] Preparing Web Mode package...
if exist backend\dist\frontend_web (rmdir /s /q backend\dist\frontend_web)
xcopy /E /I /Q frontend\out backend\dist\frontend_web >nul
copy start-web.bat backend\dist\ >nul

echo.
echo ======================================================
echo BUILD COMPLETED!
echo.
echo   Electron App : frontend\dist\   (.exe)
echo   Web Package  : backend\dist\    (ZIP to share)
echo ======================================================
pause
