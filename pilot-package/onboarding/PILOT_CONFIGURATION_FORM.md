# Mine Manager AI - Pilot Configuration Form

## Instructions

Complete this form before technical deployment and customer
configuration begin.

Use `Not Applicable` where a field is not required.

Do not include passwords, secret keys, database passwords, or other
sensitive credentials in this document.

## 1. Customer Organization

| Field | Customer Response |
|---|---|
| Legal company name | |
| Trading name | |
| Country | |
| Head-office location | |
| Industry | Mining |
| Company website | |
| Executive sponsor | |
| Executive sponsor title | |
| Executive sponsor email | |
| Commercial contact | |
| Commercial contact email | |

## 2. Pilot Mine

| Field | Customer Response |
|---|---|
| Mine name | |
| Mine type | Underground / Surface / Combined |
| Main commodity | |
| Mine location | |
| Operating status | Operating / Development / Study |
| Number of operating areas | |
| Number of processing plants | |
| Approximate workforce | |
| Primary reporting timezone | |
| Preferred date format | |
| Preferred language | English / Mongolian / Other |

## 3. Pilot Scope

| Field | Customer Response |
|---|---|
| Pilot objective | |
| Main operational problem | |
| Expected business value | |
| Pilot start date | |
| Pilot end date | |
| Pilot duration | |
| Number of users | |
| Number of mines | |
| Historical data period | |
| Daily or weekly reporting frequency | |
| Executive reports required | |
| Customer success decision date | |

## 4. Pilot Capabilities

Mark each required capability.

| Capability | Required | Notes |
|---|---:|---|
| Executive dashboard | [ ] | |
| Production monitoring | [ ] | |
| Fleet monitoring | [ ] | |
| Plant monitoring | [ ] | |
| Safety monitoring | [ ] | |
| Mine Health Score | [ ] | |
| AI Executive Insights | [ ] | |
| Predictive Intelligence | [ ] | |
| Executive Actions | [ ] | |
| Executive Reports | [ ] | |
| PDF export | [ ] | |
| Excel export | [ ] | |
| User Management | [ ] | |
| Audit Trail | [ ] | |
| System Health | [ ] | |
| Security Center | [ ] | |
| Demo Mode | [ ] | |

## 5. Branding Configuration

| Field | Customer Response |
|---|---|
| Display company name | |
| Display mine name | |
| Logo file supplied | Yes / No |
| Logo file name | |
| Primary color | |
| Secondary color | |
| Report footer text | |
| Report confidentiality text | |
| Customer support text | |

## 6. Shift Configuration

| Field | Customer Response |
|---|---|
| Number of shifts per day | |
| Shift 1 name | |
| Shift 1 start time | |
| Shift 1 end time | |
| Shift 2 name | |
| Shift 2 start time | |
| Shift 2 end time | |
| Shift 3 name | |
| Shift 3 start time | |
| Shift 3 end time | |
| Shift handover time | |
| Reporting cut-off time | |
| Operational day start time | |

## 7. User Configuration

Do not record passwords in this form.

| Full Name | Email | Job Title | Role | Mine | Active |
|---|---|---|---|---|---|
| | | | Administrator | | Yes |
| | | | General Manager | | Yes |
| | | | Mine Manager | | Yes |
| | | | Superintendent | | Yes |
| | | | Viewer | | Yes |

Available roles:

- Administrator
- General Manager
- Mine Manager
- Superintendent
- Viewer

## 8. Production Data

| Field | Customer Response |
|---|---|
| Production data owner | |
| Source system | |
| Source file name | |
| File format | |
| Reporting frequency | |
| Historical period available | |
| Ore unit | Tonnes / Kilotonnes / Other |
| Waste unit | Tonnes / Kilotonnes / Other |
| Date column name | |
| Mine-name column name | |
| Ore plan column | |
| Ore actual column | |
| Waste plan column | |
| Waste actual column | |

Expected Mine Manager AI fields:

- `report_date`
- `ore_plan`
- `ore_actual`
- `waste_plan`
- `waste_actual`
- `mine_name`

## 9. Fleet Data

| Field | Customer Response |
|---|---|
| Fleet data owner | |
| Source system | |
| Source file name | |
| File format | |
| Reporting frequency | |
| Historical period available | |
| Availability unit | Percentage |
| Utilization unit | Percentage |
| Date column name | |
| Mine-name column name | |
| Availability column | |
| Utilization column | |

Expected Mine Manager AI fields:

- `report_date`
- `mine_name`
- `availability`
- `utilization`

## 10. Plant Data

