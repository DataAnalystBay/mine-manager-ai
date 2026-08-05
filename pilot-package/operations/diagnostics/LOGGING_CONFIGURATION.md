# Mine Manager AI Version 1.0

# Logging Configuration

---

# Document Information

| Item | Value |

|---|---|

| Product | Mine Manager AI |

| Version | 1.0 |

| Document | Logging Configuration |

| Audience | Administrators, Developers, Technical Support |

| Status | Pilot Release |

| Last Updated | August 2026 |

---

# 1. Purpose

This document defines the logging standard for Mine Manager AI Version 1.0.

The logging configuration must support:

\- Application troubleshooting

\- Pilot support

\- Incident investigation

\- Performance review

\- Error diagnosis

\- Security review

\- Support Diagnostics

\- Operational evidence

Logging must provide enough technical information to diagnose issues without exposing credentials, secrets, tokens, or confidential customer data.

---

# 2. Logging Objectives

Mine Manager AI logging should:

\- Record application startup and shutdown

\- Record important configuration states

\- Record request failures

\- Record unexpected exceptions

\- Record database connectivity failures

\- Record upload failures

\- Record report-generation failures

\- Record AI-service failures

\- Record deployment-readiness failures

\- Record System Health failures

\- Support request correlation

\- Support file rotation and retention

\- Avoid uncontrolled log growth

\- Avoid sensitive-data exposure

---

# 3. Logging Scope

Logging applies to:

\- FastAPI application

\- API routers

\- Service modules

\- Database operations

\- Authentication

\- Report generation

\- File uploads

\- Executive Insights

\- Predictive Intelligence

\- System Health

\- Deployment Readiness

\- Support Diagnostics

\- Backup and restore scripts

\- Frontend API failures

---

# 4. Log Levels

Mine Manager AI uses the following standard levels.

## DEBUG

Use for detailed technical information during development.

Examples:

\- Function entry and exit

\- Detailed calculation values

\- Internal branch decisions

\- Development-only diagnostics

DEBUG logging must normally be disabled in pilot and production environments.

## INFO

Use for normal application activity.

Examples:

\- Application startup

\- Application shutdown

\- Successful scheduled process

\- Successful report generation

\- Successful data upload

\- Successful backup

\- Successful restore validation

## WARNING

Use for non-blocking abnormal conditions.

Examples:

\- Log directory not configured

\- Low disk space

\- Optional service unavailable

\- Slow response

\- Recoverable validation issue

\- Deprecated configuration

## ERROR

Use when a request or operation fails.

Examples:

\- Upload rejected

\- Report generation failed

\- Database query failed

\- Diagnostics download failed

\- Authentication service error

## CRITICAL

Use for conditions that may stop safe operation.

Examples:

\- Database unavailable

\- Corrupted configuration

\- Security-sensitive failure

\- Backup failure before migration

\- Application cannot start

---

# 5. Default Log Level

Recommended defaults:

| Environment | Log Level |

|---|---|

| Development | DEBUG or INFO |

| Pilot | INFO |

| Production | INFO |

| Incident investigation | Temporarily DEBUG with approval |

Environment variable:

```dotenv

LOG\_LEVEL=INFO

```

Do not leave DEBUG enabled permanently in pilot or production.

---

# 6. Log Output

Recommended output channels:

\- Console output

\- Rotating application log file

Console logging supports:

\- Local development

\- Container logging

\- Cloud platform logs

\- Immediate operator visibility

File logging supports:

\- Local pilot troubleshooting

\- Support Diagnostics

\- Incident review

\- Evidence collection

---

# 7. Log Directory

Recommended backend log directory:

```text

C:\\Projects\\mine-manager-ai\\backend\\logs

```

Environment variable:

```dotenv

LOG\_DIR=C:\\Projects\\mine-manager-ai\\backend\\logs

```

The directory must:

\- Exist

\- Be writable by the backend process

\- Be excluded from Git

\- Have sufficient disk space

\- Follow customer retention requirements

Recommended `.gitignore` entries:

```text

backend/logs/

\*.log

```

---

# 8. Log File Naming

Recommended application log:

```text

mine\_manager\_ai.log

```

Rotated files may use:

```text

mine\_manager\_ai.log.1

mine\_manager\_ai.log.2

mine\_manager\_ai.log.3

```

or date-based names:

```text

mine\_manager\_ai\_2026-08-05.log

```

---

# 9. Rotation

