# Mine Manager AI - Installation Guide

## 1. Purpose

This guide explains how to install, configure, start, and validate Mine
Manager AI Version 1.0 for local development and controlled customer
pilot environments.

The guide covers:

- PostgreSQL database setup
- FastAPI backend installation
- React frontend installation
- Environment configuration
- Database migrations
- Application startup
- Authentication validation
- Demo-data validation
- Upload validation
- System Health validation
- Security Configuration Center validation
- Common troubleshooting

This guide does not replace customer-specific infrastructure, security,
network, backup, or change-management requirements.

---

## 2. Product Scope

Mine Manager AI Version 1.0 is an executive operations intelligence and
decision-support platform.

Version 1.0 includes:

- Authentication
- Role-based access
- User Management
- Company and mine configuration
- Excel report upload
- Production monitoring
- Fleet monitoring
- Plant monitoring
- Safety monitoring
- Executive dashboard
- AI Executive Insights
- Predictive Intelligence
- Executive Actions
- Executive Reports
- PDF and Excel export
- Audit Trail
- System Health
- Security Configuration Center
- Deployment Readiness checks
- Demo Mode

Mine Manager AI Version 1.0 must not directly control:

- Mining equipment
- Processing-plant control systems
- Dispatch systems
- SCADA systems
- Autonomous equipment
- Safety-critical systems

All operational decisions remain the responsibility of authorized
customer personnel.

---

# 3. Validated Development Environment

The current validated Windows development environment is:

| Component | Validated Version |
|---|---|
| Operating system | Windows 10/11, 64-bit |
| Python | 3.11.9 |
| pip | 26.2 |
| Node.js | 22.23.2 |
| npm | 10.9.8 |
| PostgreSQL driver | psycopg2-binary 2.9.12 |
| SQLAlchemy | 2.0.51 |
| FastAPI | 0.128.8 |
| Uvicorn | 0.39.0 |
| React build tool | Vite |
| Database | PostgreSQL |
| Source-control tool | Git |

Other versions may work, but they should be tested before a customer
pilot.

---

# 4. Recommended Pilot Infrastructure

## 4.1 Minimum Pilot Resources

Recommended minimum for a small controlled pilot:

### Backend

- 2 virtual CPU cores
- 4 GB RAM
- 10 GB available disk
- Outbound HTTPS access where AI APIs are used

### Frontend

- Static hosting or Node-capable hosting
- HTTPS support
- 1 GB available disk is sufficient for build assets

### PostgreSQL

- 2 virtual CPU cores
- 4 GB RAM
- 20 GB storage
- Automated backup capability
- SSL support

These are minimum pilot recommendations, not final production sizing.

---

## 4.2 Recommended Production Resources

Initial production sizing should be based on:

- Number of mines
- Number of users
- Upload frequency
- Historical data volume
- Report-generation volume
- AI request volume
- Backup-retention period
- Expected availability target

A formal performance and capacity review should be completed before
large-scale production use.

---

# 5. Network and Security Requirements

Before installation, confirm:

- Frontend domain is available
- Backend API domain is available
- PostgreSQL access is available
- HTTPS certificates are available
- Required firewall rules are approved
- Customer VPN requirements are understood
- IP restrictions are understood
- DNS records are available
- CORS origins are approved
- Secret-storage method is approved
- Backup-storage method is approved

For external customer pilots:

- Frontend must use HTTPS
- Backend must use HTTPS
- Wildcard CORS must not be used
- Debug mode must be disabled
- Demo Mode should normally be disabled
- Production-quality secret keys must be used

---

# 6. Repository Location

Validated Windows project path:

```text
C:\Projects\mine-manager-ai
```

Main directories:

```text
C:\Projects\mine-manager-ai\backend
C:\Projects\mine-manager-ai\frontend
C:\Projects\mine-manager-ai\pilot-package
```

---

# 7. Obtain the Source Code

## 7.1 Clone the repository

Open Command Prompt:

```cmd
cd C:\Projects
```

Clone:

```cmd
git clone https://github.com/DataAnalystBay/mine-manager-ai.git
```

Open the project:

```cmd
cd C:\Projects\mine-manager-ai
```

Check the current branch:

```cmd
git branch --show-current
```

For a customer pilot, deploy only an approved release branch or approved
release tag.

Do not deploy directly from an unreviewed development branch.

---

## 7.2 Existing local copy

For an existing installation:

```cmd
cd C:\Projects\mine-manager-ai

git status
```

Do not pull changes while uncommitted deployment modifications are
present.

