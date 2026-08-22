# WealthOS root setup
# Run from d:\wealthOS with: .\setup.ps1

$ErrorActionPreference = 'Stop'
$repoRoot = Join-Path $PSScriptRoot 'WealthOS'
$pythonCandidates = @(
    (Join-Path $PSScriptRoot '.venv\Scripts\python.exe'),
    (Join-Path $PSScriptRoot 'venv\Scripts\python.exe'),
    (Join-Path $repoRoot '.venv\Scripts\python.exe'),
    'python'
)

function Resolve-Python {
    param([string[]]$Candidates)
    foreach ($candidate in $Candidates) {
        if ($candidate -eq 'python') { return $candidate }
        if (Test-Path $candidate) { return (Resolve-Path $candidate).Path }
    }
    return 'python'
}

$pythonExe = Resolve-Python -Candidates $pythonCandidates
$nodeOk = [bool](Get-Command node -ErrorAction SilentlyContinue)
$npmOk = [bool](Get-Command npm -ErrorAction SilentlyContinue)

Write-Host "WealthOS setup" -ForegroundColor Cyan
Write-Host "Python: $pythonExe" -ForegroundColor DarkGray
Write-Host "Node:   $nodeOk" -ForegroundColor DarkGray

if (-not $nodeOk -or -not $npmOk) {
    throw "Node.js and npm are required. Install Node 18+ before continuing."
}

if ($pythonExe -eq 'python') {
    $pythonExe = (Get-Command python -ErrorAction Stop).Source
}

Push-Location $PSScriptRoot
try {
    if (-not (Test-Path (Join-Path $PSScriptRoot '.venv'))) {
        & $pythonExe -m venv .venv
    }
    $env:PYO3_USE_ABI3_FORWARD_COMPATIBILITY = "1"
    [System.Environment]::SetEnvironmentVariable("PYO3_USE_ABI3_FORWARD_COMPATIBILITY", "1", "Process")
    & (Join-Path $PSScriptRoot '.venv\Scripts\python.exe') -m pip install --upgrade pip
    & (Join-Path $PSScriptRoot '.venv\Scripts\python.exe') -m pip install -r (Join-Path $repoRoot 'requirements.txt')
    Push-Location (Join-Path $repoRoot 'frontend')
    try {
        npm install
    } finally {
        Pop-Location
    }
} finally {
    Pop-Location
}

Write-Host "Setup complete." -ForegroundColor Green
