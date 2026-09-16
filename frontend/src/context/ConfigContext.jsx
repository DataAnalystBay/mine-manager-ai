import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { getFullConfig } from "../api/configApi";
import { useAuth } from "./AuthContext";


import { dashboardCache } from "../services/dashboardCache";

const ConfigContext = createContext();


const EMPTY_CONFIG = {
  company: null,
  mine: null,
  kpi_targets: [],
  alert_thresholds: [],
  shift_patterns: [],
  operation_profile: null,
};


export const ConfigProvider = ({ children }) => {
  const {
    user,
    sessionId,
    loading: authLoading,
  } = useAuth();

  const [config, setConfig] = useState(
    EMPTY_CONFIG
  );

  const [loading, setLoading] = useState(true);
  const [configuredSession, setConfiguredSession] = useState(null);
  const [dashboardScope, setDashboardScope] = useState(null);
  const requestIdRef = useRef(0);


  /*
   * Language
   * --------
   * "en" = English
   * "mn" = Mongolian
   *
   * Persist the selected UI language between sessions.
   */
  const [language, setLanguageState] = useState(() => {
    const storedLanguage = localStorage.getItem(
      "mine_manager_language"
    );

    if (
      storedLanguage === "en" ||
      storedLanguage === "mn"
    ) {
      return storedLanguage;
    }

    return "en";
  });


  const setLanguage = (newLanguage) => {
    if (
      newLanguage !== "en" &&
      newLanguage !== "mn"
    ) {
      return;
    }

    setLanguageState(newLanguage);

    localStorage.setItem(
      "mine_manager_language",
      newLanguage
    );
  };


  const toggleLanguage = () => {
    setLanguage(
      language === "en" ? "mn" : "en"
    );
  };


  const loadConfiguration = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const isCurrent = () => requestIdRef.current === requestId &&
      dashboardCache.getSession() === sessionId;
    dashboardCache.configure(sessionId, null, null);
    /*
     * Configuration is tenant-specific and therefore must
     * only be loaded after authentication has completed.
     */
    if (!user) {
      setConfig(EMPTY_CONFIG);
      setConfiguredSession(sessionId);
      setDashboardScope(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const data = await getFullConfig();
      if (!isCurrent()) return;
      setConfiguredSession(sessionId);
      setDashboardScope(dashboardCache.configure(sessionId, data?.company?.id, data?.mine?.id));

      setConfig({
        company:
          data?.company || null,

        mine:
          data?.mine || null,

        kpi_targets:
          data?.kpi_targets || [],

        alert_thresholds:
          data?.alert_thresholds || [],

        shift_patterns:
          data?.shift_patterns || [],

        operation_profile:
          data?.operation_profile || null,
      });
    } catch (error) {
      if (!isCurrent()) return;
      console.error(
        "Failed to load configuration:",
        error
      );

      /*
       * Never retain the previous tenant's configuration
       * after a failed reload or account change.
       */
      setConfig(EMPTY_CONFIG);
      setConfiguredSession(sessionId);
      setDashboardScope(null);
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [
    user,
    sessionId,
  ]);


  useEffect(() => {
    /*
     * Wait until AuthProvider has restored the user/token.
     *
     * Then reload configuration whenever the authenticated
     * user changes. This prevents the initial-login race
     * where Dashboard previously fell back to:
     *
     *   Mine Manager AI
     *   Demo Mine
     */
    if (authLoading) {
      return;
    }

    const timeoutId = window.setTimeout(
      loadConfiguration,
      0
    );

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [
    authLoading,
    loadConfiguration,
  ]);


  return (
    <ConfigContext.Provider
      value={{
        ...(configuredSession === sessionId ? config : EMPTY_CONFIG),
        dashboardScope: !loading && configuredSession === sessionId ? dashboardScope : null,

        loading:
          authLoading || loading || configuredSession !== sessionId,

        language,
        setLanguage,
        toggleLanguage,

        reloadConfiguration:
          loadConfiguration,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};


// Keep the established context API in one module for existing consumers.
// eslint-disable-next-line react-refresh/only-export-components
export const useConfig = () => {
  const context = useContext(
    ConfigContext
  );

  if (!context) {
    throw new Error(
      "useConfig must be used inside ConfigProvider"
    );
  }

  return context;
};
