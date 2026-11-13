@echo off
cd /d "%~dp0"
node scripts/checkpoint.mjs --sync
if errorlevel 1 echo Sync failed. Local checkpoint may still be available.
pause
