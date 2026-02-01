@echo off
REM Startup script for Spring Boot backend with UTC timezone
echo Starting Spring Boot backend with UTC timezone...

REM Set timezone to UTC
set TZ=UTC

REM Set Maven options
set MAVEN_OPTS=-Duser.timezone=UTC

REM Start the application
cd /d "%~dp0"
mvn spring-boot:run

pause
