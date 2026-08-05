# Mine Manager AI - Environment Variables

## 1. Purpose

This document defines the environment variables used to configure Mine
Manager AI Version 1.0 for local development, customer pilots, and
production deployments.

Environment variables must be configured separately for:

- FastAPI backend
- PostgreSQL database
- Authentication
- Security
- Deployment readiness
- Logging
- External AI services
- React frontend

This document must not contain real customer credentials, database
passwords, secret keys, or API keys.

---

## 2. Security Rules

The following values are secrets and must never be committed to Git:

- Database passwords
- JWT secret keys
- OpenAI API keys
- Azure API keys
- Cloud-platform credentials
- Backup-storage credentials
- SMTP passwords
- Private certificates
- Production tokens

Never commit:

```text
backend/.env
frontend/.env
frontend/.env.local
*.pem
*.key
```

Only safe placeholder files such as `.env.example` may be committed.

Before committing changes, verify:

```cmd
git status
git diff --cached
```

---

## 3. Backend Environment File

The recommended local backend environment file is:

```text
C:\Projects\mine-manager-ai\backend\.env
```

The backend loads environment variables using `python-dotenv`.

A safe example is:

```dotenv
# ==================================================
# Mine Manager AI - Backend Environment
# ==================================================

# Application
APP_ENV=development
APP_VERSION=1.0.0
DEBUG=false

# Database
DB_HOST=your-postgresql-host
DB_PORT=5432
DB_NAME=mine_manager_ai
DB_USER=your-database-user
DB_PASSWORD=replace-with-secure-password
DB_SSLMODE=require

# Authentication
SECRET_KEY=replace-with-long-random-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175

# HTTPS
FORCE_HTTPS=false

# Demo Mode
DEMO_MODE=true

# Logging
LOG_LEVEL=INFO

# External AI Services
OPENAI_API_KEY=
AZURE_OPENAI_API_KEY=
```

Do not copy this example into production without replacing all placeholder
values.

---

# 4. Required Backend Variables

## 4.1 `DB_HOST`

Purpose:

PostgreSQL server hostname.

Example:

```dotenv
DB_HOST=example-postgresql.postgres.database.azure.com
```

Local example:

```dotenv
DB_HOST=127.0.0.1
```

Required:

Yes.

Validation:

```cmd
echo %DB_HOST%
```

---

## 4.2 `DB_PORT`

Purpose:

PostgreSQL server port.

Default:

```text
5432
```

Example:

```dotenv
DB_PORT=5432
```

Required:

Recommended explicitly, although the application defaults to `5432`.

---

## 4.3 `DB_NAME`

Purpose:

PostgreSQL database name.

Example:

```dotenv
DB_NAME=mine_manager_ai
```

Required:

Yes.

---

## 4.4 `DB_USER`

Purpose:

PostgreSQL login user.

Example:

```dotenv
DB_USER=mine_manager_admin
```

Required:

Yes.

Do not use a database superuser for routine application access unless
required for initial provisioning.

---

## 4.5 `DB_PASSWORD`

Purpose:

PostgreSQL login password.

Example:

```dotenv
DB_PASSWORD=replace-with-secure-password
```

Required:

Yes.

Security requirements:

- Use a strong, unique password
- Do not include it in documentation
- Do not commit it to Git
- Store it in the deployment platform's secret manager where available
- Rotate it if exposure is suspected

---

## 4.6 Database Connection Construction

The current backend constructs its PostgreSQL URL as:

```text
postgresql://DB_USER:DB_PASSWORD@DB_HOST:DB_PORT/DB_NAME
```

The application currently creates the SQLAlchemy engine using:

```text
sslmode=require
```

This means the configured PostgreSQL server must support SSL.

---

## 4.7 `DB_SSLMODE`

Purpose:

Declares the intended PostgreSQL SSL mode for deployment-readiness
inspection.

Example:

```dotenv
DB_SSLMODE=require
```

Recommended pilot value:

```text
require
```

Important:

The current database engine code explicitly uses `sslmode=require`.
Changing only `DB_SSLMODE` does not change the active SQLAlchemy engine
configuration unless `app/database.py` is updated accordingly.

---

# 5. Authentication Variables

## 5.1 `SECRET_KEY`

Purpose:

Signs and verifies JWT access tokens.

Example placeholder:

```dotenv
SECRET_KEY=replace-with-long-random-secret
```

Required:

Yes.

The application also accepts:

