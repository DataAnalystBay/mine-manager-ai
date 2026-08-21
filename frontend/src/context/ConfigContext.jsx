import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { getFullConfig } from "../api/configApi";

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState({
    company: null,
    mine: null,
    kpi_targets: [],
    alert_thresholds: [],
    shift_patterns: [],
  });

  const [loading, setLoading] = useState(true);

  /*
   * Language
   * --------
   * "en" = English
   * "mn" = Mongolian
   *
   * We keep it in localStorage so the user's language
   * remains selected after refresh/login.
   */
  const [language, setLanguageState] = useState(() => {
    const storedLanguage = localStorage.getItem(
      "mine_manager_language",
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
      newLanguage,
    );
  };

  const toggleLanguage = () => {
    setLanguage(
      language === "en" ? "mn" : "en",
    );
  };

  const loadConfiguration = async () => {
    try {
      const data = await getFullConfig();

      setConfig({
        company: data?.company || null,
        mine: data?.mine || null,
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
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfiguration();
  }, []);

  return (
    <ConfigContext.Provider
      value={{
        ...config,

        loading,

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

export const useConfig = () => {
  const context = useContext(ConfigContext);

  if (!context) {
    throw new Error(
      "useConfig must be used inside ConfigProvider",
    );
  }

  return context;
};