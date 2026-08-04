# Mine Manager AI - Pilot Success Criteria

## 1. Purpose

This document defines measurable success criteria for a Mine Manager AI
Version 1.0 customer pilot.

The customer and Mine Manager AI delivery team should approve these
criteria before the pilot begins.

## 2. Pilot Success Principle

A successful pilot must demonstrate more than application availability.

The pilot should demonstrate that Mine Manager AI is:

- Technically stable
- Operationally useful
- Accurate enough for management use
- Securely accessible
- Repeatable in daily or weekly workflows
- Valuable to customer decision-makers

## 3. Success Rating

Each criterion should be rated:

- Pass
- Partial Pass
- Fail
- Not Applicable

A criterion should only be marked Pass when supporting evidence is
available.

## 4. Overall Pilot Decision

Recommended decision rules:

### Successful Pilot

- No unresolved critical defects
- No unresolved critical security issues
- All mandatory criteria pass
- At least 80 percent of applicable criteria pass
- Customer sponsor confirms operational value

### Conditional Success

- No unresolved critical security issues
- No unresolved data-integrity failures
- One or more non-critical issues remain
- At least 65 percent of applicable criteria pass
- Customer agrees to corrective actions

### Unsuccessful Pilot

- Critical security issue remains
- Critical data-integrity issue remains
- Core workflows cannot be completed
- Less than 65 percent of applicable criteria pass
- Customer sponsor does not confirm value

## 5. Mandatory Success Criteria

The following are mandatory:

- Customer users can authenticate
- Role-based access works
- Customer data can be uploaded
- Required KPI values are calculated
- Dashboard information loads
- Executive reports can be generated
- Audit logging operates
- Backup can be completed
- No blocking deployment-readiness failures remain
- Customer confirms that Mine Manager AI provides useful management information

## 6. Technical Success Criteria

| ID | Criterion | Target | Evidence | Result |
|---|---|---|---|---|
| TEC-01 | Frontend availability | Application available during agreed pilot hours | Availability record | |
| TEC-02 | Backend availability | API responds during agreed pilot hours | System Health record | |
| TEC-03 | Database connectivity | No unresolved database connection failure | Health check | |
| TEC-04 | Page performance | Main pages load within agreed acceptable time | Test record | |
| TEC-05 | System Health | No unresolved critical service failure | System Health page | |
| TEC-06 | Deployment readiness | Zero blocking failures | Security Center | |
| TEC-07 | HTTPS | External pilot uses HTTPS | Browser verification | |
| TEC-08 | Logging | Application logs are available | Log file verification | |
| TEC-09 | Database migrations | Latest approved migrations applied | Alembic record | |
| TEC-10 | Browser compatibility | Approved customer browser works | Test result | |

## 7. Authentication and Security Criteria

| ID | Criterion | Target | Evidence | Result |
|---|---|---|---|---|
| SEC-01 | User login | Approved users can log in | Login test | |
| SEC-02 | Invalid login | Invalid credentials are rejected | Test record | |
| SEC-03 | Password hashing | Passwords are not stored in plain text | Technical review | |
| SEC-04 | Protected routes | Unauthenticated users cannot access protected pages | Access test | |
| SEC-05 | Protected APIs | Unauthenticated requests are rejected where required | API test | |
| SEC-06 | Role permissions | Users can only access authorized functions | Role test | |
| SEC-07 | Disabled users | Disabled user access is rejected | Test record | |
| SEC-08 | Secret configuration | Production-quality secret is configured | Security Center | |
| SEC-09 | Debug mode | Debug mode is disabled for external pilot | Configuration review | |
| SEC-10 | Audit Trail | Security-relevant actions are recorded | Audit Trail | |
| SEC-11 | Sensitive files | Secret files are not committed to Git | Repository review | |
| SEC-12 | CORS | Only approved frontend origins are configured | Configuration review | |

## 8. Data Success Criteria