Recommended pilot configuration:

\- Maximum file size: 10 MB

\- Backup files retained: 10

\- Rotation type: size-based or daily

\- Compression: optional

Example environment variables:

```dotenv

LOG\_MAX\_BYTES=10485760

LOG\_BACKUP\_COUNT=10

```

Recommended production configuration may use:

\- Daily rotation

\- Central log collection

\- Longer retention

\- Customer-approved archive storage

---

# 10. Retention

Suggested pilot retention:

| Log Type | Retention |

|---|---|

| Application logs | 30 days |

| Error logs | 90 days |

| Security logs | According to customer policy |

| Audit Trail | According to customer policy |

| Incident evidence | Until incident closure and approval |

Customer legal and cybersecurity requirements take precedence.

---

# 11. Log Format

Recommended text format:

```text

timestamp level logger request\_id user\_id route message

```

Example:

```text

2026-08-05T14:35:21Z INFO app.upload request\_id=abc123 user\_id=7 route=/api/upload/production upload completed

```

Recommended JSON format for centralized logging:

```json

{

&#x20; "timestamp": "2026-08-05T14:35:21Z",

&#x20; "level": "INFO",

&#x20; "logger": "app.upload",

&#x20; "request\_id": "abc123",

&#x20; "user\_id": 7,

&#x20; "route": "/api/upload/production",

&#x20; "message": "Upload completed"

}

```

---

# 12. Request IDs

Each API request should have a unique request ID.

Recommended sources:

\- Incoming `X-Request-ID`

\- Generated UUID when missing

The request ID should be:

\- Added to logs

\- Returned in the response header

\- Included in error responses where appropriate

\- Included in support cases

Example response header:

```text

X-Request-ID: 75f8b4c1-2df8-4d1c-8c88-4e72ef6fb7cb

```

---

# 13. Exception Logging

Unexpected exceptions should use:

```python

logger.exception(

&#x20;   "Unexpected error while processing request"

)

```

This records the stack trace on the server.

User-facing responses should not expose:

\- Stack traces

\- Database credentials

\- Internal file paths where avoidable

\- Raw SQL

\- Secret values

\- Full exception objects containing credentials

Recommended user response:

```json

{

&#x20; "detail": "An unexpected error occurred.",

&#x20; "request\_id": "abc123"

}

```

---

# 14. Authentication Logging

Allowed authentication events:

\- Login success

\- Login failure

\- Token validation failure

\- Access denied

\- Account disabled

\- Password reset requested

\- Password reset completed

Do not log:

\- Passwords

\- Password hashes

\- Access tokens

\- Refresh tokens

\- Authorization headers

\- Secret keys

---

# 15. Upload Logging

Recommended upload events:

\- Upload started

\- File type

\- Report type

\- User ID

\- Mine

\- Row count

\- Validation result

\- Upload completed

\- Upload failed

Do not log:

\- Full workbook contents

\- Confidential rows

\- Customer-sensitive values

\- Original file bytes

File names may be logged only when customer policy allows it.

---

# 16. Database Logging

Recommended database events:

\- Connection failure

\- Transaction failure

\- Migration status

\- Restore validation

\- Backup result

\- Query duration for slow queries

Do not log:

\- Database password

\- Full connection string

\- Secret query parameters

\- Sensitive customer values

---

# 17. AI-Service Logging

Recommended AI events:

\- Provider configured

\- Request started

\- Request completed

\- Request duration

\- Model name

\- Token usage where available

\- Failure type

\- Fallback used

Do not log:

\- API keys

\- Authorization headers

\- Full confidential prompts

\- Full confidential model responses

Where prompt logging is required for testing, use synthetic data only.

---

# 18. Frontend Logging

Frontend production behavior should:

\- Show user-friendly error messages

\- Avoid unnecessary `console.log`

\- Avoid exposing backend stack traces

\- Avoid logging access tokens

\- Avoid logging user passwords

\- Preserve a request ID where available

Allowed during development:

```javascript

console.error("Unable to load diagnostics", error);

```

Production should prefer controlled error reporting.

---

# 19. Sensitive Data Redaction

Sensitive terms include:

```text

password

passwd

secret

secret\_key

jwt

token

authorization

api\_key

apikey

db\_password

openai\_api\_key

azure\_openai\_api\_key

connection\_string

```

When a log line may contain one of these terms, redact the value.

Example:

```text

DB\_PASSWORD=\[REDACTED]

Authorization=\[REDACTED]

```

