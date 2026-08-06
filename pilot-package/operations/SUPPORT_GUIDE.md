# Mine Manager AI Version 1.0

# Support Guide

---

# Document Information

| Item | Value |

|---|---|

| Product | Mine Manager AI |

| Version | 1.0 |

| Document | Support Guide |

| Audience | Customer Users, Administrators, Technical Support, Pilot Delivery Team |

| Status | Pilot Release |

| Last Updated | August 2026 |

---

# 1. Purpose

This guide defines how customer users, administrators, and the Mine Manager AI delivery team should request, manage, investigate, and close support cases during a controlled pilot.

The guide covers:

\- Support channels

\- Support responsibilities

\- Severity classification

\- Evidence requirements

\- Response expectations

\- Escalation

\- Diagnostics collection

\- Customer communication

\- Case closure

---

# 2. Support Scope

Pilot support includes:

\- Login and access problems

\- Role and authorization issues

\- Company and mine configuration

\- Data-upload errors

\- Dashboard and KPI problems

\- AI Executive Insights issues

\- Predictive Intelligence issues

\- Executive Actions issues

\- Executive Report generation

\- Audit Trail issues

\- System Health issues

\- Deployment Readiness issues

\- Support Diagnostics issues

\- Backup and restore issues

\- Documentation questions

Pilot support does not automatically include:

\- New feature development

\- Customer-specific integrations

\- Direct dispatch integration

\- Direct SCADA integration

\- Equipment-control integration

\- Mobile application development

\- Version 2.0 features

\- On-site support unless separately agreed

\- Data cleansing outside the agreed pilot scope

---

# 3. Support Roles

## Customer User

Responsibilities:

\- Follow approved workflows

\- Use approved templates

\- Record clear error details

\- Avoid sharing passwords or tokens

\- Report issues promptly

\- Confirm whether a resolution worked

## Customer Administrator

Responsibilities:

\- Manage users and roles

\- Confirm configuration

\- Review System Health

\- Review Support Diagnostics

\- Collect approved evidence

\- Coordinate customer-side actions

\- Approve escalation where required

## Customer Pilot Manager

Responsibilities:

\- Confirm business priority

\- Confirm operational impact

\- Approve workarounds

\- Coordinate customer communication

\- Approve pilot extensions or scope changes

## Mine Manager AI Technical Support

Responsibilities:

\- Review evidence

\- Reproduce the problem

\- Identify root cause

\- Recommend resolution

\- Record defects

\- Validate fixes

\- Protect customer information

## Mine Manager AI Delivery Lead

Responsibilities:

\- Manage major escalations

\- Coordinate technical and commercial response

\- Confirm release or deployment decisions

\- Approve high-risk corrective actions

---

# 4. Support Channels

Approved support channels should be recorded for each pilot.

| Channel | Details |

|---|---|

| Primary email | |

| Customer pilot contact | |

| Mine Manager AI support contact | |

| Emergency contact | |

| Meeting channel | |

| File-transfer method | |

| Ticket or case system | |

Do not send passwords, tokens, API keys, database passwords, or full confidential datasets by ordinary email.

---

# 5. Support Hours

Record agreed pilot support hours:

| Item | Value |

|---|---|

| Support timezone | |

| Business days | |

| Business hours | |

| Critical support availability | |

| Planned maintenance window | |

| Public holidays | |

Support expectations must be agreed before pilot launch.

---

# 6. Severity Levels

| Severity | Definition |

|---|---|

| Critical | Full outage, security incident, data corruption, or unsafe system state |

| High | Major capability unavailable for multiple users |

| Medium | One capability or one user significantly affected |

| Low | Non-blocking problem, question, or usability issue |

---

# 7. Priority Examples

## Critical

Examples:

\- Application unavailable for all users

\- Database unavailable

\- Suspected credential exposure

\- Suspected data corruption

\- Backup failure before a database change

\- Restore failure during an approved recovery event

## High

Examples:

\- Upload unavailable for multiple users

\- Dashboard unavailable

\- Executive Reports unavailable

\- Authentication unavailable for several users

\- System Health reports a blocking failure

## Medium

Examples:

\- One report type fails

\- One user cannot access a permitted page