Recommended update workflow:

```cmd
git fetch origin
git status
git log --oneline --decorate -5
```

Then switch only to the approved branch or tag.

---

# 8. PostgreSQL Setup

## 8.1 Create the database

Using PostgreSQL administration tools, create:

```text
mine_manager_ai
```

Example SQL:

```sql
CREATE DATABASE mine_manager_ai;
```

---

## 8.2 Create an application user

Example:

```sql
CREATE USER mine_manager_app
WITH PASSWORD 'replace-with-secure-password';
```

Grant database access:

```sql
GRANT ALL PRIVILEGES
ON DATABASE mine_manager_ai
TO mine_manager_app;
```

Additional schema privileges may be required depending on the PostgreSQL
version and migration process.

Avoid using the PostgreSQL superuser for routine application access.

---

## 8.3 SSL requirement

The current backend database engine explicitly uses:

```text
sslmode=require
```

The PostgreSQL service must support SSL.

For managed PostgreSQL services such as Azure Database for PostgreSQL,
SSL is normally available.

A local PostgreSQL instance without SSL may fail until either:

- local SSL is configured, or
- the database engine implementation is intentionally changed

Do not remove SSL requirements from customer deployments without security
approval.

---

# 9. Backend Installation

## 9.1 Open the backend directory

```cmd
cd C:\Projects\mine-manager-ai\backend
```

---

## 9.2 Create a Python virtual environment

If the environment does not exist:

```cmd
python -m venv venv
```

Activate it:

```cmd
venv\Scripts\activate.bat
```

Expected prompt:

```text
(venv) C:\Projects\mine-manager-ai\backend>
```

Verify Python:

```cmd
python --version
```

Validated version:

```text
Python 3.11.9
```

Verify the active Python path:

```cmd
where python
```

The first result must be:

```text
C:\Projects\mine-manager-ai\backend\venv\Scripts\python.exe
```

---

## 9.3 Upgrade pip

```cmd
python -m pip install --upgrade pip
```

Verify:

```cmd
python -m pip --version
```

---

## 9.4 Install backend dependencies

```cmd
python -m pip install -r requirements.txt
```

Verify SQLAlchemy:

```cmd
python -m pip show sqlalchemy
```

Verify FastAPI:

```cmd
python -m pip show fastapi
```

Verify Uvicorn:

```cmd
python -m pip show uvicorn
```

Capture the installed environment when required:

```cmd
python -m pip freeze
```

---

# 10. Backend Environment Configuration

## 10.1 Create `.env`

Create:

```text
C:\Projects\mine-manager-ai\backend\.env
```

Use the deployment-specific values defined in:

```text
pilot-package\deployment\ENVIRONMENT_VARIABLES.md
```

Minimum required variables:

```dotenv
APP_ENV=pilot
APP_VERSION=1.0.0
DEBUG=false

DB_HOST=your-postgresql-host
DB_PORT=5432
DB_NAME=mine_manager_ai
DB_USER=your-database-user
DB_PASSWORD=replace-with-secure-password
DB_SSLMODE=require

SECRET_KEY=replace-with-secure-random-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

CORS_ORIGINS=https://approved-frontend-domain
FORCE_HTTPS=true

DEMO_MODE=false
LOG_LEVEL=INFO
```

Do not commit `.env`.

---

## 10.2 Generate a secure secret

```cmd
python -c "import secrets; print(secrets.token_hex(64))"
```

Copy the result securely into:

```dotenv
SECRET_KEY=
```

Do not paste the production secret into documentation, Git, email, or
chat.

---

## 10.3 Validate required variables safely

```cmd
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('DB_HOST configured:', bool(os.getenv('DB_HOST'))); print('DB_NAME configured:', bool(os.getenv('DB_NAME'))); print('DB_USER configured:', bool(os.getenv('DB_USER'))); print('DB_PASSWORD configured:', bool(os.getenv('DB_PASSWORD'))); print('SECRET_KEY configured:', bool(os.getenv('SECRET_KEY') or os.getenv('JWT_SECRET_KEY')))"
```

Expected:

```text
DB_HOST configured: True
DB_NAME configured: True
DB_USER configured: True
DB_PASSWORD configured: True
SECRET_KEY configured: True
```

---

# 11. Database Connectivity Test

Run:

```cmd
python -c "from sqlalchemy import text; from app.database import engine; connection=engine.connect(); print('Database connection successful:', connection.execute(text('SELECT 1')).scalar()); connection.close()"
```

Expected:

```text
Database connection successful: 1
```

If this fails, verify:

- Database host
- Port
- Database name
- Username
- Password
- Network access
- SSL support
- Firewall rules

---

# 12. Database Migrations

## 12.1 Confirm Alembic

From the backend directory:

```cmd
dir /B alembic.ini
dir /B alembic
```

If both are present, check status:

```cmd
alembic current
alembic heads
```

---

## 12.2 Apply migrations

Apply all approved migrations:

```cmd
alembic upgrade head
```

Verify:

```cmd
alembic current
```

The active revision should match the approved head revision.

Do not use automatic table creation as a replacement for controlled
migration management.

---

## 12.3 Migration safety

Before applying migrations to a customer environment:

- Complete a database backup
- Review the migration scripts
- Confirm the target environment
- Confirm the active branch or release tag
- Confirm rollback or restore procedure
- Record the current revision
- Record the target revision
- Obtain change approval where required

---

# 13. Required Backend Directories

The backend uses directories including:

```text
backend\app\static
backend\app\static\logos
backend\uploads
```

Verify:

```cmd
dir app\static
dir app\static\logos
dir uploads
```

Create missing directories if required:

```cmd
mkdir app\static
mkdir app\static\logos
mkdir uploads
```

If a directory already exists, Windows will report that it already exists.

---

# 14. Start the Backend

## 14.1 Development mode

```cmd
cd C:\Projects\mine-manager-ai\backend

venv\Scripts\activate.bat

uvicorn app.main:app --reload
```

Default backend URL:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

---

## 14.2 Pilot or production process

Do not use `--reload` for customer pilot or production deployments.

Example:

```cmd
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

A process manager, Windows service, container platform, or cloud service
should manage restarts and availability.

The final production command depends on the selected hosting platform.

---

# 15. Backend Route Verification

The backend currently registers routers for:

- Authentication
- Users
- Audit logs
- Configuration
- Production
- Analytics
- AI
- Briefing
- Upload
- Dashboard
- Demo
- Reports
- Executive Actions
- Executive Recommendations
- Executive Insights
- Executive KPI PDF
- System Health
- Predictions
- Deployment Readiness

Open Swagger:

```text
http://127.0.0.1:8000/docs
```

Confirm required routes are visible.

---

# 16. Frontend Installation

## 16.1 Open the frontend directory

```cmd
cd C:\Projects\mine-manager-ai\frontend
```

---

## 16.2 Verify Node.js and npm

```cmd
node --version
npm --version
```

Validated versions:

```text
Node.js v22.23.2
npm 10.9.8
```

---

## 16.3 Install dependencies

```cmd
npm install
```

For repeatable CI or approved deployment builds, use:

```cmd
npm ci
```

`npm ci` requires a valid lock file and installs the exact locked
dependency versions.

---

## 16.4 Review scripts

```cmd
type package.json
```

Typical Vite commands include:

```cmd
npm run dev
npm run build
npm run preview
```

Use only scripts that exist in `package.json`.

---

# 17. Frontend Environment Configuration

Create:

```text
C:\Projects\mine-manager-ai\frontend\.env
```

Local example:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Pilot example:

```dotenv
VITE_API_BASE_URL=https://api-pilot.example.com
```

Do not include a trailing slash.

The frontend defaults to:

```text
http://127.0.0.1:8000
```

when `VITE_API_BASE_URL` is not configured.

---

# 18. Start the Frontend

## 18.1 Development mode

```cmd
cd C:\Projects\mine-manager-ai\frontend

npm run dev
```

Typical Vite URL:

```text
http://localhost:5173
```

If the port is already in use, Vite may select:

```text
http://localhost:5174
```

or:

```text
http://localhost:5175
```

This is normal for local development.

The selected origin must be allowed by backend CORS configuration.

---

# 19. Build the Frontend

Create a production build:

```cmd
npm run build
```

Expected output directory:

```text
frontend\dist
```

Test the build locally:

```cmd
npm run preview
```

Vite environment variables are embedded during build time.

After changing `VITE_API_BASE_URL`, rebuild the frontend.

---

# 20. Reverse Proxy and HTTPS

For external pilots, use an HTTPS-capable hosting platform or reverse
proxy.

Typical architecture:

```text
User Browser
    |
    | HTTPS
    v
Frontend Hosting
    |
    | HTTPS API requests
    v
Reverse Proxy or Backend Service
    |
    v
FastAPI
    |
    | SSL PostgreSQL connection
    v