```dotenv
JWT_SECRET_KEY=replace-with-long-random-secret
```

`SECRET_KEY` is the recommended standard variable.

Generate a secure value using Python:

```cmd
python -c "import secrets; print(secrets.token_hex(64))"
```

Security requirements:

- Use at least 64 random bytes
- Do not reuse development secrets in production
- Do not email or message the production secret
- Do not commit it to Git
- Rotate it if exposed

Changing the secret invalidates existing access tokens.

---

## 5.2 `JWT_SECRET_KEY`

Purpose:

Alternative JWT secret variable.

Example:

```dotenv
JWT_SECRET_KEY=replace-with-long-random-secret
```

Use either:

```text
SECRET_KEY
```

or:

```text
JWT_SECRET_KEY
```

Do not configure different values for both unless the application logic
is intentionally reviewed.

---

## 5.3 `AUTH_SECRET_KEY`

Purpose:

Recognized by the Deployment Readiness Service as an alternative secret
name.

Important:

The current JWT authentication module primarily reads:

```text
SECRET_KEY
```

or:

```text
JWT_SECRET_KEY
```

Therefore, do not rely only on `AUTH_SECRET_KEY` without confirming the
authentication implementation.

Recommended:

Use `SECRET_KEY`.

---

## 5.4 `ALGORITHM`

Purpose:

JWT signing algorithm.

Default:

```text
HS256
```

Recommended configuration:

```dotenv
ALGORITHM=HS256
```

Do not change this without reviewing existing issued tokens and
authentication code.

---

## 5.5 `ACCESS_TOKEN_EXPIRE_MINUTES`

Purpose:

Controls JWT access-token lifetime.

Default:

```text
60
```

Example:

```dotenv
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Pilot recommendation:

```text
60
```

A shorter period improves security but may require users to log in more
frequently.

---

# 6. Application Environment Variables

## 6.1 `APP_ENV`

Purpose:

Identifies the deployment environment.

Examples:

```dotenv
APP_ENV=development
```

```dotenv
APP_ENV=pilot
```

```dotenv
APP_ENV=production
```

Recommended customer-pilot value:

```text
pilot
```

Recommended commercial deployment value:

```text
production
```

Alternative variables recognized by readiness checks include:

```text
ENVIRONMENT
FASTAPI_ENV
```

Use `APP_ENV` as the standard variable.

---

## 6.2 `APP_VERSION`

Purpose:

Displays or reports the deployed application version.

Recommended:

```dotenv
APP_VERSION=1.0.0
```

The value should match the approved release.

---

## 6.3 `DEBUG`

Purpose:

Controls whether development debugging is enabled.

Development:

```dotenv
DEBUG=true
```

Pilot and production:

```dotenv
DEBUG=false
```

Required production setting:

```text
false
```

Alternative variables recognized by readiness checks include:

```text
APP_DEBUG
FASTAPI_DEBUG
```

Use `DEBUG` as the standard variable.

Never run an external pilot with debug mode enabled.

---

# 7. CORS Configuration

## 7.1 `CORS_ORIGINS`

Purpose:

Defines the frontend domains allowed to call the backend API.

Local example:

```dotenv
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
```

Pilot example:

```dotenv
CORS_ORIGINS=https://pilot.example.com
```

Multiple deployed origins:

```dotenv
CORS_ORIGINS=https://pilot.example.com,https://admin.example.com
```

Security rules:

- Do not use `*` in production
- Do not retain localhost origins unless explicitly required
- Use HTTPS URLs for external deployments
- Include only approved frontend domains

Alternative variable recognized by readiness checks:

```text
ALLOWED_ORIGINS
```

Use `CORS_ORIGINS` as the standard variable.

Important:

The environment variable must also be wired into FastAPI's CORS
middleware configuration. Deployment readiness can detect the variable,
but runtime behavior depends on `app/main.py`.

---

# 8. HTTPS Variables

## 8.1 `FORCE_HTTPS`

Purpose:

Declares that HTTPS must be used for the deployed application.

Local development:

```dotenv
FORCE_HTTPS=false
```

External pilot:

```dotenv
FORCE_HTTPS=true
```

Production:

```dotenv
FORCE_HTTPS=true
```

Alternative readiness variables include:

```text
HTTPS_ONLY
SECURE_COOKIES
```

Use `FORCE_HTTPS` as the standard deployment variable.

Important:

This variable does not create an SSL certificate. HTTPS must be
implemented using the selected hosting platform, reverse proxy, or load
balancer.

---

# 9. Demo Mode

## 9.1 `DEMO_MODE`

Purpose:

Controls whether demonstration features are intended to remain
available.

Local demonstration:

```dotenv
DEMO_MODE=true
```

Customer pilot:

```dotenv
DEMO_MODE=false
```

Production:

```dotenv
DEMO_MODE=false
```

Alternative recognized variable:

```text
ENABLE_DEMO_MODE
```

Recommended:

Use `DEMO_MODE`.

Before disabling Demo Mode, confirm that customer data and required
configuration are available.

Demo data must never be confused with real customer operational data.

---

# 10. Logging

## 10.1 `LOG_LEVEL`

Purpose:

Defines application logging severity.

Allowed values:

- `CRITICAL`
- `ERROR`
- `WARNING`
- `INFO`
- `DEBUG`

Local development:

```dotenv
LOG_LEVEL=DEBUG
```

Pilot:

```dotenv
LOG_LEVEL=INFO
```

Production:

```dotenv
LOG_LEVEL=INFO
```

or:

```dotenv
LOG_LEVEL=WARNING
```

Do not use `DEBUG` logging in production unless temporarily approved for
diagnostics.

Logging must not expose:

- Passwords
- JWT tokens
- Secret keys
- Database credentials
- Full customer files
- Personally identifiable information

---

# 11. External AI Service Variables

## 11.1 `OPENAI_API_KEY`

Purpose:

Authenticates requests to OpenAI services where configured.

Example placeholder:

```dotenv
OPENAI_API_KEY=
```

Security:

- Store as a secret
- Do not commit
- Apply usage limits
- Monitor costs
- Rotate if exposed

The application should handle a missing key gracefully where AI features
are optional.

---

## 11.2 `AZURE_OPENAI_API_KEY`

Purpose:

Authenticates Azure OpenAI services where configured.

Example placeholder:

```dotenv
AZURE_OPENAI_API_KEY=
```

Additional Azure endpoint or deployment variables may be needed depending
on the active service implementation.

The current environment inventory confirms that the System Health
service checks for Azure and OpenAI keys, but the complete provider
configuration should be verified before customer deployment.

---

# 12. Frontend Environment Variables

The recommended frontend environment file is:

```text
C:\Projects\mine-manager-ai\frontend\.env
```

or, for local-only settings:

```text
C:\Projects\mine-manager-ai\frontend\.env.local
```

A safe example is:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000
```

