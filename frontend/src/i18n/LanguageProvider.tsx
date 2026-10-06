"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AppLocale =
  | "pt-BR"
  | "en-US"
  | "en-GB"
  | "en-AU";

type LanguageContextValue = {
  locale: AppLocale;
  isEnglish: boolean;
  setLocale: (
    locale: AppLocale
  ) => void;
  applyDefaultLocale: (
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
      saved === "en-US" ||
      saved === "en-GB" ||
      saved === "en-AU"
    ) {
      setLocaleState(
        saved
      );

      document.documentElement.lang =
        saved;

      return;
    }

    const browserLocale =
      navigator.language
        .toLowerCase();

    const detected:
      AppLocale =
      browserLocale.startsWith("pt")
        ? "pt-BR"
        : browserLocale.startsWith("en-au")
          ? "en-AU"
          : browserLocale.startsWith("en-gb")
            ? "en-GB"
            : "en-US";

    setLocaleState(
      detected
    );

    document.documentElement.lang =
      detected;
  }, []);

  const setLocale =
    useCallback((
      nextLocale:
        AppLocale
    ) => {
    setLocaleState(
      nextLocale
    );

    window.localStorage.setItem(
      STORAGE_KEY,
      nextLocale
    );

    document.documentElement.lang =
      nextLocale;
  }, []);

  const applyDefaultLocale =
    useCallback((
      nextLocale:
        AppLocale
    ) => {
    const saved =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (
      saved === "pt-BR" ||
      saved === "en-US" ||
      saved === "en-GB" ||
      saved === "en-AU"
    ) {
      return;
    }

    setLocaleState(
      nextLocale
    );

    document.documentElement.lang =
      nextLocale;
  }, []);

  const value =
    useMemo<LanguageContextValue>(
      () => ({
        locale,
        isEnglish:
          locale.startsWith(
            "en"
          ),
        setLocale,
        applyDefaultLocale,
        text: (
          pt,
          en
        ) =>
          locale.startsWith(
            "en"
          )
            ? en
            : pt,
      }),
      [
        locale,
        setLocale,
        applyDefaultLocale,
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
