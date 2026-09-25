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

type AreaDraft = {
  city: string;
  neighborhood: string;
  pricingMode: PricingMode;
  fee: string;
  distanceKm: string;
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
    distanceKm:
      area.distanceKm != null
        ? String(
            Number(
              area.distanceKm
            )
          )
        : "",
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
    loading,
    setLoading,
  ] =
    useState(true);

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
    distanceKm,
    setDistanceKm,
  ] =
    useState("");

  const [
    feePerKm,
    setFeePerKm,
  ] =
    useState("");

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

  const calculatedNewFee =
    useMemo(
      () =>
        pricingMode ===
        "PER_KM"
          ? Number(
              distanceKm ||
                0
            ) *
            Number(
              feePerKm ||
                0
            )
          : Number(
              fee ||
                0
            ),
      [
        pricingMode,
        distanceKm,
        feePerKm,
        fee,
      ]
    );

  async function loadAreas() {
    try {
      setErrorMessage(
        ""
      );

      const response =
        await adminFetch(
          `${API_URL}/api/delivery-areas`,
          {
            cache:
              "no-store",
            credentials:
              "include",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Erro ao carregar áreas"
        );
      }

      const data:
        DeliveryArea[] =
        await response.json();

      setAreas(
        data
      );

      setDrafts(
        Object.fromEntries(
          data.map(
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

    } catch {
      setErrorMessage(
        "Não foi possível carregar as áreas de entrega."
      );

    } finally {
      setLoading(
        false
      );
    }
  }

  useEffect(() => {
    void loadAreas();
  }, []);

  function validatePricing(
    mode: PricingMode,
    fixedFee: string,
    km: string,
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

    const kmValue =
      Number(
        km
      );

    const perKmValue =
      Number(
        perKm
      );

    if (
      km.trim() ===
        "" ||
      Number.isNaN(
        kmValue
      ) ||
      kmValue <= 0
    ) {
      return "Informe a distância em km.";
    }

    if (
      perKm.trim() ===
        "" ||
      Number.isNaN(
        perKmValue
      ) ||
      perKmValue < 0
    ) {
      return "Informe o valor por km.";
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

    if (!city.trim()) {
      setErrorMessage(
        "Informe a cidade."
      );
      return;
    }

    if (!neighborhood.trim()) {
      setErrorMessage(
        "Informe o bairro."
      );
      return;
    }

    const pricingError =
      validatePricing(
        pricingMode,
        fee,
        distanceKm,
        feePerKm
      );

    if (pricingError) {
      setErrorMessage(
        pricingError
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
            credentials:
              "include",
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
                    : calculatedNewFee,
                distanceKm:
                  pricingMode ===
                  "PER_KM"
                    ? Number(
                        distanceKm
                      )
                    : null,
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

      if (!response.ok) {
        const text =
          await response.text();

        throw new Error(
          text ||
            "Erro ao cadastrar área"
        );
      }

      setCity(
        ""
      );
      setNeighborhood(
        ""
      );
      setFee(
        ""
      );
      setDistanceKm(
        ""
      );
      setFeePerKm(
        ""
      );
      setPricingMode(
        "FIXED"
      );

      setSuccessMessage(
        "Área de entrega cadastrada."
      );

      await loadAreas();

    } catch {
      setErrorMessage(
        "Não foi possível cadastrar a área. Confira cidade, bairro e valores."
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

    if (
      !draft.city.trim() ||
      !draft.neighborhood.trim()
    ) {
      setErrorMessage(
        "Cidade e bairro são obrigatórios."
      );
      return;
    }

    const pricingError =
      validatePricing(
        draft.pricingMode,
        draft.fee,
        draft.distanceKm,
        draft.feePerKm
      );

    if (pricingError) {
      setErrorMessage(
        pricingError
      );
      return;
    }

    try {
      setUpdatingId(
        area.id
      );

      setErrorMessage(
        ""
      );

      setSuccessMessage(
        ""
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
            credentials:
              "include",
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
                    : Number(
                        draft.distanceKm
                      ) *
                      Number(
                        draft.feePerKm
                      ),
                distanceKm:
                  draft.pricingMode ===
                  "PER_KM"
                    ? Number(
                        draft.distanceKm
                      )
                    : null,
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

      if (!response.ok) {
        throw new Error(
          "Erro ao salvar"
        );
      }

      setSuccessMessage(
        "Área atualizada."
      );

      await loadAreas();

    } catch {
      setErrorMessage(
        "Não foi possível salvar esta área."
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
            credentials:
              "include",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Erro ao alterar status"
        );
      }

      setSuccessMessage(
        area.active
          ? "Área desativada."
          : "Área ativada."
      );

      await loadAreas();

    } catch {
      setErrorMessage(
        "Não foi possível alterar o status."
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

        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Entrega
            </p>

            <h1 className="mt-2 font-display text-4xl uppercase leading-none tracking-tight text-foreground">
              Taxas de entrega
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              Use taxa fixa por região ou calcule pelo valor do km. Para taxa por km, você informa a distância daquela região e o preço por quilômetro.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Áreas ativas
            </p>

            <p className="mt-1 text-3xl font-bold">
              {
                areas.filter(
                  (
                    area
                  ) =>
                    area.active
                ).length
              }
            </p>
          </div>

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
          onSubmit={
            handleCreate
          }
          className="rounded-3xl border border-border bg-card p-5 shadow-sm"
        >
          <div>
            <h2 className="font-display text-2xl uppercase">
              Nova área
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              A cidade será escolhida primeiro pelo cliente no checkout.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">

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
                placeholder="Ex: Centro"
                className={
                  fieldClass
                }
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                Tipo de taxa
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
                  Por km
                </option>
              </select>
            </div>

            {pricingMode ===
            "FIXED" ? (
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                  Taxa fixa
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    fee
                  }
                  onChange={(
                    event
                  ) =>
                    setFee(
                      event.target.value
                    )
                  }
                  placeholder="0,00"
                  className={
                    fieldClass
                  }
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                    Distância da região
                  </label>

                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={
                      distanceKm
                    }
                    onChange={(
                      event
                    ) =>
                      setDistanceKm(
                        event.target.value
                      )
                    }
                    placeholder="Ex: 8,5 km"
                    className={
                      fieldClass
                    }
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                    Valor por km
                  </label>

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
                      fieldClass
                    }
                  />
                </div>

                <div className="flex h-11 items-center rounded-xl border border-primary/15 bg-primary/5 px-4 text-sm font-bold text-foreground">
                  Taxa calculada:{" "}
                  <span className="ml-2 text-primary">
                    {
                      money(
                        calculatedNewFee
                      )
                    }
                  </span>
                </div>
              </>
            )}

          </div>

          <button
            type="submit"
            disabled={
              submitting
            }
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting
              ? "Salvando..."
              : "Cadastrar área"}
          </button>
        </form>

        <section className="mt-6 space-y-4">

          {loading ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
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

                const previewFee =
                  draft.pricingMode ===
                  "PER_KM"
                    ? Number(
                        draft.distanceKm ||
                          0
                      ) *
                      Number(
                        draft.feePerKm ||
                          0
                      )
                    : Number(
                        draft.fee ||
                          0
                      );

                return (
                  <article
                    key={
                      area.id
                    }
                    className="rounded-3xl border border-border bg-card p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">

                      <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">

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
                          placeholder="Cidade"
                          className={
                            fieldClass
                          }
                        />

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
                          placeholder="Bairro"
                          className={
                            fieldClass
                          }
                        />

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
                                  event.target.value as PricingMode,
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

                        {draft.pricingMode ===
                        "FIXED" ? (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              draft.fee
                            }
                            onChange={(
                              event
                            ) =>
                              updateDraft(
                                area.id,
                                {
                                  fee:
                                    event.target.value,
                                }
                              )
                            }
                            placeholder="Taxa"
                            className={
                              fieldClass
                            }
                          />
                        ) : (
                          <>
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={
                                draft.distanceKm
                              }
                              onChange={(
                                event
                              ) =>
                                updateDraft(
                                  area.id,
                                  {
                                    distanceKm:
                                      event.target.value,
                                  }
                                )
                              }
                              placeholder="Distância km"
                              className={
                                fieldClass
                              }
                            />

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                draft.feePerKm
                              }
                              onChange={(
                                event
                              ) =>
                                updateDraft(
                                  area.id,
                                  {
                                    feePerKm:
                                      event.target.value,
                                  }
                                )
                              }
                              placeholder="R$ / km"
                              className={
                                fieldClass
                              }
                            />
                          </>
                        )}

                      </div>

                      <div className="flex flex-wrap items-center gap-2">

                        <span className="rounded-full bg-muted px-3 py-2 text-xs font-bold text-foreground">
                          {
                            money(
                              previewFee
                            )
                          }
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            saveArea(
                              area
                            )
                          }
                          disabled={
                            updatingId ===
                            area.id
                          }
                          className="h-10 rounded-xl bg-foreground px-4 text-xs font-bold text-background transition hover:opacity-90 disabled:opacity-50"
                        >
                          Salvar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleActive(
                              area
                            )
                          }
                          disabled={
                            updatingId ===
                            area.id
                          }
                          className={[
                            "h-10 rounded-xl border px-4 text-xs font-bold transition disabled:opacity-50",
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

                    <p className="mt-3 text-xs text-muted-foreground">
                      {draft.pricingMode ===
                      "PER_KM"
                        ? `${draft.distanceKm || "0"} km × ${money(
                            Number(
                              draft.feePerKm ||
                                0
                            )
                          )}/km = ${money(
                            previewFee
                          )}`
                        : `Taxa fixa de ${money(
                            previewFee
                          )}`}
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
