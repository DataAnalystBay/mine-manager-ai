# Dashboard performance regression tests

Run from `frontend`:

```powershell
node --test tests/dashboardCache.test.mjs
node tests/runDashboardBrowser.mjs
npm run build
```

The browser runner uses an installed Chrome, Chromium or Edge. Set
`DASHBOARD_TEST_BROWSER` to its executable if it is not found automatically.
Sandboxed environments may need permission to launch browser child processes.
No package installation is required.

The browser fixture mounts the real Dashboard, authentication, configuration and
language providers in React StrictMode. A lightweight `/production` route exercises
Dashboard unmount/remount without involving unrelated Production components.
Every API response is mocked in memory; no live backend, credentials or customer
data is used. The tests cover cold loading, independent panels, navigation reuse,
request deduplication, refresh failures, EN/MN changes, demo load/reset, invalidation,
logout, account switches and late configuration/data responses.

Cache unit tests additionally cover operational company/mine IDs, same-ID account
switches, pending-request invalidation and successful-write interceptors.

These fixtures are not part of the production Vite entry point. The measurements
do not establish deployed network latency or backend query performance.
