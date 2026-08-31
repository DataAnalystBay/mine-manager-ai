import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { getFullConfig } from "../api/configApi";
import { useAuth } from "./AuthContext";


const ConfigContext = createContext();


const EMPTY_CONFIG = {
  company: null,
  mine: null,
  kpi_targets: [],
  alert_thresholds: [],
  shift_patterns: [],
};


export const ConfigProvider = ({ children }) => {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [config, setConfig] = useState(
    EMPTY_CONFIG
  );

  const [loading, setLoading] = useState(true);


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
    /*
     * Configuration is tenant-specific and therefore must
     * only be loaded after authentication has completed.
     */
    if (!user) {
      setConfig(EMPTY_CONFIG);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const data = await getFullConfig();

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
      });
    } catch (error) {
      console.error(
        "Failed to load configuration:",
        error
      );

      /*
       * Never retain the previous tenant's configuration
       * after a failed reload or account change.
       */
      setConfig(EMPTY_CONFIG);
    } finally {
      setLoading(false);
    }
  }, [
    user,
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
        ...config,

        loading:
          authLoading || loading,

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
