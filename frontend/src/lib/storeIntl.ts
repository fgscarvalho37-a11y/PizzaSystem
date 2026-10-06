export type StoreIntlSnapshot = {
  defaultLocale: string;
  currencyCode: string;
};

const STORAGE_KEY =
  "pizzasystem-store-intl";

const FALLBACK:
  StoreIntlSnapshot = {
    defaultLocale: "pt-BR",
    currencyCode: "BRL",
  };

function isBrowser() {
  return (
    typeof window !==
    "undefined"
  );
}

export function saveStoreIntlSnapshot(
  value: Partial<StoreIntlSnapshot> | null | undefined
) {
  if (!isBrowser()) {
    return;
  }

  const defaultLocale =
    typeof value?.defaultLocale ===
      "string" &&
    value.defaultLocale.trim()
      ? value.defaultLocale.trim()
      : FALLBACK.defaultLocale;

  const currencyCode =
    typeof value?.currencyCode ===
      "string" &&
    value.currencyCode.trim()
      ? value.currencyCode
          .trim()
          .toUpperCase()
      : FALLBACK.currencyCode;

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      defaultLocale,
      currencyCode,
    })
  );
}

export function getStoreIntlSnapshot():
StoreIntlSnapshot {
  if (!isBrowser()) {
    return FALLBACK;
  }

  try {
    const raw =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      return FALLBACK;
    }

    const parsed =
      JSON.parse(raw);

    const defaultLocale =
      typeof parsed?.defaultLocale ===
        "string" &&
      parsed.defaultLocale.trim()
        ? parsed.defaultLocale.trim()
        : FALLBACK.defaultLocale;

    const currencyCode =
      typeof parsed?.currencyCode ===
        "string" &&
      parsed.currencyCode.trim()
        ? parsed.currencyCode
            .trim()
            .toUpperCase()
        : FALLBACK.currencyCode;

    return {
      defaultLocale,
      currencyCode,
    };
  } catch {
    return FALLBACK;
  }
}

export function formatStoreMoney(
  value: number | null | undefined
) {
  const {
    defaultLocale,
    currencyCode,
  } =
    getStoreIntlSnapshot();

  return new Intl.NumberFormat(
    defaultLocale,
    {
      style: "currency",
      currency:
        currencyCode,
    }
  ).format(
    Number(
      value ?? 0
    )
  );
}

export function getStoreCurrencySymbol() {
  const {
    defaultLocale,
    currencyCode,
  } =
    getStoreIntlSnapshot();

  const parts =
    new Intl.NumberFormat(
      defaultLocale,
      {
        style: "currency",
        currency:
          currencyCode,
        currencyDisplay:
          "narrowSymbol",
      }
    ).formatToParts(
      0
    );

  return (
    parts.find(
      (part) =>
        part.type ===
        "currency"
    )?.value ??
    currencyCode
  );
}
