\# Mine Manager AI Version 1.0.3 Deployment Guide



\## Release Information



Version: 1.0.3

Release Tag: v1.0.3

Release Commit: 2289682

Release Branch: commercial/v1.0-pilot



\## Deployment Architecture



Mine Manager AI Version 1.0.3 uses:



\- React frontend

\- FastAPI backend

\- PostgreSQL database

\- Browser-based customer interface

\- Excel operational data upload

\- Secure authenticated API access



\## Minimum Deployment Components



1\. Frontend web application

2\. FastAPI backend service

3\. PostgreSQL database

4\. Environment configuration

5\. HTTPS-enabled customer URL

6\. Authorized user accounts



\## Required Backend Environment Variables



APP\_NAME=Mine Manager AI

APP\_VERSION=1.0.3

APP\_ENV=production

DATABASE\_URL=<production PostgreSQL connection>

SECRET\_KEY=<strong production secret>

OPENAI\_API\_KEY=<configured key if AI services require it>

CORS\_ORIGINS=<approved frontend URL>

STORAGE\_PATH=app/storage



\## Required Frontend Environment Variables



VITE\_APP\_NAME=Mine Manager AI

VITE\_APP\_VERSION=1.0.3

VITE\_API\_BASE\_URL=<production backend URL>

VITE\_DEMO\_MODE=false



\## Pre-Deployment Verification



\- Backend starts successfully

\- Database connection succeeds

\- Database migrations are current

\- Frontend production build succeeds

\- APP\_VERSION reports 1.0.3

\- Authentication works

\- RBAC works

\- Production upload works

\- Fleet upload works

\- Plant upload works

\- Safety upload works

\- Dashboard loads operational KPIs

\- Executive reports generate successfully



\## Customer Pilot Setup



1\. Configure company

2\. Configure mine

3\. Configure timezone

4\. Configure language

5\. Configure KPI targets

6\. Create customer users

7\. Assign correct roles

8\. Provide operational upload templates

9\. Load initial operational data

10\. Verify dashboard results

11\. Generate first executive report

12\. Complete pilot acceptance checklist



\## Supported Version 1.0.3 Data Inputs



\### Production



\- report\_date

\- ore\_plan

\- ore\_actual

\- waste\_plan

\- waste\_actual



\### Fleet



\- report\_date

\- availability

\- utilization



\### Plant



\- report\_date

\- throughput\_plan

\- throughput\_actual

\- recovery



\### Safety



\- report\_date

\- incidents

\- near\_misses

\- critical\_risks

\- safety\_score



\## Production Deployment Rules



\- Do not use demo credentials

\- Do not expose SECRET\_KEY

\- Do not commit .env files

\- Use HTTPS

\- Use production database credentials

\- Restrict CORS to approved customer URLs

\- Disable demo mode for normal customer use

\- Maintain database backups

\- Review system health after deployment

\- Verify audit logging



\## Version 1.0.x Change Control



Only the following changes should be applied to Version 1.0.x:



\- Critical defect fixes

\- Security fixes

\- Data-integrity fixes

\- KPI calculation corrections

\- Deployment blockers

\- Authentication/RBAC defects

\- Customer-blocking usability fixes

\- Material report accuracy fixes



New strategic features belong to Version 2.0.