For a deployed pilot:

```dotenv
VITE_API_BASE_URL=https://api-pilot.example.com
```

---

## 12.1 `VITE_API_BASE_URL`

Purpose:

Defines the FastAPI backend base URL used by the React frontend.

Local default:

```text
http://127.0.0.1:8000
```

Local example:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Pilot example:

```dotenv
VITE_API_BASE_URL=https://api-pilot.example.com
```

Rules:

- Do not add a trailing slash
- Use HTTPS for external pilots
- Ensure the domain is included in backend CORS configuration
- Rebuild the frontend after changing production environment variables

The frontend normalizes trailing slashes automatically, but the
recommended configuration remains without a trailing slash.

---

# 13. Complete Pilot Example

## Backend `.env`

```dotenv
APP_ENV=pilot
APP_VERSION=1.0.0
DEBUG=false

DB_HOST=example-postgresql.postgres.database.azure.com
DB_PORT=5432
DB_NAME=mine_manager_ai
DB_USER=mine_manager_pilot
DB_PASSWORD=replace-with-secure-password
DB_SSLMODE=require

SECRET_KEY=replace-with-secure-random-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

CORS_ORIGINS=https://pilot.example.com
FORCE_HTTPS=true

DEMO_MODE=false
LOG_LEVEL=INFO

OPENAI_API_KEY=
AZURE_OPENAI_API_KEY=
```

## Frontend `.env`

```dotenv
VITE_API_BASE_URL=https://api-pilot.example.com
```

---

# 14. Local Development Example

## Backend `.env`

```dotenv
APP_ENV=development
APP_VERSION=1.0.0
DEBUG=true

DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=mine_manager_ai
DB_USER=postgres
DB_PASSWORD=replace-with-local-password
DB_SSLMODE=require

SECRET_KEY=replace-with-development-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
FORCE_HTTPS=false

DEMO_MODE=true
LOG_LEVEL=DEBUG
```

## Frontend `.env`

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Important:

