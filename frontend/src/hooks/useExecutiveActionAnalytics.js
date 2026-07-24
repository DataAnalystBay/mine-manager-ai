import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getExecutiveActionAnalytics,
} from "../api/executiveActionsApi";

function getErrorMessage(error) {
  return (
    error?.userMessage ||
    error?.response?.data?.detail ||
    error?.message ||
    "Unable to load executive action analytics."
  );
}

export default function useExecutiveActionAnalytics(
  options = {}
) {
  const {
    autoLoad = true,
  } = options;

  const [analytics, setAnalytics] =
    useState(null);

  const [loading, setLoading] =
    useState(autoLoad);

  const [error, setError] =
    useState("");

  const loadAnalytics = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getExecutiveActionAnalytics();

        setAnalytics(data);

        return data;
      } catch (requestError) {
        console.error(
          "Failed to load executive action analytics:",
          requestError
        );

        const message =
          getErrorMessage(requestError);

        setError(message);
        setAnalytics(null);

        throw requestError;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const refreshAnalytics = useCallback(
    async () => {
      return loadAnalytics();
    },
    [loadAnalytics]
  );

  const clearError = useCallback(() => {
    setError("");
  }, []);

  useEffect(() => {
    if (!autoLoad) {
      setLoading(false);
      return;
    }

    loadAnalytics().catch(() => {
      // Error state is already handled inside
      // loadAnalytics.
    });
  }, [autoLoad, loadAnalytics]);

  return {
    analytics,
    loading,
    error,
    loadAnalytics,
    refreshAnalytics,
    clearError,
    setAnalytics,
  };
}