# Mine Manager AI Version 1.0

# Security Review Checklist

---

# Document Information

| Item | Value |
|---|---|
| Product | Mine Manager AI |
| Version | 1.0 |
| Document | Security Review Checklist |
| Audience | Administrator, Technical Lead, Pilot Delivery Team |
| Status | Pilot Release |
| Last Updated | August 2026 |

---

# 1. Purpose

This checklist verifies that Mine Manager AI Version 1.0 meets the minimum security controls required for a controlled customer pilot.

---

# 2. Authentication

- [ ] Valid users can log in.
- [ ] Invalid credentials are rejected.
- [ ] Passwords are not returned in API responses.
- [ ] Passwords are not written to logs.
- [ ] Password hashes are used.
- [ ] Logout ends the local session.
- [ ] Expired sessions require a new login.
- [ ] Authentication errors are user-safe.

Evidence:

```text

```

Result:

- [ ] PASS
- [ ] PASS WITH OBSERVATIONS
- [ ] FAIL

---

# 3. User Roles

Approved roles:

- Administrator
- General Manager
- Mine Manager
- Superintendent
- Viewer

Checks:

- [ ] Role names are normalized consistently.
- [ ] Administrator functions require Administrator.
- [ ] General Manager permissions are enforced.
- [ ] Mine Manager permissions are enforced.
- [ ] Superintendent permissions are enforced.
- [ ] Viewer permissions are enforced.
- [ ] Unsupported roles are rejected.
- [ ] Role changes require a new authenticated session where applicable.

Evidence:

```text

```

---

# 4. Protected Routes

- [ ] Unauthenticated frontend routes redirect to Login.
- [ ] Protected APIs reject missing credentials.
- [ ] Protected APIs reject invalid credentials.
- [ ] Administrator-only APIs reject non-administrators.
- [ ] Support Diagnostics requires Administrator.
- [ ] User Management requires approved authorization.
- [ ] Security Center requires approved authorization.
- [ ] Configuration changes require approved authorization.
- [ ] Audit Trail access follows approved role rules.

Evidence:

```text

```

---

# 5. Password Security

- [ ] Passwords use approved hashing.
- [ ] Plain-text passwords are not stored.
- [ ] Password hashes are not exposed.
- [ ] Password values are not included in logs.
- [ ] Password values are not included in diagnostics.
- [ ] Password reset procedures are controlled.
- [ ] Default passwords are changed before customer pilot.
- [ ] Shared accounts are prohibited unless formally approved.

Evidence:

```text

```

---

# 6. JWT and Secret Configuration

- [ ] `SECRET_KEY` or `JWT_SECRET_KEY` is configured.
- [ ] The configured secret is not committed to Git.
- [ ] The configured secret is not printed in evidence files.
- [ ] Missing secret configuration blocks or warns appropriately.
- [ ] Token expiry is configured.
- [ ] Tokens are validated before protected access.
- [ ] Authorization headers are not logged.
- [ ] Access tokens are not included in diagnostics downloads.

Evidence:

```text

```

---

# 7. Environment Variables

- [ ] Backend `.env` is excluded from Git.
- [ ] Database password is stored outside source code.
- [ ] API keys are stored outside source code.
- [ ] Documentation contains variable names, not real secrets.
- [ ] Pilot environment variables are reviewed.
- [ ] Production values are not reused in public evidence.
- [ ] Debug settings are reviewed.
- [ ] Demo Mode settings are reviewed.
- [ ] CORS settings are reviewed.

Evidence:

```text

```

---

# 8. Database Security

- [ ] PostgreSQL requires authentication.
- [ ] SSL is required.
- [ ] Database credentials are not exposed.
- [ ] Database connection strings are not committed.
- [ ] Database permissions follow least privilege where practical.
- [ ] Alembic revision is current.
- [ ] Backup and restore access is limited.
- [ ] Temporary restore databases are deleted after validation.
- [ ] Production database is not used as a restore-test target.

Evidence:

```text

```

---

# 9. API Security

- [ ] Inputs are validated.
- [ ] Invalid requests return controlled errors.
- [ ] Internal stack traces are not returned to users.
- [ ] HTTP 401 is used for authentication failure.
- [ ] HTTP 403 is used for authorization failure.
- [ ] HTTP 422 validation responses are handled.
- [ ] API documentation exposure is reviewed for the pilot.
- [ ] Sensitive endpoints require authorization.
- [ ] Download endpoints require authorization.
- [ ] Response headers are reviewed where applicable.

Evidence:

```text

```

---

# 10. File Upload Security

- [ ] Supported extensions are validated.
- [ ] Required columns are validated.
- [ ] Invalid workbooks are rejected.
- [ ] Password-protected workbooks are not accepted unless approved.
- [ ] Uploaded data is validated before database insertion.
- [ ] Upload filenames are handled safely.
- [ ] Uploaded files are not committed to Git.
- [ ] Customer datasets are not copied into support evidence without approval.
- [ ] Fleet `truck_id` validation is implemented.

