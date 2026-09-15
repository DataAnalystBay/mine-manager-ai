// Local browser regression fixture. All API traffic is intercepted in memory.
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import axios from 'axios';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const requests = [];
const waiting = [];
axios.defaults.adapter = (config) => {
  const url = `${config.baseURL || ''}${config.url}`;
  requests.push(url);
  const response = (data) => ({ data, status: 200, statusText: 'OK', headers: {}, config });
  if (/config\/full|executive-summary|health-history/.test(url)) {
    return new Promise((resolve, reject) => waiting.push({ url, resolve: (data) => resolve(response(data)), reject }));
  }
  if (url.includes('/api/demo/')) return Promise.resolve(response({ success: true }));
  if (url.includes('executive-insights')) return Promise.resolve(response({ status: 'success', insights: [] }));
  if (url.includes('predictions/summary')) return Promise.resolve(response({ predictions: {}, overall_outlook: 'Unavailable' }));
  throw new Error(`Unexpected API request: ${url}`);
};

const { AuthProvider, useAuth } = await import('../src/context/AuthContext.jsx');
const { ConfigProvider, useConfig } = await import('../src/context/ConfigContext.jsx');
const { LanguageProvider, useLanguage } = await import('../src/context/LanguageContext.jsx');
const { default: Dashboard } = await import('../src/pages/Dashboard.jsx');
const { dashboardCache } = await import('../src/services/dashboardCache.js');
let auth, config, language, navigate;
// Test fixture intentionally mounts local components without exporting an application module.
// eslint-disable-next-line react-refresh/only-export-components
function Probe() {
  auth = useAuth(); config = useConfig(); language = useLanguage(); navigate = useNavigate();
  return null;
}
const root = createRoot(document.getElementById('root'));
const passed = [];
const check = (condition, message) => { if (!condition) throw Error(message); };
const count = (path) => requests.filter((url) => url.includes(path)).length;
const tick = async () => { await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); }); };
async function until(predicate) {
  for (let i = 0; i < 100; i++) { if (predicate()) return; await tick(); }
  throw Error('Timed out waiting for test state');
}
const settle = async (path, data, failure = false) => {
  const index = waiting.findIndex((request) => request.url.includes(path));
  check(index >= 0, `No pending ${path}`);
  const [request] = waiting.splice(index, 1);
  await act(async () => { if (failure) request.reject(Error('offline')); else request.resolve(data); });
};
const summary = (health) => ({ company_id: 12, mine_id: 34, health, ore: 98, waste: 97, fleet: 90,
  plant: 96, safety: 0, safety_score: 100, report_date: '2026-09-15', operation_profile: 'standard_mine' });
const history = { history: [{ report_date: '2026-09-14', health: 91 }, { report_date: '2026-09-15', health: 92 }] };
const configuration = (companyName, companyId = 12) => ({ company: { id: companyId, company_name: companyName },
  mine: { id: 34, company_id: companyId, mine_name: 'Same Mine' } });
const score = () => document.querySelector('.executive-type-health-score')?.textContent.trim();
const text = () => document.getElementById('root').textContent;