| ID | Criterion | Target | Evidence | Result |
|---|---|---|---|---|
| DAT-01 | Production upload | Valid production file uploads successfully | Upload record | |
| DAT-02 | Fleet upload | Valid fleet file uploads successfully | Upload record | |
| DAT-03 | Plant upload | Valid plant file uploads successfully | Upload record | |
| DAT-04 | Safety upload | Valid safety file uploads successfully | Upload record | |
| DAT-05 | Required-column validation | Missing required columns are rejected | Negative test | |
| DAT-06 | Invalid values | Invalid values produce clear errors | Negative test | |
| DAT-07 | Duplicate handling | Duplicate records are handled as designed | Duplicate test | |
| DAT-08 | Mine mapping | Uploaded records use the correct mine | Data review | |
| DAT-09 | Date mapping | Dates are stored and displayed correctly | Data review | |
| DAT-10 | Units | Units match approved customer definitions | Customer confirmation | |
| DAT-11 | Historical data | Agreed historical period is available | Database verification | |
| DAT-12 | Demo separation | Demo data is clearly separated from customer data | Data review | |

## 9. KPI Accuracy Criteria

| ID | Criterion | Target | Evidence | Result |
|---|---|---|---|---|
| KPI-01 | Ore production | Matches approved customer calculation | Reconciliation | |
| KPI-02 | Waste movement | Matches approved customer calculation | Reconciliation | |
| KPI-03 | Fleet availability | Matches approved customer calculation | Reconciliation | |
| KPI-04 | Fleet utilization | Matches approved customer calculation | Reconciliation | |
| KPI-05 | Plant throughput | Matches approved customer calculation | Reconciliation | |
| KPI-06 | Plant recovery | Matches approved customer calculation | Reconciliation | |
| KPI-07 | Safety incidents | Matches approved customer definition | Reconciliation | |
| KPI-08 | Mine Health | Calculation is documented and accepted | Customer review | |
| KPI-09 | KPI target status | Pass, warning, and critical status use approved thresholds | Configuration test | |
| KPI-10 | Date filtering | Reporting period filters return correct results | Test record | |

Recommended accuracy target:

- 100 percent match for direct source values
- Agreed tolerance for calculated or rounded values
- All differences documented and approved

## 10. Executive Dashboard Criteria

| ID | Criterion | Target | Evidence | Result |
|---|---|---|---|---|
| DSH-01 | Dashboard loads | No unresolved loading error | User test | |
| DSH-02 | Company branding | Correct customer name and logo displayed | Screenshot | |
| DSH-03 | Mine selection | Correct pilot mine displayed | Screenshot | |
| DSH-04 | KPI cards | Agreed KPIs displayed | User test | |
| DSH-05 | Mine Health | Current health status displayed | User test | |
| DSH-06 | Risk information | Operational risks displayed | User test | |
| DSH-07 | Priority actions | Priority actions displayed | User test | |
| DSH-08 | Trend information | Historical trends displayed | User test | |
| DSH-09 | Data freshness | Reporting date is clear | Screenshot | |
| DSH-10 | Executive usability | Executive user can understand current status | User feedback | |

## 11. AI Executive Insight Criteria

| ID | Criterion | Target | Evidence | Result |
|---|---|---|---|---|
| AI-01 | Insight generation | Insight is generated from available operational data | Screenshot | |
| AI-02 | KPI reference | Insight references relevant KPI movement | Review | |
| AI-03 | Risk identification | Insight identifies relevant operational concern | Review | |
| AI-04 | Recommendation | Insight includes an actionable recommendation | Review | |
| AI-05 | Data traceability | Insight can be related to available source data | Review | |
| AI-06 | Unsupported certainty | Insight does not present uncertain information as guaranteed fact | Review | |
| AI-07 | Executive relevance | Customer executive rates insight as useful | Feedback | |
| AI-08 | Human oversight | Customer understands that insight is decision support | Training record | |

## 12. Predictive Intelligence Criteria

