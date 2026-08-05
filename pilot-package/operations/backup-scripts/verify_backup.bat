@echo off
setlocal EnableExtensions

rem ============================================================
rem Mine Manager AI - PostgreSQL Backup Verification Script
rem ============================================================

set "PG_RESTORE=C:\Program Files\PostgreSQL\17\bin\pg_restore.exe"

if "%~1"=="" (
    echo ERROR: No backup file was supplied.
    echo.
    echo Usage:
    echo verify_backup.bat ^<backup-file-path^>
    exit /b 1
)

set "BACKUP_FILE=%~1"

if not exist "%PG_RESTORE%" (
    echo ERROR: pg_restore.exe was not found:
    echo %PG_RESTORE%
    exit /b 1
)

if not exist "%BACKUP_FILE%" (
    echo ERROR: Backup file does not exist:
    echo %BACKUP_FILE%
    exit /b 1
)

for %%F in ("%BACKUP_FILE%") do (
    set "BACKUP_SIZE=%%~zF"
)

if "%BACKUP_SIZE%"=="0" (
    echo ERROR: Backup file is empty.
    exit /b 1
)

echo.
echo Verifying PostgreSQL backup archive...
echo File: %BACKUP_FILE%
echo Size: %BACKUP_SIZE% bytes
echo.

"%PG_RESTORE%" ^
    --list ^
    "%BACKUP_FILE%" >nul 2>&1

if errorlevel 1 (
    echo ERROR: The backup archive could not be read by pg_restore.
    exit /b 1
)

echo Backup archive is readable and structurally valid.

endlocal
exit /b 0