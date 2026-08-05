# Mine Manager AI Version 1.0

# Error Catalog

---

# Document Information

| Item | Value |
|---|---|
| Product | Mine Manager AI |
| Version | 1.0 |
| Document | Error Catalog |
| Audience | Administrators, Technical Support, Pilot Delivery Team |
| Status | Pilot Release |
| Last Updated | August 2026 |

---

# 1. Purpose

This catalog defines common Mine Manager AI Version 1.0 errors, likely causes, recommended resolutions, evidence requirements, and information that must not be collected.

Use this catalog during:

- Customer pilots
- Technical support
- Incident response
- User troubleshooting
- Deployment validation
- Acceptance testing

---

# 2. Severity Levels

| Severity | Meaning |
|---|---|
| Critical | Security incident, data corruption, full outage, or unsafe system state |
| High | Major capability unavailable for multiple users |
| Medium | One function or one user significantly affected |
| Low | Non-blocking issue, warning, or usability problem |

---

# 3. Authentication and Authorization

## ERR-AUTH-001 - Login Failed

**Severity:** Medium  
**Area:** Authentication

**User message**

```text
Invalid email or password.
```

**Likely causes**

- Incorrect email
- Incorrect password
- Inactive account
- Backend unavailable
- Database unavailable

**Resolution**

1. Confirm the email address.
2. Re-enter the password.
3. Confirm the account is active.
4. Confirm the backend is running.
5. Confirm database connectivity.
6. Escalate if multiple users are affected.

**Evidence to collect**

- Timestamp
- User email
- HTTP status
- Request ID
- Backend log excerpt

**Do not collect**

- Password
- Access token
- Password hash

---

## ERR-AUTH-002 - Session Expired

**Severity:** Low  
**Area:** Authentication

**User message**

```text
Your login session has expired. Please log in again.
```

**Likely causes**

- JWT expired
- Token removed from local storage
- Token invalidated
- Browser session reset

**Resolution**

1. Log out.
2. Close stale tabs if needed.
3. Log in again.
4. Retry the action.

**Evidence to collect**

- Timestamp
- HTTP status
- Request ID
- Affected page

**Do not collect**

- JWT token
- Authorization header

---

## ERR-AUTH-003 - Administrator Access Required

**Severity:** Medium  
**Area:** Authorization

**User message**

```text
Administrator access is required.
```

**Likely causes**

- User role is not Administrator
- Role configuration is incorrect
- User account was changed
- Token contains an outdated role

**Resolution**

1. Confirm the user role.
2. Confirm the account is active.
3. Log out and log in again after a role change.
4. Assign Administrator only with approval.

**Evidence to collect**

- User email
- Current role
- Requested route
- HTTP status
- Request ID

**Do not collect**

- Password
- Access token

---

# 4. Database

## ERR-DB-001 - Database Connection Failed

**Severity:** Critical  
**Area:** Database

**User message**

```text
Database connection check failed.
```

**Likely causes**

- Incorrect database host
- Incorrect password
- Firewall restriction
- PostgreSQL unavailable
- SSL configuration problem
- Network issue

**Resolution**

1. Confirm `DB_HOST`.
2. Confirm `DB_PORT`.
3. Confirm `DB_NAME`.
4. Confirm `DB_USER`.
5. Confirm `DB_PASSWORD` is configured.
6. Test `SELECT 1`.
7. Check Azure PostgreSQL availability.
8. Check firewall and SSL settings.

**Evidence to collect**

- Timestamp
- Error type
- Database host
- Server status
- Connection test result

**Do not collect**

- Database password
- Full connection string

---

## ERR-DB-002 - Alembic Revision Mismatch

**Severity:** High  
**Area:** Database Schema

**User message**

```text
Database schema is not at the expected revision.
```

**Likely causes**

- Migration not applied
- Wrong database selected
- Deployment interrupted
- Branch and database out of sync

**Resolution**

1. Run `alembic current`.
2. Run `alembic heads`.
3. Confirm expected revision.
4. Back up the database.
5. Apply approved migrations.
6. Recheck the revision.

**Evidence to collect**

- Current revision
- Head revision
- Database name
- Migration log

