# WealthOS — Single-command launcher
# Usage: Right-click start.ps1 → Run with PowerShell
#        OR: from D:\wealthOS\WealthOS run: .\start.ps1

$ErrorActionPreference = 'Stop'

$repoRoot     = $PSScriptRoot
$frontendDir  = Join-Path $repoRoot 'frontend'
$pythonCandidates = @(
    (Join-Path $repoRoot '..\venv\Scripts\python.exe'),
    'D:\wealthOS\.venv\Scripts\python.exe',
    (Join-Path $repoRoot '.venv\Scripts\python.exe'),
    'python'
)

function Resolve-Executable {
    param([string[]]$Candidates)
    foreach ($candidate in $Candidates) {
        if ($candidate -eq 'python') { return $candidate }
        if (Test-Path $candidate) { return (Resolve-Path $candidate).Path }
    }
    return 'python'
}

$pythonExe = Resolve-Executable -Candidates $pythonCandidates
$npmExe = if (Get-Command npm.cmd -ErrorAction SilentlyContinue) { 'npm.cmd' } else { 'npm' }

Write-Host ""
Write-Host "  WealthOS Launcher" -ForegroundColor Cyan
Write-Host "  ────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Python  : $pythonExe" -ForegroundColor DarkGray
Write-Host "  NPM     : $npmExe" -ForegroundColor DarkGray
Write-Host "  Repo    : $repoRoot" -ForegroundColor DarkGray
Write-Host ""

if (-not (Test-Path (Join-Path $frontendDir 'node_modules'))) {
    Write-Host "[setup] Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location $frontendDir
    try {
        & $npmExe install
    } finally {
        Pop-Location
    }
}

Write-Host "[1/3] Starting FastAPI backend (http://localhost:8000) ..." -ForegroundColor Yellow
$backend = Start-Process -FilePath $pythonExe `
    -ArgumentList "-m uvicorn api:app --host 127.0.0.1 --port 8000 --reload" `
    -WorkingDirectory $repoRoot `
    -PassThru -WindowStyle Minimized

Write-Host "[2/3] Starting Streamlit app (http://localhost:8501) ..." -ForegroundColor Yellow
$streamlit = Start-Process -FilePath $pythonExe `
    -ArgumentList "-m streamlit run app.py --server.port 8501 --server.address 127.0.0.1" `
    -WorkingDirectory $repoRoot `
    -PassThru -WindowStyle Minimized

Write-Host "[3/3] Starting Vite frontend (http://localhost:3000) ..." -ForegroundColor Yellow
$vite = Start-Process -FilePath $npmExe `
    -ArgumentList "run dev -- --host 127.0.0.1" `
    -WorkingDirectory $frontendDir `
    -PassThru -WindowStyle Minimized

Write-Host ""
Write-Host "  Waiting for services to warm up..." -ForegroundColor DarkGray
Start-Sleep -Seconds 6

Write-Host ""
Write-Host "  Opening browser tabs..." -ForegroundColor Green
Start-Process "http://localhost:8000/docs"
Start-Process "http://localhost:8501"
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "  WealthOS is running. Press ENTER to stop everything and exit." -ForegroundColor DarkGray
Read-Host | Out-Null

Write-Host "  Stopping servers..." -ForegroundColor Yellow
foreach ($proc in @($backend, $streamlit, $vite)) {
    if ($proc -and -not $proc.HasExited) {
        try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
    }
}
Write-Host "  Done." -ForegroundColor Green
