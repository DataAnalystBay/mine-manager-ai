import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useConfig,
} from "./ConfigContext";

import {
  translations,
} from "../i18n/translations";

const LanguageContext =
  createContext(null);

const STORAGE_KEY =
  "mma_language";


function normalizeLanguage(
  value
) {
  const normalized =
    String(value || "")
      .trim()
      .toLowerCase();

  if (
    normalized === "mn" ||
    normalized === "mongolian" ||
    normalized === "\u043c\u043e\u043d\u0433\u043e\u043b"
  ) {
    return "MN";
  }

  return "EN";
}


function getTranslation(
  dictionary,
  key
) {
  return key
    .split(".")
    .reduce(
      (
        current,
        part
      ) => {
        if (
          current &&
          Object.prototype.hasOwnProperty.call(
            current,
            part
          )
        ) {
          return current[
            part
          ];
        }

        return undefined;
      },
      dictionary
    );
}


export function LanguageProvider({
  children,
}) {
  const {
    company,
    loading: configLoading,
  } = useConfig();

  const [
    language,
    setLanguageState,
  ] = useState(() => {
    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (saved) {
      return normalizeLanguage(
        saved
      );
    }

    return "EN";
  });


  /* ============================================================
     Apply configured company language when the user has not
     already selected a personal language preference.
     ============================================================ */

  useEffect(() => {
    if (configLoading) {
      return;
    }

    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (
      !saved &&
      company?.language
    ) {
      setLanguageState(
        normalizeLanguage(
          company.language
        )
      );
    }
  }, [
    company?.language,
    configLoading,
  ]);


  /* ============================================================
     Persist language and update document locale
     ============================================================ */

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      language
    );

    document.documentElement.lang =
      language === "MN"
        ? "mn"
        : "en";
  }, [
    language,
  ]);


  /* ============================================================
     Public language controls
     ============================================================ */

  const setLanguage = (
    value
  ) => {
    setLanguageState(
      normalizeLanguage(
        value
      )
    );
  };


  const toggleLanguage =
    () => {
      setLanguageState(
        (current) =>
          current === "EN"
            ? "MN"
            : "EN"
      );
    };


  /* ============================================================
     Translation function
     ============================================================ */

  const t = (
    key
  ) => {
    const selected =
      getTranslation(
        translations[
          language
        ],
        key
      );

    if (
      selected !==
      undefined
    ) {
      return selected;
    }

    const english =
      getTranslation(
        translations.EN,
        key
      );

    if (
      english !==
      undefined
    ) {
      return english;
    }

    return key;
  };


  const value =
    useMemo(
      () => ({
        language,
        setLanguage,
        toggleLanguage,
        t,
        isMongolian:
          language === "MN",
      }),
      [
        language,
      ]
    );


  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  );
}


export function useLanguage() {
  const context =
    useContext(
      LanguageContext
    );

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}