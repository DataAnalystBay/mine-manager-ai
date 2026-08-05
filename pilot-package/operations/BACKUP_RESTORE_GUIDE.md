# Mine Manager AI Version 1.0

# Backup and Restore Guide

---

# Document Information

| Item | Value |

|---|---|

| Product | Mine Manager AI |

| Version | 1.0 |

| Document | Backup and Restore Guide |

| Audience | Administrators, Database Administrators, Technical Support |

| Status | Pilot Release |

| Last Updated | August 2026 |

---

# 1. Purpose

This guide explains how to back up, verify, restore, validate, retain, and securely manage the Mine Manager AI Version 1.0 PostgreSQL database.

The procedures are intended for:

\- Customer pilot environments

\- Development environments

\- Controlled production deployments

\- Disaster-recovery testing

\- Pre-deployment and pre-migration protection

Database restoration is a potentially destructive activity. Always restore into a temporary database first unless an approved production recovery process explicitly requires otherwise.

---

# 2. Scope

This guide covers:

\- PostgreSQL client-tool requirements

\- Backup storage

\- Custom-format database backups

\- Backup verification

\- Temporary restore testing

\- Restored-data validation

\- Temporary database cleanup

\- Retention and security

\- Production recovery controls

\- Troubleshooting

This guide does not replace customer-specific:

\- Disaster-recovery policy

\- Cloud backup policy

\- Retention policy

\- Legal data-retention requirements

\- Cybersecurity requirements

\- Change-management controls

---

# 3. Validated Environment

The validated backup and restore environment is:

| Component | Version or Value |

|---|---|

| Operating system | Windows 10/11, 64-bit |

| PostgreSQL client tools | 17.10 |

| PostgreSQL server | 17.10 |

| Database | mine\_manager\_ai |

| Backup format | PostgreSQL custom archive |

| Backup extension | `.backup` |

| SSL mode | require |

| Alembic revision | afaaaeb915e4 |

Validated PostgreSQL tools:

```text

pg\_dump 17.10

pg\_restore 17.10

psql 17.10

```

Validated executable location:

```text

C:\\Program Files\\PostgreSQL\\17\\bin

```

---

# 4. Files Included

Backup scripts are located in:

```text

pilot-package\\operations\\backup-scripts

```

Included scripts:

```text

backup\_database.bat

verify\_backup.bat

restore\_database.bat

```

Validation evidence is located in:

```text

pilot-package\\operations\\validation

```

Included evidence:

```text

postgres\_environment.txt

backup\_test\_results.txt

restore\_test\_results.txt

backup\_archive\_inventory.txt

```

---

# 5. Security Requirements

Database backups may contain:

\- User accounts

\- Operational data

\- Audit logs

\- Configuration

\- Company information

\- Mine information

\- Report history

\- Executive Actions

Treat every database backup as confidential.

Required controls:

\- Store backups in an approved secure location.

\- Restrict access to authorized personnel.

\- Encrypt backups at rest where required.

\- Use encrypted transfer methods.

\- Do not commit backup files to Git.

\- Do not email database backups without approval.

\- Do not store backups on unmanaged devices.

\- Record backup access where required.

\- Securely delete expired backups.

Never include:

\- Database passwords

\- JWT secrets

\- API keys

\- Cloud credentials

inside documentation or evidence files.

---

# 6. Backup Storage

The validated local backup directory is:

```text

C:\\Projects\\mine-manager-ai\\backups\\database

```

The project `.gitignore` must contain:

```text

backups/

\*.backup

\*.dump

\*.sql.gz

```

Verify:

```cmd

cd C:\\Projects\\mine-manager-ai

git check-ignore -v backups\\database

```

Expected result:

Git reports that the `backups/` rule excludes the directory.

---

# 7. Before Creating a Backup

Confirm:

\- \[ ] Database is reachable

\- \[ ] PostgreSQL client tools are available

\- \[ ] Backend `.env` exists

\- \[ ] Database variables are configured

\- \[ ] Backup destination has sufficient storage

\- \[ ] No active migration is in progress

\- \[ ] Backup purpose is recorded

\- \[ ] Responsible owner is identified

Verify tools:

```cmd

"C:\\Program Files\\PostgreSQL\\17\\bin\\pg\_dump.exe" --version

"C:\\Program Files\\PostgreSQL\\17\\bin\\pg\_restore.exe" --version

"C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe" --version

```

---

# 8. Database Connectivity Check

From the backend:

```cmd

cd C:\\Projects\\mine-manager-ai\\backend

venv\\Scripts\\activate.bat

```

Run:

```cmd

python -c "from sqlalchemy import text; from app.database import engine; c=engine.connect(); print('Database:', c.execute(text('SELECT current\_database()')).scalar()); print('Server version:', c.execute(text('SHOW server\_version')).scalar()); print('Connection test:', c.execute(text('SELECT 1')).scalar()); c.close()"

```

