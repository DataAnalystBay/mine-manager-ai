# Mine Manager AI Version 1.0

# Incident Response Procedure

---

# Document Information

| Item | Value |

|---|---|

| Product | Mine Manager AI |

| Version | 1.0 |

| Document | Incident Response Procedure |

| Audience | Administrators, Technical Support, Pilot Delivery Team |

| Status | Pilot Release |

---

# 1. Purpose

This document defines the process for identifying, recording, investigating, containing, resolving, and closing incidents during a Mine Manager AI customer pilot.

# 2. Incident Categories

\- Application unavailable

\- Database unavailable

\- Authentication failure

\- Data upload failure

\- Incorrect KPI or report output

\- AI insight unavailable

\- Predictive Intelligence unavailable

\- Security concern

\- Backup or restore failure

\- Performance degradation

# 3. Severity Levels

| Severity | Meaning |

|---|---|

| Critical | Full outage, security incident, data corruption, or unsafe state |

| High | Major function unavailable for multiple users |

| Medium | One function or user significantly affected |

| Low | Non-blocking issue or usability problem |

# 4. Incident Workflow

1\. Record the incident.

2\. Assign severity.

3\. Confirm business impact.

4\. Collect evidence.

5\. Contain the issue.

6\. Investigate root cause.

7\. Implement resolution.

8\. Validate the fix.

9\. Record customer communication.

10\. Close the incident.

# 5. Evidence to Collect

\- Timestamp

\- User

\- Company and mine

\- Page or endpoint

\- Expected result

\- Actual result

\- Screenshot

\- Request ID

\- HTTP status

\- Support Diagnostics JSON

\- Relevant log excerpt

\- Git revision

\- Database revision

# 6. Information Not to Collect

\- Passwords

\- Access tokens

\- JWT secrets

\- Database passwords

\- API keys

\- Full confidential datasets without approval

# 7. Critical Incident Actions

For a Critical incident:

1\. Stop affected pilot activity where required.

2\. Protect customer data.

3\. Notify the customer pilot manager.

4\. Notify the Mine Manager AI technical lead.

5\. Preserve logs and diagnostics.

6\. Create a backup before database changes.

7\. Do not restore over the active database without approval.

8\. Record all actions and timestamps.

# 8. Communication

| Severity | Initial Notification Target |

|---|---|

| Critical | Immediate |

| High | Within 1 hour |

| Medium | Same business day |

| Low | Next planned support review |

# 9. Resolution Validation

Before closure:

\- \[ ] Fix applied

\- \[ ] Backend validation passed

\- \[ ] Frontend validation passed

\- \[ ] Database validation passed

\- \[ ] Security impact reviewed

\- \[ ] Customer confirmed result

\- \[ ] Evidence stored

\- \[ ] Defect or action updated

# 10. Incident Record

| Field | Value |

|---|---|

| Incident ID | |

| Date opened | |

| Reported by | |

| Severity | |

| Business impact | |

| Root cause | |

| Resolution | |

| Date resolved | |

| Customer confirmation | |

| Closed by | |

# Revision History

| Version | Date | Description |

|---|---|---|

| 1.0 | August 2026 | Initial Incident Response Procedure |

---

**End of Incident Response Procedure**

