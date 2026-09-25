"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminHeader from "@/components/AdminHeader";
import { adminFetch } from "@/lib/adminFetch";

const API_URL = "";

type DeliveryConfig = {
  originAddress: string | null;
  maxDistanceKm: number | null;
  feePerKm: number | null;
  freeDeliveryAbove: number | null;
  freeDeliveryDistanceKm: number | null;
  mapsConfigured: boolean;
  routeProvider: string;
};

async function readMessage(
  response: Response
) {
  const text =
    await response.text();

  if (!text) {
    return "";
  }

  try {
    const data =
      JSON.parse(
        text
      );

    return (
      data?.message ??
      data?.detail ??
      data?.error ??
      text
    );
  } catch {
    return text;
  }
}

function money(
  value: number
) {
  return Number(
    value || 0
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

export default function AdminEntregasPage() {
  const [
    config,
    setConfig,
  ] =
    useState<DeliveryConfig | null>(
      null
    );

  const [
    originAddress,
    setOriginAddress,
  ] =
    useState("");

  const [
    feePerKm,
    setFeePerKm,
  ] =
    useState("");

  const [
    freeDeliveryAbove,
    setFreeDeliveryAbove,
  ] =
    useState("");

  const [
    freeDeliveryDistanceKm,
    setFreeDeliveryDistanceKm,
  ] =
    useState("");

  const [
    maxDistanceKm,
    setMaxDistanceKm,
  ] =
    useState("");

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
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");

  async function loadConfig() {
    try {
      setLoading(
        true
      );

      setErrorMessage(
        ""
      );

      const response =
        await adminFetch(
          `${API_URL}/api/delivery-areas/config`,
          {
            cache:
              "no-store",
          }
        );

      if (!response.ok) {
        throw new Error(
          (
            await readMessage(
              response
            )
          ) ||
            "Não foi possível carregar a configuração de entrega."
        );
      }

      const data:
        DeliveryConfig =
        await response.json();

      setConfig(
        data
      );

      setOriginAddress(
        data.originAddress ??
          ""
      );

      setFeePerKm(
        data.feePerKm !=
          null
          ? String(
              Number(
                data.feePerKm
              )
            )
          : ""
      );

      setFreeDeliveryAbove(
        data.freeDeliveryAbove !=
          null
          ? String(
              Number(
                data.freeDeliveryAbove
              )
            )
          : ""
      );

      setFreeDeliveryDistanceKm(
        data.freeDeliveryDistanceKm !=
          null
          ? String(
              Number(
                data.freeDeliveryDistanceKm
              )
            )
          : ""
      );

      setMaxDistanceKm(
        data.maxDistanceKm !=
          null
          ? String(
              Number(
                data.maxDistanceKm
              )
            )
          : ""
      );

    } catch (
      error
    ) {
      setErrorMessage(
        error instanceof
          Error
          ? error.message
          : "Não foi possível carregar as entregas."
      );

    } finally {
      setLoading(
        false
      );
    }
  }

  useEffect(() => {
    void loadConfig();
  }, []);

  const googleMapsOriginUrl =
    useMemo(
      () =>
        originAddress.trim()
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              originAddress.trim()
            )}`
          : "",
      [
        originAddress,
      ]
    );

  async function saveConfig(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage(
      ""
    );

    setSuccessMessage(
      ""
    );

    const normalizedOrigin =
      originAddress.trim();

    const normalizedFeePerKm =
      Number(
        feePerKm
      );

    const normalizedMaxDistance =
      maxDistanceKm.trim()
        ? Number(
            maxDistanceKm
          )
        : null;

    const normalizedFreeAbove =
      freeDeliveryAbove.trim()
        ? Number(
            freeDeliveryAbove
          )
        : null;

    const normalizedFreeDistance =
      freeDeliveryDistanceKm.trim()
        ? Number(
            freeDeliveryDistanceKm
          )
        : null;

    if (!normalizedOrigin) {
      setErrorMessage(
        "Informe o endereço completo de saída da pizzaria."
      );

      return;
    }

    if (
      feePerKm.trim() ===
        "" ||
      Number.isNaN(
        normalizedFeePerKm
      ) ||
      normalizedFeePerKm <
        0
    ) {
      setErrorMessage(
        "Informe um valor por km válido."
      );

      return;
    }

    if (
      normalizedMaxDistance !=
        null &&
      (
        Number.isNaN(
          normalizedMaxDistance
        ) ||
        normalizedMaxDistance <=
          0
      )
    ) {
      setErrorMessage(
        "A distância máxima precisa ser maior que zero."
      );

      return;
    }

    if (
      normalizedFreeAbove !=
        null &&
      (
        Number.isNaN(
          normalizedFreeAbove
        ) ||
        normalizedFreeAbove <=
          0
      )
    ) {
      setErrorMessage(
        "O valor para frete grátis precisa ser maior que zero."
      );

      return;
    }

    if (
      normalizedFreeDistance !=
        null &&
      (
        Number.isNaN(
          normalizedFreeDistance
        ) ||
        normalizedFreeDistance <=
          0
      )
    ) {
      setErrorMessage(
        "A distância de frete grátis precisa ser maior que zero."
      );

      return;
    }

    if (
      normalizedFreeDistance !=
        null &&
      normalizedMaxDistance !=
        null &&
      normalizedFreeDistance >
        normalizedMaxDistance
    ) {
      setErrorMessage(
        "A distância de frete grátis não pode ser maior que a distância máxima."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      const response =
        await adminFetch(
          `${API_URL}/api/delivery-areas/config`,
          {
            method:
              "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                originAddress:
                  normalizedOrigin,
                maxDistanceKm:
                  normalizedMaxDistance,
                feePerKm:
                  normalizedFeePerKm,
                freeDeliveryAbove:
                  normalizedFreeAbove,
                freeDeliveryDistanceKm:
                  normalizedFreeDistance,
              }),
          }
        );

      if (!response.ok) {
        throw new Error(
          (
            await readMessage(
              response
            )
          ) ||
            "Não foi possível salvar a configuração."
        );
      }

      const data:
        DeliveryConfig =
        await response.json();

      setConfig(
        data
      );

      setSuccessMessage(
        "Configuração de entrega salva."
      );

    } catch (
      error
    ) {
      setErrorMessage(
        error instanceof
          Error
          ? error.message
          : "Não foi possível salvar a configuração."
      );

    } finally {
      setSaving(
        false
      );
    }
  }

  const fieldClass =
    "h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";

  return (
    <main className="min-h-screen bg-background">

      <AdminHeader />

      <div className="mx-auto max-w-[1100px] px-4 py-7 sm:px-6 lg:px-8">

        <section className="border-b border-border pb-6">

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Entrega
          </p>

          <h1 className="mt-2 font-display text-4xl uppercase leading-none tracking-tight text-foreground">
            Taxa por distância
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            O PizzaSystem calcula a rota entre a pizzaria e o cliente e cobra a entrega pelo número de quilômetros. Você não precisa mais cadastrar taxa por bairro.
          </p>

        </section>

        {errorMessage && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        {loading ? (
          <div className="mt-6 space-y-4">
            <div className="h-40 animate-pulse rounded-3xl bg-muted" />
            <div className="h-64 animate-pulse rounded-3xl bg-muted" />
          </div>

        ) : (
          <>

            <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Provedor de rota
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-foreground">
                    OpenRouteService + Google Maps
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    A distância e a taxa são calculadas pelo OpenRouteService. O Google Maps fica somente como atalho visual para abrir o endereço e a rota, então o cálculo não depende da API do Google.
                  </p>
                </div>

                <span
                  className={[
                    "w-fit rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]",
                    config?.mapsConfigured
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700",
                  ].join(
                    " "
                  )}
                >
                  {config?.mapsConfigured
                    ? "Rotas conectadas"
                    : "Falta chave de rotas"}
                </span>

              </div>

              {!config?.mapsConfigured && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                  Para ativar o cálculo automático no servidor, adicione a variável <strong>OPENROUTESERVICE_API_KEY</strong> no backend do PizzaSystem.
                </div>
              )}

            </section>

            <form
              onSubmit={
                saveConfig
              }
              className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"
            >

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  Configuração
                </p>

                <h2 className="mt-1 text-xl font-bold text-foreground">
                  Regras de entrega
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  A rota é recalculada no servidor quando o pedido é criado, então o cliente não consegue alterar a taxa manualmente.
                </p>
              </div>

              <div className="mt-6">

                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                  Endereço de saída da pizzaria
                </label>

                <input
                  value={
                    originAddress
                  }
                  onChange={(
                    event
                  ) =>
                    setOriginAddress(
                      event.target.value
                    )
                  }
                  placeholder="Ex: Av. X, 123, Centro, Jaguariúna - SP, 13910-000"
                  className={
                    fieldClass
                  }
                />

                <div className="mt-2 flex flex-wrap items-center gap-3">

                  <p className="text-xs leading-5 text-muted-foreground">
                    Informe rua, número, bairro, cidade, estado e CEP para melhorar a precisão.
                  </p>

                  {googleMapsOriginUrl && (
                    <a
                      href={
                        googleMapsOriginUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-primary underline underline-offset-2"
                    >
                      Conferir no Google Maps
                    </a>
                  )}

                </div>

              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

                <div>

                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                    Valor por km
                  </label>

                  <div className="relative">

                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                      R$
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        feePerKm
                      }
                      onChange={(
                        event
                      ) =>
                        setFeePerKm(
                          event.target.value
                        )
                      }
                      placeholder="Ex: 2,50"
                      className={
                        `${fieldClass} pl-10 pr-14`
                      }
                    />

                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      / km
                    </span>

                  </div>

                </div>

                <div>

                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                    Distância máxima
                  </label>

                  <div className="relative">

                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={
                        maxDistanceKm
                      }
                      onChange={(
                        event
                      ) =>
                        setMaxDistanceKm(
                          event.target.value
                        )
                      }
                      placeholder="Ex: 15"
                      className={
                        `${fieldClass} pr-12`
                      }
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      km
                    </span>

                  </div>

                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Em branco = sem limite configurado.
                  </p>

                </div>

                <div>

                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                    Frete grátis até
                  </label>

                  <div className="relative">

                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={
                        freeDeliveryDistanceKm
                      }
                      onChange={(
                        event
                      ) =>
                        setFreeDeliveryDistanceKm(
                          event.target.value
                        )
                      }
                      placeholder="Ex: 4"
                      className={
                        `${fieldClass} pr-12`
                      }
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      km
                    </span>

                  </div>

                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Em branco = cobra normalmente desde o primeiro km.
                  </p>

                </div>

                <div>

                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                    Frete grátis acima de
                  </label>

                  <div className="relative">

                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                      R$
                    </span>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={
                        freeDeliveryAbove
                      }
                      onChange={(
                        event
                      ) =>
                        setFreeDeliveryAbove(
                          event.target.value
                        )
                      }
                      placeholder="Ex: 120"
                      className={
                        `${fieldClass} pl-10`
                      }
                    />

                  </div>

                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Em branco = sem isenção automática.
                  </p>

                </div>

              </div>

              <div className="mt-6 rounded-2xl border border-border bg-background p-4">

                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Exemplo da regra
                </p>

                <p className="mt-2 text-sm leading-6 text-foreground">
                  {feePerKm.trim()
                    ? `Uma entrega de 5 km custaria ${money(
                        Number(
                          feePerKm || 0
                        ) * 5
                      )}.`
                    : "Defina o valor por km para visualizar um exemplo."}

                  {freeDeliveryDistanceKm.trim()
                    ? ` Entregas de até ${Number(
                        freeDeliveryDistanceKm || 0
                      )} km ficam grátis.`
                    : ""}

                  {freeDeliveryAbove.trim()
                    ? ` Pedidos a partir de ${money(
                        Number(
                          freeDeliveryAbove || 0
                        )
                      )} também recebem frete grátis.`
                    : ""}
                </p>

              </div>

              <button
                type="submit"
                disabled={
                  saving
                }
                className="mt-6 h-11 rounded-xl bg-foreground px-5 text-sm font-bold text-background transition hover:opacity-90 disabled:opacity-50"
              >
                {saving
                  ? "Salvando..."
                  : "Salvar configuração"}
              </button>

            </form>

          </>
        )}

      </div>

    </main>
  );
}