| ID | Criterion | Target | Evidence | Result |
|---|---|---|---|---|
| PRE-01 | Forecast generation | Forecast is produced for agreed KPIs | Screenshot | |
| PRE-02 | Forecast horizon | Forecast period is clearly displayed | Screenshot | |
| PRE-03 | Confidence | Confidence indicator is displayed | Screenshot | |
| PRE-04 | Trend direction | Forecast direction is understandable | User review | |
| PRE-05 | Historical basis | Forecast uses available historical records | Technical verification | |
| PRE-06 | Insufficient data | System handles insufficient data clearly | Negative test | |
| PRE-07 | Executive usefulness | Customer confirms forecast supports planning discussion | Feedback | |
| PRE-08 | No automated control | Forecast does not directly trigger safety-critical control | Scope review | |

## 13. Executive Action Criteria

| ID | Criterion | Target | Evidence | Result |
|---|---|---|---|---|
| ACT-01 | Create action | Authorized user can create action | User test | |
| ACT-02 | Edit action | Authorized user can edit action | User test | |
| ACT-03 | Status update | Action status can be updated | User test | |
| ACT-04 | Ownership | Action owner can be recorded | User test | |
| ACT-05 | Timing | Due timing can be recorded | User test | |
| ACT-06 | KPI link | Action can be associated with KPI context | User test | |
| ACT-07 | Auditability | Relevant action changes are auditable | Audit review | |
| ACT-08 | Executive usefulness | Customer confirms action workflow is useful | Feedback | |

## 14. Reporting Criteria

| ID | Criterion | Target | Evidence | Result |
|---|---|---|---|---|
| REP-01 | Daily report | Daily Executive Report generates successfully | PDF file | |
| REP-02 | Weekly report | Weekly Operations Report generates successfully | PDF file | |
| REP-03 | Monthly report | Monthly KPI Pack generates successfully | PDF file | |
| REP-04 | Excel export | Required Excel export downloads successfully | Excel file | |
| REP-05 | Branding | Reports display correct company branding | Report review | |
| REP-06 | Reporting period | Correct date range is displayed | Report review | |
| REP-07 | KPI accuracy | Report KPIs match dashboard and database | Reconciliation | |
| REP-08 | Readability | Executive users find report readable | Feedback | |
| REP-09 | Confidentiality | Required confidentiality text is displayed | Report review | |
| REP-10 | Repeatability | Report can be regenerated consistently | Repeat test | |

## 15. Administration Criteria

| ID | Criterion | Target | Evidence | Result |
|---|---|---|---|---|
| ADM-01 | Create user | Administrator can create a user | User test | |
| ADM-02 | Edit user | Administrator can edit user details | User test | |
| ADM-03 | Disable user | Administrator can disable a user | User test | |
| ADM-04 | Assign role | Administrator can assign approved role | User test | |
| ADM-05 | Company configuration | Administrator can configure company | User test | |
| ADM-06 | Mine configuration | Administrator can configure mine | User test | |
| ADM-07 | KPI configuration | Administrator can configure targets | User test | |
| ADM-08 | Alert configuration | Administrator can configure thresholds | User test | |
| ADM-09 | Audit review | Administrator can review audit records | User test | |
| ADM-10 | Health review | Administrator can review System Health | User test | |
| ADM-11 | Security review | Administrator can review Security Center | User test | |

## 16. Backup and Recovery Criteria

| ID | Criterion | Target | Evidence | Result |
|---|---|---|---|---|
| BAK-01 | Backup procedure | Procedure is documented | Guide review | |
| BAK-02 | Database backup | Backup completes successfully | Backup file | |
| BAK-03 | Backup protection | Backup location is access controlled | Security review | |
| BAK-04 | Restore procedure | Procedure is documented | Guide review | |
| BAK-05 | Test restore | Test restore completes successfully | Restore record | |
| BAK-06 | Recovery ownership | Responsible person is identified | Configuration form | |
| BAK-07 | Backup retention | Retention period is agreed | Configuration form | |

