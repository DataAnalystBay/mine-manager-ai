import { useCallback, useEffect, useSyncExternalStore } from "react";
import { dashboardCache } from "../services/dashboardCache";
import { getExecutiveSummary, getHealthHistory } from "../services/dashboardApi";

const EMPTY = { data: null, loading: false, error: null };

export default function useDashboardData(scope, mineName) {
  const snapshot = useSyncExternalStore(dashboardCache.subscribe, dashboardCache.getSnapshot);
  const current = Boolean(scope) && snapshot.scope === scope;
  const refreshSummary = useCallback(
    () => dashboardCache.refresh(scope, "summary", () => getExecutiveSummary(mineName)),
    [scope, mineName],
  );
  const refreshHistory = useCallback(
    () => dashboardCache.refresh(scope, "history", () => getHealthHistory(mineName)),
    [scope, mineName],
  );
  const ensureSummary = useCallback(
    () => dashboardCache.ensure(scope, "summary", () => getExecutiveSummary(mineName)),
    [scope, mineName],
  );
  const ensureHistory = useCallback(
    () => dashboardCache.ensure(scope, "history", () => getHealthHistory(mineName)),
    [scope, mineName],
  );

  useEffect(() => {
    if (!current) return;
    ensureSummary();
    ensureHistory();
  }, [current, snapshot.generation, ensureSummary, ensureHistory]);

  return {
    summary: current ? snapshot.summary : EMPTY,
    history: current ? snapshot.history : EMPTY,
    refreshSummary,
    refreshHistory,
  };
}
