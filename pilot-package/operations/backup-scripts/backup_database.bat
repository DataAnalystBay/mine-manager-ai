@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem ============================================================
rem Mine Manager AI - PostgreSQL Backup Script
rem ============================================================

set "PROJECT_ROOT=C:\Projects\mine-manager-ai"
set "BACKEND_DIR=%PROJECT_ROOT%\backend"
set "BACKUP_DIR=%PROJECT_ROOT%\backups\database"

set "PG_BIN=C:\Program Files\PostgreSQL\17\bin"
set "PG_DUMP=%PG_BIN%\pg_dump.exe"

if not exist "%PG_DUMP%" (
    echo ERROR: pg_dump.exe was not found:
    echo %PG_DUMP%
    exit /b 1
)

if not exist "%BACKEND_DIR%\.env" (
    echo ERROR: Backend .env file was not found:
    echo %BACKEND_DIR%\.env
    exit /b 1
)

if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
)

for /f "usebackq tokens=1,* delims==" %%A in ("%BACKEND_DIR%\.env") do (
    set "KEY=%%A"
    set "VALUE=%%B"

    if /I "!KEY!"=="DB_HOST" set "DB_HOST=!VALUE!"
    if /I "!KEY!"=="DB_PORT" set "DB_PORT=!VALUE!"
    if /I "!KEY!"=="DB_NAME" set "DB_NAME=!VALUE!"
    if /I "!KEY!"=="DB_USER" set "DB_USER=!VALUE!"
    if /I "!KEY!"=="DB_PASSWORD" set "DB_PASSWORD=!VALUE!"
)

if not defined DB_PORT (
    set "DB_PORT=5432"
)

if not defined DB_HOST (
    echo ERROR: DB_HOST is not configured.
    exit /b 1
)

if not defined DB_NAME (
    echo ERROR: DB_NAME is not configured.
    exit /b 1
)

if not defined DB_USER (
    echo ERROR: DB_USER is not configured.
    exit /b 1
)

if not defined DB_PASSWORD (
    echo ERROR: DB_PASSWORD is not configured.
    exit /b 1
)

for /f %%I in (
    'powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"'
) do (
    set "TIMESTAMP=%%I"
)

set "BACKUP_FILE=%BACKUP_DIR%\%DB_NAME%_%TIMESTAMP%.backup"
set "PGPASSWORD=%DB_PASSWORD%"

echo.
echo Starting PostgreSQL backup...
echo Database: %DB_NAME%
echo Host: %DB_HOST%
echo Port: %DB_PORT%
echo Output: %BACKUP_FILE%
echo.

"%PG_DUMP%" ^
    --host="%DB_HOST%" ^
    --port="%DB_PORT%" ^
    --username="%DB_USER%" ^
    --dbname="%DB_NAME%" ^
    --format=custom ^
    --compress=9 ^
    --no-password ^
    --verbose ^
    --file="%BACKUP_FILE%"

set "BACKUP_RESULT=%ERRORLEVEL%"
set "PGPASSWORD="

if not "%BACKUP_RESULT%"=="0" (
    echo.
    echo ERROR: Database backup failed with exit code %BACKUP_RESULT%.

    if exist "%BACKUP_FILE%" (
        del "%BACKUP_FILE%" >nul 2>&1
    )

    exit /b %BACKUP_RESULT%
)

if not exist "%BACKUP_FILE%" (
    echo ERROR: Backup completed but no file was created.
    exit /b 1
)

for %%F in ("%BACKUP_FILE%") do (
    set "BACKUP_SIZE=%%~zF"
)

if "%BACKUP_SIZE%"=="0" (
    echo ERROR: Backup file is empty.
    del "%BACKUP_FILE%" >nul 2>&1
    exit /b 1
)

echo.
echo Backup completed successfully.
echo File: %BACKUP_FILE%
echo Size: %BACKUP_SIZE% bytes

endlocal
exit /b 0