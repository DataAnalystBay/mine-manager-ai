\# Mine Manager AI Version 1.0 — Customer Deployment Checklist



Version: 1.0.0

Commercial Branch: commercial/v1.0-pilot

Purpose: Customer pilot and production-readiness deployment



\## 1. Customer Information



\- \[ ] Customer company name confirmed

\- \[ ] Mine name confirmed

\- \[ ] Primary customer contact confirmed

\- \[ ] Technical contact confirmed

\- \[ ] Pilot start date confirmed

\- \[ ] Pilot duration confirmed



\## 2. Deployment Environment



\- \[ ] Deployment environment selected

\- \[ ] Frontend hosting configured

\- \[ ] Backend hosting configured

\- \[ ] PostgreSQL database provisioned

\- \[ ] HTTPS enabled

\- \[ ] Production domain confirmed

\- \[ ] Backup strategy confirmed



\## 3. Backend Configuration



\- \[ ] `APP\_VERSION=1.0.0`

\- \[ ] `APP\_ENV=production`

\- \[ ] Production `SECRET\_KEY` generated

\- \[ ] Database host configured

\- \[ ] Database name configured

\- \[ ] Database user configured

\- \[ ] Database password configured

\- \[ ] OpenAI API key configured if required

\- \[ ] CORS origins configured

\- \[ ] Storage path configured



\## 4. Frontend Configuration



\- \[ ] `VITE\_APP\_NAME` configured

\- \[ ] `VITE\_APP\_VERSION=1.0.0`

\- \[ ] `VITE\_API\_BASE\_URL` configured

\- \[ ] Production frontend build succeeds

\- \[ ] Production bundle contains no localhost API references



\## 5. Database



\- \[ ] PostgreSQL connection succeeds

\- \[ ] Alembic migrations applied

\- \[ ] Alembic current revision matches head

\- \[ ] Database backup tested

\- \[ ] Restore process documented



\## 6. Company and Mine Configuration



\- \[ ] Company name configured

\- \[ ] Mine name configured

\- \[ ] Company logo uploaded

\- \[ ] Primary brand color configured

\- \[ ] Secondary brand color configured

\- \[ ] Timezone configured

\- \[ ] Language configured

\- \[ ] Shift pattern configured



\## 7. KPI Configuration



\- \[ ] Production KPI targets configured

\- \[ ] Fleet KPI targets configured

\- \[ ] Plant KPI targets configured

\- \[ ] Safety KPI targets configured

\- \[ ] Warning thresholds configured

\- \[ ] Critical thresholds configured



\## 8. Users and Security



\- \[ ] Administrator account created

\- \[ ] General Manager account created if required

\- \[ ] Mine Manager account created if required

\- \[ ] Superintendent account created if required

\- \[ ] Viewer accounts created if required

\- \[ ] Temporary passwords changed

\- \[ ] Role-based access tested

\- \[ ] Protected endpoints reject unauthenticated requests



\## 9. Customer Data



\- \[ ] Production data template agreed

\- \[ ] Fleet data template agreed

\- \[ ] Plant data template agreed

\- \[ ] Safety data template agreed

\- \[ ] Customer sample files received

\- \[ ] Column mappings verified

\- \[ ] Date formats verified

\- \[ ] Units verified

\- \[ ] Data-quality issues documented



\## 10. Functional Validation



\- \[ ] Login succeeds

\- \[ ] Executive Dashboard loads

\- \[ ] Mine Health Score loads

\- \[ ] Production analytics work

\- \[ ] Fleet analytics work

\- \[ ] Plant analytics work

\- \[ ] Safety analytics work

\- \[ ] Executive KPI Analysis works

\- \[ ] AI Executive Insights work

\- \[ ] Predictive Intelligence works

\- \[ ] Executive Actions work



\## 11. Reports



\- \[ ] Daily Executive PDF works

\- \[ ] Weekly Operations PDF works

\- \[ ] Monthly KPI Pack works

\- \[ ] Excel export works

\- \[ ] PowerPoint Board Pack works

\- \[ ] Report History works

\- \[ ] Customer branding appears correctly



\## 12. Demo Mode



\- \[ ] Demo Mode requirement agreed with customer

\- \[ ] Demo data kept separate from live customer data

\- \[ ] Demo Reset behavior understood

\- \[ ] Demo Mode disabled for normal production use if not required



\## 13. Operations and Support



\- \[ ] System Health page checked

\- \[ ] Audit Trail checked

\- \[ ] Support Diagnostics checked

\- \[ ] Incident response process shared

\- \[ ] Support contact agreed

\- \[ ] Backup monitoring agreed



\## 14. Pilot Acceptance



\- \[ ] Customer confirms dashboard usefulness

\- \[ ] Customer confirms KPI accuracy

\- \[ ] Customer confirms report usefulness

\- \[ ] Customer confirms predictive output usefulness

\- \[ ] Customer issues documented

\- \[ ] Customer change requests classified

\- \[ ] Pilot acceptance meeting completed



\## 15. Commercial Conversion



\- \[ ] Pilot results summarized

\- \[ ] Time savings quantified

\- \[ ] Reporting-effort reduction quantified

\- \[ ] Decision-support value documented

\- \[ ] Commercial proposal submitted

\- \[ ] Subscription/license terms agreed

\- \[ ] Production go-live approved

