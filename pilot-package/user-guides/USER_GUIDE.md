# Mine Manager AI Version 1.0

# User Guide

---

# Document Information

| Item | Value |

|---|---|

| Product | Mine Manager AI |

| Version | 1.0 |

| Document | User Guide |

| Audience | General Managers, Mine Managers, Superintendents, Viewers |

| Status | Pilot Release |

| Last Updated | August 2026 |

---

# 1. Purpose

This guide explains how day-to-day users access and use Mine Manager AI Version 1.0 during a customer pilot.

It focuses on operational and executive workflows rather than system administration.

Typical users include:

\- General Managers

\- Mine Managers

\- Superintendents

\- Operational Leaders

\- Technical Services Leaders

\- Viewers

---

# 2. What Mine Manager AI Does

Mine Manager AI converts operational data into executive decision support.

The application helps users:

\- Review Mine Health

\- Monitor Production

\- Monitor Fleet

\- Monitor Plant

\- Monitor Safety

\- Review AI Executive Insights

\- Review Predictive Intelligence

\- Track Executive Actions

\- Generate Executive Reports

\- Review historical trends

\- Support daily and weekly operational meetings

Mine Manager AI is a decision-support platform.

It does not directly control mining equipment, plant control systems, dispatch systems, or safety-critical systems.

All operational decisions remain the responsibility of authorized personnel.

---

# 3. Supported User Roles

## General Manager

Typical access includes:

\- Executive Dashboard

\- Executive Insights

\- Predictive Intelligence

\- Executive Actions

\- Executive Reports

\- Approved configuration functions

\- System Health where permitted

## Mine Manager

Typical access includes:

\- Dashboard

\- Operational KPIs

\- Executive Actions

\- Reports

\- Data review

\- Mine-management workflows

## Superintendent

Typical access includes:

\- Operational pages

\- Data upload where approved

\- Executive Actions

\- Reports

\- Department-level review

## Viewer

Typical access includes:

\- Read-only dashboard access

\- Read-only operational information

\- Read-only report history where permitted

Viewer accounts cannot perform protected write actions.

---

# 4. Login

Open the Mine Manager AI application using the approved frontend address.

Local example:

```text

http://localhost:5173

```

Enter:

\- Email

\- Password

Then select Login.

If login fails:

\- Confirm the email address

\- Confirm the password

\- Confirm the account is active

\- Confirm the backend is available

\- Contact an Administrator if access remains unavailable

---

# 5. Main Navigation

The current Version 1.0 navigation includes:

\- Dashboard

\- Upload Reports

\- Production

\- Fleet

\- Plant

\- Safety

\- Executive Actions

\- Executive Reports

\- User Management

\- Audit Trail

\- System Health

\- Security Center

\- Settings

The pages visible to each user may depend on role and authorization.

---

# 6. Dashboard

The Dashboard is the main executive operations view.

It may display:

\- Mine Health Score

\- Production performance

\- Fleet performance

\- Plant performance

\- Safety performance

\- Operational risks

\- Priority actions

\- AI Executive Insights

\- Predictive Intelligence

\- Historical trends

\- Current mine and reporting date

Use the Dashboard to answer:

\- Is the mine operating on target?

\- Which KPI is below plan?

\- What is driving the current performance?

\- What operational risk requires attention?

\- What action should be prioritized?

\- Is Mine Health improving or declining?

---

# 7. Mine Health

Mine Health summarizes the overall condition of the operation.

It combines information from major operational areas such as:

\- Production

\- Fleet

\- Plant

\- Safety

Mine Health should be interpreted together with supporting KPI details.

A high score does not remove the need to review critical risks.

A lower score should prompt users to review:

\- Underperforming KPIs

\- Risk drivers

\- Current actions

\- AI insights

\- Predictive trends

---

# 8. Production

The Production page supports review of:

\- Ore plan

\- Ore actual

\- Waste plan

\- Waste actual

\- Performance against plan

\- Historical trend

Use this page to identify:

\- Production shortfalls

\- Over-performance

\- Repeated underperformance

\- Changes in daily output

\- Variance between plan and actual

Before taking action, confirm the uploaded source data and reporting date.

---

# 9. Fleet

The Fleet page supports review of:

\- Fleet availability

\- Fleet utilization

\- Historical trend

\- Operational underperformance

Fleet sample uploads currently include:

\- `report\_date`

\- `truck\_id`

\- `availability`

\- `utilization`

Use this page to identify:

\- Low availability

\- Low utilization

\- Repeated poor fleet performance

\- Potential maintenance or operating constraints

---

# 10. Plant