PostgreSQL
```

The reverse proxy should:

- Terminate HTTPS
- Forward requests to FastAPI
- Preserve required headers
- Enforce request-size limits
- Apply timeout rules
- Record access logs
- Restrict unapproved origins
- Support health checks

Customer infrastructure requirements determine the exact configuration.

---

# 21. Initial Application Validation

## 21.1 Open the frontend

Open the configured frontend URL.

Confirm the Login page loads.

---

## 21.2 Authenticate

Use an approved administrator account.

Confirm:

- Login succeeds
- Invalid credentials are rejected
- Protected routes redirect unauthenticated users
- JWT token is stored as designed
- Logout works

---

## 21.3 Verify User Management

Confirm an Administrator can:

- View users
- Create a user
- Assign a role
- Edit a user
- Disable a user

Do not use shared accounts for customer pilots.

---

# 22. Configuration Validation

Open Settings and verify:

- Company name
- Mine name
- Company logo
- Primary color
- Secondary color
- Timezone
- Language
- Shift pattern
- KPI targets
- Alert thresholds

Confirm the dashboard and reports display the correct branding.

---

# 23. System Health Validation

Open:

```text
System Health
```

Verify:

- Backend health
- Database health
- AI-service health where configured
- Storage health
- Latency status
- Recent incidents
- Health trend

Resolve critical failures before pilot launch.

---

# 24. Security Configuration Center Validation

Open:

```text
Security Center
```

Verify:

- Deployment readiness score
- Passed checks
- Warnings
- Failed checks
- Secret-key configuration
- Debug mode
- Database configuration
- CORS
- HTTPS expectation
- Logging
- Demo Mode
- Required directories
- Dependencies

A customer pilot must have no unresolved blocking failures.

---

# 25. Demo Data Validation

If Demo Mode is intentionally enabled for local validation:

- Open the Demo controls
- Load a demo scenario
- Confirm dashboard data appears
- Confirm Production, Fleet, Plant, and Safety data appear
- Confirm Executive Insights load
- Confirm Predictive Intelligence loads
- Reset demo data when testing is complete

Demo Mode should normally be disabled before using customer operational
data.

---

# 26. Pilot Dataset Upload Validation

Use the approved files under:

```text
pilot-package\data\demo
```

Upload:

```text
Mine_Manager_AI_Production_30_Day_Sample.xlsx
Mine_Manager_AI_Fleet_30_Day_Sample.xlsx
Mine_Manager_AI_Plant_30_Day_Sample.xlsx
Mine_Manager_AI_Safety_30_Day_Sample.xlsx
```

Confirm:

- Authentication is valid
- Required columns pass validation
- Upload succeeds
- Thirty records appear for each data area
- No uncontrolled duplicates are created
- Dashboard values update
- Upload history records the operation

---

# 27. Database Data Validation

From the backend virtual environment:

```cmd
python -c "from sqlalchemy import text; from app.database import engine; tables=['production_daily','fleet_daily','plant_daily','safety_daily']; conn=engine.connect(); [print(t, conn.execute(text(f'SELECT COUNT(*) FROM {t}')).scalar()) for t in tables]; conn.close()"
```

Validate reporting periods:

```cmd
python -c "from sqlalchemy import text; from app.database import engine; tables=['production_daily','fleet_daily','plant_daily','safety_daily']; conn=engine.connect(); [print(t, conn.execute(text(f'SELECT MIN(report_date), MAX(report_date) FROM {t}')).fetchone()) for t in tables]; conn.close()"
```

---

# 28. Executive Dashboard Validation

Confirm:

- Dashboard loads without API errors
- Mine Health is visible
- Production KPIs are visible
- Fleet KPIs are visible
- Plant KPIs are visible
- Safety KPIs are visible
- Trend charts load
- Risk information loads
- Priority actions load
- AI Executive Insights load
- Predictive Intelligence loads

---

# 29. Executive Reports Validation

Validate:

- Daily Executive Report PDF
- Weekly Operations Report PDF
- Monthly KPI Pack PDF
- Excel export
- Company branding
- Mine name
- Reporting period
- KPI accuracy
- Report download
- Report history

Store generated test reports only in an approved test location.

---

# 30. Audit Trail Validation

Verify that relevant activities appear in the Audit Trail:

- Login
- User-management activity
- Configuration changes
- Upload activity
- Executive actions
- Report activity
- Security-relevant activity

Confirm audit records do not expose secrets.

---

# 31. Backup Validation

Before pilot launch:

- Complete a database backup
- Record backup date and time
- Record responsible owner
- Verify backup file location
- Confirm backup access restrictions
- Perform a test restore where approved

Detailed procedures are maintained in:

```text
pilot-package\operations\BACKUP_RESTORE_GUIDE.md
```

---

# 32. Final Deployment Readiness Test

Before pilot launch, verify:

- Backend available
- Frontend available
- Database connected
- HTTPS working
- CORS correct
- Authentication working
- Required roles working
- Debug disabled
- Strong secret configured
- Demo Mode configured correctly
- Logging configured
- Backup completed
- System Health acceptable
- Security Center has no blocking failures
- Sample upload succeeds
- Dashboard validates
- Reports generate
- Support contact assigned

---

# 33. Troubleshooting

## 33.1 `ModuleNotFoundError`

Example:

```text
ModuleNotFoundError: No module named 'sqlalchemy'
```

Resolution:

Activate the correct virtual environment:

```cmd
cd C:\Projects\mine-manager-ai\backend

