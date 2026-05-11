# WealthOS — Single-command launcher
# Usage: Right-click start.ps1 → Run with PowerShell
#        OR: from D:\wealthOS\WealthOS run: .\start.ps1

$repoRoot   = $PSScriptRoot
$venvPython = "$repoRoot\..\venv\Scripts\python.exe"
$venvAlt    = "D:\wealthOS\.venv\Scripts\python.exe"
$frontendDir = "$repoRoot\frontend"

# Resolve which python to use
$pythonExe = if (Test-Path $venvPython) { $venvPython }
             elseif (Test-Path $venvAlt) { $venvAlt }
             else { "python" }

Write-Host ""
Write-Host "  WealthOS Launcher" -ForegroundColor Cyan
Write-Host "  ────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Python  : $pythonExe" -ForegroundColor DarkGray
Write-Host "  Repo    : $repoRoot" -ForegroundColor DarkGray
Write-Host ""

# ── 1. Start Streamlit in background ──────────────────────────────────────
Write-Host "[1/2] Starting Streamlit (http://localhost:8501) ..." -ForegroundColor Yellow
$streamlit = Start-Process -FilePath $pythonExe `
    -ArgumentList "-m streamlit run app.py --server.port 8501 --server.address 127.0.0.1" `
    -WorkingDirectory $repoRoot `
    -PassThru -WindowStyle Minimized

# Give Streamlit a moment to bind the port
Start-Sleep -Seconds 3

# ── 2. Start Vite frontend in background ──────────────────────────────────
Write-Host "[2/2] Starting Vite frontend (http://localhost:3000) ..." -ForegroundColor Yellow
$vite = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c npm run dev" `
    -WorkingDirectory $frontendDir `
    -PassThru -WindowStyle Minimized

Start-Sleep -Seconds 4

# ── 3. Open browser ───────────────────────────────────────────────────────
Write-Host ""
Write-Host "  Both servers running. Opening browser..." -ForegroundColor Green
Start-Process "http://localhost:8501"
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "  Press ENTER to stop both servers and exit." -ForegroundColor DarkGray
Read-Host | Out-Null

# ── 4. Cleanup ────────────────────────────────────────────────────────────
Write-Host "  Stopping servers..." -ForegroundColor Yellow
if ($streamlit -and !$streamlit.HasExited) { Stop-Process -Id $streamlit.Id -Force }
if ($vite     -and !$vite.HasExited)      { Stop-Process -Id $vite.Id     -Force }
Write-Host "  Done." -ForegroundColor Green
