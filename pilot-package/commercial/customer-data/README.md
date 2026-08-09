\# Customer Data Folder



This folder is reserved for commercial pilot customer data.



\## Important



Do not commit real customer operational data to Git.



The following types of files are intentionally ignored:



\- Excel files

\- CSV files

\- JSON data files

\- ZIP archives

\- Environment files

\- Credential files

\- Secret files



\## Typical Customer Inputs



Examples may include:



\- Production reports

\- Fleet reports

\- Plant reports

\- Safety reports

\- Maintenance reports

\- Workforce reports

\- KPI target files

\- Customer configuration exports



\## Handling Rules



1\. Store customer data only on approved local or secured storage.

2\. Never place passwords, API keys, database credentials, or secrets in Git.

3\. Remove customer-identifying data before creating reusable demo datasets.

4\. Use synthetic or anonymized data for demonstrations and development.

5\. Confirm customer permission before using any operational data outside the agreed pilot scope.



\## Git Policy



This folder is protected by `.gitignore`.



Only this README and the optional `.gitkeep` file may be committed.

