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

  const loadConfiguration = async () => {
    try {
      const data = await getFullConfig();
      setConfig(data);
    } catch (error) {
      console.error("Failed to load configuration:", error);
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
        reloadConfiguration: loadConfiguration,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  return useContext(ConfigContext);
};