The current database engine always requires PostgreSQL SSL. A local
PostgreSQL server without SSL may fail unless the database configuration
is changed.

---

# 15. Environment Validation

## Confirm backend variables are available

From the backend virtual environment:

```cmd
cd C:\Projects\mine-manager-ai\backend

venv\Scripts\activate.bat

python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('APP_ENV:', os.getenv('APP_ENV')); print('DB_HOST configured:', bool(os.getenv('DB_HOST'))); print('DB_NAME configured:', bool(os.getenv('DB_NAME'))); print('DB_USER configured:', bool(os.getenv('DB_USER'))); print('DB_PASSWORD configured:', bool(os.getenv('DB_PASSWORD'))); print('SECRET_KEY configured:', bool(os.getenv('SECRET_KEY') or os.getenv('JWT_SECRET_KEY')))"
```

This command shows only whether secrets exist. It does not print secret
values.

---

## Test database connectivity

```cmd
python -c "from sqlalchemy import text; from app.database import engine; connection=engine.connect(); print(connection.execute(text('SELECT 1')).scalar()); connection.close()"
```

Expected:

```text
1
```

---

## Test deployment readiness

Start the backend:

```cmd
uvicorn app.main:app --reload
```

Open:

```text
http://127.0.0.1:8000/docs
```

Then verify:

```text
GET /api/deployment-readiness
```

Expected:

- No blocking failures
- Database configuration detected
- Secret key configured
- Debug mode appropriate
- CORS configured
- Logging configured
- HTTPS requirement appropriate for the environment

---

## Verify frontend variable

From the frontend folder:

```cmd
cd C:\Projects\mine-manager-ai\frontend

type .env
```

Do not paste the output publicly if more secrets are ever added.

Run:

```cmd
npm run dev
```

Confirm that API calls reach the configured backend.

---

# 16. Production Requirements

Before production deployment:

- [ ] `APP_ENV=production`
- [ ] `DEBUG=false`
- [ ] Strong `SECRET_KEY` configured
- [ ] Database credentials stored securely
- [ ] PostgreSQL SSL enabled
- [ ] `CORS_ORIGINS` contains only approved HTTPS domains
- [ ] `FORCE_HTTPS=true`
- [ ] `DEMO_MODE=false`
- [ ] `LOG_LEVEL=INFO` or `WARNING`
- [ ] Frontend uses an HTTPS API URL
- [ ] Secrets are absent from Git
- [ ] Backup credentials are stored securely
- [ ] Access-token lifetime is approved
- [ ] External AI-service usage is approved
- [ ] Deployment Readiness reports zero blocking failures

---

# 17. Troubleshooting

## Missing JWT secret

Error:

```text
Missing JWT secret. Set SECRET_KEY or JWT_SECRET_KEY.
```

Resolution:

Add a secure value to the backend `.env`:

```dotenv
SECRET_KEY=replace-with-secure-random-secret
```

Restart the backend.

---

## Database connection failure

Check:

```dotenv
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=
```

Then test:

```cmd
python -c "from sqlalchemy import text; from app.database import engine; connection=engine.connect(); print(connection.execute(text('SELECT 1')).scalar()); connection.close()"
```

Also confirm the database permits SSL connections.

---

## CORS error

Confirm:

```dotenv
CORS_ORIGINS=https://approved-frontend-domain
```

Verify that `app/main.py` reads the configured variable and passes the
origins into FastAPI's CORS middleware.

Restart the backend after changing the variable.

---

## Frontend still calls localhost

Confirm:

```dotenv
VITE_API_BASE_URL=https://deployed-api-domain
```

Then rebuild or restart the frontend:

```cmd
npm run build
```

Vite variables are embedded during the frontend build.

---

## Deployment Readiness warning

Review:

```text
Security Center
```

Typical warnings may require:

- `DEBUG=false`
- Strong secret configuration
- Explicit CORS configuration
- HTTPS enforcement
- Demo Mode disabled
- `LOG_LEVEL=INFO`

---

# 18. Change Control

Any environment-variable change should record:

- Variable name
- Environment
- Requestor
- Approver
- Date changed
- Reason
- Validation result
- Rollback value or procedure

Secret values must not be written into change records.

---

# 19. Final Approval

| Role | Name | Date | Status |
|---|---|---|---|
| Technical Deployment Lead | | | Pending |
| Customer IT Representative | | | Pending |
| Customer Security Representative | | | Pending |
| Pilot Delivery Lead | | | Pending |