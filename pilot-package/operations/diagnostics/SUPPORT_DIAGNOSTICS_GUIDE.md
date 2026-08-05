# Mine Manager AI Version 1.0

# Support Diagnostics Guide

---

# Document Information

| Item | Value |

|---|---|

| Product | Mine Manager AI |

| Version | 1.0 |

| Document | Support Diagnostics Guide |

| Audience | Administrators, Technical Support, Pilot Delivery Team |

| Status | Pilot Release |

| Last Updated | August 2026 |

---

# 1. Purpose

This guide explains how to use the Mine Manager AI Support Diagnostics Center during customer pilots and technical support activities.

The Support Diagnostics Center provides safe, read-only technical information about:

\- Application runtime

\- Database connectivity

\- Disk storage

\- Runtime directories

\- System Health

\- Deployment Readiness

\- Application logs

\- Backend dependencies

The diagnostics response excludes passwords, tokens, API keys, authorization headers, database connection strings, and uploaded customer files.

---

# 2. Access

The Support Diagnostics page is available at:

```text

/support-diagnostics

```

Backend endpoints:

```text

GET /api/support-diagnostics

GET /api/support-diagnostics/summary

GET /api/support-diagnostics/download

```

Administrator access is required.

---

# 3. Main Page Sections

## Overall Status

Shows the combined diagnostics result.

Possible values:

```text

Healthy

Warning

Failed

```

A warning does not always indicate a blocking issue.

For example, file logging may be marked Not Configured while the application is otherwise operational.

## Database

Shows:

\- Database name

\- Database user

\- PostgreSQL server version

\- Alembic revision

\- Connection test

\- Response time

\- SSL expectation

## Disk Storage

Shows:

\- Project path

\- Total space

\- Used space

\- Free space

\- Free percentage

## Runtime Directories

Checks:

\- Log directory

\- Upload directory

\- Static directory

\- Logo directory

Each directory is checked for:

\- Existence

\- Directory type

\- Write access

## System Health

Reuses the existing System Health service.

Shows:

\- Overall status

\- Last check

\- Cache state

\- Cache age

\- Check duration

\- Slowest service

## Deployment Readiness

Shows a compact snapshot of:

\- Overall readiness

\- Readiness score

\- Passed checks

\- Warnings

\- Failed checks

## Application Logs

Shows:

\- Log directory

\- Log file count

\- Recent warning and error entries

Only warning, error, critical, and exception lines are included.

Sensitive lines are redacted.

## Dependencies

Shows installed backend package versions, including:

\- FastAPI

\- Starlette

\- Uvicorn

\- SQLAlchemy

\- Psycopg2

\- Pydantic

\- Alembic

\- OpenAI

\- Pandas

\- Openpyxl

\- ReportLab

---

# 4. Refresh Diagnostics

Use the Refresh button to run a new diagnostics request.

The page reloads:

\- Runtime information

\- Database status

\- Storage status

\- Directory checks

\- System Health snapshot

\- Deployment Readiness snapshot

\- Log information

\- Dependency versions

---

# 5. Download Diagnostics

Use Download Diagnostics to create a JSON support file.

The downloaded filename follows:

```text

mine\_manager\_ai\_support\_diagnostics\_YYYYMMDD\_HHMMSS.json

```

The file may be attached to an approved support case.

Before sharing it externally:

1\. Review the file.

2\. Confirm no customer-sensitive information is present.

3\. Use the approved transfer method.

4\. Record the support case reference.

---

# 6. Security Controls

The diagnostics service must not return:

\- Passwords

\- JWT secrets

\- Access tokens

\- Authorization headers

\- API keys

\- Database passwords

\- Database connection strings

\- Uploaded customer files

\- Raw authentication payloads

The service uses redaction rules to mask lines containing sensitive terms.

---

# 7. Typical Support Workflow

1\. Confirm the issue.

2\. Record the date and time.

3\. Open Support Diagnostics.

4\. Review Overall Status.

5\. Review Database.

6\. Review Disk Storage.

7\. Review Runtime Directories.

8\. Review System Health.

9\. Review Deployment Readiness.

10\. Review Application Logs.

11\. Download the diagnostics file.

12\. Attach it to the approved support case.

13\. Record the resolution.

---

# 8. Common Conditions

## Overall Warning

Possible reasons:

\- Log directory not configured

\- Runtime directory missing

\- Deployment Readiness warning

\- Low disk space

\- Non-blocking dependency issue

## Database Failed

Possible reasons:

\- Database unavailable

\- Invalid credentials

\- Network issue

\- Firewall issue

\- SSL issue

\- Database server unavailable

## Storage Warning

Possible reasons:

\- Free disk space below threshold

\- Project drive nearing capacity

## Log Status Not Configured

Meaning:

No supported log files were found in the configured log directory.

This is not automatically a system failure.

## Runtime Directory Warning

Possible reasons:

\- Directory does not exist

\- Path is not a directory

\- Directory is not writable

---

# 9. Diagnostic Thresholds

Disk storage status:

| Free Space | Status |

|---|---|

| 15% or more | Healthy |

| 5% to less than 15% | Warning |

| Less than 5% | Failed |

These thresholds are defined in the diagnostics service.

---

# 10. Validation

Validated Sprint 10.21.7 results:

```text

Backend service compilation: PASSED

Backend router compilation: PASSED

FastAPI startup: PASSED

Swagger endpoint registration: PASSED

Frontend production build: PASSED

Administrator page access: PASSED

Database diagnostics: HEALTHY

Disk diagnostics: HEALTHY

System Health integration: AVAILABLE

Download endpoint: AVAILABLE

```

---

# 11. Limitations

Version 1.0 diagnostics does not currently provide:

\- Centralized cloud log aggregation

\- Real-time alert delivery

\- Automated email alerts

\- Distributed tracing

\- Application performance monitoring integration

\- Historical log analytics

\- Automatic support-ticket creation

These are future enhancements.

---

# 12. Support Evidence Checklist

\- \[ ] Screenshot captured

\- \[ ] Diagnostics JSON downloaded

\- \[ ] Timestamp recorded

\- \[ ] User role recorded

\- \[ ] Company and mine recorded

\- \[ ] Error message recorded

\- \[ ] Business impact recorded

\- \[ ] Backend logs reviewed

\- \[ ] System Health reviewed

\- \[ ] Deployment Readiness reviewed

\- \[ ] Resolution recorded

---

# Revision History

| Version | Date | Description |

|---|---|---|

| 1.0 | August 2026 | Initial Support Diagnostics Guide |

---

\*\*End of Support Diagnostics Guide\*\*

