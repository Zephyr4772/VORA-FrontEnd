@echo off
title VORA - Local Deployment Launcher
color 0B

echo.
echo  ==========================================
echo   VORA - Legal Intelligence System
echo   Local Deployment Launcher
echo  ==========================================
echo.

:: ─── Step 1: Start Ollama ─────────────────────────────────────────────────
echo [1/4] Starting Ollama (embedding model)...
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I "ollama.exe" >NUL
if %ERRORLEVEL% NEQ 0 (
    start "Ollama" ollama serve
    echo       Ollama started. Waiting for it to be ready...
    timeout /t 6 /nobreak >nul
) else (
    echo       Ollama already running, skipping.
)
echo       Ollama OK on port 11434.

:: ─── Step 2: Start FastAPI backend ────────────────────────────────────────
echo.
echo [2/4] Starting FastAPI backend (RAG engine on port 8000)...
start "VORA - FastAPI Backend" cmd /k "title VORA API Server && cd /d "%~dp0backend" && python -m uvicorn api:app --host 0.0.0.0 --port 8000"
timeout /t 5 /nobreak >nul

:: ─── Step 3: Start ngrok tunnel ────────────────────────────────────────────
echo.
echo [3/4] Starting ngrok tunnel to Vercel...
start "VORA - ngrok Tunnel" cmd /k "title VORA ngrok Tunnel && ngrok http --url=rack-varnish-urology.ngrok-free.dev 8000"
timeout /t 4 /nobreak >nul

:: ─── Step 4: Start Vite frontend (local dev only) ────────────────────────
echo.
echo [4/4] Starting React Frontend (local dev at port 8080)...
start "VORA - React Frontend" cmd /k "title VORA Frontend && cd /d "%~dp0frontend" && npm run dev"
timeout /t 4 /nobreak >nul

:: ─── Done ─────────────────────────────────────────────────────────────────
cls
color 0B
echo.
echo  ==========================================
echo   VORA IS LIVE!
echo  ==========================================
echo.
echo   Local API:      http://localhost:8000
echo   Health check:   http://localhost:8000/api/health
echo   Ollama Engine:  http://localhost:11434
echo.
echo  ------------------------------------------
echo   DEPLOYED FRONTENDS (via ngrok tunnel)
echo  ------------------------------------------
echo   Chat App:     https://vora-ai-psi.vercel.app
echo   Login/Land:   https://vora-jade.vercel.app
echo.
echo  ------------------------------------------
echo   LOCAL FRONTEND (dev only)
echo  ------------------------------------------
echo   Chat App:     http://localhost:8080
echo.
echo  ==========================================
echo   Keep ALL terminal windows running.
echo   ngrok window must stay open for Vercel
echo   deployments to reach the local backend.
echo  ==========================================
echo.
pause
