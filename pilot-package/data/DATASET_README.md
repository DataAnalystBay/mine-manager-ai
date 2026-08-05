# Mine Manager AI - Pilot Dataset Package

## 1. Purpose

This directory contains the standardized Excel templates, synthetic
sample datasets, and technical validation records used for Mine Manager
AI Version 1.0 customer pilots.

The package is intended to support:

- Customer onboarding
- Data-owner training
- Upload testing
- Dashboard validation
- KPI reconciliation
- Executive-report testing
- Demonstrations
- Pilot acceptance testing

## 2. Data Classification

All sample datasets included in this package contain synthetic data only.

The files must not contain:

- Confidential customer mine data
- Personal information
- Employee information
- Credentials
- Passwords
- Secret keys
- Database connection details
- Production-system extracts
- Sensitive commercial information
- Safety-critical operational information from a real mine

Customer operational data must be stored and handled separately according
to the customer-approved data-security process.

## 3. Directory Structure

### `templates`

Contains header-only Excel files supplied to customer data owners.

These files define the required column names for each supported report.

### `demo`

Contains 30-day synthetic datasets used for demonstrations, training,
technical validation, and controlled pilot testing.

### `validation`

Contains technical evidence used to confirm:

- Backend upload requirements
- Database table columns
- Existing Excel file inventory
- Dataset validation results
- Upload and database verification

## 4. Supported Version 1.0 Data Areas

The Version 1.0 pilot dataset package supports:

- Production
- Fleet
- Plant
- Safety

## 5. Standard Template Files

The following header-only files are included:

- `Mine_Manager_AI_Production_Template.xlsx`
- `Mine_Manager_AI_Fleet_Template.xlsx`
- `Mine_Manager_AI_Plant_Template.xlsx`
- `Mine_Manager_AI_Safety_Template.xlsx`

These templates should be supplied to customer data owners before pilot
data preparation begins.

## 6. Standard Synthetic Sample Files

The following 30-day synthetic datasets are included:

- `Mine_Manager_AI_Production_30_Day_Sample.xlsx`
- `Mine_Manager_AI_Fleet_30_Day_Sample.xlsx`
- `Mine_Manager_AI_Plant_30_Day_Sample.xlsx`
- `Mine_Manager_AI_Safety_30_Day_Sample.xlsx`

## 7. Sample Reporting Period

The standard synthetic reporting period is:

`2026-07-01` through `2026-07-30`

Each sample workbook contains:

- One header row
- Thirty daily records

## 8. Mine Assignment

The Excel workbooks do not include a `mine_name` column.

During upload, the Mine Manager AI backend associates the uploaded records
with the configured active mine.

The validated pilot records were assigned to:

`Oyu Tolgoi Surface`

For another customer pilot, the configured mine must be verified before
uploading sample or customer files.

## 9. Required Column Standards

Do not rename required columns.

Column names must remain lowercase and use underscores exactly as shown.

### 9.1 Production

Required columns:

- `report_date`
- `ore_plan`
- `ore_actual`
- `waste_plan`
- `waste_actual`

Example header:

```text
report_date, ore_plan, ore_actual, waste_plan, waste_actual