@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem ============================================================
rem Mine Manager AI - Support Diagnostics Collection Script
rem ============================================================

set "PROJECT_ROOT=C:\Projects\mine-manager-ai"
set "BACKEND_DIR=%PROJECT_ROOT%\backend"
set "OUTPUT_ROOT=%PROJECT_ROOT%\support-diagnostics"

if not exist "%OUTPUT_ROOT%" (
    mkdir "%OUTPUT_ROOT%"
)

for /f %%I in (
    'powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"'
) do (
    set "TIMESTAMP=%%I"
)

set "OUTPUT_DIR=%OUTPUT_ROOT%\diagnostics_%TIMESTAMP%"

mkdir "%OUTPUT_DIR%"

echo Mine Manager AI Support Diagnostics
echo ====================================
echo.
echo Output directory:
echo %OUTPUT_DIR%
echo.

rem ------------------------------------------------------------
rem System and environment information
rem ------------------------------------------------------------

(
    echo Mine Manager AI Diagnostics
    echo ===========================
    echo.
    echo Collected:
    powershell -NoProfile -Command "Get-Date -Format yyyy-MM-ddTHH:mm:ssK"
    echo.
    echo Computer name:
    hostname
    echo.
    echo Windows version:
    ver
    echo.
    echo Current user:
    whoami
) > "%OUTPUT_DIR%\system_information.txt"

rem ------------------------------------------------------------
rem Python environment
rem ------------------------------------------------------------

if exist "%BACKEND_DIR%\venv\Scripts\python.exe" (
    (
        echo Python Environment
        echo ==================
        echo.
        "%BACKEND_DIR%\venv\Scripts\python.exe" --version
        echo.
        "%BACKEND_DIR%\venv\Scripts\python.exe" -m pip --version
        echo.
        where python
    ) > "%OUTPUT_DIR%\python_environment.txt" 2>&1
) else (
    echo Backend virtual environment was not found. > "%OUTPUT_DIR%\python_environment.txt"
)

rem ------------------------------------------------------------
rem Node and frontend environment
rem ------------------------------------------------------------

(
    echo Node Environment
    echo ================
    echo.
    node --version
    echo.
    call npm --version
) > "%OUTPUT_DIR%\node_environment.txt" 2>&1

rem ------------------------------------------------------------
rem Git information
rem ------------------------------------------------------------

(
    echo Git Information
    echo ===============
    echo.
    cd /d "%PROJECT_ROOT%"
    git branch --show-current
    git log -1 --oneline
    echo.
    git status --short
) > "%OUTPUT_DIR%\git_information.txt" 2>&1

rem ------------------------------------------------------------
rem Backend health checks
rem ------------------------------------------------------------

if exist "%BACKEND_DIR%\venv\Scripts\python.exe" (
    (
        echo Backend Diagnostics
        echo ===================
        echo.
        cd /d "%BACKEND_DIR%"
        "%BACKEND_DIR%\venv\Scripts\python.exe" -c "from app.services.support_diagnostics_service import get_support_diagnostics; import json; print(json.dumps(get_support_diagnostics(), indent=2, default=str))"
    ) > "%OUTPUT_DIR%\support_diagnostics.json" 2>&1
)

rem ------------------------------------------------------------
rem Alembic status
rem ------------------------------------------------------------

if exist "%BACKEND_DIR%\venv\Scripts\alembic.exe" (
    (
        echo Alembic Status
        echo ==============
        echo.
        cd /d "%BACKEND_DIR%"
        "%BACKEND_DIR%\venv\Scripts\alembic.exe" current
        echo.
        "%BACKEND_DIR%\venv\Scripts\alembic.exe" heads
    ) > "%OUTPUT_DIR%\alembic_status.txt" 2>&1
)

rem ------------------------------------------------------------
rem Application log inventory
rem ------------------------------------------------------------

(
    echo Log Inventory
    echo =============
    echo.
    dir /S /B "%BACKEND_DIR%\*.log" 2^>nul
) > "%OUTPUT_DIR%\log_inventory.txt"

rem ------------------------------------------------------------
rem Runtime directory inventory
rem ------------------------------------------------------------

(
    echo Runtime Directory Inventory
    echo ===========================
    echo.
    echo Uploads:
    dir "%BACKEND_DIR%\uploads" 2^>nul
    echo.
    echo Static files:
    dir "%BACKEND_DIR%\app\static" 2^>nul
    echo.
    echo Logs:
    dir "%BACKEND_DIR%\logs" 2^>nul
) > "%OUTPUT_DIR%\runtime_directories.txt"

rem ------------------------------------------------------------
rem Secret-name scan
rem ------------------------------------------------------------

(
    echo Secret Name Scan
    echo ================
    echo.
    echo This scan checks collected files for sensitive variable names.
    echo It does not intentionally print configured secret values.
    echo.
    findstr /S /N /I ^
        "DB_PASSWORD SECRET_KEY JWT_SECRET_KEY OPENAI_API_KEY AZURE_OPENAI_API_KEY AUTHORIZATION TOKEN PASSWORD" ^
        "%OUTPUT_DIR%\*.txt" ^
        "%OUTPUT_DIR%\*.json"
) > "%OUTPUT_DIR%\sensitive_name_scan.txt" 2>&1

rem ------------------------------------------------------------
rem Completion
rem ------------------------------------------------------------

(
    echo Diagnostics Collection Result
    echo =============================
    echo.
    echo Status: COMPLETED
    echo Output directory: %OUTPUT_DIR%
    echo Collected:
    powershell -NoProfile -Command "Get-Date -Format yyyy-MM-ddTHH:mm:ssK"
) > "%OUTPUT_DIR%\collection_result.txt"

echo.
echo Diagnostics collection completed.
echo Output:
echo %OUTPUT_DIR%
echo.
echo Review every collected file before sharing it externally.

endlocal
exit /b 0