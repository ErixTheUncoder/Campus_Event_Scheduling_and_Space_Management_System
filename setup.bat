@echo off
echo ========================================
echo Campus Event Scheduling System Setup
echo ========================================
echo.

REM Check Python installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

REM Check Node.js installation
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Creating Python virtual environment...
if not exist "backend\venv" (
    cd backend
    python -m venv venv
    cd ..
    echo Virtual environment created successfully.
) else (
    echo Virtual environment already exists.
)

echo.
echo [2/4] Installing Python dependencies...
cd backend
call venv\Scripts\activate
pip install -r requirements.txt
cd ..
echo Python dependencies installed successfully.

echo.
echo [3/4] Installing Node.js dependencies...
cd vite-project
call npm install
cd ..
echo Node.js dependencies installed successfully.

echo.
echo [4/4] Setting up database...
cd backend
call venv\Scripts\activate
set FLASK_APP=run.py
flask db upgrade
cd ..
echo Database setup complete.

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the application, run: start.bat
echo.
pause
