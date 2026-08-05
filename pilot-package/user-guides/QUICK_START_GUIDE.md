# Mine Manager AI Version 1.0

# Quick Start Guide

---

# Document Information

| Item | Value |

|---|---|

| Product | Mine Manager AI |

| Version | 1.0 |

| Document | Quick Start Guide |

| Audience | Pilot Users |

| Status | Pilot Release |

| Last Updated | August 2026 |

---

# 1. Purpose

This guide provides the minimum steps required to begin using Mine Manager AI Version 1.0 during a customer pilot.

Use this guide for:

\- First login

\- Daily report upload

\- Dashboard review

\- Executive Action review

\- Executive Report generation

\- Basic troubleshooting

For more detail, refer to:

\- `USER\_GUIDE.md`

\- `ADMINISTRATOR\_GUIDE.md`

\- `DATA\_UPLOAD\_GUIDE.md`

\- `TROUBLESHOOTING.md`

---

# 2. Before You Begin

Confirm that you have:

\- An active Mine Manager AI user account

\- The approved application URL

\- A supported browser

\- The correct assigned role

\- Approved Excel report templates

\- Access to the correct mine data

\- A support contact

Do not share your login credentials.

---

# 3. Supported Roles

Mine Manager AI supports:

\- Administrator

\- General Manager

\- Mine Manager

\- Superintendent

\- Viewer

Your available pages and actions depend on your assigned role.

Viewer accounts are read-only.

---

# 4. Log In

Open the approved Mine Manager AI frontend address.

Local example:

```text

http://localhost:5173

```

Enter:

\- Email

\- Password

Select Login.

After login, the application opens the Dashboard.

If login fails:

1\. Confirm the email address.

2\. Confirm the password.

3\. Confirm the account is active.

4\. Try logging in again.

5\. Contact an Administrator if access remains unavailable.

---

# 5. Confirm the Correct Company and Mine

Before reviewing data or uploading reports, confirm:

\- Company name

\- Mine name

\- Reporting date

\- Timezone

\- Environment or Demo Mode status

Do not upload customer data when the wrong mine or demonstration environment is selected.

---

# 6. Main Navigation

The current navigation may include:

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

Some pages are restricted by role.

---

# 7. Daily Workflow Summary

The recommended daily workflow is:

1\. Log in.

2\. Confirm the company and mine.

3\. Open Upload Reports.

4\. Upload Production.

5\. Upload Fleet.

6\. Upload Plant.

7\. Upload Safety.

8\. Confirm Data Completeness reaches 100%.

9\. Open Dashboard.

10\. Review Mine Health.

11\. Review underperforming KPIs.

12\. Review AI Executive Insights.

13\. Review Predictive Intelligence.

14\. Review or update Executive Actions.

15\. Generate or download the Daily Executive Report.

16\. Escalate critical risks through the approved customer process.

---

# 8. Upload Production Data

Open:

```text

Upload Reports

```

Select the Production Report card.

Required columns:

```text

report\_date

ore\_plan

ore\_actual

waste\_plan

waste\_actual

```

Upload the approved Excel file.

Wait for:

\- Column validation

\- Upload progress

\- Success message

Expected success message:

```text

Validated and uploaded successfully

```

---

# 9. Upload Fleet Data

Select the Fleet Report card.

Required columns:

```text

report\_date

truck\_id

availability

utilization

```

Important:

\- `truck\_id` must not be blank.

\- Availability must be between 0 and 100.

\- Utilization must be between 0 and 100.

Upload the approved Excel file and wait for confirmation.

---

# 10. Upload Plant Data

Select the Plant Report card.

Required columns:

```text

report\_date

throughput\_plan

throughput\_actual

recovery

```

Important:

\- Throughput values must be numeric.

\- Recovery must be between 0 and 100.

Upload the file and confirm success.

---

# 11. Upload Safety Data

Select the Safety Report card.

Required columns:

```text

report\_date

incidents

near\_misses

critical\_risks

safety\_score

```

Important:

\- Safety counts must be whole numbers.

\- Safety counts must not be negative.

\- Safety score must be between 0 and 100.

Upload the file and confirm success.

---

# 12. Review Data Completeness

The Upload Reports page shows Data Completeness.

Typical values:

\- 25%: one report uploaded

\- 50%: two reports uploaded

\- 75%: three reports uploaded

\- 100%: all four reports uploaded

A 100% completeness score confirms all required report types uploaded successfully.

It does not automatically confirm that every source value is operationally correct.

---

# 13. Review Upload History

After each successful upload, review Upload History.

Confirm:

\- Correct report type

\- Correct file name

\- Correct user

\- Correct upload time

\- Success status

Report unexpected files or users to the Administrator.

---

# 14. Open the Dashboard

Select Dashboard.

Review:

\- Mine Health

\- Production KPI

\- Fleet KPI

\- Plant KPI

\- Safety KPI

\- Reporting date

\- Operational risks

\- Priority actions

\- AI Executive Insights

\- Predictive Intelligence

\- Historical trends

Confirm the displayed mine and date are correct.

---

# 15. Review Mine Health

Mine Health summarizes overall operational condition.

Use it as a starting point, then review the supporting KPIs.

If Mine Health is below target:

1\. Identify the weakest KPI.

