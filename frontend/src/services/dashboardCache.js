// Memory only: survives route changes, never persists tenant data to disk.
const emptyResource = () => ({ data: null, loading: false, error: null });

export function createDashboardCache() {
  let session = 0;
  let state = { scope: null, generation: 0, summary: emptyResource(), history: emptyResource() };
  const listeners = new Set();
  const pending = new Map();
  const publish = (next) => {
    state = next;
    listeners.forEach((listener) => listener());
  };
  const clear = (scope) => {
    pending.clear();
    publish({ scope, generation: state.generation + 1, summary: emptyResource(), history: emptyResource() });
  };

  return {
    getSnapshot: () => state,
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
    refresh: (scope, resource, fetchData) => {
      if (!scope || state.scope !== scope) return Promise.resolve(false);
      if (pending.has(resource)) return pending.get(resource);
      const generation = state.generation;
      const current = () => state.scope === scope && state.generation === generation;
      const request = Promise.resolve().then(() => {
        if (!current()) throw new Error("Dashboard request invalidated");
        return fetchData();
      }).then(
        (data) => {
          if (!current()) return false;
          publish({ ...state, [resource]: { data, loading: false, error: null } });
          return true;
        },
        (error) => {
          if (!current()) return false;
          // A failed refresh must not destroy the last successful value.
          publish({ ...state, [resource]: { ...state[resource], loading: false, error } });
          return false;
        },
      ).finally(() => {
        if (pending.get(resource) === request) pending.delete(resource);
      });
      pending.set(resource, request);
      publish({ ...state, [resource]: { ...state[resource], loading: true, error: null } });
      return request;
    },
  };
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
