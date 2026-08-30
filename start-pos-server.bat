@echo off
:: ═══════════════════════════════════════════════════════════════════
::  VINAYAK FOODS POS — One-Click Local Server Launcher
::  Run this file on the Admin Laptop to start all services.
::  All other devices connect via the IP addresses shown below.
:: ═══════════════════════════════════════════════════════════════════

title Vinayak Foods POS Server
color 0A

echo.
echo  ██╗   ██╗██╗███╗   ██╗ █████╗ ██╗   ██╗ █████╗ ██╗  ██╗
echo  ██║   ██║██║████╗  ██║██╔══██╗╚██╗ ██╔╝██╔══██╗██║ ██╔╝
echo  ██║   ██║██║██╔██╗ ██║███████║ ╚████╔╝ ███████║█████╔╝ 
echo  ╚██╗ ██╔╝██║██║╚██╗██║██╔══██║  ╚██╔╝  ██╔══██║██╔═██╗ 
echo   ╚████╔╝ ██║██║ ╚████║██║  ██║   ██║   ██║  ██║██║  ██╗
echo    ╚═══╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝
echo                   FOODS POS — LOCAL SERVER
echo.
echo ───────────────────────────────────────────────────────────────

:: ── Detect local Wi-Fi IP address ──────────────────────────────
for /f "tokens=2 delims=:" %%I in ('ipconfig ^| findstr /i "IPv4 Address" ^| findstr /v "127.0.0.1"') do (
    set WIFI_IP=%%I
    :: Trim leading space
    set WIFI_IP=!WIFI_IP: =!
    goto :got_ip
)
:got_ip
setlocal enabledelayedexpansion
for /f "tokens=2 delims=:" %%I in ('ipconfig ^| findstr /i "IPv4 Address" ^| findstr /v "127.0.0.1"') do (
    set WIFI_IP=%%I
)
set WIFI_IP=%WIFI_IP: =%

if "%WIFI_IP%"=="" (
    set WIFI_IP=YOUR_LAPTOP_IP
    echo  [!] Could not detect Wi-Fi IP. Please check ipconfig manually.
) else (
    echo  [✓] Detected Wi-Fi IP: %WIFI_IP%
)

echo.
echo  DEVICE ACCESS URLS:
echo  ─────────────────────────────────────────────────────────────
echo.
echo  🖥  Admin Laptop    →  http://localhost:3000
echo  💳  Cashier Tablet  →  http://%WIFI_IP%:3000
echo  📱  Waiter Phone 1  →  http://%WIFI_IP%:3000
echo  📱  Waiter Phone 2  →  http://%WIFI_IP%:3000
echo  🍳  Kitchen Display →  http://%WIFI_IP%:3000/dashboard/kitchen-1
echo  🍳  Kitchen 2       →  http://%WIFI_IP%:3000/dashboard/kitchen-2
echo  📊  Admin Panel     →  http://%WIFI_IP%:3000/dashboard/admin
echo.
echo  BACKEND API         →  http://%WIFI_IP%:3001
echo.
echo ───────────────────────────────────────────────────────────────
echo  Starting Backend (NestJS on port 3001)...
echo ───────────────────────────────────────────────────────────────
start "Vinayak Foods BACKEND" cmd /k "cd /d %~dp0backend && npm run start:dev"

echo  Waiting 4 seconds for backend to initialise...
timeout /t 4 /nobreak >nul

echo.
echo ───────────────────────────────────────────────────────────────
echo  Starting Frontend (Next.js on port 3000, bound to 0.0.0.0)...
echo ───────────────────────────────────────────────────────────────
start "Vinayak Foods FRONTEND" cmd /k "cd /d %~dp0my-app && npm run dev"

echo.
echo  [✓] Both servers are starting in separate windows.
echo.
echo  TIP: Share the Cashier/Waiter/Kitchen URLs above with
echo       each device on the same Wi-Fi network.
echo       No installation needed — just open a browser!
echo.
echo  Press any key to open the Admin panel in your browser...
pause >nul
start http://localhost:3000

exit /b 0