**Do not collect**

- Database password

---

# 5. Data Upload

## ERR-UPL-001 - Missing Required Columns

**Severity:** Medium  
**Area:** Data Upload

**User message**

```text
The workbook is missing required columns.
```

**Likely causes**

- Template not used
- Header renamed
- Header misspelled
- Wrong report type selected
- Empty first row

**Resolution**

1. Open the approved template.
2. Compare row 1.
3. Restore required column names.
4. Save the workbook.
5. Retry the upload.

**Evidence to collect**

- Report type
- File name
- Missing-column list
- Timestamp
- User email

**Do not collect**

- Full customer workbook unless approved

---

## ERR-UPL-002 - Unsupported File Type

**Severity:** Low  
**Area:** Data Upload

**User message**

```text
Unsupported file type.
```

**Likely causes**

- Wrong extension
- Macro-enabled workbook
- Password-protected workbook
- Corrupted file

**Resolution**

1. Use the approved `.xlsx`, `.xls`, or `.csv` format supported by the page.
2. Remove macros.
3. Remove password protection.
4. Save a clean copy.
5. Retry.

---

## ERR-UPL-003 - Fleet `truck_id` Missing

**Severity:** Medium  
**Area:** Fleet Upload

**User message**

```text
The Fleet workbook is missing truck_id.
```

**Likely causes**

- Old template used
- Column deleted
- Column renamed
- Blank truck IDs

**Resolution**

1. Use `Mine_Manager_AI_Fleet_Template.xlsx`.
2. Confirm the header includes `truck_id`.
3. Confirm every fleet row has a valid truck ID.
4. Retry the upload.

---

## ERR-UPL-004 - Invalid Percentage Value

**Severity:** Medium  
**Area:** Data Validation

**User message**

```text
Percentage values must be between 0 and 100.
```

**Likely causes**

- Value entered as `0.90` instead of `90`
- Percentage symbol included
- Text value entered
- Negative value
- Value greater than 100

**Resolution**

1. Convert the value to a number.
2. Use the range 0 to 100.
3. Remove percentage symbols.
4. Retry the upload.

---

## ERR-UPL-005 - Duplicate Reporting Record

**Severity:** Medium  
**Area:** Data Integrity

**User message**

```text
A record already exists for this mine and reporting date.
```

**Likely causes**

- Same file uploaded twice
- Wrong mine selected
- Existing data not updated as expected
- Unique constraint triggered

**Resolution**

1. Confirm the mine.
2. Confirm the reporting date.
3. Review Upload History.
4. Confirm whether the endpoint should update or reject.
5. Investigate unexpected duplicate counts.

---

# 6. Dashboard and KPI

## ERR-DASH-001 - Dashboard Data Unavailable

**Severity:** High  
**Area:** Dashboard

**User message**

```text
Unable to load dashboard data.
```

**Likely causes**

- Backend unavailable
- Database unavailable
- No data for selected mine
- API error
- Authentication failure

**Resolution**

1. Confirm login.
2. Confirm the selected mine.
3. Confirm uploads succeeded.
4. Confirm backend availability.
5. Check System Health.
6. Review backend logs.

---

## ERR-DASH-002 - KPI Appears Incorrect

**Severity:** High  
**Area:** KPI Calculation

**User message**

```text
The displayed KPI does not match the expected result.
```

**Likely causes**

- Incorrect source data
- Wrong mine
- Wrong date range
- Calculation logic issue
- Stale dashboard response
- Duplicate data

**Resolution**

Validate in this order:

1. Source workbook
2. Upload result
3. Database value
4. KPI calculation
5. Dashboard display
6. Report output

---

# 7. Executive Reports

## ERR-RPT-001 - PDF Report Generation Failed

**Severity:** High  
**Area:** Executive Reports

**User message**

```text
Unable to generate the PDF report.
```

**Likely causes**

- Missing data
- Report service error
- Logo path invalid
- Font or image issue
- Database unavailable
- File-system issue

**Resolution**

1. Confirm the reporting period.
2. Confirm data exists.
3. Confirm branding files exist.
4. Confirm output directory is writable.
5. Review backend logs.
6. Retry once.