## 17. User Adoption Criteria

| ID | Criterion | Target | Evidence | Result |
|---|---|---|---|---|
| USE-01 | Administrator training | Required administrator completes training | Attendance | |
| USE-02 | Executive training | Required executive users complete training | Attendance | |
| USE-03 | Data-user training | Required upload users complete training | Attendance | |
| USE-04 | Login adoption | Agreed pilot users log in | Audit record | |
| USE-05 | Dashboard use | Executive users review dashboard regularly | Audit or feedback | |
| USE-06 | Data process | Customer completes agreed upload process | Upload history | |
| USE-07 | Weekly review | Customer attends agreed review meetings | Meeting record | |
| USE-08 | User satisfaction | Users provide acceptable satisfaction rating | Survey | |

Suggested user-satisfaction target:

- Average score of at least 4 out of 5

## 18. Business Value Criteria

The customer should select at least three measurable business-value
criteria.

| ID | Criterion | Customer Target | Evidence | Result |
|---|---|---|---|---|
| BUS-01 | Reduced report-preparation time | | Time comparison | |
| BUS-02 | Faster executive review | | User feedback | |
| BUS-03 | Improved KPI consistency | | Reconciliation | |
| BUS-04 | Faster risk identification | | Case example | |
| BUS-05 | Better action tracking | | Action records | |
| BUS-06 | Improved meeting preparation | | Time comparison | |
| BUS-07 | Improved operational transparency | | Sponsor feedback | |
| BUS-08 | Reduced manual consolidation | | Process comparison | |
| BUS-09 | Improved decision-support quality | | Executive feedback | |
| BUS-10 | Commercial value confirmed | | Sponsor decision | |

## 19. Defect Acceptance Criteria

### Critical Defect

A defect that causes:

- Security compromise
- Data corruption
- Incorrect access to sensitive information
- Complete system unavailability
- Materially incorrect executive information
- Loss of required customer data

Critical defects must be resolved before successful pilot sign-off.

### High Defect

A defect that prevents a major workflow but has no security or
data-integrity impact.

High defects should be resolved or formally accepted with a corrective
action plan.

### Medium Defect

A defect that affects usability but has a reasonable workaround.

### Low Defect

A cosmetic or minor usability issue with no material workflow impact.

## 20. Pilot Scorecard

| Category | Applicable Criteria | Passed | Partial | Failed | Pass Rate |
|---|---:|---:|---:|---:|---:|
| Technical | | | | | |
| Security | | | | | |
| Data | | | | | |
| KPI Accuracy | | | | | |
| Dashboard | | | | | |
| AI Insights | | | | | |
| Predictive Intelligence | | | | | |
| Executive Actions | | | | | |
| Reporting | | | | | |
| Administration | | | | | |
| Backup and Recovery | | | | | |
| User Adoption | | | | | |
| Business Value | | | | | |
| Total | | | | | |

## 21. Customer Feedback

### What worked well

-

### What needs improvement

-

### Most valuable feature

-

### Least valuable feature

-

### Required configuration changes

-

### Required future development

-

### Commercial deployment interest

- Yes
- No
- Conditional
- Not yet decided

## 22. Final Pilot Decision

Select one:

- [ ] Successful Pilot
- [ ] Conditional Success
- [ ] Pilot Extension Required
- [ ] Unsuccessful Pilot
- [ ] Commercial Deployment Approved
- [ ] Commercial Decision Deferred

## 23. Final Sign-Off

| Role | Name | Signature or Approval | Date |
|---|---|---|---|
| Customer Executive Sponsor | | | |
| Customer Pilot Manager | | | |
| Customer System Administrator | | | |
| Mine Manager AI Pilot Lead | | | |

## 24. Final Actions

| Action | Owner | Due Date | Status |
|---|---|---|---|
| | | | |
| | | | |
| | | | |