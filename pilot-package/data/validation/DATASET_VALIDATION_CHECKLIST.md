# Mine Manager AI - Dataset Validation Checklist

## Purpose

This checklist is used to verify that every dataset included in the Mine Manager AI Version 1.0 Pilot Package is technically valid before it is distributed to pilot customers.

Validation should be completed whenever:

- New dataset templates are created
- Sample datasets are regenerated
- Upload validation rules change
- Database schema changes
- Upload services are modified
- A new Version 1.0 pilot package is released

---

# Dataset Information

| Item | Value |
|------|------|
| Product | Mine Manager AI |
| Version | 1.0 |
| Sprint | 10.21.3 |
| Validation Date | 2026-08-05 |
| Environment | Local Development |
| Database | PostgreSQL |
| Validation Status | PASSED |

---

# Files Validated

## Templates

- [x] Mine_Manager_AI_Production_Template.xlsx
- [x] Mine_Manager_AI_Fleet_Template.xlsx
- [x] Mine_Manager_AI_Plant_Template.xlsx
- [x] Mine_Manager_AI_Safety_Template.xlsx

## Demo Datasets

- [x] Mine_Manager_AI_Production_30_Day_Sample.xlsx
- [x] Mine_Manager_AI_Fleet_30_Day_Sample.xlsx
- [x] Mine_Manager_AI_Plant_30_Day_Sample.xlsx
- [x] Mine_Manager_AI_Safety_30_Day_Sample.xlsx

---

# Header Validation

## Production

Required columns

- [x] report_date
- [x] ore_plan
- [x] ore_actual
- [x] waste_plan
- [x] waste_actual

Status

✅ Passed

---

## Fleet

Required columns

- [x] report_date
- [x] truck_id
- [x] availability
- [x] utilization

Status

✅ Passed

---

## Plant

Required columns

- [x] report_date
- [x] throughput_plan
- [x] throughput_actual
- [x] recovery

Status

✅ Passed

---

## Safety

Required columns

- [x] report_date
- [x] incidents
- [x] near_misses
- [x] critical_risks
- [x] safety_score

Status

✅ Passed

---

# Workbook Validation

## Production Workbook

- [x] Workbook opens successfully
- [x] Worksheet exists
- [x] Header row exists
- [x] 30 data rows
- [x] Correct date format
- [x] Numeric values
- [x] No blank required columns

Status

✅ Passed

---

## Fleet Workbook

- [x] Workbook opens successfully
- [x] Worksheet exists
- [x] Header row exists
- [x] truck_id included
- [x] 30 data rows
- [x] Availability numeric
- [x] Utilization numeric

Status

✅ Passed

---

## Plant Workbook

- [x] Workbook opens successfully
- [x] Worksheet exists
- [x] Header row exists
- [x] 30 data rows
- [x] Throughput values numeric
- [x] Recovery numeric

Status

✅ Passed

---

## Safety Workbook

- [x] Workbook opens successfully
- [x] Worksheet exists
- [x] Header row exists
- [x] 30 data rows
- [x] Safety counts numeric
- [x] Safety score numeric

Status

✅ Passed

---

# Upload Validation

Production Upload

- [x] File accepted
- [x] Validation passed
- [x] Database updated

Fleet Upload

- [x] File accepted
- [x] truck_id validated
- [x] Database updated

Plant Upload

- [x] File accepted
- [x] Validation passed
- [x] Database updated

Safety Upload

- [x] File accepted
- [x] Validation passed
- [x] Database updated

Overall Status

✅ Passed

---

# Database Validation

Tables Checked

- production_daily
- fleet_daily
- plant_daily
- safety_daily

Validated Reporting Period

2026-07-01 to 2026-07-30

Verified Records

Production

- [x] 30 records

Fleet

- [x] 30 records

Plant

- [x] 30 records

Safety

- [x] 30 records

Overall Status

✅ Passed

---

# Latest Records Verified

Production

Date

2026-07-30

Values

- Ore Plan: 9648
- Ore Actual: 9667
- Waste Plan: 16015
- Waste Actual: 16840

Status

✅ Verified

---

Fleet

Date

2026-07-30

Values

- Availability: 88.7
- Utilization: 79.6

Status

✅ Verified

---

Plant

Date

2026-07-30

Values

- Throughput Plan: 33846
- Throughput Actual: 34501
- Recovery: 90.9

Status

✅ Verified

---

Safety

Date

2026-07-30

Values

- Incidents: 0
- Near Misses: 2
- Critical Risks: 0
- Safety Score: 94.6

Status

✅ Verified

---

# Upload Endpoint Validation

Verified Endpoints

- [x] Production Upload
- [x] Fleet Upload
- [x] Plant Upload
- [x] Safety Upload

Authentication

- [x] JWT authentication verified

Frontend Validation

- [x] Required columns synchronized with backend

Status

✅ Passed

---

# Dataset Generator Validation

Generator

backend/generate_pilot_datasets.py

Checks

- [x] Templates generated
- [x] Demo datasets generated
- [x] Fleet includes truck_id
- [x] Workbook validation passed
- [x] Value validation passed

Status

✅ Passed

---

# Overall Pilot Dataset Validation

The Mine Manager AI Version 1.0 Pilot Dataset Package has been validated.

The package includes:

- Standard upload templates
- Synthetic demonstration datasets
- Backend-compatible column definitions
- Valid upload files
- Database validation
- Documentation

The package is approved for use during Version 1.0 pilot deployments.

Overall Result

# ✅ PASSED

---

Prepared By

Mine Manager AI Development Team

Sprint

10.21.3 — Standard Pilot Sample Datasets

Validation Date

2026-08-05