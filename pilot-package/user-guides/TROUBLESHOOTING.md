# Mine Manager AI Version 1.0

# Troubleshooting Guide

---

# Document Information

| Item | Value |

|---|---|

| Product | Mine Manager AI |

| Version | 1.0 |

| Document | Troubleshooting Guide |

| Audience | Pilot Users, Administrators, Support Personnel |

| Status | Pilot Release |

| Last Updated | August 2026 |

---

# 1. Purpose

This guide explains how to diagnose and resolve common Mine Manager AI Version 1.0 issues during development, pilot deployment, and day-to-day use.

Use it for problems involving:

\- Login

\- Authentication

\- User access

\- Backend startup

\- Frontend startup

\- Database connectivity

\- Excel upload

\- Dashboard data

\- Executive Reports

\- AI features

\- System Health

\- Security Center

\- Git and local development

Do not include passwords, secret keys, JWT tokens, database credentials, or confidential customer files in support requests.

---

# 2. First Response Checklist

Before making changes:

1\. Record the exact error message.

2\. Record the page or command where it occurred.

3\. Record the date and time.

4\. Confirm the active environment.

5\. Confirm the current company and mine.

6\. Confirm whether the issue affects one user or all users.

7\. Take a screenshot where useful.

8\. Preserve relevant logs.

9\. Avoid deleting data.

10\. Avoid changing multiple settings at once.

---

# 3. Confirm the Project Location

Validated Windows project path:

```text

C:\\Projects\\mine-manager-ai

```

Backend:

```text

C:\\Projects\\mine-manager-ai\\backend

```

Frontend:

```text

C:\\Projects\\mine-manager-ai\\frontend

```

If a command fails because the path is wrong:

```cmd

cd C:\\Projects\\mine-manager-ai

```

Then confirm:

```cmd

dir

```

---

# 4. Virtual Environment Problems

## Problem

Python packages such as SQLAlchemy, FastAPI, or Alembic are reported as missing.

Example:

```text

ModuleNotFoundError: No module named 'sqlalchemy'

```

## Cause

The backend virtual environment is not active, or Windows is using a different Python installation.

## Resolution

```cmd

cd C:\\Projects\\mine-manager-ai\\backend

venv\\Scripts\\activate.bat

```

Confirm:

```cmd

where python

```

The first result should be:

```text

C:\\Projects\\mine-manager-ai\\backend\\venv\\Scripts\\python.exe

```

Verify the package:

```cmd

python -m pip show sqlalchemy

```

---

# 5. PowerShell Activation Problem

## Problem

This command does not activate the environment correctly:

```cmd

.\\venv\\Scripts\\Activate.ps1

```

## Cause

The command is being run in Command Prompt instead of PowerShell, or PowerShell execution policy prevents the script.

## Resolution for Command Prompt

Use:

```cmd

venv\\Scripts\\activate.bat

```

Expected prompt:

```text

(venv) C:\\Projects\\mine-manager-ai\\backend>

```

---

# 6. Backend Does Not Start

## Problem

Uvicorn exits with an import, configuration, or database error.

## Resolution

Activate the environment:

```cmd

cd C:\\Projects\\mine-manager-ai\\backend

venv\\Scripts\\activate.bat

```

Start:

```cmd

uvicorn app.main:app --reload

```

Check for:

\- Missing Python package

\- Missing JWT secret

\- Database connection failure

\- Syntax error

\- Missing router

\- Missing static directory

\- Port conflict

---

# 7. Missing JWT Secret

## Error

```text

Missing JWT secret. Set SECRET\_KEY or JWT\_SECRET\_KEY.

```

## Cause

The backend `.env` file does not contain a valid JWT signing secret.

## Resolution

Open:

```text

C:\\Projects\\mine-manager-ai\\backend\\.env

```

Add:

```dotenv

SECRET\_KEY=replace-with-secure-random-secret

```

Generate a secret:

```cmd

python -c "import secrets; print(secrets.token\_hex(64))"

```

Restart the backend.

Do not commit the real secret to Git.

---

# 8. Database Connection Failure

## Symptoms

\- Backend fails during startup

\- Dashboard shows no data

\- Upload fails

\- System Health reports database failure

## Check environment variables