---

# 20. Prohibited Log Content

Never log:

\- Plain-text passwords

\- Password hashes

\- JWT secrets

\- JWT access tokens

\- Refresh tokens

\- Authorization headers

\- Database passwords

\- API keys

\- Azure credentials

\- OpenAI credentials

\- Full connection strings

\- Private encryption keys

\- Backup encryption keys

\- Full uploaded customer datasets

\- Confidential employee data

\- Safety-sensitive personal data unless approved

---

# 21. Logging Environment Variables

Recommended variables:

```dotenv

LOG\_LEVEL=INFO

LOG\_DIR=C:\\Projects\\mine-manager-ai\\backend\\logs

LOG\_FILE=mine\_manager\_ai.log

LOG\_MAX\_BYTES=10485760

LOG\_BACKUP\_COUNT=10

LOG\_TO\_CONSOLE=true

LOG\_TO\_FILE=true

```

Optional:

```dotenv

LOG\_FORMAT=text

REQUEST\_ID\_HEADER=X-Request-ID

```

---

# 22. Startup Logging

Recommended startup events:

\- Application name

\- Application version

\- Environment

\- Debug state

\- Log level

\- Log directory

\- Database connectivity result

\- Router registration completed

\- Migration status

\- Startup completed

Do not print secrets during startup.

---

# 23. Shutdown Logging

Recommended shutdown events:

\- Shutdown initiated

\- Background task stop result

\- Database engine disposal

\- Shutdown completed

---

# 24. Health and Diagnostics Logging

Recommended events:

\- System Health check failed

\- System Health degraded

\- Deployment Readiness failed

\- Support Diagnostics generated

\- Support Diagnostics download completed

\- Directory check failed

\- Disk-space warning

---

# 25. Logging and Audit Trail

Application logs and Audit Trail are different.

## Application Logs

Used for:

\- Technical errors

\- Exceptions

\- Performance

\- Runtime diagnostics

## Audit Trail

Used for:

\- User activity

\- Administrative changes

\- Configuration changes

\- Security-relevant business actions

Do not replace Audit Trail with application logs.

---

# 26. Pilot Deployment Recommendation

Minimum pilot logging configuration:

```dotenv

LOG\_LEVEL=INFO

LOG\_TO\_CONSOLE=true

LOG\_TO\_FILE=true

LOG\_DIR=C:\\Projects\\mine-manager-ai\\backend\\logs

LOG\_FILE=mine\_manager\_ai.log

LOG\_MAX\_BYTES=10485760

LOG\_BACKUP\_COUNT=10

```

Before pilot launch:

\- Create the log directory

\- Confirm write access

\- Confirm rotation

\- Confirm `.gitignore`

\- Trigger one test warning

\- Trigger one safe test error

\- Confirm Support Diagnostics can see the log file

\- Confirm sensitive values are redacted

---

# 27. Validation Checklist

\- \[ ] Log directory exists

\- \[ ] Backend process can write to log directory

\- \[ ] Console logging works

\- \[ ] File logging works

\- \[ ] INFO messages are recorded

\- \[ ] WARNING messages are recorded

\- \[ ] ERROR messages are recorded

\- \[ ] Rotation works

\- \[ ] Old files are retained correctly

\- \[ ] Request ID appears

\- \[ ] Exception stack trace appears server-side

\- \[ ] User response is sanitized

\- \[ ] Passwords are not logged

\- \[ ] Tokens are not logged

\- \[ ] API keys are not logged

\- \[ ] Support Diagnostics detects log files

\- \[ ] Git ignores log files

---

# 28. Known Version 1.0 Limitation

The Support Diagnostics Center can inspect existing log files, but centralized rotating file logging may not yet be fully enabled in every deployment.

When file logging is not configured, Support Diagnostics displays:

```text

Not Configured

```

This is a warning, not automatically a blocking failure.

---

# 29. Future Enhancements

Potential Version 2.0 enhancements:

\- Structured JSON logging

\- Central cloud log aggregation

\- OpenTelemetry tracing

\- Error-monitoring integration

\- Automated alerts

\- Log-search dashboard

\- Request performance analytics

\- Correlation across frontend and backend

\- Automatic incident creation

---

# Revision History

| Version | Date | Description |

|---|---|---|

| 1.0 | August 2026 | Initial Logging Configuration standard |

---

\*\*End of Logging Configuration\*\*