Expected:

```text

Database: mine\_manager\_ai

Server version: 17.10

Connection test: 1

```

---

# 9. Create a Database Backup

From the project root:

```cmd

cd C:\\Projects\\mine-manager-ai

```

Run:

```cmd

pilot-package\\operations\\backup-scripts\\backup\_database.bat

```

The script:

\- reads database variables from `backend\\.env`;

\- uses PostgreSQL 17 `pg\_dump`;

\- creates a timestamped custom-format archive;

\- uses maximum compression;

\- verifies that the file exists;

\- verifies that the file is not empty;

\- removes incomplete backup output after failure.

Example output:

```text

Backup completed successfully.

File: C:\\Projects\\mine-manager-ai\\backups\\database\\mine\_manager\_ai\_20260805\_140953.backup

Size: 87593 bytes

```

---

# 10. Backup Naming Convention

Backup files follow:

```text

<database>\_<YYYYMMDD\_HHMMSS>.backup

```

Example:

```text

mine\_manager\_ai\_20260805\_140953.backup

```

This naming standard records:

\- database name;

\- date;

\- time.

Do not manually rename backups without updating the backup register.

---

# 11. Verify the Backup Archive

Run:

```cmd

pilot-package\\operations\\backup-scripts\\verify\_backup.bat "C:\\Projects\\mine-manager-ai\\backups\\database\\<backup-file>.backup"

```

Example:

```cmd

pilot-package\\operations\\backup-scripts\\verify\_backup.bat "C:\\Projects\\mine-manager-ai\\backups\\database\\mine\_manager\_ai\_20260805\_140953.backup"

```

Expected:

```text

Backup archive is readable and structurally valid.

```

This verification confirms that `pg\_restore` can read the archive.

It does not replace a full restore test.

---

# 12. Inspect Backup Contents

Create an archive inventory:

```cmd

"C:\\Program Files\\PostgreSQL\\17\\bin\\pg\_restore.exe" --list "C:\\Projects\\mine-manager-ai\\backups\\database\\<backup-file>.backup" > pilot-package\\operations\\validation\\backup\_archive\_inventory.txt

```

Review:

```cmd

powershell -Command "Get-Content pilot-package\\operations\\validation\\backup\_archive\_inventory.txt -TotalCount 30"

```

Confirm critical objects:

```cmd

findstr /I /C:"production\_daily" /C:"fleet\_daily" /C:"plant\_daily" /C:"safety\_daily" /C:"users" /C:"alembic\_version" pilot-package\\operations\\validation\\backup\_archive\_inventory.txt

```

The archive should contain:

\- schemas;

\- tables;

\- table data;

\- sequences;

\- defaults;

\- indexes;

\- primary keys;

\- unique constraints;

\- foreign keys;

\- Alembic state.

---

# 13. Safe Restore Principle

Never test a restore directly against:

```text

mine\_manager\_ai

```

Use a temporary database such as:

```text

mine\_manager\_ai\_restore\_test

```

The restore script explicitly refuses to restore into the active database name.

---

# 14. Restore Into a Temporary Database

Run:

```cmd

pilot-package\\operations\\backup-scripts\\restore\_database.bat "C:\\Projects\\mine-manager-ai\\backups\\database\\<backup-file>.backup" mine\_manager\_ai\_restore\_test

```

Example:

```cmd

pilot-package\\operations\\backup-scripts\\restore\_database.bat "C:\\Projects\\mine-manager-ai\\backups\\database\\mine\_manager\_ai\_20260805\_140953.backup" mine\_manager\_ai\_restore\_test

```

The script:

\- terminates existing sessions on the temporary database;

\- drops the temporary database if it already exists;

\- creates a clean temporary database;

\- restores schemas and data;

\- restores sequences;

\- restores constraints and indexes;

\- uses `--no-owner`;

\- uses `--no-privileges`;

\- stops on restore errors.

Expected:

```text

Restore completed successfully.

Temporary database: mine\_manager\_ai\_restore\_test

```

---

# 15. Validate Restored Data

From the backend virtual environment:

```cmd

cd C:\\Projects\\mine-manager-ai\\backend

venv\\Scripts\\activate.bat

```

Run:

```cmd

python -c "import os; from dotenv import load\_dotenv; import psycopg2; load\_dotenv(); conn=psycopg2.connect(host=os.getenv('DB\_HOST'), port=os.getenv('DB\_PORT','5432'), dbname='mine\_manager\_ai\_restore\_test', user=os.getenv('DB\_USER'), password=os.getenv('DB\_PASSWORD'), sslmode='require'); cur=conn.cursor(); queries=\[('Database','SELECT current\_database()'),('Production rows','SELECT COUNT(\*) FROM public.production\_daily'),('Fleet rows','SELECT COUNT(\*) FROM public.fleet\_daily'),('Plant rows','SELECT COUNT(\*) FROM public.plant\_daily'),('Safety rows','SELECT COUNT(\*) FROM public.safety\_daily'),('Alembic revision','SELECT version\_num FROM public.alembic\_version')]; \[print(label + ':', (cur.execute(sql), cur.fetchone()\[0])\[1]) for label,sql in queries]; cur.close(); conn.close()"

```

