# NetMon Dashboard - Windows PowerShell Setup Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NetMon Dashboard - Windows Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js installation
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Write-Host "Make sure to check 'Add to PATH' during installation" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check npm installation
Write-Host ""
Write-Host "Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm is not installed or not in PATH" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install client dependencies
Write-Host ""
Write-Host "Installing client dependencies..." -ForegroundColor Yellow
Set-Location client
npm install
Set-Location ..

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install client dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Setup environment file
Write-Host ""
Write-Host "Setting up environment file..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "Environment file created from .env.example" -ForegroundColor Green
    } else {
        Write-Host "Creating .env file..." -ForegroundColor Yellow
        node setup-env.js
    }
    Write-Host "Environment file created. Please update it with your configuration." -ForegroundColor Yellow
} else {
    Write-Host "Environment file already exists." -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the application:" -ForegroundColor White
Write-Host "  1. Open a new PowerShell/Command Prompt" -ForegroundColor White
Write-Host "  2. Navigate to the project folder" -ForegroundColor White
Write-Host "  3. Run: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "The application will be available at:" -ForegroundColor White
Write-Host "  http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Login credentials:" -ForegroundColor White
Write-Host "  Username: netmon" -ForegroundColor White
Write-Host "  Password: netmon" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to continue"
