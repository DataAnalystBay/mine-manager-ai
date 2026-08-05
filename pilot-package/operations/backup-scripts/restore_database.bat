@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem ============================================================
rem Mine Manager AI - Safe PostgreSQL Restore Script
rem ============================================================

set "PROJECT_ROOT=C:\Projects\mine-manager-ai"
set "BACKEND_DIR=%PROJECT_ROOT%\backend"

set "PG_BIN=C:\Program Files\PostgreSQL\17\bin"
set "PSQL=%PG_BIN%\psql.exe"
set "PG_RESTORE=%PG_BIN%\pg_restore.exe"

if "%~1"=="" (
    echo ERROR: Backup file path is required.
    echo.
    echo Usage:
    echo restore_database.bat ^<backup-file-path^> [target-database]
    exit /b 1
)

set "BACKUP_FILE=%~1"
set "TARGET_DB=%~2"

if not defined TARGET_DB (
    set "TARGET_DB=mine_manager_ai_restore_test"
)

if /I "%TARGET_DB%"=="mine_manager_ai" (
    echo ERROR: Refusing to restore into the active database.
    echo Use a temporary database name.
    exit /b 1
)

if not exist "%BACKUP_FILE%" (
    echo ERROR: Backup file was not found:
    echo %BACKUP_FILE%
    exit /b 1
)

if not exist "%PSQL%" (
    echo ERROR: psql.exe was not found:
    echo %PSQL%
    exit /b 1
)

if not exist "%PG_RESTORE%" (
    echo ERROR: pg_restore.exe was not found:
    echo %PG_RESTORE%
    exit /b 1
)

if not exist "%BACKEND_DIR%\.env" (
    echo ERROR: Backend .env file was not found:
    echo %BACKEND_DIR%\.env
    exit /b 1
)

for /f "usebackq tokens=1,* delims==" %%A in ("%BACKEND_DIR%\.env") do (
    set "KEY=%%A"
    set "VALUE=%%B"

    if /I "!KEY!"=="DB_HOST" set "DB_HOST=!VALUE!"
    if /I "!KEY!"=="DB_PORT" set "DB_PORT=!VALUE!"
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

if not defined DB_USER (
    echo ERROR: DB_USER is not configured.
    exit /b 1
)

if not defined DB_PASSWORD (
    echo ERROR: DB_PASSWORD is not configured.
    exit /b 1
)

set "PGPASSWORD=%DB_PASSWORD%"

echo.
echo Creating temporary restore database...
echo Database: %TARGET_DB%
echo Host: %DB_HOST%
echo.

"%PSQL%" ^
    --host="%DB_HOST%" ^
    --port="%DB_PORT%" ^
    --username="%DB_USER%" ^
    --dbname="postgres" ^
    --no-password ^
    --set=ON_ERROR_STOP=1 ^
    --command="SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '%TARGET_DB%' AND pid <> pg_backend_pid();"

if errorlevel 1 (
    echo ERROR: Could not terminate existing connections.
    set "PGPASSWORD="
    exit /b 1
)

"%PSQL%" ^
    --host="%DB_HOST%" ^
    --port="%DB_PORT%" ^
    --username="%DB_USER%" ^
    --dbname="postgres" ^
    --no-password ^
    --set=ON_ERROR_STOP=1 ^
    --command="DROP DATABASE IF EXISTS \"%TARGET_DB%\";"

if errorlevel 1 (
    echo ERROR: Could not drop the temporary database.
    set "PGPASSWORD="
    exit /b 1
)

"%PSQL%" ^
    --host="%DB_HOST%" ^
    --port="%DB_PORT%" ^
    --username="%DB_USER%" ^
    --dbname="postgres" ^
    --no-password ^
    --set=ON_ERROR_STOP=1 ^
    --command="CREATE DATABASE \"%TARGET_DB%\";"

if errorlevel 1 (
    echo ERROR: Could not create the temporary database.
    set "PGPASSWORD="
    exit /b 1
)

echo.
echo Restoring backup into temporary database...
echo.

"%PG_RESTORE%" ^
    --host="%DB_HOST%" ^
    --port="%DB_PORT%" ^
    --username="%DB_USER%" ^
    --dbname="%TARGET_DB%" ^
    --no-password ^
    --no-owner ^
    --no-privileges ^
    --exit-on-error ^
    --verbose ^
    "%BACKUP_FILE%"

set "RESTORE_RESULT=%ERRORLEVEL%"
set "PGPASSWORD="

if not "%RESTORE_RESULT%"=="0" (
    echo.
    echo ERROR: Restore failed with exit code %RESTORE_RESULT%.
    exit /b %RESTORE_RESULT%
)

echo.
echo Restore completed successfully.
echo Temporary database: %TARGET_DB%

endlocal
exit /b 0