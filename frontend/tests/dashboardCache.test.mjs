import test from 'node:test';
import assert from 'node:assert/strict';
import { createDashboardCache, dashboardCache, invalidateDashboardAfterWrites } from '../src/services/dashboardCache.js';

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const setup = () => {
  const cache = createDashboardCache();
  const session = cache.resetSession();
  return { cache, session, scope: cache.configure(session, 12, 34) };
};

test('route unsubscribe/remount retains values and deduplicates an active refresh', async () => {
  const { cache, scope } = setup();
  const unsubscribe = cache.subscribe(() => {});
  await cache.refresh(scope, 'summary', async () => ({ health: 92 }));
  await cache.refresh(scope, 'history', async () => ({ history: [92] }));
  unsubscribe();
  const request = deferred();
  let calls = 0;
  const load = () => { calls++; return request.promise; };
  const first = cache.refresh(scope, 'summary', load);
  const duplicate = cache.refresh(scope, 'summary', load);
  assert.equal(first, duplicate);
  assert.equal(cache.getSnapshot().summary.data.health, 92);
  assert.deepEqual(cache.getSnapshot().history.data.history, [92]);
  await Promise.resolve();
  assert.equal(calls, 1);
  request.resolve({ health: 94 });
  await first;
  assert.equal(cache.getSnapshot().summary.data.health, 94);
});

test('failed background refresh preserves last successful summary and history', async () => {
  const { cache, scope } = setup();
  for (const resource of ['summary', 'history']) {
    await cache.refresh(scope, resource, async () => ({ value: 7 }));
    assert.equal(await cache.refresh(scope, resource, async () => { throw Error('offline'); }), false);
    assert.deepEqual(cache.getSnapshot()[resource].data, { value: 7 });
    assert.equal(cache.getSnapshot()[resource].error.message, 'offline');
  }
});

test('logout/account switch rejects old in-flight data even for identical operational IDs', async () => {
  const { cache, scope } = setup();
  const old = deferred();
  const request = cache.refresh(scope, 'summary', () => old.promise);
  await Promise.resolve();
  const newSession = cache.resetSession();
  const newScope = cache.configure(newSession, 12, 34);
  assert.notEqual(newScope, scope);
  await cache.refresh(newScope, 'summary', async () => ({ health: 81 }));
  old.resolve({ health: 99 });
  assert.equal(await request, false);
  assert.equal(cache.getSnapshot().summary.data.health, 81);
  assert.equal(await cache.refresh(scope, 'history', async () => []), false);
});

test('company/mine identity is required and configuration changes invalidate old results', async () => {
  const { cache, session, scope } = setup();
  await cache.refresh(scope, 'summary', async () => ({ health: 92 }));
  const differentCompany = cache.configure(session, 13, 34);
  assert.notEqual(differentCompany, scope);
  assert.equal(cache.getSnapshot().summary.data, null);
  assert.notEqual(cache.configure(session, 13, 35), differentCompany);
  assert.equal(cache.configure(session, null, 35), null);
  assert.equal(cache.configure(session - 1, 12, 34), null);
  assert.equal(cache.getSnapshot().scope, null);
});

test('write invalidation rejects late pre-write responses and permits a fresh request', async () => {
  const { cache, scope } = setup();
  const old = deferred();
  const pending = cache.refresh(scope, 'history', () => old.promise);
  await Promise.resolve();
  cache.invalidate();
  assert.equal(cache.getSnapshot().history.data, null);
  await cache.refresh(scope, 'history', async () => ({ history: [85] }));
  old.resolve({ history: [99] });
  assert.equal(await pending, false);
  assert.deepEqual(cache.getSnapshot().history.data.history, [85]);
});

test('successful write interceptor invalidates, GET and old-session writes do not', async () => {
  let onRequest, onResponse;
  invalidateDashboardAfterWrites({ interceptors: {
    request: { use: (fn) => { onRequest = fn; } },
    response: { use: (fn) => { onResponse = fn; } },
  } });
  const session = dashboardCache.resetSession();
  const scope = dashboardCache.configure(session, 12, 34);
  await dashboardCache.refresh(scope, 'summary', async () => ({ health: 92 }));
  onResponse({ config: onRequest({ method: 'get' }) });
  assert.equal(dashboardCache.getSnapshot().summary.data.health, 92);
  const oldWrite = onRequest({ method: 'post' });
  for (const method of ['post', 'put', 'patch', 'delete']) {
    const generation = dashboardCache.getSnapshot().generation;
    onResponse({ config: onRequest({ method }) });
    assert.equal(dashboardCache.getSnapshot().generation, generation + 1);
  }
  dashboardCache.resetSession();
  const generation = dashboardCache.getSnapshot().generation;
  onResponse({ config: oldWrite });
  assert.equal(dashboardCache.getSnapshot().generation, generation);
});