\- One KPI appears incorrect

\- Predictive Intelligence unavailable

\- Support Diagnostics download fails

## Low

Examples:

\- Documentation question

\- Formatting issue

\- Minor usability problem

\- Non-blocking warning

\- Enhancement request

---

# 8. Response Targets

Recommended pilot targets:

| Severity | Initial Response Target | Status Update |

|---|---|---|

| Critical | Immediate or within 30 minutes | Every 30 to 60 minutes |

| High | Within 1 hour | Every 2 hours |

| Medium | Same business day | Daily |

| Low | Within 2 business days | As agreed |

These are pilot targets, not formal commercial service-level commitments unless included in a signed agreement.

---

# 9. Support Request Information

Every support request should include:

\- Customer organization

\- Mine name

\- User name or email

\- User role

\- Date and time

\- Page or endpoint

\- Expected result

\- Actual result

\- Error message

\- HTTP status where available

\- Request ID where available

\- Screenshot

\- Business impact

\- Steps already attempted

\- Relevant diagnostics evidence

---

# 10. Information That Must Not Be Shared

Do not share:

\- Passwords

\- Password hashes

\- Access tokens

\- Refresh tokens

\- JWT secrets

\- Authorization headers

\- Database passwords

\- API keys

\- Full connection strings

\- Private keys

\- Backup encryption keys

\- Full confidential customer datasets without approval

---

# 11. Support Diagnostics

Administrators can use:

```text

/support-diagnostics

```

Backend endpoints:

```text

GET /api/support-diagnostics

GET /api/support-diagnostics/summary

GET /api/support-diagnostics/download

```

Support Diagnostics may provide:

\- Application information

\- Database status

\- PostgreSQL version

\- Alembic revision

\- Storage status

\- Runtime-directory checks

\- System Health result

\- Deployment Readiness result

\- Log status

\- Dependency versions

Review the downloaded JSON before external sharing.

---

# 12. Diagnostics Collection Script

Windows pilot environments may use:

```text

pilot-package\\operations\\diagnostics-scripts\\collect\_diagnostics.bat

```

The script creates a timestamped folder under:

```text

support-diagnostics\\

```

Typical files include:

\- `system\_information.txt`

\- `python\_environment.txt`

\- `node\_environment.txt`

\- `git\_information.txt`

\- `support\_diagnostics.json`

\- `alembic\_status.txt`

\- `log\_inventory.txt`

\- `runtime\_directories.txt`

\- `sensitive\_name\_scan.txt`

\- `collection\_result.txt`

Generated diagnostic folders must not be committed to Git.

---

# 13. Standard Troubleshooting Order

Use this order:

1\. Confirm the issue.

2\. Confirm the affected user.

3\. Confirm the affected mine.

4\. Confirm the reporting date.

5\. Check the browser message.

6\. Check the API response.

7\. Check System Health.

8\. Check Deployment Readiness.

9\. Check Support Diagnostics.

10\. Review logs.

11\. Confirm database connectivity.

12\. Confirm Alembic revision.

13\. Reproduce safely.

14\. Record the resolution.

---

# 14. Login and Access Issues

Check:

\- Correct email

\- Correct password

\- Account status

\- User role

\- Token expiry

\- Backend availability

\- Database availability

Never ask the user to send their password.

---

# 15. Data Upload Issues

Check:

\- Correct report type

\- Approved workbook template

\- Required columns

\- Data types

\- Percentage ranges

\- Duplicate mine/date records

\- `truck\_id` for Fleet

\- Upload History

\- User authorization

Do not modify customer source data without approval.

---

# 16. Dashboard and KPI Issues

Validate in this order:

1\. Source workbook

2\. Upload result

3\. Database value

4\. KPI calculation

5\. Dashboard display

6\. Executive Report output

Record:

\- Mine

\- Date range

\- KPI name

\- Expected value

\- Actual value

\- Source evidence

---

# 17. AI Executive Insights Issues

Check:

\- Operational data availability

\- Selected mine

\- Selected reporting period

\- AI provider configuration

\- Backend service result

\- Fallback behavior

\- User-safe error message

AI outputs are decision-support information. Authorized customer personnel remain responsible for operational decisions.

---