The Plant page supports review of:

\- Throughput plan

\- Throughput actual

\- Recovery

\- Historical trend

Use this page to identify:

\- Throughput shortfall

\- Recovery decline

\- Repeated plant underperformance

\- Performance differences between plan and actual

Confirm that units and KPI definitions match the approved customer configuration.

---

# 11. Safety

The Safety page supports review of:

\- Incidents

\- Near misses

\- Critical risks

\- Safety score

\- Historical trend

Safety information must be interpreted according to customer-approved definitions.

Mine Manager AI does not replace statutory reporting or formal safety systems.

Any critical safety risk must follow the customerâ€™s approved safety process.

---

# 12. Upload Reports

The Daily Data Center supports upload of:

\- Production Report

\- Fleet Report

\- Plant Report

\- Safety Report

The system validates required columns before upload.

The upload process includes:

\- File selection

\- Column validation

\- Authentication validation

\- Upload progress

\- Success or error message

\- Upload history

\- Data completeness percentage

Uploads require an authenticated user with an approved role.

---

# 13. Required Upload Columns

## Production

```text

report\_date

ore\_plan

ore\_actual

waste\_plan

waste\_actual

```

## Fleet

```text

report\_date

truck\_id

availability

utilization

```

## Plant

```text

report\_date

throughput\_plan

throughput\_actual

recovery

```

## Safety

```text

report\_date

incidents

near\_misses

critical\_risks

safety\_score

```

Do not rename required columns.

---

# 14. Upload Workflow

To upload a report:

1\. Open Upload Reports.

2\. Select the correct report card.

3\. Drag the Excel file into the upload area, or click to browse.

4\. Wait for column validation.

5\. Wait for upload progress to complete.

6\. Confirm the success message.

7\. Review Upload History.

8\. Confirm dashboard values update.

If an error appears, read the message before trying again.

---

# 15. Data Completeness

The Daily Data Center displays a Data Completeness percentage.

The percentage is based on the number of required report types uploaded successfully.

Example:

\- One report uploaded: 25%

\- Two reports uploaded: 50%

\- Three reports uploaded: 75%

\- Four reports uploaded: 100%

A complete upload set does not automatically guarantee data quality.

Users must still confirm:

\- Correct reporting date

\- Correct units

\- Correct mine

\- Correct source values

\- Correct KPI results

---

# 16. AI Daily Briefing Button

The Upload Reports page includes a Generate AI Daily Briefing button.

In the current implementation, the button is a placeholder and does not yet generate the final briefing workflow.

It becomes active after all required reports are uploaded successfully.

Do not represent this placeholder as a completed customer-facing briefing function until the integration is finalized.

---

# 17. Executive AI Insights

Executive AI Insights help users interpret current operational performance.

Insights may include:

\- KPI movement

\- Operational risk

\- Possible driver

\- Recommended action

\- Executive priority

Users should review the supporting data before acting.

AI insights are decision support, not guaranteed facts or automated operating instructions.

---

# 18. Predictive Intelligence

Predictive Intelligence supports forward-looking review of:

\- Mine Health trend

\- KPI direction

\- Forecast horizon

\- Confidence

\- Potential future underperformance

Use predictions to support planning discussions.

Do not use forecasts as the only basis for safety-critical or production-control decisions.

---

# 19. Executive Actions

The Executive Action Center supports:

\- Creating actions

\- Editing actions

\- Assigning owners

\- Recording timing

\- Updating status

\- Linking actions to KPI context

\- Tracking progress

Typical action statuses may include:

\- Open

\- Assigned

\- In Progress

\- Completed

Authorized operational roles can create or update actions.

Read-only users may have view access only.

---

# 20. Executive Reports

The Executive Reports page supports management reporting such as:

\- Daily Executive Report

\- Weekly Operations Report

\- Monthly KPI Pack

\- PDF export

\- Excel export

Before distributing a report, confirm:

\- Company branding

\- Mine name

\- Reporting period

\- KPI values

\- Confidentiality classification

\- Intended recipients

---

# 21. Report History

Report History allows users to review previously generated reports where available.

Use it to confirm:

\- Report type

\- Reporting period

\- Generation date

\- User

\- File availability

\- Status

Do not distribute outdated reports without clearly stating the reporting period.

---

# 22. Audit Trail

The Audit Trail records administrative and operational activity.

Depending on permissions, users may review:

\- Login events

\- User changes

\- Configuration changes

\- Upload activity

\- Report activity

\- Executive Action activity

\- Security-related activity

Audit Trail access is restricted according to role.

---

# 23. System Health

