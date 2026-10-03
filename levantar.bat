@echo off
setlocal
title Mi negocio - arranque
cd /d "%~dp0"

REM ============================================================
REM  levantar.bat - prende el front y el tunel de ESTE proyecto.
REM
REM  Cierra SOLO sus propias ventanas, por titulo. No toca nada de
REM  la clinica: ni su tunel con nombre, ni su backend, ni su front.
REM  (Esa fue la trampa que costo tres dias alla; aqui no se repite.)
REM ============================================================

echo.
echo  == Mi negocio ==
echo.

REM --- cerrar lo que este proyecto haya dejado prendido ---
taskkill /FI "WINDOWTITLE eq negocio-front*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq negocio-tunel*" /T /F >nul 2>&1

REM --- dependencias ---
if not exist "node_modules\" (
  echo  Faltan las dependencias. Instalando, tarda un minuto...
  call npm install
  if errorlevel 1 (
    echo.
    echo  No se pudieron instalar. Revisa que Node este instalado.
    pause
    exit /b 1
  )
)

REM --- limpiar el log del tunel anterior ---
if exist tunel.log del /q tunel.log

REM --- prender el front ---
echo  Prendiendo el front en el puerto 5180...
start "negocio-front" cmd /k "npm run dev"

REM --- prender el tunel ---
echo  Prendiendo el tunel...
start "negocio-tunel" cmd /k "cloudflared tunnel --config tunel.yml --url http://127.0.0.1:5180 --logfile tunel.log"

REM --- esperar a que el tunel publique su direccion ---
echo  Esperando la direccion (hasta 60 segundos)...
set "LIGA="
for /f "usebackq delims=" %%u in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$i=0; while($i -lt 60){ if(Test-Path 'tunel.log'){ $m = Select-String -Path 'tunel.log' -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -ErrorAction SilentlyContinue ^| Select-Object -First 1; if($m){ $m.Matches[0].Value; break } }; Start-Sleep -Seconds 1; $i++ }"`) do set "LIGA=%%u"

echo.
if defined LIGA (
  echo %LIGA%| clip
  echo  ============================================================
  echo.
  echo    Abre esta direccion en el Chrome del celular:
  echo.
  echo      %LIGA%
  echo.
  echo    Ya quedo copiada en el portapapeles.
  echo.
  echo  ============================================================
) else (
  echo  No alcance a leer la direccion del tunel.
  echo  Asomate a la ventana "negocio-tunel": ahi viene, dice trycloudflare.com
)

echo.
echo  En la PC: http://127.0.0.1:5180
echo  Para apagar todo: bajar.bat
echo.
echo  OJO: la camara y el lector de codigos SOLO funcionan por la
echo  direccion del tunel (https). Por la IP de la red local no.
echo.
pause
