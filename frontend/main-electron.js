const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');

let mainWindow;
let pythonProcess = null;

function killPort(port) {
    try {
        console.log(`Cleaning up port ${port}...`);
        if (process.platform === 'win32') {
            // Windows: Find PID and kill it
            execSync(`powershell -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"`);
        } else {
            // Linux: Use fuser to kill process on port
            execSync(`fuser -k ${port}/tcp 2>/dev/null || true`);
        }
    } catch (e) {
        // Ignore if port is already clear
    }
}

function startPython() {
    killPort(8003);
    console.log('Starting Python backend...');
    let pythonCmd;
    let backendPath;
    let backendDir;

    if (app.isPackaged) {
        // In production, the sidecar is in the resources folder
        const sidecarName = process.platform === 'win32' ? 'backend-server.exe' : 'backend-server';
        backendPath = path.join(process.resourcesPath, 'backend', sidecarName);
        backendDir = path.join(process.resourcesPath, 'backend');
        pythonCmd = backendPath;

        console.log(`Packaged Mode: Spawning sidecar from ${pythonCmd}`);

        // Check if sidecar exists
        const fs = require('fs');
        if (!fs.existsSync(pythonCmd)) {
            dialog.showErrorBox('Backend Error', `หาไฟล์ Sidecar ไม่เจอที่: ${pythonCmd}\nกรุณาตรวจสอบว่า Build ถูกต้องหรือไม่`);
            return;
        }

        pythonProcess = spawn(pythonCmd, [], {
            cwd: backendDir,
            env: { ...process.env, PYTHONUNBUFFERED: '1' }
        });
    } else {
        // In development, use .venv or system python
        backendDir = path.join(__dirname, '..', 'backend');
        backendPath = path.join(backendDir, 'main.py');
        pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

        const venvPath = process.platform === 'win32'
            ? path.join(backendDir, '.venv', 'Scripts', 'python.exe')
            : path.join(backendDir, '.venv', 'bin', 'python3');

        const fs = require('fs');
        if (fs.existsSync(venvPath)) {
            pythonCmd = venvPath;
            console.log(`Dev Mode: Using VENV Python: ${pythonCmd}`);
        } else {
            console.log(`VENV not found at ${venvPath}, falling back to system: ${pythonCmd}`);
        }

        pythonProcess = spawn(pythonCmd, [backendPath], {
            cwd: backendDir,
            env: { ...process.env, PYTHONUNBUFFERED: '1' }
        });
    }

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python: ${data}`);
        // Consider sending this to renderer for a debug console
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
    });

    pythonProcess.on('error', (err) => {
        dialog.showErrorBox('Spawn Error', `ไม่สามารถรัน Backend ได้: ${err.message}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
        if (app.isPackaged && code !== 0 && code !== null) {
            dialog.showErrorBox('Backend Crash', `Backend หยุดทำงานกะทันหัน (Exit Code: ${code})`);
        }
    });

    // Success notification (optional, helpful for debugging)
    if (app.isPackaged) {
        console.log("Backend spawned successfully");
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            // Required for file:// pages to make http:// API requests
            webSecurity: !app.isPackaged,
        },
        title: "PM2230 Dashboard",
        backgroundColor: '#111827',
        autoHideMenuBar: true,
    });

    if (!app.isPackaged) {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    } else {
        // For production, we load the exported static file
        mainWindow.loadFile(path.join(__dirname, 'out', 'index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', () => {
    startPython();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    if (pythonProcess) {
        console.log('Killing Python backend...');
        pythonProcess.kill();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
