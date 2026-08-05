# Mine Manager AI Version 1.0

# Administrator Guide

---

# Document Information

| Item | Value |

|------|-------|

| Product | Mine Manager AI |

| Version | 1.0 |

| Document | Administrator Guide |

| Audience | System Administrators, IT Administrators, Mine Managers |

| Status | Pilot Release |

| Last Updated | August 2026 |

---

# 1. Purpose

This guide explains how to install, configure, administer, maintain, and support Mine Manager AI Version 1.0 during customer pilot deployments.

It is intended for personnel responsible for maintaining the application and ensuring reliable operation.

Typical readers include:

\- System Administrators

\- IT Administrators

\- Database Administrators

\- Mine Managers

\- General Managers

\- Pilot Delivery Teams

---

# 2. System Overview

Mine Manager AI is an executive operational intelligence platform designed for mining operations.

The platform transforms operational data into executive decision support through dashboards, AI insights, KPI monitoring, reporting, and operational analytics.

Current Version 1.0 capabilities include:

\- Executive Dashboard

\- Production Monitoring

\- Fleet Monitoring

\- Plant Monitoring

\- Safety Monitoring

\- Executive KPI Analysis

\- Executive AI Insights

\- Predictive Intelligence

\- Executive Action Center

\- Executive Reports

\- User Management

\- Audit Trail

\- System Health

\- Security Configuration Center

\- Deployment Readiness Assessment

---

# 3. System Architecture

Mine Manager AI consists of three major components.

## Frontend

\- React

\- Vite

\- Material UI

\- Axios

Responsible for:

\- Dashboard

\- User Interface

\- Reports

\- Configuration

---

## Backend

\- FastAPI

\- SQLAlchemy

\- JWT Authentication

\- REST API

Responsible for:

\- Business Logic

\- Authentication

\- Data Validation

\- AI Services

\- Reporting

---

## Database

\- PostgreSQL

Stores:

\- Production Data

\- Fleet Data

\- Plant Data

\- Safety Data

\- Users

\- Executive Actions

\- Configuration

\- Audit Logs

---

# 4. Administrator Responsibilities

Administrators are responsible for:

\- Installing Mine Manager AI

\- Maintaining application availability

\- Managing users

\- Managing permissions

\- Configuring company settings

\- Configuring mine settings

\- Monitoring system health

\- Monitoring security

\- Reviewing audit logs

\- Managing backups

\- Supporting users

\- Deploying updates

---

# 5. Login

Open the application.

Example:

```

http://localhost:5173

```

Enter:

\- Email

\- Password

Administrator accounts have unrestricted access to administrative modules.

---

# 6. Dashboard

The Executive Dashboard provides a real-time operational overview.

Displayed information includes:

\- Mine Health Score

\- Production KPI

\- Fleet KPI

\- Plant KPI

\- Safety KPI

\- AI Executive Insights

\- Executive Actions

\- Operational Trends

Administrators should verify dashboard data updates correctly after daily uploads.

---

# 7. User Roles

Supported roles include:

| Role | Description |

|------|-------------|

| Administrator | Full system access |

| General Manager | Executive decision support |

| Mine Manager | Operational management |

| Superintendent | Department supervision |

| Viewer | Read-only access |

Always apply the Principle of Least Privilege.

---

# 8. User Management

Administrators can:

\- Create users

\- Edit users

\- Disable users

\- Enable users

\- Reset passwords

\- Assign roles

\- Update user information

Recommendations:

\- Remove inactive users.

\- Review user roles regularly.

\- Restrict Administrator accounts.

---

# 9. Company Configuration

Configure:

\- Company Name

\- Mine Name

\- Company Logo

\- Primary Color

\- Secondary Color

\- Language

\- Timezone

Branding changes automatically appear throughout the application.

---

# 10. Mine Configuration

Administrators configure:

\- Mine Information

\- Shift Pattern

\- KPI Targets

\- Alert Thresholds

\- Operating Calendar

Review configuration before pilot deployment.

---

# 11. Daily Upload Process

Daily operational reports include:

\- Production

\- Fleet

\- Plant

\- Safety

Uploaded Excel files are validated before being stored.

Verify:

\- Correct template

\- Required columns

\- Reporting date

\- Data quality

---

# 12. Executive Reports

Administrators can generate:

\- Daily Executive Report

\- Weekly Operations Report

\- Monthly KPI Report

\- Executive KPI PDF

\- Excel Export

Before distributing reports verify:

\- Company branding

\- Reporting period

\- KPI accuracy

\- Executive summary

---

# 13. Executive Action Center

