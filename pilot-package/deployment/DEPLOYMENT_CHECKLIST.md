# Mine Manager AI - Deployment Checklist

## 1. Purpose

This checklist confirms that Mine Manager AI Version 1.0 has been
installed, configured, secured, validated, and approved for a controlled
customer pilot.

Complete this checklist before pilot launch.

Do not mark an item complete unless supporting evidence exists.

---

# 2. Deployment Information

| Item | Value |
|---|---|
| Product | Mine Manager AI |
| Version | 1.0 |
| Environment | Development / Pilot / Production |
| Customer | |
| Mine | |
| Deployment date | |
| Deployment owner | |
| Technical lead | |
| Customer IT contact | |
| Customer security contact | |
| Frontend URL | |
| Backend API URL | |
| Database host | |
| Release branch or tag | |
| Git commit | |

---

# 3. Scope Confirmation

- [ ] Pilot objective is approved
- [ ] Pilot mine is approved
- [ ] Pilot duration is approved
- [ ] Pilot users are identified
- [ ] In-scope features are documented
- [ ] Out-of-scope features are documented
- [ ] Customer data owners are identified
- [ ] Customer support contacts are identified
- [ ] Customer success criteria are approved
- [ ] Pilot agreement or approval is complete

---

# 4. Infrastructure Readiness

## Backend

- [ ] Backend hosting environment is available
- [ ] Backend CPU is sufficient
- [ ] Backend memory is sufficient
- [ ] Backend disk capacity is sufficient
- [ ] Backend outbound network access is approved
- [ ] Backend inbound network access is restricted appropriately
- [ ] Port configuration is approved
- [ ] Process restart method is defined
- [ ] Service availability monitoring is defined

## Frontend

- [ ] Frontend hosting environment is available
- [ ] Frontend domain is configured
- [ ] Frontend HTTPS certificate is valid
- [ ] Static build hosting is configured
- [ ] Frontend deployment path is documented
- [ ] Frontend rollback build is available

## Database

- [ ] PostgreSQL service is available
- [ ] Database storage is sufficient
- [ ] Database SSL is supported
- [ ] Database firewall access is approved
- [ ] Application database exists
- [ ] Application database user exists
- [ ] Application user permissions are appropriate
- [ ] Database superuser is not used for routine application access
- [ ] Automated database backup capability is available

---

# 5. Source-Control Readiness

- [ ] Approved branch or release tag is selected
- [ ] Approved Git commit is recorded
- [ ] Working tree is reviewed
- [ ] No uncommitted deployment changes remain
- [ ] No sensitive files are committed
- [ ] `.env` is excluded from Git
- [ ] Database credentials are excluded from Git
- [ ] Secret keys are excluded from Git
- [ ] API keys are excluded from Git
- [ ] Backup files are excluded from Git
- [ ] Previous approved release is available for rollback

Recommended commands:

```cmd
git branch --show-current
git status
git log -1 --oneline
git check-ignore backend\.env
git check-ignore frontend\.env
```

---

# 6. Backend Runtime

- [ ] Python is installed
- [ ] Python version is verified
- [ ] Python virtual environment exists
- [ ] Virtual environment activates successfully
- [ ] Active Python path points to backend virtual environment
- [ ] pip is available
- [ ] `requirements.txt` exists
- [ ] Backend dependencies install successfully
- [ ] FastAPI is installed
- [ ] Uvicorn is installed
- [ ] SQLAlchemy is installed
- [ ] PostgreSQL driver is installed
- [ ] Alembic is installed

Validated development version:

```text
Python 3.11.9
```

Verification:

```cmd
cd C:\Projects\mine-manager-ai\backend

venv\Scripts\activate.bat

python --version
where python
python -m pip --version
python -m pip show fastapi
python -m pip show uvicorn
python -m pip show sqlalchemy
python -m pip show psycopg2-binary
python -m pip show alembic
```

---

# 7. Frontend Runtime

- [ ] Node.js is installed
- [ ] Node.js version is verified
- [ ] npm is installed
- [ ] npm version is verified
- [ ] `package.json` exists
- [ ] Lock file exists
- [ ] Frontend dependencies install successfully
- [ ] Development server starts
- [ ] Production build succeeds
- [ ] Production build output exists
- [ ] Preview build loads successfully