```dotenv

DB\_HOST=

DB\_PORT=5432

DB\_NAME=

DB\_USER=

DB\_PASSWORD=

```

## Test connectivity

```cmd

cd C:\\Projects\\mine-manager-ai\\backend

venv\\Scripts\\activate.bat

python -c "from sqlalchemy import text; from app.database import engine; connection=engine.connect(); print(connection.execute(text('SELECT 1')).scalar()); connection.close()"

```

Expected:

```text

1

```

## Common causes

\- Incorrect host

\- Incorrect password

\- Incorrect database name

\- Firewall restriction

\- PostgreSQL service unavailable

\- SSL requirement not supported

\- Network or DNS issue

---

# 9. PostgreSQL SSL Error

## Problem

The database rejects the connection because of SSL configuration.

## Cause

The current backend uses:

```text

sslmode=require

```

## Resolution

Confirm the PostgreSQL server supports SSL.

For local PostgreSQL without SSL, either:

\- configure local PostgreSQL SSL, or

\- intentionally update `app/database.py` after technical review

Do not remove SSL requirements from customer deployments without approval.

---

# 10. Alembic Migration Problem

## Check current status

```cmd

cd C:\\Projects\\mine-manager-ai\\backend

venv\\Scripts\\activate.bat

alembic current

alembic heads

```

Expected validated revision:

```text

afaaaeb915e4 (head)

```

## Apply migrations

```cmd

alembic upgrade head

```

Before applying migrations to a customer environment:

\- confirm the target environment;

\- complete a backup;

\- review migration scripts;

\- confirm rollback or restore steps.

---

# 11. Backend Port 8000 Already in Use

## Symptom

Uvicorn cannot bind to port 8000.

## Find the process

```cmd

netstat -ano | findstr :8000

```

Review the process ID.

Only stop it after confirming it belongs to the old backend process.

Alternative development port:

```cmd

uvicorn app.main:app --reload --port 8001

```

Then update:

```dotenv

VITE\_API\_BASE\_URL=http://127.0.0.1:8001

```

Restart the frontend.

---

# 12. Frontend Does Not Start

## Resolution

```cmd

cd C:\\Projects\\mine-manager-ai\\frontend

node --version

npm --version

npm install

npm run dev

```

Validated versions:

```text

Node.js v22.23.2

npm 10.9.8

```

Check for:

\- missing dependency;

\- unresolved import;

\- syntax error;

\- wrong file path;

\- incompatible package version.

---

# 13. Vite Port Changes

## Symptom

Vite reports:

```text

Port 5173 is in use, trying another one...

```

and starts on:

```text

http://localhost:5174

```

or:

```text

http://localhost:5175

```

## Meaning

This is normal in local development.

## Action

Open the URL displayed by Vite.

Confirm the selected origin is allowed by backend CORS configuration.

---

# 14. Frontend Calls the Wrong Backend

## Symptom

The page loads, but API requests fail or continue to use localhost.

## Check

```text

C:\\Projects\\mine-manager-ai\\frontend\\.env

```

Expected local value:

```dotenv

VITE\_API\_BASE\_URL=http://127.0.0.1:8000

```

For an external pilot:

```dotenv

VITE\_API\_BASE\_URL=https://approved-api-domain

```

Restart the development server or rebuild:

```cmd

npm run build

```

Vite environment variables are embedded during build time.

---

# 15. CORS Error

## Symptoms

Browser console shows a cross-origin request error.

## Resolution

Confirm the backend allows the exact frontend origin.

Example:

```dotenv

CORS\_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175

```

External pilot example:

```dotenv

CORS\_ORIGINS=https://approved-frontend-domain

```

Do not use wildcard CORS in production.

Restart the backend after changing CORS settings.

---

# 16. Login Failure

## Common causes

\- Incorrect email

\- Incorrect password

\- Disabled account

\- Backend unavailable

\- Database unavailable

\- Missing JWT secret

\- Unsupported user role

## User action

1\. Re-enter the email.

2\. Re-enter the password.

3\. Refresh the page.

4\. Try again.

5\. Contact an Administrator.

## Administrator action

Confirm:

\- user exists;

\- account is active;

\- role is valid;

\- backend is available;

