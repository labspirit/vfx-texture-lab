@echo off
cd /d "%~dp0"
node scripts/checkpoint.mjs
if errorlevel 1 echo Save failed. Read the message above.
pause
