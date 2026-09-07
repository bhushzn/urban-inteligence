@echo off
title UrbanIntel AI — Pre-Flight System Verification
color 0B
cls
echo =====================================================================
echo    URBANINTEL AI — UNIFIED SYSTEM PRE-FLIGHT VERIFICATION
echo    Smart India Hackathon (SIH) • Problem Statement 26124
echo =====================================================================
echo.

echo [*] Testing Python Backend Regression Suites...
python backend\verify_all.py
if %errorlevel% neq 0 (
    color 0C
    echo [!] Backend verification encountered issues.
    pause
    exit /b %errorlevel%
)

echo.
echo [*] Testing Frontend TypeScript & PWA Build...
call npm run build
if %errorlevel% neq 0 (
    color 0C
    echo [!] Frontend build encountered issues.
    pause
    exit /b %errorlevel%
)

color 0A
echo.
echo =====================================================================
echo    ALL SYSTEM SUITES PASSED (100%) — PLATFORM IS FULLY OPERATIONAL!
echo =====================================================================
echo.
pause
