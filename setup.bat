@echo off
set PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1
REM Setup WealthOS dependencies with ExecutionPolicy Bypass
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
