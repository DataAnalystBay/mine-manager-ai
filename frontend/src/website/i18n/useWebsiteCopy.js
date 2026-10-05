import { createContext, createElement, useContext, useEffect, useMemo, useState } from "react";
import { websiteTranslations } from "./websiteTranslations";

const WebsiteLanguageContext = createContext(null);
const STORAGE_KEY = "mma_website_language";
const normalizeLanguage = (value) => value === "EN" ? "EN" : "MN";
const resolveCopy = (dictionary, key) => key.split(".").reduce((current, part) => current?.[part], dictionary);

export function WebsiteLanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => normalizeLanguage(localStorage.getItem(STORAGE_KEY)));
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === "MN" ? "mn" : "en";
  }, [language]);
  const value = useMemo(() => ({
    language,
    setLanguage: (next) => setLanguageState(normalizeLanguage(next)),
    t: (key) => resolveCopy(websiteTranslations[language], key) ?? resolveCopy(websiteTranslations.MN, key) ?? key,
  }), [language]);
  return createElement(WebsiteLanguageContext.Provider, { value }, children);
}

export function useWebsiteCopy() {
  const context = useContext(WebsiteLanguageContext);
  if (!context) throw new Error("useWebsiteCopy must be used inside WebsiteLanguageProvider");
  return context;
}
