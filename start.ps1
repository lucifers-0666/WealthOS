Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned -Force

# Repository root
$RepoRoot = "D:\wealthOS\WealthOS"
Set-Location -Path $RepoRoot

Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " Starting WealthOS (development)" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan

# Prefer .venv311 for PyTorch compatibility; fall back to .venv
$PreferredVenv = "D:\wealthOS\.venv311"
$FallbackVenv = "D:\wealthOS\.venv"

if (Test-Path "$PreferredVenv\Scripts\Activate.ps1") {
    $VenvActivate = "$PreferredVenv\Scripts\Activate.ps1"
    $VenvPath = $PreferredVenv
} elseif (Test-Path "$FallbackVenv\Scripts\Activate.ps1") {
    $VenvActivate = "$FallbackVenv\Scripts\Activate.ps1"
    $VenvPath = $FallbackVenv
} else {
    Write-Host "[ERROR] No virtual environment found. Create one first (see setup_venv_3_11.ps1)." -ForegroundColor Red
    exit 1
}

# Check python version
try {
    $pyver = (& python --version 2>&1).Trim()
} catch {
    $pyver = "unknown"
}
Write-Host "Detected Python: $pyver"
if ($pyver -match "3\.13") {
    Write-Host "[WARNING] Python 3.13 detected — PyTorch is not supported on 3.13. Recommend using Python 3.11." -ForegroundColor Yellow
}

# Activate venv and install requirements quietly
Write-Host "[1/6] Activating virtualenv: $VenvPath" -ForegroundColor Yellow
. $VenvActivate
Write-Host "[2/6] Installing Python requirements (if needed)" -ForegroundColor Yellow
pip install -r requirements.txt --quiet
Write-Host "[2/6] Python dependencies checked." -ForegroundColor Green

# Check .env for Supabase
$EnvFile = Join-Path $RepoRoot ".env"
$supabase_ok = $false
if (Test-Path $EnvFile) {
    $env_contents = Get-Content $EnvFile | Out-String
    if ($env_contents -match "SUPABASE_URL\s*=\s*\S+") { $supabase_ok = $true }
}
if (-not $supabase_ok) {
    Write-Host "[WARN] SUPABASE_URL not configured in $EnvFile — database features disabled." -ForegroundColor Yellow
}

Write-Host "[3/6] Launching services in separate windows..." -ForegroundColor Yellow

# FastAPI (Backend)
$fastapi_cmd = "Set-Location -Path '$RepoRoot'; . '$VenvActivate'; uvicorn api:app --host 127.0.0.1 --port 8000 --reload"
Start-Process powershell.exe -ArgumentList "-NoExit","-Command","$fastapi_cmd"
Write-Host "  -> FastAPI started on http://127.0.0.1:8000"

# Streamlit (App)
$streamlit_cmd = "Set-Location -Path '$RepoRoot'; . '$VenvActivate'; streamlit run app.py"
Start-Process powershell.exe -ArgumentList "-NoExit","-Command","$streamlit_cmd"
Write-Host "  -> Streamlit started on http://localhost:8501"

# Vite frontend
$frontend_cmd = "Set-Location -Path '$RepoRoot\frontend'; npm run dev"
Start-Process powershell.exe -ArgumentList "-NoExit","-Command","$frontend_cmd"
Write-Host "  -> Frontend started on http://localhost:3001"

Write-Host "[4/6] Waiting briefly before opening browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Start-Process "http://localhost:3001"

Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " WealthOS is starting up..." -ForegroundColor Green
Write-Host "  FastAPI  → http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "  Streamlit → http://localhost:8501" -ForegroundColor Green
Write-Host "  Frontend  → http://localhost:3001" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "[5/6] Startup commands dispatched. Check the new windows for logs." -ForegroundColor Green
Write-Host "[6/6] Done." -ForegroundColor Green

