@echo off
REM Verifica se o Node.js está instalado
node -v >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo Node.js não encontrado. Por favor, instale o Node.js.
  pause
  exit /b 1
)

REM Executa o script JavaScript
node chk_link.js

REM Pausa para visualizar qualquer saída antes de fechar
pause
