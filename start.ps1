# Set execution policy for the current session to allow script execution
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# Force the working directory to the repository root
$RepoRoot = "D:\wealthOS\WealthOS"
Set-Location -Path $RepoRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Starting WealthOS Environment... " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Define the virtual environment path
$VenvActivate = "D:\wealthOS\.venv\Scripts\Activate.ps1"

# Verify virtual environment exists
if (-Not (Test-Path $VenvActivate)) {
    Write-Host "[ERROR] Virtual environment not found at D:\wealthOS\.venv" -ForegroundColor Red
    Write-Host "Please ensure the .venv is created in the parent directory." -ForegroundColor Yellow
    exit 1
}

# Install dependencies (temporarily dot source venv just for pip)
Write-Host "[1/4] Checking and installing Python dependencies..." -ForegroundColor Yellow
. $VenvActivate
pip install -r requirements.txt --quiet
Write-Host "[1/4] Dependencies installed successfully." -ForegroundColor Green

# Open a new terminal for FastAPI Backend
Write-Host "[2/4] Launching FastAPI Backend (api.py) on Port 8000..." -ForegroundColor Yellow
Start-Process powershell.exe -ArgumentList "-NoExit -Command `"Set-Location -Path '$RepoRoot'; . '$VenvActivate'; uvicorn api:app --host 0.0.0.0 --port 8000 --reload`""

# Open a new terminal for Streamlit
Write-Host "[3/4] Launching Streamlit App (app.py) on Port 8501..." -ForegroundColor Yellow
Start-Process powershell.exe -ArgumentList "-NoExit -Command `"Set-Location -Path '$RepoRoot'; . '$VenvActivate'; streamlit run app.py`""

# Open a new terminal for Vite/React frontend
Write-Host "[4/4] Launching Vite Frontend (Node.js) on Port 3000..." -ForegroundColor Yellow
Start-Process powershell.exe -ArgumentList "-NoExit -Command `"Set-Location -Path '$RepoRoot\frontend'; npm run dev`""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " WealthOS services have been launched!  " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