Evidence:

```text

```

---

# 11. Diagnostics Security

- [ ] Support Diagnostics requires Administrator.
- [ ] Diagnostics exclude passwords.
- [ ] Diagnostics exclude JWT secrets.
- [ ] Diagnostics exclude access tokens.
- [ ] Diagnostics exclude Authorization headers.
- [ ] Diagnostics exclude database passwords.
- [ ] Diagnostics exclude API keys.
- [ ] Diagnostics exclude raw customer-upload contents.
- [ ] Diagnostics downloads use a controlled filename.
- [ ] Diagnostics downloads include `no-store`.
- [ ] Generated diagnostics folders are ignored by Git.
- [ ] Diagnostics files are reviewed before external sharing.

Evidence:

```text

```

---

# 12. Logging Security

- [ ] Plain-text passwords are prohibited.
- [ ] Tokens are prohibited.
- [ ] Authorization headers are prohibited.
- [ ] API keys are prohibited.
- [ ] Database passwords are prohibited.
- [ ] Sensitive terms are redacted.
- [ ] Stack traces remain server-side.
- [ ] User-facing errors remain sanitized.
- [ ] Log retention is documented.
- [ ] Log files are ignored by Git.

Evidence:

```text

```

---

# 13. Backup Security

- [ ] Backup directory is ignored by Git.
- [ ] `.backup` files are ignored by Git.
- [ ] Backup archives are treated as confidential.
- [ ] Backup access is restricted.
- [ ] Backup transfer uses approved methods.
- [ ] Backup retention is documented.
- [ ] Expired backups are securely deleted.
- [ ] Restore testing uses a temporary database.
- [ ] Backup evidence does not contain credentials.

Evidence:

```text

```

---

# 14. Audit and Monitoring

- [ ] Audit Trail is available.
- [ ] Administrative actions are recorded where configured.
- [ ] Authentication failures can be investigated.
- [ ] User activity can be filtered.
- [ ] System Health is available.
- [ ] Deployment Readiness is available.
- [ ] Support Diagnostics is available.
- [ ] Security-related evidence is retained according to policy.

Evidence:

```text

```

---

# 15. Frontend Security

- [ ] Access tokens are not printed to the browser console.
- [ ] Passwords are not printed to the browser console.
- [ ] Backend stack traces are not shown to users.
- [ ] User-safe error messages are used.
- [ ] Protected routes are enforced.
- [ ] Browser downloads are initiated only by user action.
- [ ] Sensitive values are not embedded in frontend source.
- [ ] Production build completes successfully.

Evidence:

```text

```

---

# 16. Deployment Readiness

- [ ] Database check passes.
- [ ] Secret-key check passes or is formally accepted.
- [ ] CORS configuration is reviewed.
- [ ] Debug setting is reviewed.
- [ ] Demo Mode setting is reviewed.
- [ ] Runtime directories are reviewed.
- [ ] Alembic revision is current.
- [ ] No Critical readiness failure remains.
- [ ] No High blocking security issue remains.

Evidence:

```text

```

---

# 17. Known Security Limitations

Record accepted limitations:

```text

```

Typical Version 1.0 limitations may include:

- Centralized security monitoring is not included.
- Cloud SIEM integration is not included.
- Single sign-on is not included.
- Multi-factor authentication may not be included.
- Advanced tenant isolation may require additional validation.
- Penetration testing may be completed separately.
- Customer-specific compliance certification is outside the pilot scope.

---

# 18. Defect Summary

| Severity | Open | Closed | Accepted with Workaround |
|---|---:|---:|---:|
| Critical | | | |
| High | | | |
| Medium | | | |
| Low | | | |

Blocking security defects:

```text

```

Approved workarounds:

```text

```

---

# 19. Final Security Decision

Select one:

- [ ] PASS
- [ ] PASS WITH OBSERVATIONS
- [ ] FAIL

Decision rationale:

```text

```

Reviewer:

```text

```

Role:

```text

```

Date:

```text

```

Signature:

```text

```

---

# 20. Evidence References

- `pilot-package\testing\validation\security_acceptance_results.txt`
- `pilot-package\deployment\validation\environment_variable_inventory.txt`
- `pilot-package\operations\validation\diagnostics\diagnostics_test_results.txt`
- `pilot-package\operations\validation\postgres_environment.txt`
- `pilot-package\operations\validation\backup_test_results.txt`
- `pilot-package\operations\validation\restore_test_results.txt`

Additional evidence:

```text

```

---

# Revision History

| Version | Date | Description |
|---|---|---|
| 1.0 | August 2026 | Initial Security Review Checklist |

---

**End of Security Review Checklist**