Validated result:

```text

Database: mine\_manager\_ai\_restore\_test

Production rows: 40

Fleet rows: 40

Plant rows: 40

Safety rows: 40

Alembic revision: afaaaeb915e4

```

A valid restore must show:

\- correct target database;

\- expected table row counts;

\- current Alembic revision;

\- successful database connectivity.

---

# 16. Compare Active and Restored Databases

For a formal restore test, compare:

\- schema names;

\- table names;

\- row counts;

\- latest reporting dates;

\- user count;

\- configuration records;

\- audit-log records;

\- Alembic revision;

\- key constraints and indexes.

At minimum, validate:

```text

public.production\_daily

public.fleet\_daily

public.plant\_daily

public.safety\_daily

public.users

public.alembic\_version

```

---

# 17. Delete the Temporary Restore Database

After restore validation is complete, remove only:

```text

mine\_manager\_ai\_restore\_test

```

Run:

```cmd

cd C:\\Projects\\mine-manager-ai\\backend

venv\\Scripts\\activate.bat

```

Then:

```cmd

python -c "import os; from dotenv import load\_dotenv; import psycopg2; load\_dotenv(); conn=psycopg2.connect(host=os.getenv('DB\_HOST'), port=os.getenv('DB\_PORT','5432'), dbname='postgres', user=os.getenv('DB\_USER'), password=os.getenv('DB\_PASSWORD'), sslmode='require'); conn.autocommit=True; cur=conn.cursor(); cur.execute(\\"SELECT pg\_terminate\_backend(pid) FROM pg\_stat\_activity WHERE datname='mine\_manager\_ai\_restore\_test'\\"); cur.execute('DROP DATABASE IF EXISTS mine\_manager\_ai\_restore\_test'); print('Temporary restore database deleted successfully.'); cur.close(); conn.close()"

```

Verify:

```cmd

python -c "import os; from dotenv import load\_dotenv; import psycopg2; load\_dotenv(); conn=psycopg2.connect(host=os.getenv('DB\_HOST'), port=os.getenv('DB\_PORT','5432'), dbname='postgres', user=os.getenv('DB\_USER'), password=os.getenv('DB\_PASSWORD'), sslmode='require'); cur=conn.cursor(); cur.execute(\\"SELECT COUNT(\*) FROM pg\_database WHERE datname='mine\_manager\_ai\_restore\_test'\\"); print('Temporary database count:', cur.fetchone()\[0]); cur.close(); conn.close()"

```

Expected:

```text

Temporary database count: 0

```

---

# 18. Validated Test Result

The validated Sprint 10.21.6 restore test confirmed:

```text

Backup archive: PASSED

Archive readability: PASSED

Temporary database creation: PASSED

Schema restore: PASSED

Data restore: PASSED

Constraint restore: PASSED

Database connectivity: PASSED

Operational table row counts: PASSED

Alembic revision: PASSED

Temporary database cleanup: PASSED

```

Overall result:

```text

PASSED

```

---

# 19. Recommended Backup Schedule

## Development

\- Before schema changes

\- Before migrations

\- Before major data changes

\- Before release testing

## Pilot

\- Daily database backup

\- Backup before deployment

\- Backup before migration

\- Backup before configuration changes

\- Weekly restore verification where practical

## Production

Recommended minimum:

\- Daily full backup

\- More frequent managed-service backups where required

\- Point-in-time recovery where available

\- Regular off-site or geo-redundant copy

\- Quarterly restore test

\- Restore test after major platform changes

Customer requirements take precedence.

---

# 20. Recommended Retention

Example pilot retention:

| Backup Type | Recommended Retention |

|---|---|

| Daily | 14 days |

| Weekly | 8 weeks |

| Monthly | 12 months |

| Pre-release | Life of release plus approval period |

| Pre-migration | Until migration is accepted and stable |

Retention must align with customer security and legal requirements.

---

# 21. Backup Register

Maintain a register containing:

| Field | Description |

|---|---|

| Backup ID | Unique identifier |

| File name | Backup filename |

| Database | Source database |

| Date and time | Backup timestamp |

| Created by | Responsible person |

| Size | File size |

| Verification status | Passed or failed |

| Restore-test status | Passed, failed, or not tested |

| Storage location | Approved location |

| Expiry date | Planned deletion date |

| Notes | Exceptions or observations |

