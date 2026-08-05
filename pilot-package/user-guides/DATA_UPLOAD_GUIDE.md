# Mine Manager AI Version 1.0

# Data Upload Guide

---

# Document Information

| Item | Value |
|---|---|
| Product | Mine Manager AI |
| Version | 1.0 |
| Document | Data Upload Guide |
| Audience | Data Owners, Engineers, Superintendents, Administrators |
| Status | Pilot Release |
| Last Updated | August 2026 |

---

# 1. Purpose

This guide explains how operational data should be prepared, validated, uploaded, and verified within Mine Manager AI Version 1.0.

Correct data quality is essential because all dashboards, KPIs, AI insights, predictive intelligence, and executive reports depend on uploaded operational data.

---

# 2. Supported Report Types

Mine Manager AI Version 1.0 supports four daily operational reports.

| Report | Purpose |
|---|---|
| Production | Production KPIs |
| Fleet | Fleet KPIs |
| Plant | Plant KPIs |
| Safety | Safety KPIs |

Each report must use the approved Excel template.

---

# 3. Approved Templates

Templates are located in:

```text
pilot-package\data\templates
```

Available templates:

- Mine_Manager_AI_Production_Template.xlsx
- Mine_Manager_AI_Fleet_Template.xlsx
- Mine_Manager_AI_Plant_Template.xlsx
- Mine_Manager_AI_Safety_Template.xlsx

Do not rename required column headers.

---

# 4. Sample Data

Sample datasets are located in:

```text
pilot-package\data\demo
```

Available examples:

- Mine_Manager_AI_Production_30_Day_Sample.xlsx
- Mine_Manager_AI_Fleet_30_Day_Sample.xlsx
- Mine_Manager_AI_Plant_30_Day_Sample.xlsx
- Mine_Manager_AI_Safety_30_Day_Sample.xlsx

These files are intended for demonstrations, testing, training, and customer pilots.

---

# 5. Production Template

Required columns:

```text
report_date
ore_plan
ore_actual
waste_plan
waste_actual
```

Example:

| report_date | ore_plan | ore_actual | waste_plan | waste_actual |
|---|---:|---:|---:|---:|
| 2026-07-30 | 9600 | 9655 | 16000 | 15820 |

---

# 6. Fleet Template

Required columns:

```text
report_date
truck_id
availability
utilization
```

Example:

| report_date | truck_id | availability | utilization |
|---|---|---:|---:|
| 2026-07-30 | TRK-001 | 90.2 | 86.4 |

Each row represents one truck.

Truck IDs should remain consistent across reporting periods.

---

# 7. Plant Template

Required columns:

```text
report_date
throughput_plan
throughput_actual
recovery
```

Example:

| report_date | throughput_plan | throughput_actual | recovery |
|---|---:|---:|---:|
| 2026-07-30 | 34000 | 34380 | 91.1 |

---

# 8. Safety Template

Required columns:

```text
report_date
incidents
near_misses
critical_risks
safety_score
```

Example:

| report_date | incidents | near_misses | critical_risks | safety_score |
|---|---:|---:|---:|---:|
| 2026-07-30 | 0 | 2 | 0 | 94.6 |

---

# 9. Accepted Data Formats

| Field | Format |
|---|---|
| report_date | YYYY-MM-DD |
| truck_id | Text |
| KPI values | Numeric |
| incidents | Whole number |
| near_misses | Whole number |
| critical_risks | Whole number |
| safety_score | Decimal |

---

# 10. Accepted Value Ranges

Availability:

```text
0–100
```

Utilization:

```text
0–100
```

Recovery:

```text
0–100
```

Safety Score:

```text
0–100
```

Incident counts cannot be negative.

---

# 11. Upload Procedure

1. Log in.
2. Open **Upload Reports**.
3. Select the report card.
4. Choose the Excel file.
5. Wait for validation.
6. Upload the file.
7. Confirm the success message.
8. Repeat for all report types.

---

# 12. Upload Validation

The upload page validates:

- Required columns
- Worksheet readability
- File type
- Authentication
- Upload status

If validation fails, correct the workbook before uploading again.

---

# 13. Upload History

After each upload, verify:

- Report type
- Uploaded by
- Upload time
- File name
- Status

Unexpected uploads should be investigated immediately.

---

# 14. Data Completeness

The Upload Reports page displays overall completion.

Expected values:

| Uploaded Reports | Completion |
|---|---:|
| 1 | 25% |
| 2 | 50% |
| 3 | 75% |
| 4 | 100% |

100% indicates all required report categories have been uploaded.

---

# 15. Mine Assignment

Before uploading, verify:

- Company
- Mine
- Reporting date

Uploading data to the wrong mine will affect dashboards and reports.

---

# 16. Duplicate Uploads

Uploading the same reporting period should update the corresponding records rather than creating uncontrolled duplicates.

If duplicate records are suspected:

- Review Upload History.
- Check database records.
- Confirm report dates.
- Verify mine assignment.

---

# 17. Common Upload Errors

## Missing columns

Compare the workbook with the approved template.

---

## Unsupported file

Use the approved Excel workbook format.

---

## Not authenticated

Log in again and retry.

---

## Upload failed

Review the backend logs and verify database connectivity.

---

## Empty worksheet

Ensure row 1 contains the required headers and data begins on row 2.

---

# 18. Post-Upload Verification

After uploading:

- Review Data Completeness.
- Review Upload History.
- Open the Dashboard.
- Confirm KPIs updated.
- Confirm the reporting date.
- Confirm the correct mine.
- Generate an Executive Report if required.

---

# 19. Best Practices

- Use only approved templates.
- Do not rename columns.
- Validate source data before uploading.
- Upload reports daily.
- Review Upload History after each upload.
- Keep truck IDs consistent.
- Archive original source files.

---

# 20. Revision History

| Version | Date | Description |
|---|---|---|
| 1.0 | August 2026 | Initial Data Upload Guide for Pilot Release |

---

**End of Data Upload Guide**