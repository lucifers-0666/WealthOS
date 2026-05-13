# PowerShell commands to create and activate Python 3.11 venv at D:\wealthOS\.venv311
# 1) Check for installed Python versions
py -0p
# or show all python executables on PATH
where.exe python

# 2) If you have the py launcher and Python 3.11 installed, create venv
# If py -3.11 is available:
py -3.11 -m venv D:\wealthOS\.venv311
# OR if python points to Python 3.11 executable directly:
# python -m venv D:\wealthOS\.venv311

# 3) Activate the new venv (PowerShell)
& D:\wealthOS\.venv311\Scripts\Activate.ps1

# 4) Install requirements (run from repo root D:\wealthOS\WealthOS)
pip install -r D:\wealthOS\WealthOS\requirements.txt

# 5) Update start.ps1 to use .venv311 instead of .venv (manual step):
# Edit D:\wealthOS\WealthOS\start.ps1 and ensure $PreferredVenv = "D:\\wealthOS\\.venv311"

Write-Host "Virtualenv .venv311 created and dependencies installed. Activate with:`n& D:\\wealthOS\\.venv311\\Scripts\\Activate.ps1" -ForegroundColor Green