System Health shows the operational condition of Mine Manager AI services.

It may include:

\- Backend status

\- Database status

\- AI-service status

\- Storage status

\- Latency

\- Incidents

\- Health history

General Manager or Administrator access may be required.

Report critical failures to the support contact.

---

# 24. Security Center

The Security Center shows deployment-readiness and security-configuration checks.

It may include:

\- Readiness score

\- Passed checks

\- Warnings

\- Failed checks

\- Secret-key status

\- Debug mode

\- Database configuration

\- CORS

\- HTTPS

\- Logging

\- Demo Mode

\- Dependency checks

Administrative access may be required.

---

# 25. Settings

Settings may include:

\- Company

\- Mine

\- Branding

\- Logo

\- Timezone

\- Language

\- Shift patterns

\- KPI targets

\- Alert thresholds

General Manager or Administrator access is generally required for protected configuration changes.

All authenticated users may be able to view selected configuration.

---

# 26. Typical Daily Workflow

A recommended daily workflow is:

1\. Confirm the correct mine and date.

2\. Upload Production data.

3\. Upload Fleet data.

4\. Upload Plant data.

5\. Upload Safety data.

6\. Confirm all uploads succeed.

7\. Review Data Completeness.

8\. Open Dashboard.

9\. Review Mine Health.

10\. Review KPI exceptions.

11\. Review AI Executive Insights.

12\. Review Predictive Intelligence.

13\. Update Executive Actions.

14\. Generate or review the Daily Executive Report.

15\. Escalate critical issues through the approved process.

---

# 27. Typical Weekly Workflow

A recommended weekly workflow is:

1\. Review weekly KPI trends.

2\. Review repeated underperformance.

3\. Review unresolved risks.

4\. Review Executive Action progress.

5\. Review predictive trends.

6\. Generate the Weekly Operations Report.

7\. Confirm data quality with KPI owners.

8\. Record decisions and follow-up actions.

9\. Review pilot success measures.

---

# 28. Data Quality Responsibilities

Users should verify:

\- Correct source file

\- Correct reporting date

\- Correct column names

\- Correct units

\- Correct mine assignment

\- Correct plan values

\- Correct actual values

\- Correct percentage format

\- No confidential information is included unintentionally

A successful upload means the file passed technical validation.

It does not automatically mean every value is operationally correct.

---

# 29. Common Error Messages

## Not authenticated

Meaning:

The login session is missing or expired.

Action:

Log out, log back in, and retry.

## Missing columns

Meaning:

The uploaded file does not contain all required headers.

Action:

Use the approved template and correct the header row.

## Unsupported file

Meaning:

The selected file type is not accepted.

Action:

Use an approved Excel or CSV file.

## Upload failed

Meaning:

The backend rejected or could not process the upload.

Action:

Review the detailed message and contact support if needed.

## No data available

Meaning:

No data exists for the selected mine or reporting period.

Action:

Confirm the upload, mine assignment, and date range.

---

# 30. Best Practices

\- Use approved templates.

\- Do not rename required columns.

\- Confirm the reporting date before upload.

\- Review dashboard values after upload.

\- Review AI insights together with source data.

\- Keep Executive Actions current.

\- Confirm report periods before distribution.

\- Do not share login accounts.

\- Report system errors promptly.

\- Follow customer safety and operating procedures.

---

# 31. Limitations

Mine Manager AI Version 1.0 does not currently provide:

\- Direct equipment control

\- Direct SCADA control

\- Direct dispatch integration by default

\- Direct SAP integration by default

\- Autonomous operating decisions

\- Replacement of statutory safety reporting

\- Final integrated AI Daily Briefing from the Upload Reports button

Customer-specific integrations require separate approval and development.

---

# 32. Support Request Information

When reporting an issue, provide:

\- Your name

\- Your role

\- Company

\- Mine

\- Date and time

\- Page or feature

\- Expected result

\- Actual result

\- Error message

\- Screenshot

\- File name where relevant

\- Business impact

\- Urgency

Do not send passwords, secret keys, or database credentials.

---

# 33. User Acceptance

A user is ready for the pilot when they can:

\- Log in

\- Open the Dashboard

\- Identify Mine Health

\- Review KPI performance

\- Upload an approved file where authorized

\- Review AI Insights

\- Review Predictive Intelligence

\- Review or update Executive Actions where authorized

\- Generate or download reports where authorized

\- Report an issue correctly

---

# Revision History

| Version | Date | Description |

|---|---|---|

| 1.0 | August 2026 | Initial User Guide for Pilot Release |

---

\*\*End of User Guide\*\*