Validated development versions:

```text
Node.js v22.23.2
npm 10.9.8
```

Verification:

```cmd
cd C:\Projects\mine-manager-ai\frontend

node --version
npm --version
npm install
npm run build
```

---

# 8. Backend Environment Variables

## Application

- [ ] `APP_ENV` is configured
- [ ] `APP_VERSION` is configured
- [ ] `DEBUG` is configured
- [ ] `DEBUG=false` for pilot or production

## Database

- [ ] `DB_HOST` is configured
- [ ] `DB_PORT` is configured
- [ ] `DB_NAME` is configured
- [ ] `DB_USER` is configured
- [ ] `DB_PASSWORD` is configured
- [ ] `DB_SSLMODE=require` is documented
- [ ] Database credentials are stored securely

## Authentication

- [ ] `SECRET_KEY` or `JWT_SECRET_KEY` is configured
- [ ] Secret key is securely generated
- [ ] Secret key is not reused from development
- [ ] `ALGORITHM=HS256` is reviewed
- [ ] `ACCESS_TOKEN_EXPIRE_MINUTES` is approved

## CORS and HTTPS

- [ ] `CORS_ORIGINS` is configured
- [ ] Wildcard CORS is not used
- [ ] Localhost origins are removed for external pilot
- [ ] Approved frontend HTTPS domain is included
- [ ] `FORCE_HTTPS=true` for external pilot

## Demo Mode and Logging

- [ ] `DEMO_MODE` is explicitly configured
- [ ] Demo Mode is disabled before customer-data use
- [ ] `LOG_LEVEL` is configured
- [ ] `LOG_LEVEL=INFO` or `WARNING` for pilot
- [ ] Logs do not expose secrets

## External AI Services

- [ ] OpenAI provider requirement is reviewed
- [ ] Azure OpenAI provider requirement is reviewed
- [ ] Required AI key is configured securely
- [ ] API cost controls are defined
- [ ] Missing AI key behavior is tested
- [ ] Customer approval for external AI processing is obtained where required

---

# 9. Frontend Environment Variables

- [ ] Frontend `.env` or platform variable is configured
- [ ] `VITE_API_BASE_URL` points to the approved backend
- [ ] Backend URL has no incorrect trailing path
- [ ] HTTPS is used for external deployment
- [ ] Frontend is rebuilt after environment changes
- [ ] Frontend API calls reach the correct backend
- [ ] Frontend domain is approved in backend CORS

Example:

```dotenv
VITE_API_BASE_URL=https://api-pilot.example.com
```

---

# 10. Database Connectivity

- [ ] Database DNS resolves
- [ ] Database port is reachable
- [ ] Database credentials authenticate
- [ ] SSL connection succeeds
- [ ] SQLAlchemy engine connects
- [ ] `SELECT 1` succeeds
- [ ] Connection pool is healthy
- [ ] Database reconnect behavior is tested

Verification:

```cmd
cd C:\Projects\mine-manager-ai\backend

venv\Scripts\activate.bat

python -c "from sqlalchemy import text; from app.database import engine; connection=engine.connect(); print(connection.execute(text('SELECT 1')).scalar()); connection.close()"
```

Expected:

```text
1
```

---

# 11. Database Migration Readiness

- [ ] `alembic.ini` exists
- [ ] Alembic migration directory exists
- [ ] Current revision is recorded
- [ ] Head revision is recorded
- [ ] Migration scripts are reviewed
- [ ] Backup exists before migration
- [ ] Migration approval is obtained
- [ ] `alembic upgrade head` succeeds
- [ ] Current revision matches head
- [ ] Application starts after migration
- [ ] Rollback or restore procedure is documented

Verification:

```cmd
alembic current
alembic heads
alembic upgrade head
alembic current
```

---

# 12. Required Directories

- [ ] `backend\app\static` exists
- [ ] `backend\app\static\logos` exists
- [ ] `backend\uploads` exists
- [ ] Application can write to approved upload directory
- [ ] Application can write to approved logo directory
- [ ] Directory permissions are restricted appropriately
- [ ] Customer upload retention is defined
- [ ] Temporary file cleanup is defined

Verification:

```cmd
cd C:\Projects\mine-manager-ai\backend

dir app\static
dir app\static\logos
dir uploads
```

