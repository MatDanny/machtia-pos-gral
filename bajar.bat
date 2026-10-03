@echo off
setlocal
title Mi negocio - apagado
cd /d "%~dp0"

REM ============================================================
REM  bajar.bat - apaga SOLO el front y el tunel de este proyecto.
REM  Se cierran por titulo de ventana, asi que lo de la clinica
REM  (su tunel con nombre, su backend) se queda prendido.
REM ============================================================

echo.
echo  Apagando el front y el tunel de Mi negocio...

taskkill /FI "WINDOWTITLE eq negocio-front*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq negocio-tunel*" /T /F >nul 2>&1

if exist tunel.log del /q tunel.log

echo  Listo. Lo de la clinica no se toco.
echo.
timeout /t 3 >nul