\- authentication API is available.

---

# 17. Not Authenticated

## Error

```text

Not authenticated

```

or:

```text

Your login session has expired. Please log in again.

```

## Resolution

1\. Log out.

2\. Close stale application tabs if needed.

3\. Log in again.

4\. Retry the action.

The frontend must send:

```text

Authorization: Bearer <access\_token>

```

Do not paste the real token into a support request.

---

# 18. Access Denied

## Cause

The user role is not authorized for the action.

Supported roles:

\- Administrator

\- General Manager

\- Mine Manager

\- Superintendent

\- Viewer

Viewer accounts are read-only.

## Resolution

Confirm the user role in User Management.

Do not assign a higher role unless business approval exists.

---

# 19. User Management Does Not Load

## Check

\- user is logged in;

\- user has Administrator role;

\- backend `/api/users` routes are available;

\- database is connected;

\- browser console has no API error.

User Management is Administrator-protected.

---

# 20. Excel Upload Missing Columns

## Production

Required:

```text

report\_date

ore\_plan

ore\_actual

waste\_plan

waste\_actual

```

## Fleet

Required:

```text

report\_date

truck\_id

availability

utilization

```

## Plant

Required:

```text

report\_date

throughput\_plan

throughput\_actual

recovery

```

## Safety

Required:

```text

report\_date

incidents

near\_misses

critical\_risks

safety\_score

```

## Resolution

Use the approved templates under:

```text

pilot-package\\data\\templates

```

Do not rename required headers.

---

# 21. Fleet Upload Fails Because `truck\_id` Is Missing

## Cause

The current Fleet upload workflow requires:

```text

truck\_id

```

## Resolution

Use:

```text

Mine\_Manager\_AI\_Fleet\_Template.xlsx

```

or:

```text

Mine\_Manager\_AI\_Fleet\_30\_Day\_Sample.xlsx

```

Confirm the first row contains:

```text

report\_date

truck\_id

availability

utilization

```

---

# 22. Invalid Percentage Values

## Affected fields

\- Fleet availability

\- Fleet utilization

\- Plant recovery

\- Safety score

## Accepted format

Numeric values from `0` to `100`.

Examples:

```text

90.0

88.7

94.6

```

Avoid:

```text

0.90

90%

ninety

```

unless the upload logic is intentionally changed.

---

# 23. Upload Succeeds but Dashboard Does Not Change

## Check

1\. Confirm the upload success message.

2\. Confirm Upload History.

3\. Confirm reporting dates.

4\. Confirm the mine assignment.

5\. Refresh the Dashboard.

6\. Confirm the latest database record.

7\. Check browser console.

8\. Check backend logs.

Database validation example:

```cmd

python -c "from sqlalchemy import text; from app.database import engine; tables=\['production\_daily','fleet\_daily','plant\_daily','safety\_daily']; conn=engine.connect(); \[print(t, conn.execute(text(f'SELECT MAX(report\_date) FROM {t}')).scalar()) for t in tables]; conn.close()"

```

---

# 24. Wrong Mine Assignment

## Symptom

Uploaded data appears under the wrong mine.

## Check

\- active company;

\- active mine;

\- configured mine name;

\- upload form value;

\- backend default mine.

Current backend default may be:

```text

Oyu Tolgoi Surface

```

Before customer use, verify the configured mine.

---

# 25. Duplicate Upload Concern

## Expected behavior

The upload process should update matching mine-and-date records rather than create uncontrolled duplicates.

## Validate

```cmd

python -c "from sqlalchemy import text; from app.database import engine; conn=engine.connect(); print(conn.execute(text(\\"SELECT COUNT(\*) FROM fleet\_daily WHERE report\_date BETWEEN '2026-07-01' AND '2026-07-30'\\")).scalar()); conn.close()"

```

Repeated upload of the same validated sample period should remain controlled.

Investigate unexpected count increases.

---

# 26. Workbook Does Not Open or Shows Repair Warning

## Cause

The workbook may be corrupt or contain unsupported content.

## Resolution

\- use the approved `.xlsx` templates;

\- remove macros;

\- remove password protection;

\- remove merged cells in the data area;

\- remove formulas from required columns;

\- save a clean copy;

