import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getExecutiveActions,
  updateExecutiveActionStatus,
} from "../api/executiveActionsApi";

function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function getActionId(action) {
  return action?.id ?? action?.action_id ?? null;
}

function getErrorMessage(error, fallbackMessage) {
  return (
    error?.userMessage ||
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage
  );
}

export default function useKpiExecutiveActions(kpiKey) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const loadActions = useCallback(async () => {
    if (!kpiKey) {
      setActions([]);
      setError("");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getExecutiveActions({
        kpi_key: kpiKey,
        skip: 0,
        limit: 100,
      });

      if (Array.isArray(response)) {
        setActions(response);
      } else if (Array.isArray(response?.items)) {
        setActions(response.items);
      } else if (Array.isArray(response?.actions)) {
        setActions(response.actions);
      } else {
        setActions([]);
      }
    } catch (requestError) {
      setActions([]);
      setError(
        getErrorMessage(
          requestError,
          "Failed to load related executive actions."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [kpiKey]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  const updateStatus = useCallback(async (actionOrId, nextStatus) => {
    const actionId =
      typeof actionOrId === "object"
        ? getActionId(actionOrId)
        : actionOrId;

    if (!actionId) throw new Error("Executive action ID is required.");

    const updatedAction = await updateExecutiveActionStatus(
      actionId,
      nextStatus
    );

    setActions((current) =>
      current.map((action) =>
        getActionId(action) === actionId ? updatedAction : action
      )
    );

    return updatedAction;
  }, []);

  const summary = useMemo(() => {
    const counts = {
      open: 0,
      inProgress: 0,
      completed: 0,
      blocked: 0,
    };

    actions.forEach((action) => {
      const status = normalizeStatus(action?.status);

      if (status === "in_progress") counts.inProgress++;
      else if (status === "completed") counts.completed++;
      else if (status === "blocked") counts.blocked++;
      else counts.open++;
    });

    const total = actions.length;

    return {
      total,
      open: counts.open,
      inProgress: counts.inProgress,
      completed: counts.completed,
      blocked: counts.blocked,
      completionRate:
        total > 0
          ? Math.round((counts.completed / total) * 100)
          : 0,
    };
  }, [actions]);

  return {
    actions,
    summary,
    loading,
    error,
    updatingStatusId,
    refresh: loadActions,
    updateStatus,
  };
}

