@echo off
echo ╔════════════════════════════════════════════════════════╗
echo ║   TECH-PRO AI Backend Auto-Starter                    ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo Starting backend server on port 8080...
echo.

cd /d "%~dp0backend"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Backend server is starting...
echo Press Ctrl+C to stop the server
echo.
node server.js