---

## ERR-RPT-002 - Report Download Failed

**Severity:** Medium  
**Area:** Executive Reports

**User message**

```text
Unable to download the report.
```

**Likely causes**

- Browser blocked downloads
- Backend response failed
- Authentication expired
- File generation failed
- Network interruption

**Resolution**

1. Allow browser downloads.
2. Log in again.
3. Retry once.
4. Check the report endpoint.
5. Review backend logs.

---

# 8. AI Executive Insights

## ERR-AI-001 - AI Executive Insights Unavailable

**Severity:** Medium  
**Area:** AI Executive Insights

**User message**

```text
Unable to load AI Executive Insights.
```

**Likely causes**

- No operational data
- AI service unavailable
- Internal insight service error
- Authentication failure
- Backend unavailable

**Resolution**

1. Confirm source data exists.
2. Confirm the correct mine.
3. Confirm the backend is available.
4. Check System Health.
5. Review AI-service logs.
6. Use current KPI data as fallback.

---

## ERR-AI-002 - External AI Provider Unavailable

**Severity:** Medium  
**Area:** AI Service

**User message**

```text
AI provider is unavailable.
```

**Likely causes**

- API key missing
- Provider outage
- Network issue
- Rate limit
- Invalid model configuration

**Resolution**

1. Confirm the provider is configured.
2. Confirm the API key exists without displaying it.
3. Check provider status.
4. Review rate-limit messages.
5. Use internal fallback logic where available.

---

# 9. Predictive Intelligence

## ERR-PRED-001 - Insufficient Historical Data

**Severity:** Low  
**Area:** Predictive Intelligence

**User message**

```text
Insufficient historical data for prediction.
```

**Likely causes**

- Too few reporting days
- Missing data
- Wrong mine selected
- Incomplete dataset

**Resolution**

1. Confirm the historical date range.
2. Upload additional validated data.
3. Confirm all required report types exist.
4. Retry.

---

## ERR-PRED-002 - Prediction Service Failed

**Severity:** Medium  
**Area:** Predictive Intelligence

**User message**

```text
Unable to generate prediction.
```

**Likely causes**

- Service exception
- Invalid data
- Database issue
- Unsupported KPI
- Insufficient history

**Resolution**

1. Confirm input data.
2. Confirm the KPI is supported.
3. Review backend logs.
4. Check System Health.
5. Retry after resolving data issues.

---

# 10. System Health

## ERR-HLT-001 - System Health Failed

**Severity:** High  
**Area:** System Health

**User message**

```text
System Health check failed.
```

**Likely causes**

- Database unavailable
- Storage unavailable
- AI service unavailable
- Backend degraded
- Health-check exception

**Resolution**

1. Review each service result.
2. Identify the failed component.
3. Review response duration.
4. Review backend logs.
5. Resolve blocking failures before pilot launch.

---

## ERR-HLT-002 - System Health Degraded

**Severity:** Medium  
**Area:** System Health

**User message**

```text
System Health is degraded.
```

**Likely causes**

- Slow database response
- Optional service unavailable
- Low storage
- Demo-data warning
- Cached warning state

**Resolution**

1. Force refresh where approved.
2. Review the slowest service.
3. Check thresholds.
4. Resolve the warning.
5. Recheck.

---

# 11. Deployment Readiness

## ERR-DEP-001 - Deployment Readiness Failed

**Severity:** High  
**Area:** Deployment Readiness

**User message**

```text
Deployment readiness contains blocking failures.
```

**Likely causes**

- Missing secret key
- Debug enabled
- CORS not configured
- Demo Mode enabled
- Required directory missing
- Database failure
- Migration mismatch

**Resolution**

1. Review failed checks.
2. Resolve each blocking item.
3. Restart the backend after environment changes.
4. Refresh Deployment Readiness.
5. Do not launch the pilot until blocking failures are cleared.

---

# 12. Support Diagnostics

## ERR-DIA-001 - Support Diagnostics Access Denied

**Severity:** Medium  
**Area:** Support Diagnostics

**User message**

```text
Administrator access is required.
```

**Likely causes**

- User is not Administrator
- Role changed but session not refreshed
- Token contains old role information

