"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import AdminHeader from "@/components/AdminHeader";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { adminFetch } from "@/lib/adminFetch";
import { useLanguage } from "@/i18n/LanguageProvider";

const API_URL = "";

type StoreSettings = {
  id: number;
  storeName: string;
  open: boolean;
  whatsapp: string | null;
  dailyOrderLimit: number;
  countryCode: string;
  defaultLocale: "pt-BR" | "en-US";
  currencyCode:
    | "BRL"
    | "USD"
    | "EUR"
    | "GBP"
    | "CAD";
};

const COUNTRY_OPTIONS = [
  { code: "BR", pt: "Brasil", en: "Brazil", currency: "BRL", locale: "pt-BR" },
  { code: "US", pt: "Estados Unidos", en: "United States", currency: "USD", locale: "en-US" },
  { code: "PT", pt: "Portugal", en: "Portugal", currency: "EUR", locale: "en-US" },
  { code: "ES", pt: "Espanha", en: "Spain", currency: "EUR", locale: "en-US" },
  { code: "FR", pt: "França", en: "France", currency: "EUR", locale: "en-US" },
  { code: "DE", pt: "Alemanha", en: "Germany", currency: "EUR", locale: "en-US" },
  { code: "IT", pt: "Itália", en: "Italy", currency: "EUR", locale: "en-US" },
  { code: "GB", pt: "Reino Unido", en: "United Kingdom", currency: "GBP", locale: "en-US" },
  { code: "CA", pt: "Canadá", en: "Canada", currency: "CAD", locale: "en-US" },
] as const;