Do not record passwords or secret values.

---

# 22. Production Recovery Procedure

A production restore must not begin without:

\- approved recovery decision;

\- identified recovery owner;

\- confirmed backup file;

\- verified backup archive;

\- documented recovery point;

\- current database backup if feasible;

\- customer notification where required;

\- rollback plan;

\- downtime approval.

Recommended sequence:

1\. Declare the recovery event.

2\. Record incident details.

3\. Stop application write traffic.

4\. Create a final backup if possible.

5\. Verify the selected recovery archive.

6\. Restore into a temporary database first where time permits.

7\. Validate row counts and schema.

8\. Restore or promote according to the approved recovery plan.

9\. Run Alembic verification.

10\. Start backend services.

11\. Validate login.

12\. Validate uploads.

13\. Validate Dashboard.

14\. Validate reports.

15\. Validate System Health.

16\. Record recovery completion.

---

# 23. Rollback After Failed Restore

If a restore fails:

1\. Stop the restore process.

2\. Preserve restore logs.

3\. Do not delete the source backup.

4\. Confirm whether the target was temporary or active.

5\. Drop only the failed temporary restore database.

6\. Verify the active database remains available.

7\. Review the first error.

8\. Confirm PostgreSQL client/server compatibility.

9\. Confirm storage and permissions.

10\. Retry only after the cause is understood.

Never repeatedly restore into an active production database without an approved plan.

---

# 24. Troubleshooting

## `pg\_dump` not found

Use:

```cmd

"C:\\Program Files\\PostgreSQL\\17\\bin\\pg\_dump.exe" --version

```

If it works, add the folder to `PATH` or keep the explicit executable path in scripts.

---

## `pg\_restore` cannot read the archive

Possible causes:

\- incomplete backup;

\- zero-byte file;

\- corrupted transfer;

\- incompatible or older restore utility;

\- invalid file path.

Run:

```cmd

pilot-package\\operations\\backup-scripts\\verify\_backup.bat "<backup-file>"

```

---

## Authentication failed

Check:

```dotenv

DB\_HOST=

DB\_PORT=

DB\_USER=

DB\_PASSWORD=

```

Do not print the password.

---

## Permission denied creating temporary database

The database user may not have `CREATEDB` permission.

Use an approved administrative database account for restore testing, or have the database administrator create the temporary database.

---

## Database is being accessed by other users

Terminate sessions only on the approved temporary target database.

Do not terminate active production sessions without approval.

---

## Restore ownership errors

The restore script uses:

```text

\--no-owner

\--no-privileges

```

This reduces ownership and ACL conflicts.

---

## Restore target already exists

The safe restore script drops and recreates the temporary target.

Confirm the target name is not the active database.

---

# 25. Backup Failure Conditions

A backup is considered failed when:

\- `pg\_dump` returns a nonzero exit code;

\- no file is created;

\- the backup file is empty;

\- archive verification fails;

\- expected objects are missing;

\- the backup cannot be restored;

\- restored row counts are materially incorrect.

Failed backups must not be marked as valid.

---

# 26. Restore Acceptance Criteria

A restore test passes only when:

\- \[ ] Temporary database is created

\- \[ ] Archive restores without error

\- \[ ] Required schemas exist

\- \[ ] Required tables exist

\- \[ ] Operational row counts match expectations

\- \[ ] Alembic revision matches

\- \[ ] Constraints and indexes restore

\- \[ ] Application account can connect

\- \[ ] Temporary database is deleted afterward

\- \[ ] Evidence is recorded

---

# 27. Evidence Files

Validated evidence:

```text

pilot-package\\operations\\validation\\postgres\_environment.txt

pilot-package\\operations\\validation\\backup\_test\_results.txt

pilot-package\\operations\\validation\\restore\_test\_results.txt

pilot-package\\operations\\validation\\backup\_archive\_inventory.txt

```

These evidence files must not include:

\- database passwords;

\- JWT secrets;

\- API keys;

\- backup encryption keys.

---

# 28. Final Checklist

\- \[ ] PostgreSQL tools verified

\- \[ ] Database connection verified

\- \[ ] Backup directory excluded from Git

\- \[ ] Backup created

\- \[ ] Backup file is non-empty

\- \[ ] Archive verification passed

\- \[ ] Archive inventory reviewed

\- \[ ] Temporary restore completed

\- \[ ] Row counts validated

\- \[ ] Alembic revision validated

\- \[ ] Temporary database deleted

\- \[ ] Evidence saved

\- \[ ] Backup register updated

\- \[ ] Retention assigned

\- \[ ] Backup copied to approved secure storage

---

# Revision History

| Version | Date | Description |

|---|---|---|

| 1.0 | August 2026 | Initial Backup and Restore Guide for Pilot Release |

---

\*\*End of Backup and Restore Guide\*\*