---

# 13. Backend Startup

## Development Validation

- [ ] Backend starts using Uvicorn
- [ ] No import errors occur
- [ ] No missing environment-variable error occurs
- [ ] No database connection error occurs
- [ ] Swagger loads
- [ ] Required routers are visible

Command:

```cmd
uvicorn app.main:app --reload
```

## Pilot or Production

- [ ] `--reload` is not used
- [ ] Backend binds to approved host and port
- [ ] Process manager or service is configured
- [ ] Automatic restart is configured
- [ ] Service logs are available
- [ ] Service account permissions are appropriate

Example:

```cmd
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

# 14. Router Validation

Confirm Swagger includes routes for:

- [ ] Authentication
- [ ] Users
- [ ] Audit logs
- [ ] Configuration
- [ ] Production
- [ ] Analytics
- [ ] AI
- [ ] Briefing
- [ ] Upload
- [ ] Dashboard
- [ ] Demo
- [ ] Reports
- [ ] Executive Actions
- [ ] Executive Recommendations
- [ ] Executive Insights
- [ ] Executive KPI PDF
- [ ] System Health
- [ ] Predictions
- [ ] Deployment Readiness

Swagger URL:

```text
http://127.0.0.1:8000/docs
```

---

# 15. Frontend Startup

- [ ] Frontend development server starts
- [ ] Login page loads
- [ ] No JavaScript compilation errors occur
- [ ] No unresolved module errors occur
- [ ] API base URL is correct
- [ ] Frontend routes work
- [ ] Browser refresh works on protected pages
- [ ] Production build succeeds
- [ ] Build assets load correctly

Commands:

```cmd
cd C:\Projects\mine-manager-ai\frontend