Administrators can:

\- Review Executive Actions

\- Update status

\- Assign owners

\- Track progress

\- Monitor completion

Recommended workflow:

Open → Assigned → In Progress → Completed

---

# 14. Audit Trail

Audit Trail records:

\- User logins

\- User updates

\- Configuration changes

\- Upload activity

\- Report generation

\- Administrative actions

Administrators should review audit logs regularly.

---

# 15. System Health

The System Health page monitors:

\- Backend Status

\- Database Status

\- Storage

\- API Response

\- AI Service Availability

\- Overall Health

Investigate any warning or failed checks immediately.

---

# 16. Security Configuration Center

Security Center validates:

\- Authentication

\- JWT Configuration

\- Secret Keys

\- Database Configuration

\- Debug Mode

\- HTTPS Readiness

\- CORS Configuration

\- Dependency Checks

\- Deployment Readiness

Resolve critical issues before customer deployment.

---

# 17. Deployment Readiness

Deployment Readiness evaluates:

\- Infrastructure

\- Security

\- Configuration

\- Dependencies

\- Environment Variables

\- Database

\- Authentication

\- Logging

A deployment should not proceed while critical issues remain.

---

# 18. Backup Strategy

Recommended backup schedule:

## Daily

\- PostgreSQL Database

## Weekly

\- Uploaded Reports

\- Configuration

\- Company Branding

## Before Updates

\- Complete Database Backup

\- Configuration Backup

\- Application Backup

---

# 19. Restore Procedure

If recovery is required:

1\. Stop backend service.

2\. Restore PostgreSQL database.

3\. Restore uploaded files.

4\. Restore configuration.

5\. Restart backend.

6\. Verify System Health.

7\. Verify Dashboard.

8\. Verify Reports.

---

# 20. Log Monitoring

Administrators should regularly review:

\- Backend Logs

\- Upload Errors

\- Authentication Failures

\- Database Errors

\- AI Service Errors

Critical errors should be investigated immediately.

---

# 21. Performance Monitoring

Monitor:

\- Dashboard loading time

\- Upload duration

\- Database response time

\- API latency

\- PDF generation time

Investigate unusual performance degradation.

---

# 22. Maintenance Tasks

Daily

\- Review uploads

\- Check dashboard

\- Review system health

Weekly

\- Review audit logs

\- Review failed uploads

\- Verify backups

Monthly

\- Review users

\- Review security settings

\- Review KPI configuration

\- Test restore procedure

---

# 23. Common Problems

## Login Failure

Possible causes:

\- Incorrect password

\- Disabled account

\- Expired JWT

\- Backend unavailable

---

## Dashboard Not Loading

Check:

\- Backend service

\- Database connection

\- API availability

---

## Upload Failure

Verify:

\- Correct template

\- Required columns

\- Excel format

\- Authentication

---

## Reports Not Generating

Check:

\- Database availability

\- Report service

\- Uploaded data

\- Required permissions

---

## AI Features Unavailable

Check:

\- AI configuration

\- Environment variables

\- External AI service connectivity

---

# 24. Security Best Practices

\- Use strong passwords.

\- Restrict Administrator accounts.

\- Rotate secrets regularly.

\- Review Audit Trail.

\- Keep software updated.

\- Validate uploaded data.

\- Protect database credentials.

\- Never store secrets in Git.

---

# 25. Pilot Acceptance Checklist

Before customer acceptance verify:

\- All pages load successfully.

\- Dashboard displays current data.

\- Upload process works.

\- Reports generate correctly.

\- AI Insights operate correctly.

\- Predictive Intelligence functions correctly.

\- Executive Actions work.

\- User Management works.

\- Audit Trail records events.

\- Security Center passes required checks.

\- Deployment Readiness passes required checks.

---

# 26. Support Information

If issues cannot be resolved:

Collect:

\- Error message

\- Screenshot

\- Backend logs

\- Browser console logs

\- Audit records

\- System Health status

Provide this information to the Mine Manager AI support team.

---

# 27. Administrator Best Practices

\- Review uploads every day.

\- Monitor System Health.

\- Monitor Security Center.

\- Review Audit Trail weekly.

\- Backup the database regularly.

\- Test restores periodically.

\- Remove inactive accounts.

\- Review user permissions.

\- Verify KPI targets after configuration changes.

\- Validate reports before executive distribution.

---

# Revision History

| Version | Date | Description |

|----------|------|-------------|

| 1.0 | August 2026 | Initial Administrator Guide for Pilot Release |

---

\*\*End of Administrator Guide\*\*

