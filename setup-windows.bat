@echo off
echo ========================================
echo NetMon Dashboard - Windows Setup
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo Make sure to check "Add to PATH" during installation
    pause
    exit /b 1
)

echo Node.js found: 
node --version

echo.
echo Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)

echo npm found:
npm --version

echo.
echo Installing dependencies...
echo This may take a few minutes...
npm install

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Installing client dependencies...
cd client
npm install
cd ..

if %errorlevel% neq 0 (
    echo ERROR: Failed to install client dependencies
    pause
    exit /b 1
)

echo.
echo Setting up environment file...
if not exist .env (
    copy .env.example .env >nul 2>&1
    if %errorlevel% neq 0 (
        echo Creating .env file...
        node setup-env.js
    )
    echo Environment file created. Please update it with your configuration.
) else (
    echo Environment file already exists.
)

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo To start the application:
echo   1. Open a new terminal/command prompt
echo   2. Navigate to the project folder
echo   3. Run: npm run dev
echo.
echo The application will be available at:
echo   http://localhost:5000
echo.
echo Login credentials:
echo   Username: netmon
echo   Password: netmon
echo.
pause