| Field | Customer Response |
|---|---|
| Plant data owner | |
| Source system | |
| Source file name | |
| File format | |
| Reporting frequency | |
| Historical period available | |
| Throughput unit | |
| Recovery unit | Percentage |
| Date column name | |
| Mine-name column name | |
| Throughput plan column | |
| Throughput actual column | |
| Recovery column | |

Expected Mine Manager AI fields:

- `report_date`
- `mine_name`
- `throughput_plan`
- `throughput_actual`
- `recovery`

## 11. Safety Data

| Field | Customer Response |
|---|---|
| Safety data owner | |
| Source system | |
| Source file name | |
| File format | |
| Reporting frequency | |
| Historical period available | |
| Incident definition | |
| Near-miss definition | |
| Critical-risk definition | |
| Date column name | |
| Mine-name column name | |
| Incidents column | |
| Near misses column | |
| Critical risks column | |
| Safety score column | |

Expected Mine Manager AI fields:

- `report_date`
- `mine_name`
- `incidents`
- `near_misses`
- `critical_risks`
- `safety_score`

## 12. KPI Targets

| KPI | Target | Warning | Critical | Direction | Owner |
|---|---:|---:|---:|---|---|
| Ore Production | | | | Higher is better | |
| Waste Movement | | | | Higher is better | |
| Fleet Availability | | | | Higher is better | |
| Fleet Utilization | | | | Higher is better | |
| Plant Throughput | | | | Higher is better | |
| Plant Recovery | | | | Higher is better | |
| Safety Incidents | | | | Lower is better | |
| Critical Risks | | | | Lower is better | |
| Mine Health Score | | | | Higher is better | |

## 13. Executive Reporting

| Field | Customer Response |
|---|---|
| Daily Executive Report required | Yes / No |
| Weekly Operations Report required | Yes / No |
| Monthly KPI Pack required | Yes / No |
| Report recipients | |
| Reporting timezone | |
| Daily report time | |
| Weekly report day | |
| Monthly reporting cut-off | |
| Confidentiality classification | |
| Required report footer | |

## 14. Technical Environment

| Field | Customer Response |
|---|---|
| Hosting model | Cloud / Customer-hosted / Local pilot |
| Frontend hosting platform | |
| Backend hosting platform | |
| PostgreSQL hosting platform | |
| Customer domain | |
| Frontend URL | |
| Backend API URL | |
| HTTPS certificate owner | |
| Customer IT contact | |
| Customer security contact | |
| Network approval required | Yes / No |
| VPN required | Yes / No |
| IP restriction required | Yes / No |
| Single sign-on required | Yes / No |
| Backup storage location | |

## 15. Security Requirements

| Requirement | Customer Response |
|---|---|
| Data classification | |
| Data residency requirement | |
| Password policy requirement | |
| Account lockout requirement | |
| Session timeout requirement | |
| Audit-log retention period | |
| Application-log retention period | |
| Backup retention period | |
| HTTPS required | Yes |
| Multi-factor authentication required | |
| Security review required | |
| Penetration test required | |
| Customer security sign-off required | |

## 16. Support Configuration

| Field | Customer Response |
|---|---|
| Customer pilot manager | |
| Customer technical contact | |
| Customer data contact | |
| Mine Manager AI support contact | |
| Support email | |
| Support phone | |
| Support hours | |
| Critical issue channel | |
| Standard issue channel | |
| Weekly review day | |
| Weekly review time | |

## 17. Known Constraints

Document known constraints:

- Data availability:
- Network access:
- User availability:
- Customer security approval:
- Deployment environment:
- Historical data quality:
- KPI definition differences:
- Reporting calendar:
- Language:
- Other:

## 18. Initial Risks

| Risk | Owner | Probability | Impact | Mitigation | Status |
|---|---|---|---|---|---|
| | | | | | |
| | | | | | |
| | | | | | |

## 19. Customer Approvals

| Approval | Name | Role | Date | Status |
|---|---|---|---|---|
| Pilot scope | | | | Pending |
| Data definitions | | | | Pending |
| KPI targets | | | | Pending |
| User list | | | | Pending |
| Technical environment | | | | Pending |
| Security requirements | | | | Pending |
| Pilot launch | | | | Pending |

## 20. Configuration Completion

- [ ] Customer organization information complete
- [ ] Pilot mine information complete
- [ ] Pilot scope complete
- [ ] Branding information complete
- [ ] Shift configuration complete
- [ ] User list complete
- [ ] Production mapping complete
- [ ] Fleet mapping complete
- [ ] Plant mapping complete
- [ ] Safety mapping complete
- [ ] KPI targets approved
- [ ] Executive reporting requirements complete
- [ ] Technical environment approved
- [ ] Security requirements approved
- [ ] Support contacts confirmed
- [ ] Risks recorded
- [ ] Required approvals received