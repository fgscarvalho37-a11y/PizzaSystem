"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import AdminHeader from "@/components/AdminHeader";
import { adminFetch } from "@/lib/adminFetch";

const API_URL = "";

type PricingMode =
  | "FIXED"
  | "PER_KM";

type DeliveryArea = {
  id: number;
  city: string | null;
  neighborhood: string;
  pricingMode: PricingMode;
  distanceKm: number | null;
  feePerKm: number | null;
  fee: number;
  active: boolean;
};

type DeliveryConfig = {
  originAddress: string | null;
  maxDistanceKm: number | null;
  mapsConfigured: boolean;
};

type AreaDraft = {
  city: string;
  neighborhood: string;
  pricingMode: PricingMode;
  fee: string;
  feePerKm: string;
};

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

function toDraft(
  area: DeliveryArea
): AreaDraft {
  return {
    city:
      area.city ?? "",
    neighborhood:
      area.neighborhood,
    pricingMode:
      area.pricingMode ??
      "FIXED",
    fee:
      String(
        Number(
          area.fee ?? 0
        )
      ),
    feePerKm:
      area.feePerKm != null
        ? String(
            Number(
              area.feePerKm
            )
          )
        : "",
  };
}

export default function AdminEntregasPage() {
  const [
    areas,
    setAreas,
  ] =
    useState<DeliveryArea[]>(
      []
    );

  const [
    drafts,
    setDrafts,
  ] =
    useState<
      Record<
        number,
        AreaDraft
      >
    >({});

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
    maxDistanceKm,
    setMaxDistanceKm,
  ] =
    useState("");

  const [
    city,
    setCity,
  ] =
    useState("");

  const [
    neighborhood,
    setNeighborhood,
  ] =
    useState("");

  const [
    pricingMode,
    setPricingMode,
  ] =
    useState<PricingMode>(
      "FIXED"
    );

  const [
    fee,
    setFee,
  ] =
    useState("");

  const [
    feePerKm,
    setFeePerKm,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    savingConfig,
    setSavingConfig,
  ] =
    useState(false);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    updatingId,
    setUpdatingId,
  ] =
    useState<number | null>(
      null
    );

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

  async function loadData() {
    try {
      setLoading(
        true
      );

      setErrorMessage(
        ""
      );

      const [
        areasResponse,
        configResponse,
      ] =
        await Promise.all([
          adminFetch(
            `${API_URL}/api/delivery-areas`,
            {
              cache:
                "no-store",
            }
          ),
          adminFetch(
            `${API_URL}/api/delivery-areas/config`,
            {
              cache:
                "no-store",
            }
          ),
        ]);

      if (
        !areasResponse.ok
      ) {
        throw new Error(
          "Não foi possível carregar as áreas de entrega."
        );
      }

      if (
        !configResponse.ok
      ) {
        throw new Error(
          "Não foi possível carregar a configuração de entrega."
        );
      }

      const areasData:
        DeliveryArea[] =
        await areasResponse.json();

      const configData:
        DeliveryConfig =
        await configResponse.json();

      setAreas(
        areasData
      );

      setDrafts(
        Object.fromEntries(
          areasData.map(
            (
              area
            ) => [
              area.id,
              toDraft(
                area
              ),
            ]
          )
        )
      );

      setConfig(
        configData
      );

      setOriginAddress(
        configData.originAddress ??
          ""
      );

      setMaxDistanceKm(
        configData.maxDistanceKm !=
          null
          ? String(
              Number(
                configData.maxDistanceKm
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
    void loadData();
  }, []);

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

    const maxDistance =
      maxDistanceKm.trim()
        ? Number(
            maxDistanceKm
          )
        : null;

    if (
      maxDistance != null &&
      (
        Number.isNaN(
          maxDistance
        ) ||
        maxDistance <=
          0
      )
    ) {
      setErrorMessage(
        "A distância máxima precisa ser maior que zero."
      );

      return;
    }

    try {
      setSavingConfig(
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
                  originAddress.trim() ||
                  null,
                maxDistanceKm:
                  maxDistance,
              }),
          }
        );

      if (
        !response.ok
      ) {
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
      setSavingConfig(
        false
      );
    }
  }

  function validateArea(
    mode: PricingMode,
    fixedFee: string,
    perKm: string
  ) {

    if (
      mode ===
      "FIXED"
    ) {
      const value =
        Number(
          fixedFee
        );

      if (
        fixedFee.trim() ===
          "" ||
        Number.isNaN(
          value
        ) ||
        value < 0
      ) {
        return "Informe uma taxa fixa válida.";
      }

      return "";
    }

    const perKmValue =
      Number(
        perKm
      );

    if (
      perKm.trim() ===
        "" ||
      Number.isNaN(
        perKmValue
      ) ||
      perKmValue < 0
    ) {
      return "Informe um valor por km válido.";
    }

    return "";
  }

  async function handleCreate(
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

    if (
      !city.trim() ||
      !neighborhood.trim()
    ) {
      setErrorMessage(
        "Informe cidade e bairro."
      );

      return;
    }

    const validation =
      validateArea(
        pricingMode,
        fee,
        feePerKm
      );

    if (validation) {
      setErrorMessage(
        validation
      );

      return;
    }

    try {
      setSubmitting(
        true
      );

      const response =
        await adminFetch(
          `${API_URL}/api/delivery-areas`,
          {
            method:
              "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                city:
                  city.trim(),
                neighborhood:
                  neighborhood.trim(),
                pricingMode,
                fee:
                  pricingMode ===
                  "FIXED"
                    ? Number(
                        fee
                      )
                    : 0,
                distanceKm:
                  null,
                feePerKm:
                  pricingMode ===
                  "PER_KM"
                    ? Number(
                        feePerKm
                      )
                    : null,
                active:
                  true,
              }),
          }
        );

      if (
        !response.ok
      ) {
        throw new Error(
          (
            await readMessage(
              response
            )
          ) ||
            "Não foi possível cadastrar a área."
        );
      }

      setCity(
        ""
      );
      setNeighborhood(
        ""
      );
      setPricingMode(
        "FIXED"
      );
      setFee(
        ""
      );
      setFeePerKm(
        ""
      );

      setSuccessMessage(
        "Área de entrega cadastrada."
      );

      await loadData();

    } catch (
      error
    ) {
      setErrorMessage(
        error instanceof
          Error
          ? error.message
          : "Não foi possível cadastrar a área."
      );

    } finally {
      setSubmitting(
        false
      );
    }
  }

  function updateDraft(
    id: number,
    patch:
      Partial<
        AreaDraft
      >
  ) {
    setDrafts(
      (
        current
      ) => ({
        ...current,
        [id]: {
          ...current[id],
          ...patch,
        },
      })
    );
  }

  async function saveArea(
    area: DeliveryArea
  ) {
    const draft =
      drafts[
        area.id
      ];

    if (!draft) {
      return;
    }

    setErrorMessage(
      ""
    );

    setSuccessMessage(
      ""
    );

    if (
      !draft.city.trim() ||
      !draft.neighborhood.trim()
    ) {
      setErrorMessage(
        "Cidade e bairro são obrigatórios."
      );

      return;
    }

    const validation =
      validateArea(
        draft.pricingMode,
        draft.fee,
        draft.feePerKm
      );

    if (validation) {
      setErrorMessage(
        validation
      );

      return;
    }

    try {
      setUpdatingId(
        area.id
      );

      const response =
        await adminFetch(
          `${API_URL}/api/delivery-areas/${area.id}`,
          {
            method:
              "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                city:
                  draft.city.trim(),
                neighborhood:
                  draft.neighborhood.trim(),
                pricingMode:
                  draft.pricingMode,
                fee:
                  draft.pricingMode ===
                  "FIXED"
                    ? Number(
                        draft.fee
                      )
                    : 0,
                distanceKm:
                  null,
                feePerKm:
                  draft.pricingMode ===
                  "PER_KM"
                    ? Number(
                        draft.feePerKm
                      )
                    : null,
                active:
                  area.active,
              }),
          }
        );

      if (
        !response.ok
      ) {
        throw new Error(
          (
            await readMessage(
              response
            )
          ) ||
            "Não foi possível salvar esta área."
        );
      }

      setSuccessMessage(
        "Área atualizada."
      );

      await loadData();

    } catch (
      error
    ) {
      setErrorMessage(
        error instanceof
          Error
          ? error.message
          : "Não foi possível salvar esta área."
      );

    } finally {
      setUpdatingId(
        null
      );
    }
  }

  async function toggleActive(
    area: DeliveryArea
  ) {
    try {
      setUpdatingId(
        area.id
      );

      setErrorMessage(
        ""
      );

      const response =
        await adminFetch(
          `${API_URL}/api/delivery-areas/${area.id}/active?active=${!area.active}`,
          {
            method:
              "PATCH",
          }
        );

      if (
        !response.ok
      ) {
        throw new Error(
          "Não foi possível alterar o status."
        );
      }

      await loadData();

      setSuccessMessage(
        area.active
          ? "Área desativada."
          : "Área ativada."
      );

    } catch (
      error
    ) {
      setErrorMessage(
        error instanceof
          Error
          ? error.message
          : "Não foi possível alterar o status."
      );

    } finally {
      setUpdatingId(
        null
      );
    }
  }

  const fieldClass =
    "h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";

  return (
    <main className="min-h-screen bg-background">

      <AdminHeader />

      <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 lg:px-8">

        <section className="border-b border-border pb-6">

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Entrega
          </p>

          <h1 className="mt-2 font-display text-4xl uppercase leading-none tracking-tight text-foreground">
            Taxas de entrega
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Defina bairros com taxa fixa ou valor por km. Quando a área usa cobrança por km, o PizzaSystem calcula a rota real entre a pizzaria e o endereço do cliente no checkout.
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

        <form
          onSubmit={
            saveConfig
          }
          className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm"
        >

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Cálculo automático
              </p>

              <h2 className="mt-1 text-xl font-bold text-foreground">
                Endereço de saída da pizzaria
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Esse endereço é o ponto inicial da rota. Informe rua, número, bairro, cidade, estado e CEP para aumentar a precisão.
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
                ? "API de rotas conectada"
                : "API de rotas pendente"}
            </span>

          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px]">

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                Endereço completo
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
            </div>

          </div>

          <button
            type="submit"
            disabled={
              savingConfig
            }
            className="mt-5 h-11 rounded-xl bg-foreground px-5 text-sm font-bold text-background transition hover:opacity-90 disabled:opacity-50"
          >
            {savingConfig
              ? "Salvando..."
              : "Salvar cálculo de entrega"}
          </button>

        </form>

        <form
          onSubmit={
            handleCreate
          }
          className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm"
        >

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
              Área atendida
            </p>

            <h2 className="mt-1 text-xl font-bold text-foreground">
              Nova cidade / bairro
            </h2>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                Cidade
              </label>

              <input
                value={
                  city
                }
                onChange={(
                  event
                ) =>
                  setCity(
                    event.target.value
                  )
                }
                placeholder="Ex: Jaguariúna"
                className={
                  fieldClass
                }
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                Bairro
              </label>

              <input
                value={
                  neighborhood
                }
                onChange={(
                  event
                ) =>
                  setNeighborhood(
                    event.target.value
                  )
                }
                placeholder="Ex: Cruzeiro do Sul"
                className={
                  fieldClass
                }
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                Tipo da taxa
              </label>

              <select
                value={
                  pricingMode
                }
                onChange={(
                  event
                ) =>
                  setPricingMode(
                    event.target
                      .value as PricingMode
                  )
                }
                className={
                  fieldClass
                }
              >
                <option value="FIXED">
                  Taxa fixa
                </option>

                <option value="PER_KM">
                  Automática por km
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                {pricingMode ===
                "FIXED"
                  ? "Valor da entrega"
                  : "Valor por km"}
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  pricingMode ===
                  "FIXED"
                    ? fee
                    : feePerKm
                }
                onChange={(
                  event
                ) => {
                  if (
                    pricingMode ===
                    "FIXED"
                  ) {
                    setFee(
                      event.target.value
                    );
                  } else {
                    setFeePerKm(
                      event.target.value
                    );
                  }
                }}
                placeholder={
                  pricingMode ===
                  "FIXED"
                    ? "Ex: 8,00"
                    : "Ex: 2,50"
                }
                className={
                  fieldClass
                }
              />
            </div>

          </div>

          {pricingMode ===
            "PER_KM" && (
            <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
              O cliente informa o endereço no checkout. O sistema calcula a rota de carro automaticamente e multiplica a distância pelo valor por km. Exemplo: 7 km × R$ 2,50 = R$ 17,50.
            </div>
          )}

          <button
            type="submit"
            disabled={
              submitting
            }
            className="mt-5 h-11 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting
              ? "Cadastrando..."
              : "Cadastrar área"}
          </button>

        </form>

        <section className="mt-6 space-y-3">

          <div className="flex items-end justify-between gap-4">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Cobertura
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Áreas cadastradas
              </h2>
            </div>

            <span className="text-sm text-muted-foreground">
              {
                areas.filter(
                  (
                    area
                  ) =>
                    area.active
                ).length
              }{" "}
              ativa(s)
            </span>

          </div>

          {loading ? (
            <div className="rounded-3xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Carregando áreas...
            </div>

          ) : areas.length ===
            0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
              <p className="text-3xl">
                🛵
              </p>

              <p className="mt-3 font-bold">
                Nenhuma área cadastrada
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Cadastre pelo menos um bairro para liberar opções de entrega no checkout.
              </p>
            </div>

          ) : (
            areas.map(
              (
                area
              ) => {
                const draft =
                  drafts[
                    area.id
                  ] ??
                  toDraft(
                    area
                  );

                return (
                  <article
                    key={
                      area.id
                    }
                    className="rounded-3xl border border-border bg-card p-5 shadow-sm"
                  >

                    <div className="grid gap-3 lg:grid-cols-[1fr_1fr_190px_180px_auto] lg:items-end">

                      <div>
                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                          Cidade
                        </label>

                        <input
                          value={
                            draft.city
                          }
                          onChange={(
                            event
                          ) =>
                            updateDraft(
                              area.id,
                              {
                                city:
                                  event.target.value,
                              }
                            )
                          }
                          className={
                            fieldClass
                          }
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                          Bairro
                        </label>

                        <input
                          value={
                            draft.neighborhood
                          }
                          onChange={(
                            event
                          ) =>
                            updateDraft(
                              area.id,
                              {
                                neighborhood:
                                  event.target.value,
                              }
                            )
                          }
                          className={
                            fieldClass
                          }
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                          Tipo
                        </label>

                        <select
                          value={
                            draft.pricingMode
                          }
                          onChange={(
                            event
                          ) =>
                            updateDraft(
                              area.id,
                              {
                                pricingMode:
                                  event.target
                                    .value as PricingMode,
                              }
                            )
                          }
                          className={
                            fieldClass
                          }
                        >
                          <option value="FIXED">
                            Taxa fixa
                          </option>

                          <option value="PER_KM">
                            Por km
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                          {draft.pricingMode ===
                          "FIXED"
                            ? "Valor"
                            : "R$ por km"}
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            draft.pricingMode ===
                            "FIXED"
                              ? draft.fee
                              : draft.feePerKm
                          }
                          onChange={(
                            event
                          ) =>
                            updateDraft(
                              area.id,
                              draft.pricingMode ===
                                "FIXED"
                                ? {
                                    fee:
                                      event.target.value,
                                  }
                                : {
                                    feePerKm:
                                      event.target.value,
                                  }
                            )
                          }
                          className={
                            fieldClass
                          }
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">

                        <button
                          type="button"
                          disabled={
                            updatingId ===
                            area.id
                          }
                          onClick={() =>
                            saveArea(
                              area
                            )
                          }
                          className="h-11 rounded-xl bg-foreground px-4 text-xs font-bold text-background disabled:opacity-50"
                        >
                          Salvar
                        </button>

                        <button
                          type="button"
                          disabled={
                            updatingId ===
                            area.id
                          }
                          onClick={() =>
                            toggleActive(
                              area
                            )
                          }
                          className={[
                            "h-11 rounded-xl border px-4 text-xs font-bold disabled:opacity-50",
                            area.active
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-border bg-muted text-muted-foreground",
                          ].join(
                            " "
                          )}
                        >
                          {area.active
                            ? "Ativa"
                            : "Inativa"}
                        </button>

                      </div>

                    </div>

                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                      {draft.pricingMode ===
                      "PER_KM"
                        ? `A distância será calculada automaticamente no checkout e cobrada a ${money(
                            Number(
                              draft.feePerKm ||
                                0
                            )
                          )} por km.`
                        : `Taxa fixa de ${money(
                            Number(
                              draft.fee ||
                                0
                            )
                          )}.`}
                    </p>

                  </article>
                );
              }
            )
          )}

        </section>

      </div>

    </main>
  );
}
