"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import AdminHeader from "@/components/AdminHeader";
import { adminFetch } from "@/lib/adminFetch";
import { useLanguage } from "@/i18n/LanguageProvider";

type FulfillmentSettings = {
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  pickupOnlinePaymentEnabled: boolean;
  pickupPayAtStoreEnabled: boolean;
  pickupCashEnabled: boolean;
  pickupCardEnabled: boolean;
  pickupOtherEnabled: boolean;
  pickupInstructions: string | null;
  pickupPreparationMinutes: number;
  pickupAddress: string | null;
  storeName: string;
};

const API_URL = "";

export default function PickupSettingsPage() {
  const {
    text,
  } =
    useLanguage();

  const [
    data,
    setData,
  ] =
    useState<FulfillmentSettings | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  async function load() {
    try {
      setLoading(
        true
      );
      setError(
        ""
      );

      const response =
        await adminFetch(
          `${API_URL}/api/store/fulfillment`,
          {
            cache:
              "no-store",
          }
        );

      if (!response.ok) {
        throw new Error(
          text(
            "Não foi possível carregar as modalidades.",
            "We could not load fulfillment settings."
          )
        );
      }

      setData(
        await response.json()
      );
    } catch (
      caught
    ) {
      setError(
        caught instanceof Error
          ? caught.message
          : text(
              "Não foi possível carregar.",
              "We could not load the settings."
            )
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function patch(
    values:
      Partial<FulfillmentSettings>
  ) {
    setData(
      (
        current
      ) =>
        current
          ? {
              ...current,
              ...values,
            }
          : current
    );
  }

  async function save(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !data ||
      saving
    ) {
      return;
    }

    try {
      setSaving(
        true
      );
      setMessage(
        ""
      );
      setError(
        ""
      );

      const response =
        await adminFetch(
          `${API_URL}/api/store/fulfillment`,
          {
            method:
              "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                deliveryEnabled:
                  data.deliveryEnabled,
                pickupEnabled:
                  data.pickupEnabled,
                pickupOnlinePaymentEnabled:
                  data.pickupOnlinePaymentEnabled,
                pickupPayAtStoreEnabled:
                  data.pickupPayAtStoreEnabled,
                pickupCashEnabled:
                  data.pickupCashEnabled,
                pickupCardEnabled:
                  data.pickupCardEnabled,
                pickupOtherEnabled:
                  data.pickupOtherEnabled,
                pickupInstructions:
                  data.pickupInstructions,
                pickupPreparationMinutes:
                  data.pickupPreparationMinutes,
              }),
          }
        );

      const body =
        await response
          .json()
          .catch(
            () =>
              null
          );

      if (!response.ok) {
        throw new Error(
          body?.message ??
            text(
              "Não foi possível salvar.",
              "We could not save the settings."
            )
        );
      }

      setData(
        body
      );

      setMessage(
        text(
          "Configuração de retirada salva.",
          "Pickup settings saved."
        )
      );
    } catch (
      caught
    ) {
      setError(
        caught instanceof Error
          ? caught.message
          : text(
              "Não foi possível salvar.",
              "We could not save the settings."
            )
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  if (
    loading ||
    !data
  ) {
    return (
      <main className="min-h-screen bg-background">
        <AdminHeader />
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="h-72 animate-pulse rounded-3xl bg-muted" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <AdminHeader />

      <div className="mx-auto max-w-4xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="border-b border-border pb-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            {text(
              "Atendimento",
              "Fulfillment"
            )}
          </p>

          <h1 className="mt-2 font-display text-4xl uppercase leading-none tracking-tight text-foreground sm:text-5xl">
            {text(
              "Entrega e retirada",
              "Delivery & pickup"
            )}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {text(
              "Escolha como seus clientes podem receber e pagar os pedidos.",
              "Choose how customers can receive and pay for orders."
            )}
          </p>
        </div>

        <form
          onSubmit={
            save
          }
          className="mt-6 space-y-5"
        >
          <section className="rounded-3xl border border-border bg-card p-5 sm:p-7">
            <h2 className="font-display text-2xl tracking-tight text-foreground">
              {text(
                "Modalidades",
                "Fulfillment methods"
              )}
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                <input
                  type="checkbox"
                  checked={
                    data.deliveryEnabled
                  }
                  onChange={(
                    event
                  ) =>
                    patch({
                      deliveryEnabled:
                        event.target.checked,
                    })
                  }
                  className="mt-1"
                />

                <span>
                  <span className="block text-sm font-bold text-foreground">
                    {text(
                      "Aceitar entrega",
                      "Accept delivery"
                    )}
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {text(
                      "Mantém o fluxo atual com endereço, rota e taxa.",
                      "Keeps the current address, route and delivery fee flow."
                    )}
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                <input
                  type="checkbox"
                  checked={
                    data.pickupEnabled
                  }
                  onChange={(
                    event
                  ) =>
                    patch({
                      pickupEnabled:
                        event.target.checked,
                    })
                  }
                  className="mt-1"
                />

                <span>
                  <span className="block text-sm font-bold text-foreground">
                    {text(
                      "Aceitar retirada",
                      "Accept pickup"
                    )}
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {text(
                      "Sem cálculo de frete, CEP ou mapa.",
                      "No delivery fee, postal code or map."
                    )}
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 sm:p-7">
            <h2 className="font-display text-2xl tracking-tight text-foreground">
              {text(
                "Retirada",
                "Pickup"
              )}
            </h2>

            <div className="mt-4 rounded-2xl border border-border bg-background p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {text(
                  "Endereço de retirada",
                  "Pickup address"
                )}
              </p>

              <p className="mt-1 text-sm font-semibold text-foreground">
                {data.pickupAddress ||
                  text(
                    "Ainda não configurado em Entregas.",
                    "Not configured yet under Delivery."
                  )}
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4">
                <input
                  type="checkbox"
                  checked={
                    data.pickupOnlinePaymentEnabled
                  }
                  disabled={
                    !data.pickupEnabled
                  }
                  onChange={(
                    event
                  ) =>
                    patch({
                      pickupOnlinePaymentEnabled:
                        event.target.checked,
                    })
                  }
                />

                <span className="text-sm font-bold">
                  {text(
                    "Pagamento online",
                    "Pay online"
                  )}
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4">
                <input
                  type="checkbox"
                  checked={
                    data.pickupPayAtStoreEnabled
                  }
                  disabled={
                    !data.pickupEnabled
                  }
                  onChange={(
                    event
                  ) =>
                    patch({
                      pickupPayAtStoreEnabled:
                        event.target.checked,
                    })
                  }
                />

                <span className="text-sm font-bold">
                  {text(
                    "Pagamento na retirada",
                    "Pay at pickup"
                  )}
                </span>
              </label>
            </div>

            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {text(
                  "Métodos no balcão",
                  "Methods at pickup"
                )}
              </p>

              <div className="mt-3 flex flex-wrap gap-4">
                {[
                  [
                    "pickupCashEnabled",
                    text(
                      "Dinheiro",
                      "Cash"
                    ),
                  ],
                  [
                    "pickupCardEnabled",
                    text(
                      "Cartão",
                      "Card"
                    ),
                  ],
                  [
                    "pickupOtherEnabled",
                    text(
                      "Outro",
                      "Other"
                    ),
                  ],
                ].map(
                  (
                    [
                      key,
                      label,
                    ]
                  ) => (
                    <label
                      key={
                        key
                      }
                      className="flex items-center gap-2 text-sm font-semibold"
                    >
                      <input
                        type="checkbox"
                        disabled={
                          !data.pickupPayAtStoreEnabled
                        }
                        checked={
                          Boolean(
                            data[
                              key as
                                | "pickupCashEnabled"
                                | "pickupCardEnabled"
                                | "pickupOtherEnabled"
                            ]
                          )
                        }
                        onChange={(
                          event
                        ) =>
                          patch({
                            [key]:
                              event.target.checked,
                          })
                        }
                      />

                      {label}
                    </label>
                  )
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-[160px_1fr]">
              <label>
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {text(
                    "Preparo médio",
                    "Prep time"
                  )}
                </span>

                <input
                  type="number"
                  min={5}
                  max={240}
                  value={
                    data.pickupPreparationMinutes
                  }
                  onChange={(
                    event
                  ) =>
                    patch({
                      pickupPreparationMinutes:
                        Number(
                          event.target.value
                        ),
                    })
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none"
                />
              </label>

              <label>
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {text(
                    "Instruções",
                    "Instructions"
                  )}
                </span>

                <textarea
                  value={
                    data.pickupInstructions ??
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    patch({
                      pickupInstructions:
                        event.target.value,
                    })
                  }
                  maxLength={500}
                  rows={3}
                  placeholder={text(
                    "Ex: Retire seu pedido no balcão principal.",
                    "Example: Pick up your order at the main counter."
                  )}
                  className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm outline-none"
                />
              </label>
            </div>
          </section>

          {(message ||
            error) && (
            <div
              className={
                error
                  ? "rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
                  : "rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"
              }
            >
              {error ||
                message}
            </div>
          )}

          <button
            type="submit"
            disabled={
              saving
            }
            className="h-12 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {saving
              ? text(
                  "Salvando...",
                  "Saving..."
                )
              : text(
                  "Salvar configuração",
                  "Save settings"
                )}
          </button>
        </form>
      </div>
    </main>
  );
}
