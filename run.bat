@echo off
REM Launch WealthOS using the PowerShell start script with ExecutionPolicy Bypass
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"
