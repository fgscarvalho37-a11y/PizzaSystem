"use client";

import {
  useLanguage,
} from "@/i18n/LanguageProvider";

export default function LanguageSwitcher({
  dark = false,
}: {
  dark?: boolean;
}) {
  const {
    locale,
    setLocale,
  } =
    useLanguage();

  const shell =
    dark
      ? "border-white/10 bg-white/[0.04] text-white/45"
      : "border-border bg-background text-muted-foreground";

  const active =
    dark
      ? "bg-white text-[#1f1713]"
      : "bg-foreground text-background";

  return (
    <div
      className={`inline-flex items-center rounded-full border p-1 text-[10px] font-bold tracking-[0.08em] ${shell}`}
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() =>
          setLocale(
            "pt-BR"
          )
        }
        className={`rounded-full px-2.5 py-1 transition ${
          locale ===
          "pt-BR"
            ? active
            : ""
        }`}
        aria-pressed={
          locale ===
          "pt-BR"
        }
      >
        PT
      </button>

      <button
        type="button"
        onClick={() =>
          setLocale(
            "en-US"
          )
        }
        className={`rounded-full px-2.5 py-1 transition ${
          locale ===
          "en-US"
            ? active
            : ""
        }`}
        aria-pressed={
          locale ===
          "en-US"
        }
      >
        EN
      </button>
    </div>
  );
}