export default function InternacionalizacaoPage() {
  const {
    locale,
    text,
  } = useLanguage();

  const [
    settings,
    setSettings,
  ] = useState<StoreSettings | null>(null);

  const [
    countryCode,
    setCountryCode,
  ] = useState("BR");

  const [
    defaultLocale,
    setDefaultLocale,
  ] = useState<"pt-BR" | "en-US">("pt-BR");

  const [
    currencyCode,
    setCurrencyCode,
  ] = useState<
    "BRL" | "USD" | "EUR" | "GBP" | "CAD"
  >("BRL");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setErrorMessage("");

        const response =
          await adminFetch(
            `${API_URL}/api/store`,
            {
              cache: "no-store",
            }
          );

        if (!response.ok) {
          throw new Error(
            text(
              "Não foi possível carregar as configurações internacionais.",
              "We could not load the international settings."
            )
          );
        }

        const data:
          StoreSettings =
          await response.json();

        if (!mounted) {
          return;
        }

        setSettings(data);
        setCountryCode(
          data.countryCode || "BR"
        );
        setDefaultLocale(
          data.defaultLocale === "en-US"
            ? "en-US"
            : "pt-BR"
        );
        setCurrencyCode(
          (
            ["BRL", "USD", "EUR", "GBP", "CAD"].includes(
              data.currencyCode
            )
              ? data.currencyCode
              : "BRL"
          ) as
            | "BRL"
            | "USD"
            | "EUR"
            | "GBP"
            | "CAD"
        );
      } catch (error) {
        if (!mounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : text(
                "Não foi possível carregar as configurações.",
                "We could not load the settings."
              )
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [text]);

  function changeCountry(
    nextCountry: string
  ) {
    setCountryCode(
      nextCountry
    );

    const preset =
      COUNTRY_OPTIONS.find(
        (country) =>
          country.code ===
          nextCountry
      );

    if (!preset) {
      return;
    }

    setCurrencyCode(
      preset.currency
    );

    setDefaultLocale(
      preset.locale
    );
  }

  async function save(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!settings) {
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response =
        await adminFetch(
          `${API_URL}/api/store`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                id:
                  settings.id,
                storeName:
                  settings.storeName,
                open:
                  settings.open,
                whatsapp:
                  settings.whatsapp,
                dailyOrderLimit:
                  settings.dailyOrderLimit,
                countryCode,
                defaultLocale,
                currencyCode,
              }),
          }
        );

      if (!response.ok) {
        let message =
          text(
            "Não foi possível salvar as configurações internacionais.",
            "We could not save the international settings."
          );

        try {
          const data =
            await response.json();

          if (
            typeof data?.message ===
              "string" &&
            data.message
          ) {
            message =
              data.message;
          }
        } catch {
          // mantém a mensagem padrão
        }

        throw new Error(
          message
        );
      }

      const updated:
        StoreSettings =
        await response.json();

      setSettings(
        updated
      );

      setSuccessMessage(
        text(
          "País, idioma e moeda salvos. O cardápio público passa a usar essas preferências como padrão.",
          "Country, language and currency saved. The public menu now uses these settings by default."
        )
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : text(
              "Não foi possível salvar.",
              "We could not save the settings."
            )
      );
    } finally {
      setSaving(false);
    }
  }

  const previewValue =
    new Intl.NumberFormat(
      defaultLocale,
      {
        style: "currency",
        currency:
          currencyCode,
      }
    ).format(
      49.9
    );

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <AdminHeader />

        <div className="mx-auto max-w-[1100px] px-4 py-12 text-center text-sm text-muted-foreground">
          {text(
            "Carregando internacionalização...",
            "Loading international settings..."
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <AdminHeader />

      <div className="mx-auto max-w-[1100px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              {text(
                "Internacionalização",
                "Internationalization"
              )}
            </p>

            <h1 className="mt-2 font-display text-4xl uppercase leading-none tracking-tight text-foreground">
              {text(
                "Idioma e moeda",
                "Language & currency"
              )}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              {text(
                "Defina o padrão de cada pizzaria. Isso controla o idioma inicial e como os valores aparecem para os clientes.",
                "Set each store's defaults. This controls the initial language and how prices are displayed to customers."
              )}
            </p>
          </div>

          <LanguageSwitcher />
        </div>

        {errorMessage && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        <form
          onSubmit={save}
          className="rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] sm:p-6"
        >
          <div className="grid gap-5 md:grid-cols-3">
            <label>
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                {text(
                  "País da operação",
                  "Operating country"
                )}
              </span>

              <select
                value={countryCode}
                onChange={(event) =>
                  changeCountry(
                    event.target.value
                  )
                }
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none"
              >
                {COUNTRY_OPTIONS.map(
                  (country) => (
                    <option
                      key={country.code}
                      value={country.code}
                    >
                      {locale === "en-US"
                        ? country.en
                        : country.pt}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                {text(
                  "Idioma padrão",
                  "Default language"
                )}
              </span>

              <select
                value={defaultLocale}
                onChange={(event) =>
                  setDefaultLocale(
                    event.target.value as
                      | "pt-BR"
                      | "en-US"
                  )
                }
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none"
              >
                <option value="pt-BR">
                  Português (Brasil)
                </option>
                <option value="en-US">
                  English (US)
                </option>
              </select>
            </label>

            <label>
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                {text(
                  "Moeda",
                  "Currency"
                )}
              </span>

              <select
                value={currencyCode}
                onChange={(event) =>
                  setCurrencyCode(
                    event.target.value as
                      | "BRL"
                      | "USD"
                      | "EUR"
                      | "GBP"
                      | "CAD"
                  )
                }
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none"
              >
                <option value="BRL">BRL — R$</option>
                <option value="USD">USD — $</option>
                <option value="EUR">EUR — €</option>
                <option value="GBP">GBP — £</option>
                <option value="CAD">CAD — C$</option>
              </select>
            </label>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-background p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {text(
                "Prévia de preço",
                "Price preview"
              )}
            </p>

            <p className="mt-2 text-3xl font-bold text-foreground">
              {previewValue}
            </p>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {text(
                "A alteração muda apenas a apresentação e o padrão da loja. Conversão cambial automática não é feita: os preços cadastrados passam a ser interpretados na moeda escolhida.",
                "This changes the store's display and defaults only. There is no automatic FX conversion: existing prices are interpreted in the selected currency."
              )}
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            {text(
              "Pagamentos e endereços ainda seguem as regras brasileiras atuais. Este checkpoint prepara idioma e moeda; na próxima etapa entram endereço internacional e meios de pagamento para fora do Brasil.",
              "Payments and addresses still follow the current Brazilian rules. This checkpoint prepares language and currency; international addresses and payment methods come next."
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {saving
              ? text(
                  "Salvando...",
                  "Saving..."
                )
              : text(
                  "Salvar internacionalização",
                  "Save international settings"
                )}
          </button>
        </form>
      </div>
    </main>
  );
}