try {
  localStorage.clear();
  localStorage.setItem('access_token', 'test-session-a');
  localStorage.setItem('user', JSON.stringify({ id: 1, company_id: 1, role: 'Administrator' }));
  await act(async () => root.render(
    <React.StrictMode><AuthProvider><ConfigProvider><LanguageProvider><MemoryRouter>
      <Probe /><Routes><Route path="/" element={<Dashboard />} />
        <Route path="/production" element={<div>Production route</div>} /></Routes>
    </MemoryRouter></LanguageProvider></ConfigProvider></AuthProvider></React.StrictMode>,
  ));
  await until(() => count('config/full') === 1);
  check(document.querySelector('h1'), 'Cold header missing');
  check(score() === '—', 'Cold load showed a fabricated score');
  check(count('executive-summary') === 0 && count('health-history') === 0, 'Requested data before configuration');
  await settle('config/full', configuration('Tenant A'));
  await until(() => count('executive-summary') === 1 && count('health-history') === 1);
  await until(() => count('executive-insights') > 0 && count('predictions/summary') > 0);
  check(score() === '—', 'Panels should mount before summary data');
  check(!document.querySelector('.executive-kpi-grid'), 'Cold KPI values rendered');
  check(document.querySelector('.executive-panels-grid [role="status"]'), 'Decision loading states missing');
  passed.push('Cold shell, placeholders, config guard and independent panels (StrictMode)');

  await settle('executive-summary', summary(92)); await settle('health-history', history);
  check(score() === '92', 'Loaded score missing');
  await act(async () => navigate('/production'));
  await act(async () => navigate('/'));
  check(score() === '92', 'Return navigation failed to show cached score');
  check(document.querySelector('.executive-health-grid svg'), 'Cached chart missing on return');
  await until(() => count('executive-summary') === 2 && count('health-history') === 2);
  check(count('config/full') === 1, 'Navigation refetched configuration');
  check(count('shared-analytics') === 0, 'Unused shared analytics requested');
  passed.push('Route remount reuses summary/history; one background refresh each; no config/shared analytics request');

  await settle('executive-summary', null, true); await settle('health-history', null, true);
  check(score() === '92', 'Failed refresh destroyed cached score');
  check(document.querySelector('.executive-health-grid svg'), 'Failed refresh destroyed cached chart');
  check(document.querySelector('[role="alert"]'), 'Refresh error/retry absent');
  passed.push('Failed refresh preserves successful content and exposes retry');

  const beforeLanguage = count('executive-summary');
  await act(async () => language.setLanguage('MN'));
  await tick();
  check(count('executive-summary') === beforeLanguage, 'Language change refetched numeric summary');
  check(score() === '92', 'Language change discarded cache');
  await act(async () => language.setLanguage('EN'));
  passed.push('EN/MN switch preserves numeric cache without refetching summary');

  const beforeDemo = count('executive-summary');
  await act(async () => document.querySelector('.executive-demo-button').click());
  await until(() => waiting.some((r) => r.url.includes('executive-summary')));
  check(score() === '—', 'Demo write failed to invalidate prior score');
  await settle('executive-summary', summary(95)); await settle('health-history', history);
  await until(() => document.querySelector('.executive-reset-button') && !document.querySelector('.executive-reset-button').disabled);
  check(score() === '95', 'Demo did not use refreshed authoritative score');
  check(count('executive-summary') === beforeDemo + 1, 'Demo caused duplicate summary refresh');
  await act(async () => document.querySelector('.executive-reset-button').click());
  await until(() => waiting.some((r) => r.url.includes('executive-summary')));
  check(score() === '—', 'Demo reset failed to invalidate demo score');
  await settle('executive-summary', summary(92)); await settle('health-history', history);
  await until(() => !document.querySelector('.dashboard-transition-overlay'));
  check(score() === '92' && !document.querySelector('.executive-reset-button'), 'Demo reset failed to restore live state');
  check(count('shared-analytics') === 0, 'Demo refresh requested unused analytics');
  passed.push('Demo load/reset invalidate and refresh once while preserving scenario controls');

  await act(async () => dashboardCache.invalidate());
  check(score() === '—', 'Write invalidation retained invalid live score');
  await until(() => waiting.some((r) => r.url.includes('executive-summary')));
  const oldSummary = waiting.splice(waiting.findIndex((r) => r.url.includes('executive-summary')), 1)[0];
  const oldHistory = waiting.splice(waiting.findIndex((r) => r.url.includes('health-history')), 1)[0];
  await act(async () => { auth.logout(); auth.login('test-session-b', { id: 2, company_id: 2, role: 'Administrator' }); });
  check(!text().includes('Tenant A') && score() === '—', 'Account switch displayed prior tenant');
  await until(() => waiting.some((r) => r.url.includes('config/full')));
  await settle('config/full', configuration('Tenant B', 13));
  await until(() => waiting.some((r) => r.url.includes('executive-summary')));
  await settle('executive-summary', summary(81)); await settle('health-history', history);
  await act(async () => { oldSummary.resolve(summary(99)); oldHistory.resolve({ history: [] }); });
  check(score() === '81' && !text().includes('Tenant A'), 'Late previous-session response leaked');
  passed.push('Write invalidation and account switch with identical mine names reject late previous-session responses');

  await act(async () => { config.reloadConfiguration(); });
  await until(() => waiting.some((r) => r.url.includes('config/full')));
  const oldConfig = waiting.splice(waiting.findIndex((r) => r.url.includes('config/full')), 1)[0];
  await act(async () => auth.login('test-session-c', { id: 3, company_id: 3, role: 'Administrator' }));
  await until(() => waiting.some((r) => r.url.includes('config/full')));
  await settle('config/full', configuration('Tenant C', 14));
  await act(async () => oldConfig.resolve(configuration('Tenant B', 13)));
  check(text().includes('Tenant C') && !text().includes('Tenant B'), 'Late configuration response leaked');
  await settle('executive-summary', null, true); await settle('health-history', null, true);
  check(score() === '—' && !document.querySelector('.executive-kpi-grid'), 'Cold failure rendered fake live values');
  check(document.querySelector('.prediction-summary'), 'Cold summary failure removed independent predictions');
  passed.push('Configuration race rejected; cold errors retain shell/panels without fabricated values');
  await act(async () => auth.logout());
  check(!text().includes('Tenant C') && score() === '—', 'Logout left tenant data visible');
  passed.push('Logout clears all visible cached tenant data');
  document.getElementById('results').textContent = `PASS (${passed.length})\n${passed.join('\n')}`;
} catch (error) {
  document.getElementById('results').textContent = `FAIL: ${error.stack}\nPassed: ${passed.join('\n')}`;
}