npm run dev
npm run build
```

---

# 16. Authentication Validation

- [ ] Approved administrator account exists
- [ ] Valid login succeeds
- [ ] Invalid login is rejected
- [ ] Missing token is rejected
- [ ] Expired token is rejected
- [ ] Protected pages require authentication
- [ ] Protected APIs require authentication
- [ ] Logout clears the session
- [ ] Disabled user cannot log in
- [ ] Passwords are hashed
- [ ] JWT secret is not exposed
- [ ] Authentication errors are understandable

---

# 17. Role-Based Access Validation

Validate each approved role:

## Administrator

- [ ] Can access User Management
- [ ] Can access Audit Trail
- [ ] Can access System Health
- [ ] Can access Security Center
- [ ] Can update configuration
- [ ] Can upload operational data
- [ ] Can access executive features

## General Manager

- [ ] Can access approved executive features
- [ ] Can access approved configuration features
- [ ] Cannot perform unauthorized administrator-only actions

## Mine Manager

- [ ] Can access dashboard
- [ ] Can access operational data
- [ ] Can access Executive Actions
- [ ] Can access reports
- [ ] Cannot perform unauthorized administrator actions

## Superintendent

- [ ] Can access approved operational features
- [ ] Can upload data where approved
- [ ] Cannot access restricted administration functions

## Viewer

- [ ] Can view approved information
- [ ] Cannot modify configuration
- [ ] Cannot manage users
- [ ] Cannot perform unauthorized write actions

---

# 18. Customer Configuration

- [ ] Company name is configured
- [ ] Mine name is configured
- [ ] Mine location is configured
- [ ] Mine type is configured
- [ ] Company logo is uploaded
- [ ] Logo displays correctly
- [ ] Primary color is configured
- [ ] Secondary color is configured
- [ ] Timezone is configured
- [ ] Language is configured
- [ ] Shift pattern is configured
- [ ] Reporting calendar is configured
- [ ] KPI targets are configured
- [ ] Alert thresholds are configured

---

# 19. Company Logo Validation

- [ ] Logo file type is approved
- [ ] Logo extension is approved
- [ ] Logo uploads successfully
- [ ] Logo file is stored in `app\static\logos`
- [ ] Logo URL begins with `/static/logos/`
- [ ] Logo displays in application header
- [ ] Logo displays in reports where required
- [ ] Invalid file types are rejected
- [ ] Logo upload requires authorized role

Supported types:

- PNG
- JPG
- JPEG
- WEBP

---

# 20. Pilot Dataset Validation

Approved sample files:

- [ ] Production sample exists
- [ ] Fleet sample exists
- [ ] Plant sample exists
- [ ] Safety sample exists
- [ ] Production template exists
- [ ] Fleet template exists
- [ ] Plant template exists
- [ ] Safety template exists

Approved schemas:

## Production

- [ ] `report_date`
- [ ] `ore_plan`
- [ ] `ore_actual`
- [ ] `waste_plan`
- [ ] `waste_actual`

## Fleet

- [ ] `report_date`
- [ ] `truck_id`
- [ ] `availability`
- [ ] `utilization`

## Plant

- [ ] `report_date`
- [ ] `throughput_plan`
- [ ] `throughput_actual`
- [ ] `recovery`

## Safety

- [ ] `report_date`
- [ ] `incidents`
- [ ] `near_misses`
- [ ] `critical_risks`
- [ ] `safety_score`

---

# 21. Upload Workflow Validation

- [ ] Production upload succeeds
- [ ] Fleet upload succeeds
- [ ] Plant upload succeeds
- [ ] Safety upload succeeds
- [ ] JWT token is sent with upload requests
- [ ] Missing columns are rejected
- [ ] Empty files are rejected
- [ ] Invalid values are rejected
- [ ] Unsupported file type is rejected
- [ ] Duplicate behavior is correct
- [ ] Upload history records successful uploads
- [ ] Upload errors are understandable
- [ ] Customer data is assigned to the correct mine

---

# 22. Database Data Validation

- [ ] Production records exist
- [ ] Fleet records exist
- [ ] Plant records exist
- [ ] Safety records exist
- [ ] Reporting dates are correct
- [ ] Mine assignment is correct
- [ ] Numeric values are correct
- [ ] Duplicate records are controlled
- [ ] Latest record is correct
- [ ] Historical range is correct

Example validation:

```cmd
python -c "from sqlalchemy import text; from app.database import engine; tables=['production_daily','fleet_daily','plant_daily','safety_daily']; conn=engine.connect(); [print(t, conn.execute(text(f'SELECT COUNT(*) FROM {t}')).scalar()) for t in tables]; conn.close()"
```

---

# 23. Dashboard Validation

- [ ] Dashboard loads without API error
- [ ] Correct company is displayed
- [ ] Correct mine is displayed
- [ ] Mine Health is displayed
- [ ] Production KPI is displayed
- [ ] Fleet KPI is displayed
- [ ] Plant KPI is displayed
- [ ] Safety KPI is displayed
- [ ] Trend charts load
- [ ] Reporting date is clear
- [ ] Risk information loads
- [ ] Priority Actions load
- [ ] AI Executive Insights load
- [ ] Predictive Intelligence loads
- [ ] No demo data is mistaken for customer data

---

# 24. Executive Action Validation

- [ ] Authorized user can create an action
- [ ] Authorized user can edit an action
- [ ] Action status can be changed
- [ ] Owner can be assigned
- [ ] Timing can be recorded
- [ ] KPI context can be linked
- [ ] Unauthorized user is restricted
- [ ] Relevant changes appear in Audit Trail

---

# 25. Executive Report Validation

- [ ] Daily Executive Report generates
- [ ] Weekly Operations Report generates
- [ ] Monthly KPI Pack generates
- [ ] PDF downloads successfully
- [ ] Excel export downloads successfully
- [ ] Correct company branding appears
- [ ] Correct mine appears
- [ ] Correct reporting period appears
- [ ] KPI values match the database
- [ ] KPI values match the dashboard
- [ ] Confidentiality text is correct
- [ ] Report history records generated reports
- [ ] Regeneration produces consistent results

---

# 26. AI Executive Insight Validation

- [ ] Insight loads
- [ ] Insight uses available operational data
- [ ] KPI movement is referenced correctly
- [ ] Risk statement is understandable
- [ ] Recommendation is actionable
- [ ] Confidence is represented appropriately
- [ ] Unsupported certainty is avoided
- [ ] Missing AI service is handled gracefully
- [ ] Customer understands human oversight requirement

---

# 27. Predictive Intelligence Validation

- [ ] Forecasts load
- [ ] Forecast horizon is visible
- [ ] Confidence is visible
- [ ] Trend direction is understandable
- [ ] Historical data is used
- [ ] Insufficient data is handled clearly
- [ ] Forecast does not trigger automated control
- [ ] Customer understands prediction limitations

---

# 28. Audit Trail Validation

- [ ] Login events appear where designed
- [ ] User-management activity appears
- [ ] Configuration changes appear
- [ ] Upload activity appears
- [ ] Executive Action activity appears
- [ ] Report activity appears
- [ ] Security-relevant activity appears
- [ ] Filters work
- [ ] Export works where available
- [ ] Secrets are not stored in audit records
- [ ] Retention requirement is documented

---

# 29. System Health Validation

- [ ] System Health page loads
- [ ] Backend status is visible
- [ ] Database status is visible
- [ ] AI-service status is visible where configured
- [ ] Storage status is visible
- [ ] Latency is visible
- [ ] Health history is visible
- [ ] Incidents are recorded
- [ ] Refresh works
- [ ] No unresolved critical failure remains

---

# 30. Security Configuration Center

- [ ] Security Center loads
- [ ] Readiness score is visible
- [ ] Passed count is visible
- [ ] Warning count is visible
- [ ] Failed count is visible
- [ ] Database configuration check passes
- [ ] Secret key check passes
- [ ] Debug-mode check passes
- [ ] CORS check passes
- [ ] HTTPS expectation is correct
- [ ] Logging check passes
- [ ] Demo Mode status is correct
- [ ] Required directory checks pass
- [ ] Dependency checks pass
- [ ] No blocking failures remain

---

# 31. HTTPS Validation

- [ ] Frontend HTTPS certificate is valid
- [ ] Backend HTTPS certificate is valid
- [ ] HTTP redirects to HTTPS where required
- [ ] Browser shows no certificate warning
- [ ] API calls use HTTPS
- [ ] Mixed-content errors do not occur
- [ ] Secure cookie requirement is reviewed
- [ ] TLS configuration meets customer requirements

---

# 32. CORS Validation

- [ ] Approved frontend origin is configured
- [ ] Unapproved origin is rejected
- [ ] Wildcard origin is not used
- [ ] Localhost origin is removed for external pilot
- [ ] Required HTTP methods work
- [ ] Required headers work
- [ ] Authentication header is accepted
- [ ] File upload works across configured origin

---

# 33. Logging Validation

- [ ] `LOG_LEVEL` is configured
- [ ] Backend logs are available
- [ ] Startup logs are available
- [ ] Error logs are available
- [ ] Authentication failures are logged appropriately
- [ ] Database failures are logged appropriately
- [ ] Upload failures are logged appropriately
- [ ] Logs do not expose passwords
- [ ] Logs do not expose JWT tokens
- [ ] Logs do not expose secret keys
- [ ] Log retention is documented
- [ ] Log access is restricted

---

# 34. Backup Readiness

- [ ] Backup owner is identified
- [ ] Backup schedule is defined
- [ ] Backup storage is approved
- [ ] Backup retention is defined
- [ ] Database backup succeeds
- [ ] Backup file is protected
- [ ] Restore procedure is documented
- [ ] Test restore succeeds
- [ ] Restore evidence is recorded
- [ ] Rollback decision owner is identified

Detailed guide:

```text
pilot-package\operations\BACKUP_RESTORE_GUIDE.md
```

---

# 35. Support Readiness

- [ ] Customer support contact is assigned
- [ ] Mine Manager AI support contact is assigned
- [ ] Support email is configured
- [ ] Critical issue channel is agreed
- [ ] Standard issue channel is agreed
- [ ] Support hours are agreed
- [ ] Incident priority definitions are agreed
- [ ] Escalation path is agreed
- [ ] Screenshot and log collection process is agreed
- [ ] Weekly pilot review is scheduled

---

# 36. Incident Response

- [ ] Security incident owner is assigned
- [ ] Data-integrity incident owner is assigned
- [ ] Service outage owner is assigned
- [ ] Customer notification process is defined
- [ ] Credential rotation procedure is defined
- [ ] Secret exposure procedure is defined
- [ ] Database recovery procedure is defined
- [ ] Log-preservation procedure is defined
- [ ] Incident review process is defined

Detailed guide:

```text
pilot-package\operations\INCIDENT_RESPONSE.md
```

---

# 37. Performance Validation

- [ ] Login response is acceptable
- [ ] Dashboard load time is acceptable
- [ ] Upload time is acceptable
- [ ] Report generation time is acceptable
- [ ] AI insight response time is acceptable
- [ ] Prediction response time is acceptable
- [ ] Database query latency is acceptable
- [ ] Concurrent pilot-user behavior is acceptable
- [ ] No memory leak is observed during pilot test
- [ ] No repeated application crash occurs

Customer-specific thresholds should be agreed before final approval.

---

# 38. Browser Validation

- [ ] Approved customer browser is identified
- [ ] Login works in approved browser
- [ ] Dashboard works in approved browser
- [ ] Upload works in approved browser
- [ ] Reports download in approved browser
- [ ] Settings work in approved browser
- [ ] No unsupported-browser warning is required
- [ ] Responsive layout is acceptable

---

# 39. Demo Mode Validation

## When enabled

- [ ] Demo data loads
- [ ] Demo scenario is clearly labelled
- [ ] Demo data is synthetic
- [ ] Demo reset works
- [ ] Demo data does not overwrite customer data unexpectedly

## Before customer-data use

- [ ] Demo Mode status is reviewed
- [ ] Demo Mode is disabled if required
- [ ] Demo data is separated from customer data
- [ ] Customer users understand the distinction

---

# 40. Rollback Readiness

- [ ] Previous backend release is available
- [ ] Previous frontend build is available
- [ ] Previous environment configuration is available
- [ ] Database backup exists
- [ ] Rollback owner is assigned
- [ ] Rollback approval process is defined
- [ ] Rollback validation steps are documented
- [ ] Rollback communication process is defined

---

# 41. Deployment Evidence

| Evidence | File or Location | Status |
|---|---|---|
| Python environment | `deployment/validation/python_environment.txt` | |
| Node environment | `deployment/validation/node_environment.txt` | |
| Backend dependencies | `deployment/validation/backend_dependencies.txt` | |
| Frontend dependencies | `deployment/validation/frontend_dependencies.txt` | |
| Environment inventory | `deployment/validation/environment_variable_inventory.txt` | |
| Router inventory | `deployment/validation/router_inventory.txt` | |
| Alembic status | `deployment/validation/alembic_status.txt` | |
| Deployment Readiness result | | |
| System Health result | | |
| Database connection result | | |
| Frontend build result | | |
| Upload validation result | | |
| Report validation result | | |
| Backup result | | |
| Restore result | | |

---

# 42. Blocking Conditions

Pilot launch must not proceed when any of the following remains unresolved:

- Critical security issue
- Critical data-integrity issue
- Database connection failure
- Authentication failure
- Unauthorized access vulnerability
- Missing production secret
- Debug mode enabled externally
- Wildcard CORS in external deployment
- Invalid HTTPS certificate
- Missing database backup
- Failed migration
- Uncontrolled duplicate data
- Materially incorrect KPI values
- Complete report-generation failure
- Unresolved blocking Deployment Readiness failure

---

# 43. Known Issues

| Issue | Severity | Owner | Mitigation | Due Date | Status |
|---|---|---|---|---|---|
| | | | | | |
| | | | | | |
| | | | | | |

---

# 44. Final Deployment Decision

Select one:

- [ ] Ready for Pilot
- [ ] Ready with Conditions
- [ ] Not Ready
- [ ] Deployment Deferred
- [ ] Rollback Required

---

# 45. Final Approval

| Role | Name | Approval | Date |
|---|---|---|---|
| Technical Deployment Lead | | | |
| Customer IT Representative | | | |
| Customer Security Representative | | | |
| Customer Pilot Manager | | | |
| Customer Executive Sponsor | | | |
| Mine Manager AI Pilot Lead | | | |

---

# 46. Final Notes

Use this section to record:

- Deployment limitations
- Temporary workarounds
- Deferred improvements
- Customer-specific configuration
- Security exceptions
- Support commitments
- Commercial next actions

---

# 47. Completion Status

The deployment checklist is complete only when:

- [ ] All mandatory sections are reviewed
- [ ] All blocking conditions are resolved
- [ ] Required evidence is attached
- [ ] Known issues are documented
- [ ] Rollback is available
- [ ] Final approval is recorded
- [ ] Pilot launch decision is confirmed