# 18. Predictive Intelligence Issues

Check:

\- Historical data length

\- Missing dates

\- Missing KPI values

\- Selected mine

\- Forecast horizon

\- Confidence output

\- Backend exception

\- Insufficient-data handling

Forecast accuracy depends on data quality and historical coverage.

---

# 19. Executive Report Issues

Check:

\- Required data exists

\- Reporting period

\- Mine selection

\- Company branding

\- Logo path

\- Output directory

\- Browser download permissions

\- Report History

\- Backend logs

---

# 20. Backup and Restore Support

Before database changes:

\- Create a backup

\- Verify the archive

\- Record the file name and size

\- Confirm available disk space

\- Use a temporary database for restore testing

Never restore over the active pilot database without written approval.

---

# 21. Incident Escalation

Escalate when:

\- Severity is Critical

\- Security exposure is suspected

\- Data corruption is suspected

\- Multiple users are affected

\- A workaround is unavailable

\- A fix requires a database change

\- A fix requires a new deployment

\- Customer acceptance is at risk

Follow:

```text

pilot-package\\operations\\INCIDENT\_RESPONSE.md

```

---

# 22. Workarounds

A workaround must:

\- Be documented

\- Be safe

\- Be approved by the responsible owner

\- Avoid data loss

\- Avoid bypassing security

\- Include an expiry or review date

\- Be linked to a defect or action

---

# 23. Customer Communication

Each major support update should include:

\- Current status

\- Business impact

\- Work completed

\- Current findings

\- Workaround

\- Next action

\- Owner

\- Next update time

Avoid speculative or unverified conclusions.

---

# 24. Case Record

| Field | Value |

|---|---|

| Case ID | |

| Customer | |

| Mine | |

| Date opened | |

| Reported by | |

| Severity | |

| Affected capability | |

| Business impact | |

| Expected result | |

| Actual result | |

| Evidence location | |

| Root cause | |

| Workaround | |

| Resolution | |

| Date resolved | |

| Customer confirmation | |

| Closed by | |

---

# 25. Case Closure Criteria

A case may be closed when:

\- \[ ] Root cause is understood or formally accepted

\- \[ ] Resolution is applied

\- \[ ] Validation passes

\- \[ ] Customer confirms the result

\- \[ ] Evidence is stored

\- \[ ] Related defect is updated

\- \[ ] Related action is updated

\- \[ ] Documentation is updated where required

\- \[ ] Follow-up date is recorded where required

---

# 26. Support Metrics

Recommended pilot metrics:

\- Number of support cases

\- Cases by severity

\- Initial response time

\- Resolution time

\- Reopened cases

\- Upload-related cases

\- Authentication-related cases

\- Report-related cases

\- AI-related cases

\- Customer satisfaction

\- Repeated root causes

---

# 27. Pilot Support Review

At least weekly, review:

\- Open cases

\- Critical and High issues

\- Repeated issues

\- Outstanding actions

\- Data-quality problems

\- Documentation gaps

\- User-training needs

\- Acceptance-test risks

\- Commercial risks

---

# 28. Known Version 1.0 Support Limitations

Version 1.0 may not include:

\- 24/7 commercial support

\- Formal SLA commitments

\- Centralized cloud log aggregation

\- Automatic ticket creation

\- SIEM integration

\- Remote device management

\- Direct production-system support

\- Mobile application support

\- Version 2.0 features

These require separate commercial scope where applicable.

---

# 29. Final Support Readiness Checklist

\- \[ ] Support contacts agreed

\- \[ ] Support hours agreed

\- \[ ] Severity definitions agreed

\- \[ ] Response targets agreed

\- \[ ] File-transfer method agreed

\- \[ ] Support Diagnostics tested

\- \[ ] Diagnostics script tested

\- \[ ] Error Catalog complete

\- \[ ] Logging Configuration complete

\- \[ ] Incident Response complete

\- \[ ] Troubleshooting Guide complete

\- \[ ] Backup and Restore Guide complete

\- \[ ] Security Review complete

\- \[ ] Customer administrator trained

---

# Revision History

| Version | Date | Description |

|---|---|---|

| 1.0 | August 2026 | Initial Support Guide |

---

**End of Support Guide**

