# PM2000 Backup Script
$timestamp = Get-Date -Format "yyyyMMdd_HHmm"
$backupName = "PM2000_backup_$timestamp.zip"
$backupPath = Join-Path $PSScriptRoot $backupName

# Backup backend (exclude .venv) and frontend (exclude node_modules, .next)
$tempDir = Join-Path $env:TEMP "pm2000_backup_temp"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy backend
robocopy "$PSScriptRoot\backend" "$tempDir\backend" /E /XD .venv __pycache__ /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
# Copy frontend
robocopy "$PSScriptRoot\frontend" "$tempDir\frontend" /E /XD node_modules .next /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null

# Compress
Compress-Archive -Path "$tempDir\*" -DestinationPath $backupPath -Force

# Cleanup temp
Remove-Item $tempDir -Recurse -Force

# Report
$file = Get-Item $backupPath
$sizeMB = [math]::Round($file.Length / 1MB, 2)
Write-Host "Backup complete: $backupName ($sizeMB MB)"
