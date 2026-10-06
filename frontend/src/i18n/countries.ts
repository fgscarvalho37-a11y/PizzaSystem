import type {
  AppLocale,
} from "@/i18n/LanguageProvider";

export type StoreCountryOption = {
  code: string;
  pt: string;
  en: string;
  currency: string;
  locale: AppLocale;
};

export const STORE_COUNTRIES:
  StoreCountryOption[] = [
  {
    code: "BR",
    pt: "Brasil",
    en: "Brazil",
    currency: "BRL",
    locale: "pt-BR",
  },
  {
    code: "US",
    pt: "Estados Unidos",
    en: "United States",
    currency: "USD",
    locale: "en-US",
  },
  {
    code: "GB",
    pt: "Reino Unido",
    en: "United Kingdom",
    currency: "GBP",
    locale: "en-GB",
  },
  {
    code: "AU",
    pt: "Austrália",
    en: "Australia",
    currency: "AUD",
    locale: "en-AU",
  },
  {
    code: "CA",
    pt: "Canadá",
    en: "Canada",
    currency: "CAD",
    locale: "en-US",
  },
  {
    code: "PT",
    pt: "Portugal",
    en: "Portugal",
    currency: "EUR",
    locale: "pt-BR",
  },
  {
    code: "ES",
    pt: "Espanha",
    en: "Spain",
    currency: "EUR",
    locale: "en-US",
  },
  {
    code: "FR",
    pt: "França",
    en: "France",
    currency: "EUR",
    locale: "en-US",
  },
  {
    code: "DE",
    pt: "Alemanha",
    en: "Germany",
    currency: "EUR",
    locale: "en-US",
  },
  {
    code: "IT",
    pt: "Itália",
    en: "Italy",
    currency: "EUR",
    locale: "en-US",
  },
];

export function getCountryOption(
  countryCode:
    | string
    | null
    | undefined
) {
  const normalized =
    countryCode
      ?.trim()
      .toUpperCase();

  return (
    STORE_COUNTRIES.find(
      (country) =>
        country.code ===
        normalized
    ) ??
    STORE_COUNTRIES[0]
  );
}

export function localeForCountry(
  countryCode:
    | string
    | null
    | undefined
): AppLocale {
  return getCountryOption(
    countryCode
  ).locale;
}
