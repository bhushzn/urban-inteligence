@echo off
echo.
echo  ╔═══════════════════════════════════════════════╗
echo  ║       CityEye — Smart City Command Center     ║
echo  ║       Problem Statement 26124                 ║
echo  ╚═══════════════════════════════════════════════╝
echo.
echo  Starting Backend (FastAPI) on http://localhost:8000
echo  Starting Frontend (React)  on http://localhost:5173
echo.

:: Start Backend
start "CityEye Backend" cmd /k "cd /d "%~dp0backend" && (if exist ".venv\Scripts\python.exe" ( .venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload ) else ( python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload ))"

:: Wait a moment for backend to init
timeout /t 3 /nobreak > nul

:: Start Frontend
start "CityEye Frontend" cmd /k "cd /d "%~dp0" && npm run dev -- --host"

:: Wait then open browser
timeout /t 4 /nobreak > nul
start http://localhost:5173

echo.
echo  ✅ Both servers started!
echo  ✅ Browser opening at http://localhost:5173
echo.
echo  API Docs available at: http://localhost:8000/docs
echo.
pause