**Resolution**

1. Confirm the user role.
2. Log out and log in again.
3. Retry.
4. Escalate role changes for approval.

---

## ERR-DIA-002 - Diagnostics Download Failed

**Severity:** Medium  
**Area:** Support Diagnostics

**User message**

```text
Unable to download support diagnostics.
```

**Likely causes**

- Session expired
- Backend unavailable
- Browser blocked download
- Diagnostics service error
- Network interruption

**Resolution**

1. Refresh the page.
2. Confirm Administrator access.
3. Confirm backend availability.
4. Retry once.
5. Review backend logs.

---

## ERR-DIA-003 - Application Logs Not Configured

**Severity:** Low  
**Area:** Logging

**User message**

```text
No application log files were found.
```

**Likely causes**

- File logging not enabled
- Log directory missing
- Log directory incorrect
- No log files created yet

**Resolution**

1. Review `LOG_DIR`.
2. Confirm the directory exists.
3. Confirm write permission.
4. Enable file logging where required.
5. Refresh Support Diagnostics.

---

# 13. Backup and Restore

## ERR-BKP-001 - Database Backup Failed

**Severity:** Critical  
**Area:** Backup

**User message**

```text
Database backup failed.
```

**Likely causes**

- `pg_dump` unavailable
- Database authentication failed
- Network failure
- Storage full
- Invalid environment variables

**Resolution**

1. Confirm PostgreSQL tools.
2. Confirm database connectivity.
3. Confirm backup directory.
4. Confirm free disk space.
5. Review the command output.
6. Do not proceed with migration until a valid backup exists.

---

## ERR-BKP-002 - Backup Archive Invalid

**Severity:** Critical  
**Area:** Backup Verification

**User message**

```text
The backup archive could not be read by pg_restore.
```

**Likely causes**

- Corrupt backup
- Incomplete file
- Zero-byte file
- Transfer corruption
- Unsupported format

**Resolution**

1. Check file size.
2. Run `verify_backup.bat`.
3. Create a new backup.
4. Preserve the failed archive for investigation.
5. Do not use the archive for recovery.

---

## ERR-RST-001 - Restore Failed

**Severity:** Critical  
**Area:** Restore

**User message**

```text
Database restore failed.
```

**Likely causes**

- Invalid archive
- Permission issue
- Existing database sessions
- Ownership conflict
- Database creation denied

**Resolution**

1. Confirm the target is temporary.
2. Review the first restore error.
3. Confirm `CREATEDB` permission.
4. Terminate temporary database sessions.
5. Retry only after identifying the cause.

---

# 14. Frontend and API Connectivity

## ERR-FE-001 - Frontend Build Failed

**Severity:** High  
**Area:** Frontend

**User message**

```text
Vite build failed.
```

**Likely causes**

- Syntax error
- Missing import
- Missing dependency
- Invalid component export
- Incorrect file path

**Resolution**

1. Review the first build error.
2. Confirm the file path.
3. Confirm the import name.
4. Run `npm install`.
5. Run `npm run build` again.

---

## ERR-FE-002 - API Connection Failed

**Severity:** High  
**Area:** Frontend API

**User message**

```text
Unable to connect to the backend API.
```

**Likely causes**

- Backend not running
- Wrong `VITE_API_BASE_URL`
- CORS issue
- Port mismatch
- Network issue

**Resolution**

1. Confirm the backend URL.
2. Confirm Uvicorn is running.
3. Confirm CORS origins.
4. Confirm frontend and backend ports.
5. Check browser console and Network tab.

---

# 15. Support Evidence Standard

For every significant issue, collect:

- Error code
- Timestamp
- User role
- Company
- Mine
- Page or endpoint
- Expected result
- Actual result
- HTTP status
- Request ID
- Screenshot
- Backend log excerpt
- Business impact
- Resolution

Do not collect:

- Passwords
- Access tokens
- JWT secrets
- Database passwords
- API keys
- Full confidential datasets without approval

---

# Revision History

| Version | Date | Description |
|---|---|---|
| 1.0 | August 2026 | Initial Error Catalog for Pilot Release |

---

**End of Error Catalog**