2\. Review its trend.

3\. Review the reported risks.

4\. Review AI Insights.

5\. Review current Executive Actions.

6\. Escalate through the approved management process.

---

# 16. Review Operational Pages

## Production

Review:

\- Ore plan

\- Ore actual

\- Waste plan

\- Waste actual

\- Performance against plan

\- Trend

## Fleet

Review:

\- Availability

\- Utilization

\- Trend

## Plant

Review:

\- Throughput plan

\- Throughput actual

\- Recovery

\- Trend

## Safety

Review:

\- Incidents

\- Near misses

\- Critical risks

\- Safety score

\- Trend

---

# 17. Review AI Executive Insights

AI Executive Insights may include:

\- KPI movement

\- Operational risk

\- Possible driver

\- Recommended action

\- Executive priority

Always compare AI insights with the supporting operational data.

AI output is decision support and must not replace authorized judgment.

---

# 18. Review Predictive Intelligence

Predictive Intelligence may show:

\- Forecast direction

\- Forecast horizon

\- Confidence

\- Expected KPI movement

\- Potential future underperformance

Use it to support planning discussions.

Do not use predictions as the sole basis for safety-critical or direct operational control decisions.

---

# 19. Review Executive Actions

Open Executive Actions.

Review:

\- Action title

\- Priority

\- Owner

\- Timing

\- KPI context

\- Status

Authorized users may:

\- Create actions

\- Edit actions

\- Assign owners

\- Update status

\- Record timing

Keep action status current.

---

# 20. Generate Executive Reports

Open Executive Reports.

Available outputs may include:

\- Daily Executive Report

\- Weekly Operations Report

\- Monthly KPI Pack

\- PDF export

\- Excel export

Before downloading or distributing a report, confirm:

\- Company name

\- Mine name

\- Reporting period

\- KPI values

\- Branding

\- Confidentiality classification

---

# 21. AI Daily Briefing Button

The Upload Reports page includes a Generate AI Daily Briefing button.

In the current Version 1.0 pilot implementation, this button is a placeholder and does not yet complete the final briefing-generation workflow.

Do not represent it as a completed function.

Use the Dashboard, Executive Insights, and Executive Reports for the current pilot workflow.

---

# 22. Common Errors

## Not authenticated

Meaning:

The login session is missing or expired.

Action:

1\. Log out.

2\. Log in again.

3\. Retry the upload or action.

## Missing columns

Meaning:

The file does not include all required column headers.

Action:

1\. Open the approved template.

2\. Compare the first row.

3\. Correct the headers.

4\. Retry.

## Unsupported file

Meaning:

The selected file type is not accepted.

Action:

Use the approved `.xlsx`, `.xls`, or `.csv` format supported by the upload page.

## Upload failed

Meaning:

The backend could not process the file.

Action:

1\. Read the full error message.

2\. Confirm the file schema.

3\. Confirm authentication.

4\. Confirm the backend is available.

5\. Contact support if needed.

## No data available

Meaning:

No records exist for the selected mine or reporting period.

Action:

1\. Confirm the mine.

2\. Confirm the reporting date.

3\. Confirm the upload succeeded.

4\. Refresh the page.

---

# 23. Basic Troubleshooting

## Page does not load

\- Refresh the browser.

\- Confirm network access.

\- Confirm the backend is available.

\- Contact support.

## Dashboard shows old data

\- Confirm the new upload succeeded.

\- Confirm the reporting date.

\- Refresh the Dashboard.

\- Confirm the selected mine.

## Report does not download

\- Confirm the report-generation request completed.

\- Allow browser downloads.

\- Retry once.

\- Contact support if the issue continues.

## Access denied

\- Confirm your assigned role.

\- Contact an Administrator if you require additional approved access.

---

# 24. Support Request Checklist

When reporting an issue, provide:

\- Name

\- Role

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

Do not send:

\- Passwords

\- Secret keys

\- JWT tokens

\- Database credentials

\- Confidential customer files unless the approved support process allows it

---

# 25. Daily Completion Checklist

\- \[ ] Logged in successfully

\- \[ ] Correct company confirmed

\- \[ ] Correct mine confirmed

\- \[ ] Correct reporting date confirmed

\- \[ ] Production uploaded

\- \[ ] Fleet uploaded

\- \[ ] Plant uploaded

\- \[ ] Safety uploaded

\- \[ ] Data Completeness reviewed

\- \[ ] Upload History reviewed

\- \[ ] Dashboard reviewed

\- \[ ] Mine Health reviewed

\- \[ ] KPI exceptions reviewed

\- \[ ] AI Insights reviewed

\- \[ ] Predictive Intelligence reviewed

\- \[ ] Executive Actions reviewed

\- \[ ] Daily report reviewed or generated

\- \[ ] Critical issues escalated

---

# 26. Important Notice

Mine Manager AI supports management decisions.

It does not replace:

\- Authorized operational judgment

\- Statutory safety systems

\- Customer emergency procedures

\- Dispatch systems

\- SCADA systems

\- Equipment control systems

\- Formal production-control processes

---

# Revision History

| Version | Date | Description |

|---|---|---|

| 1.0 | August 2026 | Initial Quick Start Guide for Pilot Release |

---

\*\*End of Quick Start Guide\*\*