\- retry.

---

# 27. Empty File or Worksheet

## Symptom

The upload page reports that the workbook is empty or unreadable.

## Resolution

Confirm:

\- the first worksheet exists;

\- row 1 contains headers;

\- data begins in row 2;

\- the file was saved correctly;

\- there are no hidden-only worksheets.

---

# 28. Dashboard Shows No Data

## Check

\- correct mine;

\- correct reporting date;

\- successful uploads;

\- database records;

\- API responses;

\- dashboard query parameters.

If no records exist, the system may display an empty summary.

---

# 29. Dashboard KPI Appears Incorrect

## Validate in this order

1\. Source workbook

2\. Upload result

3\. Database value

4\. KPI calculation

5\. Dashboard display

6\. Report output

Do not change KPI targets until the source data and calculation logic are confirmed.

---

# 30. AI Executive Insights Do Not Load

## Check

\- backend is available;

\- operational data exists;

\- authorized role;

\- AI endpoint is visible in Swagger;

\- external AI key is configured if required;

\- browser console;

\- backend logs.

The current system may generate some insights from internal logic even when external AI is unavailable.

Confirm the active implementation before troubleshooting provider keys.

---

# 31. Predictive Intelligence Does Not Load

## Check

\- historical data exists;

\- selected mine is correct;

\- prediction endpoint is available;

\- sufficient records exist;

\- browser console;

\- backend logs.

If there is insufficient history, the system should communicate the limitation rather than produce unsupported certainty.

---

# 32. AI Daily Briefing Button Does Not Generate a Briefing

## Current limitation

The Upload Reports page currently contains a placeholder button.

It displays a message indicating that the final AI Daily Briefing integration will be connected later.

## Action

Use:

\- Dashboard

\- AI Executive Insights

\- Predictive Intelligence

\- Executive Reports

Do not log this placeholder behavior as a defect unless the approved pilot scope requires the final integration.

---

# 33. Executive Action Cannot Be Created or Edited

## Check

Authorized roles generally include:

\- Superintendent

\- Mine Manager

\- General Manager

\- Administrator

Viewer accounts cannot perform protected write actions.

Confirm:

\- role;

\- authentication;

\- required fields;

\- backend route;

\- database connectivity.

---

# 34. Executive Report Does Not Download

## Check

\- authentication;

\- user role;

\- browser download permission;

\- backend report route;

\- database availability;

\- report-generation logs;

\- output filename.

Retry once after refreshing the page.

Do not repeatedly generate reports if the service is failing.

---

# 35. PDF Branding Is Incorrect

## Check Settings

\- company name;

\- mine name;

\- logo;

\- primary color;

\- secondary color.

Verify the logo exists under:

```text

backend\\app\\static\\logos

```

Verify the stored URL begins with:

```text

/static/logos/

```

---

# 36. Logo Does Not Display

## Check

\- file type is PNG, JPG, JPEG, or WEBP;

\- logo upload succeeded;

\- file exists;

\- backend exposes `/static`;

\- logo URL is correct;

\- browser cache.

Refresh using:

```text

Ctrl + F5

```

---

# 37. System Health Shows a Failure

## Review

\- affected component;

\- status message;

\- latency;

\- recent incidents;

\- service dependencies.

Common failures:

\- database unavailable;

\- external AI unavailable;

\- storage path unavailable;

\- backend degraded.

Resolve critical failures before pilot launch.

---

# 38. Security Center Warning

Common warnings include:

\- `DEBUG` not explicitly disabled;

\- secret key too weak or missing;

\- CORS not explicitly configured;

\- HTTPS not enforced;

\- Demo Mode enabled;

\- `LOG\_LEVEL` missing;

\- required directory missing.

Follow the recommendation shown in the Security Center.

Restart the backend after environment changes.

---

# 39. Demo Mode Problems

## Demo data does not load

Confirm:

\- user is General Manager or Administrator;

\- backend demo route is available;

\- database is connected;

\- selected scenario is valid.

## Demo reset fails

Administrator access may be required.

Confirm the intended mine before resetting data.

---

# 40. Audit Trail Does Not Show Expected Activity

## Check

\- user has Administrator access where required;

\- event type is implemented;

