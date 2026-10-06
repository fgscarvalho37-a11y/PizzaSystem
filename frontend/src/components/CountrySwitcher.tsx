"use client";

import {
  STORE_COUNTRIES,
} from "@/i18n/countries";

import {
  useLanguage,
} from "@/i18n/LanguageProvider";

export default function CountrySwitcher({
  compact = false,
  dark = false,
}: {
  compact?: boolean;
  dark?: boolean;
}) {
  const {
    countryCode,
    locale,
    setCountry,
  } =
    useLanguage();

  return (
    <label
      className={
        compact
          ? "inline-flex items-center"
          : "flex items-center gap-2"
      }
    >
      {!compact && (
        <span
          className={
            dark
              ? "text-[10px] font-bold uppercase tracking-[0.12em] text-white/45"
              : "text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground"
          }
        >
          {locale.startsWith(
            "en"
          )
            ? "Country"
            : "País"}
        </span>
      )}

      <select
        value={
          countryCode
        }
        onChange={(
          event
        ) =>
          setCountry(
            event.target.value
          )
        }
        aria-label={
          locale.startsWith(
            "en"
          )
            ? "Country"
            : "País"
        }
        className={[
          "h-9 rounded-full border px-3 text-xs font-bold outline-none transition",
          dark
            ? "border-white/10 bg-white/[0.05] text-white"
            : "border-border bg-background text-foreground",
        ].join(
          " "
        )}
      >
        {STORE_COUNTRIES.map(
          (country) => (
            <option
              key={
                country.code
              }
              value={
                country.code
              }
            >
              {locale.startsWith(
                "en"
              )
                ? country.en
                : country.pt}
            </option>
          )
        )}
      </select>
    </label>
  );
}
