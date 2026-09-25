"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AppLocale =
  | "pt-BR"
  | "en-US";

type LanguageContextValue = {
  locale: AppLocale;
  isEnglish: boolean;
  setLocale: (
    locale: AppLocale
  ) => void;
  text: (
    pt: string,
    en: string
  ) => string;
};

const LanguageContext =
  createContext<LanguageContextValue | null>(
    null
  );

const STORAGE_KEY =
  "pizzasystem-language";

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    locale,
    setLocaleState,
  ] =
    useState<AppLocale>(
      "pt-BR"
    );

  useEffect(() => {
    const saved =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (
      saved === "pt-BR" ||
      saved === "en-US"
    ) {
      setLocaleState(
        saved
      );

      document.documentElement.lang =
        saved;

      return;
    }

    const detected:
      AppLocale =
      navigator.language
        .toLowerCase()
        .startsWith("pt")
        ? "pt-BR"
        : "en-US";

    setLocaleState(
      detected
    );

    document.documentElement.lang =
      detected;
  }, []);

  function setLocale(
    nextLocale:
      AppLocale
  ) {
    setLocaleState(
      nextLocale
    );

    window.localStorage.setItem(
      STORAGE_KEY,
      nextLocale
    );

    document.documentElement.lang =
      nextLocale;
  }

  const value =
    useMemo<LanguageContextValue>(
      () => ({
        locale,
        isEnglish:
          locale ===
          "en-US",
        setLocale,
        text: (
          pt,
          en
        ) =>
          locale ===
          "en-US"
            ? en
            : pt,
      }),
      [
        locale,
      ]
    );

  return (
    <LanguageContext.Provider
      value={
        value
      }
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
