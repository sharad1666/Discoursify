# Build and run with UTC timezone
Write-Host "Building application..." -ForegroundColor Green
mvn clean package -DskipTests

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nStarting backend with UTC timezone..." -ForegroundColor Green
    Write-Host "Backend will be available at http://localhost:8081`n" -ForegroundColor Cyan
    java "-Duser.timezone=UTC" -jar target\ai-gd-platform-0.0.1-SNAPSHOT.jar
}
else {
    Write-Host "`nBuild failed! Please check the errors above." -ForegroundColor Red
    pause
}