venv\Scripts\activate.bat

where python

python -m pip show sqlalchemy
```

The first Python path must point to the backend virtual environment.

---

## 33.2 Database connection failure

Check:

```cmd
python -c "from sqlalchemy import text; from app.database import engine; connection=engine.connect(); print(connection.execute(text('SELECT 1')).scalar()); connection.close()"
```

Review:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- SSL support
- Firewall rules
- Database status

---

## 33.3 Missing JWT secret

Error:

```text
Missing JWT secret. Set SECRET_KEY or JWT_SECRET_KEY.
```

Add a secure value to backend `.env` and restart FastAPI.

---

## 33.4 Not authenticated during upload

Confirm the user is logged in.

The frontend upload request must include:

```text
Authorization: Bearer <access_token>
```

Log out and log back in if the session has expired.

---

## 33.5 CORS browser error

Confirm:

```dotenv
CORS_ORIGINS=https://approved-frontend-domain
```

Verify the backend CORS middleware uses the configured origins.

Restart the backend.

---

## 33.6 Frontend calls the wrong backend

Confirm:

```dotenv
VITE_API_BASE_URL=https://correct-api-domain
```

Restart development mode or rebuild:

```cmd
npm run build
```

---

## 33.7 Port already in use

Vite may move from port `5173` to `5174` or `5175`.

For FastAPI, find the process using port 8000:

```cmd
netstat -ano | findstr :8000
```

Stop only the correct process after confirming its identity.

---

## 33.8 Upload missing columns

Compare the workbook header with the approved schema:

### Production

```text
report_date
ore_plan
ore_actual
waste_plan
waste_actual
```

### Fleet

```text
report_date
truck_id
availability
utilization
```

### Plant

```text
report_date
throughput_plan
throughput_actual
recovery
```

### Safety

```text
report_date
incidents
near_misses
critical_risks
safety_score
```

---

## 33.9 Static logo does not display

Verify:

```text
backend\app\static\logos
```

Confirm the backend exposes:

```text
/static
```

Confirm the stored logo URL begins with:

```text
/static/logos/
```

---

# 34. Rollback Guidance

If deployment validation fails:

1. Stop the affected application process.
2. Preserve logs and error details.
3. Confirm the release version.
4. Restore the previous frontend build if required.
5. Restore the previous backend release if required.
6. Restore the database from the approved backup if required.
7. Reapply the previous environment configuration.
8. Validate authentication.
9. Validate database connectivity.
10. Record the incident and rollback outcome.

Do not perform destructive database rollback without an approved backup
and responsible technical owner.

---

# 35. Deployment Evidence

Record:

| Evidence | Location | Status |
|---|---|---|
| Python environment | deployment/validation/python_environment.txt | Complete |
| Node environment | deployment/validation/node_environment.txt | Complete |
| Backend dependencies | deployment/validation/backend_dependencies.txt | Complete |
| Frontend dependencies | deployment/validation/frontend_dependencies.txt | Complete |
| Environment inventory | deployment/validation/environment_variable_inventory.txt | Complete |
| Router inventory | deployment/validation/router_inventory.txt | Complete |
| Alembic status | deployment/validation/alembic_status.txt | Pending validation |
| Deployment checklist | deployment/DEPLOYMENT_CHECKLIST.md | Pending completion |

---

# 36. Final Approval

| Role | Name | Date | Status |
|---|---|---|---|
| Technical Deployment Lead | | | Pending |
| Customer IT Representative | | | Pending |
| Customer Security Representative | | | Pending |
| Pilot Delivery Lead | | | Pending |