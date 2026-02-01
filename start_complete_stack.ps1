# Start-CompleteStack.ps1
# Starts the entire Discoursify stack: Backend Microservices, Frontend, and Ngrok.

Write-Host "===================================================" -ForegroundColor Green
Write-Host "      Starting Discoursify Complete Stack" -ForegroundColor Green
Write-Host "==================================================="
Write-Host ""

# --- 1. Cleanup Existing Processes ---
Write-Host "[1/4] Cleanup: Stopping existing processes..." -ForegroundColor Yellow
try {
    Stop-Process -Name "java" -ErrorAction SilentlyContinue -Force
    Stop-Process -Name "node" -ErrorAction SilentlyContinue -Force
    Stop-Process -Name "ngrok" -ErrorAction SilentlyContinue -Force
}
catch {
    Write-Host "No processes to kill." -ForegroundColor Gray
}
Write-Host "Cleanup complete." -ForegroundColor Green
Write-Host ""

# Function to start a service in a new window
function Start-ServiceWindow {
    param (
        [string]$Name,
        [string]$Path,
        [string]$Command,
        [int]$Port,
        [string]$Title
    )
    Write-Host "Starting $Name..." -ForegroundColor Cyan
    if ($Port -gt 0) {
        Write-Host " - Port: $Port" -ForegroundColor DarkCyan
    }
    
    $fullPath = Join-Path $PSScriptRoot $Path
    $windowTitle = if ($Title) { $Title } else { $Name }
    
    # Using Start-Process to open a new PowerShell window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$fullPath'; $Command" -WindowStyle Normal
}

# --- 2. Backend Services ---
Write-Host "[2/4] Backend: Starting Microservices..." -ForegroundColor Yellow

# 2.1 Service Registry
Start-ServiceWindow -Name "Service Registry" -Path "backend/service-registry" -Command "mvn spring-boot:run" -Port 8761 -Title "Service Registry (8761)"
Write-Host "Waiting 15 seconds for Registry to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# 2.2 API Gateway (Port 8085)
Start-ServiceWindow -Name "API Gateway" -Path "backend/api-gateway" -Command "mvn spring-boot:run" -Port 8085 -Title "API Gateway (8085)"
Start-Sleep -Seconds 5

# 2.3 Auth Service (Port 8081)
Start-ServiceWindow -Name "Auth Service" -Path "backend/auth-service" -Command "mvn spring-boot:run" -Port 8081 -Title "Auth Service (8081)"
Start-Sleep -Seconds 3

# 2.4 Session Service (Port 8082)
Start-ServiceWindow -Name "Session Service" -Path "backend/session-service" -Command "mvn spring-boot:run" -Port 8082 -Title "Session Service (8082)"
Start-Sleep -Seconds 3

# 2.5 AI Service (Port 8083)
Start-ServiceWindow -Name "AI Service" -Path "backend/ai-service" -Command "mvn spring-boot:run" -Port 8083 -Title "AI Service (8083)"
Write-Host "Backend services initiated." -ForegroundColor Green
Write-Host ""

# --- 3. Frontend ---
Write-Host "[3/4] Frontend: Starting React/Vite..." -ForegroundColor Yellow
# Frontend Port 5174 (checked in vite.config.ts)
Start-ServiceWindow -Name "Frontend Web" -Path "frontend-web" -Command "npm run dev" -Port 5174 -Title "Frontend Web (5174)"
Write-Host "Frontend initiated." -ForegroundColor Green
Write-Host ""

# --- 4. Ngrok ---
Write-Host "[4/4] Access: Starting Ngrok Tunnels..." -ForegroundColor Yellow
$ngrokConfig = "frontend-web/ngrok.yml"
$ngrokLocal = Join-Path $PSScriptRoot "frontend-web\node_modules\ngrok\bin\ngrok.exe"

if (Test-Path $ngrokLocal) {
    Write-Host "Found local Ngrok binary." -ForegroundColor Green
    Start-Process $ngrokLocal -ArgumentList "start", "--all", "--config=$ngrokConfig" -WindowStyle Normal
}
elseif (Get-Command "ngrok" -ErrorAction SilentlyContinue) {
    Write-Host "Found global Ngrok command." -ForegroundColor Green
    Start-Process "ngrok" -ArgumentList "start", "--all", "--config=$ngrokConfig" -WindowStyle Normal
}
else {
    Write-Host "Error: 'ngrok' command not found." -ForegroundColor Red
    Write-Host "Please ensure ngrok is installed or available in PATH."
}

Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host "           Startup Sequence Complete" -ForegroundColor Green
Write-Host "==================================================="
Write-Host "Backend Gateway: http://localhost:8085"
Write-Host "Frontend:        https://localhost:5174"
Write-Host "Ngrok:           Check the Ngrok window for public URLs"
Write-Host ""
Write-Host "You can minimize the opened windows, but do not close them."
Read-Host -Prompt "Press Enter to exit this launcher (services will keep running)"
