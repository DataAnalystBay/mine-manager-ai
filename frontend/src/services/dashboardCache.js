// Memory only: survives route changes, never persists tenant data to disk.
export const DASHBOARD_CACHE_TTL_MS = 30_000;

const EMPTY_RESOURCE = Object.freeze({
  data: null,
  loading: false,
  error: null,
  updatedAt: 0,
});
const emptyResource = () => ({ ...EMPTY_RESOURCE });

export function createDashboardCache() {
  let session = 0;
  let state = {
    scope: null,
    generation: 0,
    summary: emptyResource(),
    history: emptyResource(),
    additional: {},
  };
  const listeners = new Set();
  const pending = new Map();
  const publish = (next) => {
    state = next;
    listeners.forEach((listener) => listener());
  };
  const clear = (scope) => {
    pending.clear();
    publish({
      scope,
      generation: state.generation + 1,
      summary: emptyResource(),
      history: emptyResource(),
      additional: {},
    });
  };
  const selectResource = (snapshot, resource) =>
    resource === "summary" || resource === "history"
      ? snapshot[resource]
      : snapshot.additional[resource] || EMPTY_RESOURCE;
  const publishResource = (resource, value) => {
    if (resource === "summary" || resource === "history") {
      publish({ ...state, [resource]: value });
      return;
    }
    publish({
      ...state,
      additional: { ...state.additional, [resource]: value },
    });
  };

  const api = {
    getSnapshot: () => state,
    getResource: (scope, resource) =>
      scope && state.scope === scope
        ? selectResource(state, resource)
        : EMPTY_RESOURCE,
    isFresh: (
      scope,
      resource,
      ttlMs = DASHBOARD_CACHE_TTL_MS,
    ) => {
      const cached = api.getResource(scope, resource);
      return cached.data !== null && Date.now() - cached.updatedAt < ttlMs;
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSession: () => session,
    resetSession: () => {
      session += 1;
      clear(null);
      return session;
    },
    configure: (sessionId, companyId, mineId) => {
      if (sessionId !== session) return null;
      const scope = companyId != null && mineId != null
        ? JSON.stringify([sessionId, companyId, mineId]) : null;
      clear(scope);
      return scope;
    },
    invalidate: () => clear(state.scope),
    ensure: (
      scope,
      resource,
      fetchData,
      ttlMs = DASHBOARD_CACHE_TTL_MS,
    ) => {
      if (!scope || state.scope !== scope) return Promise.resolve(false);
      if (api.isFresh(scope, resource, ttlMs)) {
        return Promise.resolve(true);
      }
      return api.refresh(scope, resource, fetchData);
    },
    refresh: (scope, resource, fetchData) => {
      if (!scope || state.scope !== scope) return Promise.resolve(false);
      if (pending.has(resource)) return pending.get(resource);
      const generation = state.generation;
      const current = () => state.scope === scope && state.generation === generation;
      const existing = () => selectResource(state, resource);
      const request = Promise.resolve().then(() => {
        if (!current()) throw new Error("Dashboard request invalidated");
        return fetchData();
      }).then(
        (data) => {
          if (!current()) return false;
          publishResource(resource, {
            data,
            loading: false,
            error: null,
            updatedAt: Date.now(),
          });
          return true;
        },
        (error) => {
          if (!current()) return false;
          // A failed refresh must not destroy the last successful value.
          publishResource(resource, {
            ...existing(),
            loading: false,
            error,
          });
          return false;
        },
      ).finally(() => {
        if (pending.get(resource) === request) pending.delete(resource);
      });
      pending.set(resource, request);
      publishResource(resource, {
        ...existing(),
        loading: true,
        error: null,
      });
      return request;
    },
  };

  return api;
}

export const dashboardCache = createDashboardCache();

// Install on clients that perform operational/configuration writes.
export function invalidateDashboardAfterWrites(client) {
  client.interceptors.request.use((config) => {
    config.dashboardSession = dashboardCache.getSession();
    return config;
  });
  client.interceptors.response.use((response) => {
    if (response.config?.dashboardSession === dashboardCache.getSession() &&
        ["post", "put", "patch", "delete"].includes(response.config?.method?.toLowerCase())) {
      dashboardCache.invalidate();
    }
    return response;
  });
}
