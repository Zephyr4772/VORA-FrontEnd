@echo off
title VORA - Starting...
color 0B

echo.
echo  ==========================================
echo   VORA - Legal Intelligence System
echo   Deployment Launcher
echo  ==========================================
echo.

:: ─── Step 1: Start Ollama ─────────────────────────────────────────────────
echo [1/6] Starting Ollama (embedding model)...
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I "ollama.exe" >NUL
if %ERRORLEVEL% NEQ 0 (
    start "Ollama" ollama serve
    echo       Ollama started. Waiting for it to be ready...
    timeout /t 5 /nobreak >nul
) else (
    echo       Ollama already running, skipping.
)
echo       Ollama OK on port 11434.

:: ─── Step 2: Start ngrok tunnel on port 8000 ──────────────────────────────
echo.
echo [2/6] Starting ngrok tunnel (port 8000)...
taskkill /F /IM ngrok.exe >nul 2>&1
timeout /t 1 /nobreak >nul
start "ngrok - VORA Tunnel" ngrok http 8000 --log=stdout
echo       Waiting for ngrok to initialise...
timeout /t 6 /nobreak >nul

:: ─── Step 3: Fetch the public URL ─────────────────────────────────────────
echo [3/6] Fetching public ngrok URL...
for /f "delims=" %%i in ('powershell -NoProfile -Command "(Invoke-RestMethod http://localhost:4040/api/tunnels).tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1 -ExpandProperty public_url"') do set NGROK_URL=%%i

if "%NGROK_URL%"=="" (
    echo.
    echo   [ERROR] Could not get ngrok URL.
    echo   Make sure ngrok is installed and authenticated:
    echo     1. Download: https://ngrok.com/download
    echo     2. Run:  ngrok config add-authtoken YOUR_TOKEN
    echo.
    pause
    exit /b 1
)
echo       Got URL: %NGROK_URL%

:: ─── Step 4: Update vercel.json with live ngrok URL and push ─────────────
echo.
echo [4/6] Updating Vercel proxy config with live URL...

:: Write the new vercel.json with the real ngrok URL
(
  echo {
  echo   "rewrites": [
  echo     {
  echo       "source": "/api/:path*",
  echo       "destination": "%NGROK_URL%/api/:path*"
  echo     }
  echo   ]
  echo }
) > "%~dp0frontend\vercel.json"

echo       vercel.json updated. Pushing to git so Vercel redeploys...
cd /d "%~dp0"
git add frontend/vercel.json
git commit -m "chore: update ngrok URL for live session [skip ci]" --quiet
git push --quiet
if %ERRORLEVEL% NEQ 0 (
    echo       [WARN] git push failed - Vercel may use an old URL.
    echo       Manually paste this URL in the Vercel dashboard:
    echo       %NGROK_URL%
) else (
    echo       Pushed! Vercel will redeploy in ~30 seconds.
)
cd /d "%~dp0"

:: ─── Step 5: Start FastAPI backend ────────────────────────────────────────
echo.
echo [5/6] Starting FastAPI backend (RAG engine on port 8000)...
start "VORA - FastAPI Backend" cmd /k "title VORA API Server && cd /d %~dp0backend && python -m uvicorn api:app --host 0.0.0.0 --port 8000"
timeout /t 4 /nobreak >nul

:: ─── Step 6: Start React Frontend ──────────────────────────────────────────
echo.
echo [6/6] Starting React Frontend (Vite dev server on port 5173)...
start "VORA - React Frontend" cmd /k "title VORA Frontend Server && cd /d %~dp0frontend && npm run dev"
timeout /t 2 /nobreak >nul

:: ─── Done ─────────────────────────────────────────────────────────────────
cls
color 0B
echo.
echo  ==========================================
echo   VORA IS LIVE!
echo  ==========================================
echo.
echo   Backend (ngrok public):
echo   %NGROK_URL%
echo.
echo   Local backend:  http://localhost:8000
echo   Local frontend: http://localhost:5173
echo   Health check:   %NGROK_URL%/api/health
echo   Ollama:         http://localhost:11434
echo.
echo  ------------------------------------------
echo   VERCEL FRONTEND
echo  ------------------------------------------
echo   https://vora-front-end.vercel.app
echo.
echo   Vercel will auto-redeploy in ~30 seconds
echo   with the new ngrok URL baked in.
echo   (All /api/* calls proxy through Vercel -
echo    no CORS issues!)
echo.
echo  ==========================================
echo   Keep ALL terminal windows open.
echo   Close this launcher window when done.
echo  ==========================================
echo.
pause
