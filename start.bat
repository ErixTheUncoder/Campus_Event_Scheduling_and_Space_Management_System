@echo off
echo ========================================
echo Campus Event Scheduling System Launcher
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "backend\venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found!
    echo Please run setup.bat first to install dependencies.
    pause
    exit /b 1
)

echo [1/2] Starting Backend Server...
start "Backend - Flask" cmd /k "cd /d "%~dp0backend" && venv\Scripts\activate && python run.py"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server...
start "Frontend - Vite" cmd /k "cd /d "%~dp0vite-project" && npm run dev"

echo.
echo ========================================
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo ========================================
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul

REM Open browser to frontend
start http://localhost:5173

echo.
echo Press any key to exit this window (servers will continue running)
pause >nul