\- filters are not hiding results;

\- date range;

\- database connectivity.

Not every application action may currently generate an audit record.

Document gaps rather than assuming coverage.

---

# 41. Git Pager Shows `...skipping...`

## Cause

Git opened its pager because the output was long.

## Action

Press:

```text

q

```

To avoid the pager:

```cmd

git --no-pager diff --cached --name-only

```

or:

```cmd

git --no-pager log -1 --stat

```

---

# 42. Pasted Command Output Runs as Commands

## Symptom

Command Prompt tries to execute lines such as:

```text

Microsoft Windows \[Version ...]

C:\\Projects\\mine-manager-ai>

Folder PATH listing

```

## Cause

The previous terminal output was pasted back into Command Prompt.

## Resolution

Copy only the actual command inside a code block.

Do not copy:

\- the prompt;

\- previous output;

\- explanatory text.

---

# 43. Markdown File Contains `\#`

## Symptom

A Markdown file begins with:

```text

\# Mine Manager AI

```

## Cause

Escaped Markdown was pasted into Notepad.

## Fix one file

```cmd

powershell -NoProfile -Command "$file='pilot-package\\user-guides\\FILE.md'; $text=\[System.IO.File]::ReadAllText($file); $text=$text -replace '\\\#','#' -replace '\\\---','---'; \[System.IO.File]::WriteAllText((Resolve-Path $file),$text,(New-Object System.Text.UTF8Encoding($false)))"

```

Replace `FILE.md` with the actual filename.

---

# 44. Markdown File Has Excessive Blank Lines

## Fix

```cmd

powershell -NoProfile -Command "$file='pilot-package\\user-guides\\FILE.md'; $text=\[System.IO.File]::ReadAllText($file); $replacement=\[Environment]::NewLine+\[Environment]::NewLine; $text=$text -replace '(\\r?\\n){3,}',$replacement; \[System.IO.File]::WriteAllText((Resolve-Path $file),$text,(New-Object System.Text.UTF8Encoding($false)))"

```

---

# 45. CRLF Warning During Git Add

## Warning

```text

LF will be replaced by CRLF the next time Git touches it

```

## Meaning

Git is normalizing Windows line endings.

This is usually not a blocking error.

Confirm the file content is correct before committing.

---

# 46. Deployment Readiness Shows Blocking Failure

Do not proceed with pilot launch.

Review:

\- database;

\- secret key;

\- debug mode;

\- CORS;

\- HTTPS;

\- Demo Mode;

\- logging;

\- required tables;

\- required directories;

\- dependencies.

Resolve the blocking item and refresh the assessment.

---

# 47. Support Evidence Checklist

Collect:

\- exact error;

\- timestamp;

\- user role;

\- page;

\- company and mine;

\- screenshot;

\- browser console;

\- backend log excerpt;

\- System Health status;

\- Security Center status;

\- affected file name;

\- Git commit;

\- application version.

Do not collect or share secrets.

---

# 48. Escalation Priorities

## Critical

Examples:

\- unauthorized data access;

\- active security incident;

\- database corruption;

\- complete service outage;

\- materially incorrect executive data;

\- backup and restore failure during recovery.

## High

Examples:

\- all uploads failing;

\- login unavailable to all users;

\- reports unavailable;

\- Dashboard unavailable.

## Medium

Examples:

\- one module unavailable;

\- one user affected;

\- non-blocking data-display issue.

## Low

Examples:

\- minor visual issue;

\- documentation issue;

\- non-blocking enhancement request.

---

# 49. Final Recovery Check

After resolving an issue:

\- \[ ] Backend starts

\- \[ ] Frontend loads

\- \[ ] Login works

\- \[ ] Database connects

\- \[ ] Correct mine is displayed

\- \[ ] Upload works

\- \[ ] Dashboard loads

\- \[ ] Executive Actions load

\- \[ ] Reports generate

\- \[ ] System Health is acceptable

\- \[ ] Security Center has no new blocking failure

\- \[ ] Resolution is documented

---

# Revision History

| Version | Date | Description |

|---|---|---|

| 1.0 | August 2026 | Initial Troubleshooting Guide for Pilot Release |

---

\*\*End of Troubleshooting Guide\*\*

